import { docker, pullImage, startContainerWithRandomPort } from "@fluxify/adapters/containerTestHelpers";
import { SQL } from "bun";
import type Docker from "dockerode";
import { drizzle } from "drizzle-orm/bun-sql";
import { Hono } from "hono";
import { mock, spyOn } from "bun:test";

export const PG = {
	image: "postgres:16-alpine",
	name: "fluxify-ephemeral-runs-pg-test",
};

export type Write = { op: "put" | "delete"; key: string; env: string; value?: any };
export type Called = {
	id: string;
	input: any;
	abortAfterMs?: number;
	putBefore: boolean;
};

export const state = {
	container: undefined as Docker.Container | undefined,
	sql: undefined as SQL | undefined,
	app: undefined as Hono<any> | undefined,
	writes: [] as Write[],
	called: [] as Called[],
	answers: [] as (() => Promise<any> | any)[],
	devWorker: true,
	setting: "",
};

export async function setupTestDb() {
	await docker.getContainer(PG.name).remove({ force: true }).catch(() => {});
	await pullImage(PG.image);
	const started = await startContainerWithRandomPort((host) =>
		docker.createContainer({
			Image: PG.image,
			name: PG.name,
			Env: ["POSTGRES_PASSWORD=postgres"],
			HostConfig: {
				PortBindings: { "5432/tcp": [{ HostPort: String(host) }] },
			},
			ExposedPorts: { "5432/tcp": {} },
		}),
	);
	state.container = started.container;
	const url = `postgres://postgres:postgres@127.0.0.1:${started.port}/postgres`;
	for (let i = 0; ; i++) {
		const probe = new SQL(url, { max: 1 });
		try {
			await probe`SELECT 1`;
			break;
		} catch (error) {
			if (i >= 90) throw error;
			await Bun.sleep(500);
		} finally {
			await probe.close().catch(() => {});
		}
	}
	const { migrateDB } = await import("../../../../db/migration");
	await migrateDB(url);
	state.sql = new SQL(url);
	mock.module("../../../../db", () => ({ db: drizzle({ client: state.sql! }) }));

	const natsKv = await import("../../../../db/natsKv");
	const status = await import("../../../../modules/orchestrator/status");
	const callModule = await import("../../sandboxes/call");
	const settings = await import("../../../../lib/project-settings");

	spyOn(natsKv, "putArtifact").mockImplementation(async (key, value, env) => {
		state.writes.push({ op: "put", key, env: env ?? "production", value });
	});
	spyOn(natsKv, "deleteArtifact").mockImplementation(async (key, env) => {
		state.writes.push({ op: "delete", key, env: env ?? "production" });
	});
	spyOn(status, "devWorkerOnline").mockImplementation(async () => state.devWorker);
	spyOn(settings, "getProjectSetting").mockImplementation(async () => state.setting);
	spyOn(callModule, "callDevWorker").mockImplementation((async (
		_project: string,
		id: string,
		input: any,
		_origin: string,
		opts: { abortAfterMs?: number } = {},
	) => {
		state.called.push({
			id,
			input,
			abortAfterMs: opts.abortAfterMs,
			putBefore: state.writes.some((w) => w.op === "put" && w.key.endsWith(id)),
		});
		const next = state.answers.shift();
		if (!next) throw new Error("no worker answer queued");
		return next();
	}) as never);

	const runs = (await import("../register")).default;
	const { errorHandler } = await import("../../../../middlewares/errorHandler");
	const app = new Hono<any>();
	app.onError(errorHandler);
	app.use(async (ctx, next) => {
		ctx.set("user", { id: ctx.req.header("X-User") });
		ctx.set("acl", [
			{
				projectId: ctx.req.header("X-Project"),
				role: ctx.req.header("X-Role") ?? "creator",
			},
		]);
		await next();
	});
	runs.registerHandler(app);
	state.app = app;
}

export async function teardownTestDb() {
	await state.sql?.close().catch(() => {});
	await state.container?.remove({ force: true }).catch(() => {});
}

export function resetTestState() {
	state.writes.length = 0;
	state.called.length = 0;
	state.answers = [];
	state.devWorker = true;
	state.setting = "";
}

export const short = () => crypto.randomUUID().slice(0, 8);

export async function newProject() {
	const id = `p${short()}`;
	await state.sql!`INSERT INTO projects (id, name, slug) VALUES (${id}, ${id}, ${id})`;
	return id;
}

export async function newUser() {
	const id = `u${short()}`;
	await state.sql!`INSERT INTO system_users (id, email, name) VALUES (${id}, ${`${id}@example.com`}, ${id})`;
	return id;
}

export async function run(project: string, user: string, body: unknown, role = "creator") {
	const res = await state.app!.request(
		`http://localhost/projects/${project}/ephemeral-runs`,
		{
			method: "POST",
			headers: {
				"X-User": user,
				"X-Project": project,
				"X-Role": role,
				"content-type": "application/json",
			},
			body: JSON.stringify(body),
		},
	);
	return { status: res.status, body: (await res.json()) as any };
}

export async function rowCounts() {
	const [row] = await state.sql!`SELECT
		(SELECT count(*) FROM sandboxes)::int AS sandboxes,
		(SELECT count(*) FROM blocks)::int AS blocks,
		(SELECT count(*) FROM edges)::int AS edges,
		(SELECT count(*) FROM trace_runs)::int AS trace_runs`;
	return row;
}

export const chain = {
	blocks: [
		{ ref: "calc", type: "jsrunner", data: { value: "return { n: 1 };" } },
		{ ref: "reply", type: "response", data: { httpCode: "200" } },
	],
	edges: [{ from: "calc", to: "reply" }],
};

export const ok =
	(body: unknown = { n: 1 }, trace = true) =>
	() => ({
		status: 200,
		contentType: "application/json",
		body,
		headers: {
			"content-type": "application/json",
			"x-fluxify-debug-trace": "abc",
		},
		...(trace && {
			debugTrace: {
				spans: [
					{
						blockId: "calc",
						blockType: "jsrunner",
						outcome: "success",
						ms: 2,
						output: '{"n":1}',
					},
				],
			},
		}),
	});
