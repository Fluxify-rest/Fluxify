// Ephemeral runs (#741) against a real Postgres: a run is checked like a canvas
// save, leaves no row behind, and its one system log row is its owner's alone.
// The artifact store and the development worker are recorded instead of used;
// the worker's answer is whatever the test queues.
import { afterAll, beforeAll, beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { docker, pullImage, startContainerWithRandomPort } from "@fluxify/adapters/containerTestHelpers";
import { SQL } from "bun";
import type Docker from "dockerode";
import { drizzle } from "drizzle-orm/bun-sql";
import { Hono } from "hono";

const PG = { image: "postgres:16-alpine", name: "fluxify-ephemeral-runs-pg-test" };
let container: Docker.Container | undefined;
let sql: SQL;
let app: Hono<any>;

type Write = { op: "put" | "delete"; key: string; env: string; value?: any };
const writes: Write[] = [];
type Called = { id: string; input: any; abortAfterMs?: number; putBefore: boolean };
const called: Called[] = [];
let answers: (() => Promise<any> | any)[] = [];
let devWorker = true;
let setting = "";

const natsKv = await import("../../../../db/natsKv");
const status = await import("../../../../modules/orchestrator/status");
const callModule = await import("../../sandboxes/call");
const settings = await import("../../../../lib/project-settings");

beforeAll(async () => {
	await docker.getContainer(PG.name).remove({ force: true }).catch(() => {});
	await pullImage(PG.image);
	const started = await startContainerWithRandomPort((host) =>
		docker.createContainer({
			Image: PG.image,
			name: PG.name,
			Env: ["POSTGRES_PASSWORD=postgres"],
			HostConfig: { PortBindings: { "5432/tcp": [{ HostPort: String(host) }] } },
			ExposedPorts: { "5432/tcp": {} },
		}),
	);
	container = started.container;
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
	sql = new SQL(url);
	mock.module("../../../../db", () => ({ db: drizzle({ client: sql }) }));

	spyOn(natsKv, "putArtifact").mockImplementation(async (key, value, env) => {
		writes.push({ op: "put", key, env: env ?? "production", value });
	});
	spyOn(natsKv, "deleteArtifact").mockImplementation(async (key, env) => {
		writes.push({ op: "delete", key, env: env ?? "production" });
	});
	spyOn(status, "devWorkerOnline").mockImplementation(async () => devWorker);
	spyOn(settings, "getProjectSetting").mockImplementation(async () => setting);
	spyOn(callModule, "callDevWorker").mockImplementation((async (
		_project: string,
		id: string,
		input: any,
		_origin: string,
		opts: { abortAfterMs?: number } = {},
	) => {
		called.push({
			id,
			input,
			abortAfterMs: opts.abortAfterMs,
			putBefore: writes.some((w) => w.op === "put" && w.key.endsWith(id)),
		});
		const next = answers.shift();
		if (!next) throw new Error("no worker answer queued");
		return next();
	}) as never);

	const runs = (await import("../register")).default;
	const { errorHandler } = await import("../../../../middlewares/errorHandler");
	app = new Hono<any>();
	app.onError(errorHandler);
	app.use(async (ctx, next) => {
		ctx.set("user", { id: ctx.req.header("X-User") });
		ctx.set("acl", [
			{ projectId: ctx.req.header("X-Project"), role: ctx.req.header("X-Role") ?? "creator" },
		]);
		await next();
	});
	runs.registerHandler(app);
}, 180_000);

afterAll(async () => {
	await sql?.close().catch(() => {});
	await container?.remove({ force: true }).catch(() => {});
});

beforeEach(() => {
	writes.length = 0;
	called.length = 0;
	answers = [];
	devWorker = true;
	setting = "";
});

const short = () => crypto.randomUUID().slice(0, 8);

async function newProject() {
	const id = `p${short()}`;
	await sql`INSERT INTO projects (id, name, slug) VALUES (${id}, ${id}, ${id})`;
	return id;
}

async function newUser() {
	const id = `u${short()}`;
	await sql`INSERT INTO system_users (id, email, name) VALUES (${id}, ${`${id}@example.com`}, ${id})`;
	return id;
}

async function run(project: string, user: string, body: unknown, role = "creator") {
	const res = await app.request(`http://localhost/projects/${project}/ephemeral-runs`, {
		method: "POST",
		headers: {
			"X-User": user,
			"X-Project": project,
			"X-Role": role,
			"content-type": "application/json",
		},
		body: JSON.stringify(body),
	});
	return { status: res.status, body: (await res.json()) as any };
}

/** every table a run must not write to */
async function rowCounts() {
	const [row] = await sql`SELECT
		(SELECT count(*) FROM sandboxes)::int AS sandboxes,
		(SELECT count(*) FROM blocks)::int AS blocks,
		(SELECT count(*) FROM edges)::int AS edges,
		(SELECT count(*) FROM trace_runs)::int AS trace_runs`;
	return row;
}

const chain = {
	blocks: [
		{ ref: "calc", type: "jsrunner", data: { value: "return { n: 1 };" } },
		{ ref: "reply", type: "response", data: { httpCode: "200" } },
	],
	edges: [{ from: "calc", to: "reply" }],
};

const ok =
	(body: unknown = { n: 1 }, trace = true) =>
	() => ({
		status: 200,
		contentType: "application/json",
		body,
		headers: { "content-type": "application/json", "x-fluxify-debug-trace": "abc" },
		...(trace && {
			debugTrace: {
				spans: [
					{ blockId: "calc", blockType: "jsrunner", outcome: "success", ms: 2, output: '{"n":1}' },
				],
			},
		}),
	});

describe("a successful run", () => {
	it("runs once, answers with the trace and leaves no row, key or recording", async () => {
		const project = await newProject();
		const user = await newUser();
		const before = await rowCounts();
		answers = [ok()];

		const res = await run(project, user, { ...chain, body: { a: 1 } });

		expect(res.status).toBe(200);
		expect(res.body).toMatchObject({ status: 200, body: { n: 1 } });
		expect(res.body.id).toStartWith("eph_");
		expect(res.body.debugTrace.spans[0]).toMatchObject({ blockId: "calc", outcome: "success" });
		// the debug plumbing is not for the caller
		expect(res.body.headers).not.toHaveProperty("x-fluxify-debug-trace");
		expect(JSON.stringify(res.body)).not.toContain("fxd_");

		// the artifact was in the development bucket, and only there, while the worker was called
		expect(called).toHaveLength(1);
		expect(called[0]!.putBefore).toBe(true);
		expect(called[0]!.input).toMatchObject({ debug: true, body: { a: 1 } });
		const key = `sandbox.${project}.${res.body.id}`;
		expect(writes.map((w) => [w.op, w.key, w.env])).toEqual([
			["put", key, "development"],
			["delete", key, "development"],
		]);
		const artifact = writes[0]!.value;
		expect(artifact).toMatchObject({
			sandbox: true,
			ephemeral: true,
			recordExecution: false,
			tracingEnabled: false,
		});
		expect(artifact.source).toContain("return { n: 1 };");

		expect(await rowCounts()).toEqual(before);
	});

	it("tries again only when the worker had not loaded it: a 404 with no trace", async () => {
		const project = await newProject();
		const user = await newUser();
		const notYet = () => ({ status: 404, contentType: null, body: { message: "Route not found" } });
		answers = [notYet, notYet, ok()];

		const res = await run(project, user, chain);

		expect(res.body.status).toBe(200);
		expect(called).toHaveLength(3);
		// one put, one delete, however many calls it took
		expect(writes.map((w) => w.op)).toEqual(["put", "delete"]);
	});

	it("also waits out a development token the worker has not learned yet: a 401 with no trace", async () => {
		const project = await newProject();
		const user = await newUser();
		const unknown = () => ({ status: 401, contentType: null, body: { message: "Missing or wrong development token" } });
		answers = [unknown, ok()];

		const res = await run(project, user, chain);

		expect(res.body.status).toBe(200);
		expect(called).toHaveLength(2);
	});

	it("does not try again on a 404 the graph itself answered", async () => {
		const project = await newProject();
		const user = await newUser();
		answers = [
			() => ({
				status: 404,
				contentType: "application/json",
				body: { message: "nope" },
				debugTrace: {
					spans: [{ blockId: "reply", blockType: "response", outcome: "success", ms: 1 }],
				},
			}),
		];

		const res = await run(project, user, chain);

		expect(res.body.status).toBe(404);
		expect(called).toHaveLength(1);
	});
});

describe("deleting the key", () => {
	it("happens when the call throws", async () => {
		const project = await newProject();
		const user = await newUser();
		answers = [
			() => {
				throw new Error("worker went away");
			},
		];

		const res = await run(project, user, chain);

		expect(res.status).toBe(500);
		expect(writes.map((w) => w.op)).toEqual(["put", "delete"]);
	});

	it("happens when the run times out", async () => {
		const project = await newProject();
		const user = await newUser();
		answers = [
			async () => {
				await Bun.sleep(1100);
				return { status: null, contentType: null, body: null, error: "Could not reach: aborted" };
			},
		];

		const res = await run(project, user, { ...chain, timeoutSeconds: 1 });

		expect(res.body.error).toContain("did not finish within 1 seconds");
		// the call was told to give up inside its deadline
		expect(called[0]!.abortAfterMs).toBeLessThanOrEqual(1000);
		expect(writes.map((w) => w.op)).toEqual(["put", "delete"]);
	});
});

describe("the timeout", () => {
	const timeoutOf = async (body: object, projectSetting = "") => {
		setting = projectSetting;
		const project = await newProject();
		const user = await newUser();
		answers = [ok()];
		writes.length = 0;
		await run(project, user, { ...chain, ...body });
		return writes.find((w) => w.op === "put")!.value.timeoutSeconds as number;
	};

	it("is the project's setting, and 10 when it has none", async () => {
		expect(await timeoutOf({}, "")).toBe(10);
		expect(await timeoutOf({}, "25")).toBe(25);
	});

	it("is the call's own, clamped to 1-30", async () => {
		expect(await timeoutOf({ timeoutSeconds: 3 }, "25")).toBe(3);
		expect(await timeoutOf({ timeoutSeconds: 0 })).toBe(1);
		expect(await timeoutOf({ timeoutSeconds: -5 })).toBe(1);
		expect(await timeoutOf({ timeoutSeconds: 120 })).toBe(30);
		// a bad stored value is clamped too
		expect(await timeoutOf({}, "99")).toBe(30);
	});
});

describe("a bad graph", () => {
	it("is a 400 that names the reason, and writes nothing", async () => {
		const project = await newProject();
		const user = await newUser();
		const before = await rowCounts();
		const refused = async (body: object) => {
			const res = await run(project, user, body);
			expect(res.status).toBe(400);
			return JSON.stringify(res.body);
		};

		expect(await refused({ blocks: [{ ref: "x", type: "not_a_block", data: {} }] })).toContain(
			"Unknown block type",
		);
		expect(await refused({ blocks: [{ ref: "e", type: "entrypoint" }] })).toContain(
			"added for you",
		);
		expect(await refused({ ...chain, edges: [{ from: "calc", to: "ghost" }] })).toContain(
			'no block \\"ghost\\"',
		);
		expect(
			await refused({
				blocks: [
					{ ref: "check", type: "if", data: {} },
					{ ref: "reply", type: "response", data: { httpCode: "200" } },
				],
				edges: [{ from: "check", to: "reply" }],
			}),
		).toContain("several handles");
		expect(
			await refused({
				blocks: [
					{ ref: "a", type: "jsrunner", data: { value: "return 1;" } },
					{ ref: "b", type: "jsrunner", data: { value: "return 2;" } },
				],
				edges: [
					{ from: "a", to: "b" },
					{ from: "b", to: "a" },
				],
			}),
		).toContain("Nothing to start from");
		expect(await refused({ blocks: [chain.blocks[0], { ...chain.blocks[0] }], edges: [] })).toContain(
			"share a ref",
		);

		expect(called).toHaveLength(0);
		expect(writes).toHaveLength(0);
		expect(await rowCounts()).toEqual(before);
	});

	it("is refused by the same block data rules as a save", async () => {
		const project = await newProject();
		const user = await newUser();
		const res = await run(project, user, {
			blocks: [{ ref: "calc", type: "jsrunner", data: { value: 12 } }],
		});
		expect(res.status).toBe(400);
		expect(writes).toHaveLength(0);
	});
});

describe("who may run", () => {
	it("refuses a viewer", async () => {
		const project = await newProject();
		const user = await newUser();
		expect((await run(project, user, chain, "viewer")).status).toBe(403);
	});

	it("says how to start a worker when none is running, before compiling anything", async () => {
		const project = await newProject();
		const user = await newUser();
		devWorker = false;
		const res = await run(project, user, chain);
		expect(res.status).toBe(409);
		expect(JSON.stringify(res.body)).toContain("FLUXIFY_ENV=development");
		expect(writes).toHaveLength(0);
	});
});

describe("the system log row", () => {
	it("is one per run, success or failure, with the output or the error and stack", async () => {
		const project = await newProject();
		const user = await newUser();
		answers = [
			ok({ n: 7 }),
			() => ({
				status: 500,
				contentType: "application/json",
				body: { message: "Internal server error" },
				debugError: {
					block: { id: "calc", type: "jsrunner", name: "Calc" },
					message: "boom",
					stack: "at calc (fluxify-graph:3:9)",
				},
				debugTrace: {
					spans: [
						{ blockId: "calc", blockType: "jsrunner", outcome: "failure", ms: 3, error: "boom" },
					],
				},
			}),
		];

		const good = await run(project, user, chain);
		const bad = await run(project, user, chain);

		const rows =
			await sql`SELECT * FROM system_logs WHERE project_id = ${project} AND type = 'ephemeral' ORDER BY id`;
		expect(rows).toHaveLength(2);
		expect(rows[0]).toMatchObject({
			resource_type: "ephemeral",
			resource_id: good.body.id,
			level: "info",
			detail: { userId: user, env: "development", status: 200, output: { n: 7 } },
		});
		expect(rows[0]!.detail.blocks[0]).toMatchObject({ blockId: "calc", outcome: "success" });
		expect(typeof rows[0]!.detail.durationMs).toBe("number");
		expect(rows[1]).toMatchObject({
			resource_id: bad.body.id,
			level: "error",
			message: "boom",
			detail: { userId: user, status: 500, stack: "at calc (fluxify-graph:3:9)" },
		});
		// no recording: nothing in trace_runs hangs off a run
		expect(rows.every((r) => r.run_id === null)).toBe(true);
	});

	it("cuts a big output at 64 KB and says so", async () => {
		const project = await newProject();
		const user = await newUser();
		answers = [ok("x".repeat(100_000))];

		const res = await run(project, user, chain);

		const [row] = await sql`SELECT detail FROM system_logs WHERE resource_id = ${res.body.id}`;
		expect(Buffer.byteLength(row!.detail.output)).toBe(64 * 1024);
		expect(row!.detail.note).toContain("cut at 64 KB");
	});

	it("is listed to the user who ran it and to nobody else", async () => {
		const { listSystemLogs } = await import("../../../../lib/systemLogs");
		const project = await newProject();
		const [mine, other] = [await newUser(), await newUser()];
		answers = [ok()];
		const res = await run(project, mine, chain);

		const seen = async (user: string) =>
			(await listSystemLogs({ projectId: project, type: "ephemeral" }, user)).map(
				(r) => r.resourceId,
			);
		expect(await seen(mine)).toEqual([res.body.id]);
		expect(await seen(other)).toEqual([]);
		expect(await seen("")).toEqual([]);
	});

	it("is deleted by the retention job once older than the recording max age", async () => {
		const { deleteExpiredRecordings } = await import("../../../../modules/recordings/consumer");
		const project = await newProject();
		const old = `eph_old${short()}`;
		const fresh = `eph_new${short()}`;
		const compile = `route${short()}`;
		await sql`INSERT INTO system_logs (project_id, resource_type, resource_id, type, level, message, updated_at) VALUES
			(${project}, 'ephemeral', ${old}, 'ephemeral', 'info', 'old', now() - interval '40 days'),
			(${project}, 'ephemeral', ${fresh}, 'ephemeral', 'info', 'fresh', now()),
			(${project}, 'route', ${compile}, 'compile', 'info', 'old compile', now() - interval '40 days')`;

		await deleteExpiredRecordings(30);

		const left = (await sql`SELECT resource_id FROM system_logs WHERE project_id = ${project}`).map(
			(r: any) => r.resource_id,
		);
		expect(left).toContain(fresh);
		expect(left).not.toContain(old);
		// only ephemeral rows age out here; every other log keeps its own rule
		expect(left).toContain(compile);
	});
});
