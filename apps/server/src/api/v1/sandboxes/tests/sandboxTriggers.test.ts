// Triggers on sandboxes and sandbox system logs (#735) against a real Postgres:
// only the sandbox's owner sees, attaches, edits or deletes its triggers, their
// artifacts go to the development bucket only, a sandbox's delete withdraws
// them, and a sandbox's system log rows are its owner's alone. The artifact
// store and the change signal are recorded instead of sent.
import { afterAll, beforeAll, beforeEach, describe, expect, it, mock, spyOn } from "bun:test";
import { docker, pullImage, startContainerWithRandomPort } from "@fluxify/adapters/containerTestHelpers";
import { SQL } from "bun";
import type Docker from "dockerode";
import { drizzle } from "drizzle-orm/bun-sql";
import { Hono } from "hono";

const PG = { image: "postgres:16-alpine", name: "fluxify-sandbox-triggers-pg-test" };
let container: Docker.Container | undefined;
let sql: SQL;
let app: Hono<any>;

type Write = { op: "put" | "delete"; key: string; env: string };
const writes: Write[] = [];

const natsKv = await import("../../../../db/natsKv");
const pubsub = await import("../../../../db/pubsub");

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

	const record = (op: Write["op"]) => async (key: string, _value?: unknown, env?: string) => {
		writes.push({ op, key, env: env ?? "production" });
	};
	spyOn(natsKv, "putArtifact").mockImplementation((key, value, env) => record("put")(key, value, env));
	spyOn(natsKv, "deleteArtifact").mockImplementation((key, env) => record("delete")(key, undefined, env));
	spyOn(natsKv, "putArtifactEverywhere").mockImplementation((key) => record("put")(key, undefined, "everywhere"));
	spyOn(natsKv, "deleteArtifactEverywhere").mockImplementation((key) =>
		record("delete")(key, undefined, "everywhere"),
	);
	spyOn(pubsub, "publishMessage").mockImplementation(async () => {});

	const { errorHandler } = await import("../../../../middlewares/errorHandler");
	app = new Hono<any>();
	app.onError(errorHandler);
	app.use(async (ctx, next) => {
		ctx.set("user", { id: ctx.req.header("X-User"), isSystemAdmin: false });
		ctx.set("acl", [{ projectId: ctx.req.header("X-Project"), role: "creator" }]);
		await next();
	});
	(await import("../register")).default.registerHandler(app);
	(await import("../../triggers/register")).default.registerHandler(app);
	(await import("../../projects/system-logs/route")).default(app.basePath("/projects") as any);
}, 180_000);

afterAll(async () => {
	await sql?.close().catch(() => {});
	await container?.remove({ force: true }).catch(() => {});
});

beforeEach(() => {
	writes.length = 0;
});

async function newProject() {
	const id = Bun.randomUUIDv7();
	await sql`INSERT INTO projects (id, name, slug) VALUES (${id}, ${id}, ${id})`;
	return id;
}

async function newUser() {
	const id = `u${crypto.randomUUID().slice(0, 8)}`;
	await sql`INSERT INTO system_users (id, email, name) VALUES (${id}, ${`${id}@example.com`}, ${id})`;
	return id;
}

async function call(project: string, user: string, path: string, method = "GET", body?: unknown) {
	const res = await app.request(`http://localhost${path}`, {
		method,
		headers: { "X-User": user, "X-Project": project, "content-type": "application/json" },
		body: body === undefined ? undefined : JSON.stringify(body),
	});
	return { status: res.status, body: (await res.json()) as any };
}

async function sandbox(project: string, user: string) {
	const res = await call(project, user, `/projects/${project}/sandboxes`, "POST", { name: "scratch" });
	expect(res.status).toBe(200);
	return res.body.id as string;
}

async function trigger(project: string, user: string, body: object = {}) {
	return call(project, user, "/triggers", "POST", {
		projectId: project,
		name: `t-${crypto.randomUUID().slice(0, 8)}`,
		type: "internal",
		active: true,
		...body,
	});
}

describe("a trigger on a sandbox", () => {
	let project: string;
	let owner: string;
	let other: string;
	let box: string;
	let id: string;

	beforeAll(async () => {
		project = await newProject();
		owner = await newUser();
		other = await newUser();
		box = await sandbox(project, owner);
		const res = await trigger(project, owner, { sandboxId: box });
		expect(res.status).toBe(200);
		id = res.body.id;
	});

	it("is published to the development bucket only, starting the sandbox by its id", async () => {
		const res = await trigger(project, owner, { sandboxId: box });
		const key = `trigger.${project}.${res.body.id}`;
		expect(writes).toEqual([
			{ op: "delete", key, env: "production" },
			{ op: "put", key, env: "development" },
		]);
		const read = await call(project, owner, `/triggers/${res.body.id}`);
		expect(read.body).toMatchObject({ sandboxId: box, workflowId: null });
	});

	it("is the owner's: listed, read, edited and deleted by them", async () => {
		const listed = await call(project, owner, `/triggers/list?projectId=${project}&sandboxId=${box}`);
		expect(listed.body.data.map((t: any) => t.id)).toContain(id);
		expect((await call(project, owner, `/triggers/${id}`)).status).toBe(200);
		expect((await call(project, owner, `/triggers/${id}`, "PATCH", { description: "mine" })).status).toBe(200);
	});

	it("is a 404 to another creator on every endpoint, and missing from their list", async () => {
		const workflow = Bun.randomUUIDv7();
		for (const [path, method, body] of [
			[`/triggers/${id}`, "GET"],
			[`/triggers/${id}`, "PATCH", { description: "theirs now" }],
			[`/triggers/${id}`, "DELETE"],
			[`/triggers/${id}/workflows/${workflow}`, "PUT"],
			[`/triggers/${id}/workflows/${workflow}`, "DELETE"],
		] as const) {
			const res = await call(project, other, path, method, body);
			expect(`${method} ${path} ${res.status}`).toBe(`${method} ${path} 404`);
		}
		const listed = await call(project, other, `/triggers/list?projectId=${project}`);
		expect(listed.body.data.map((t: any) => t.id)).not.toContain(id);
		expect((await call(project, owner, `/triggers/${id}`)).body.description).toBe("mine");
	});

	it("cannot be attached to someone else's sandbox, by create or by patch", async () => {
		expect((await trigger(project, other, { sandboxId: box })).status).toBe(404);
		const theirs = await trigger(project, other);
		const res = await call(project, other, `/triggers/${theirs.body.id}`, "PATCH", { sandboxId: box });
		expect(res.status).toBe(404);
	});

	it("starts a workflow or a sandbox, never both, and never on a schedule", async () => {
		const both = await trigger(project, owner, { sandboxId: box, workflowId: Bun.randomUUIDv7() });
		expect(both.status).toBe(400);
		const patched = await call(project, owner, `/triggers/${id}`, "PATCH", { workflowId: Bun.randomUUIDv7() });
		expect(patched.status).toBe(409);
		const schedule = await trigger(project, owner, { sandboxId: box, type: "schedule", schedule: "@daily" });
		expect(schedule.status).toBe(400);
		expect(JSON.stringify(schedule.body)).toContain("A schedule cannot start a sandbox");
	});

	it("moves between idle and the sandbox by patch, withdrawn everywhere when detached", async () => {
		const idle = await trigger(project, owner);
		writes.length = 0;
		const attached = await call(project, owner, `/triggers/${idle.body.id}`, "PATCH", { sandboxId: box });
		expect(attached.body.sandboxId).toBe(box);
		expect(writes.at(-1)).toMatchObject({ op: "put", env: "development" });
		const detached = await call(project, owner, `/triggers/${idle.body.id}`, "PATCH", { sandboxId: null });
		expect(detached.body.sandboxId).toBeNull();
		expect(writes.at(-1)).toMatchObject({ op: "delete", env: "everywhere" });
	});

	it("goes with its sandbox, artifact and all", async () => {
		const doomed = await sandbox(project, owner);
		const t = await trigger(project, owner, { sandboxId: doomed });
		writes.length = 0;
		expect((await call(project, owner, `/projects/${project}/sandboxes/${doomed}`, "DELETE")).status).toBe(200);
		expect(writes).toContainEqual({ op: "delete", key: `trigger.${project}.${t.body.id}`, env: "everywhere" });
		const [left] = await sql`SELECT count(*)::int AS n FROM triggers WHERE id = ${t.body.id}`;
		expect(left.n).toBe(0);
	});
});

describe("system logs of a sandbox", () => {
	it("are shown to the sandbox's owner only", async () => {
		const project = await newProject();
		const owner = await newUser();
		const other = await newUser();
		const box = await sandbox(project, owner);
		await sql`INSERT INTO system_logs (project_id, resource_type, resource_id, type, level, message)
			VALUES (${project}, 'sandbox', ${box}, 'runtime', 'error', 'sandbox broke'),
			       (${project}, 'route', 'r1', 'compile', 'info', 'route compiled')`;

		const read = async (user: string) =>
			(await call(project, user, `/projects/${project}/system-logs`)).body.items.map((l: any) => l.message).sort();
		expect(await read(owner)).toEqual(["route compiled", "sandbox broke"]);
		expect(await read(other)).toEqual(["route compiled"]);
		const filtered = await call(project, other, `/projects/${project}/system-logs?resourceId=${box}`);
		expect(filtered.body.items).toEqual([]);
	});
});
