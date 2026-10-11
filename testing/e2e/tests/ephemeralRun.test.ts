import { afterAll, beforeAll, describe, expect, it } from "bun:test";
import { connectNats, type KvBucket, openKvBucket } from "@fluxify/common/nats";
import { SQL } from "bun";
import { api, type EnvStack, mcpTool, startEnvStack, stopEnvStack } from "../src/envs";

// Ephemeral runs (#741), the real thing: an admin, NATS, and a production and a
// development compiled worker. run_blocks compiles a graph in memory, puts it in
// the development bucket for one call, runs it on the development worker and
// deletes it again. Nothing is left in Postgres or in the bucket but one
// `ephemeral` system log row, and no recording.

let stack: EnvStack;
let admin: SQL;
let development: KvBucket<unknown>;
const PROJECT = () => stack.projectId;
const RUNS = () => `/v1/projects/${PROJECT()}/ephemeral-runs`;

beforeAll(async () => {
	stack = await startEnvStack();
	admin = new SQL(stack.adminDb, { max: 2 });
	const nc = await connectNats({ ...stack.nats, connectionName: "e2e-ephemeral" } as never);
	development = await openKvBucket(nc, "fluxify_dev_artifacts", { history: 1 });
}, 600_000);

afterAll(async () => {
	await admin?.close().catch(() => {});
	await stopEnvStack();
});

/** the tables a run must not write to, and the one it may */
async function counts() {
	const [row] = await admin`SELECT
		(SELECT count(*) FROM sandboxes)::int AS sandboxes,
		(SELECT count(*) FROM blocks)::int AS blocks,
		(SELECT count(*) FROM edges)::int AS edges,
		(SELECT count(*) FROM trace_runs)::int AS trace_runs,
		(SELECT count(*) FROM system_logs WHERE type = 'ephemeral')::int AS ephemeral`;
	return row as Record<string, number>;
}

/** a NATS wildcard is a whole token, so ask for every sandbox key and keep the ephemeral ones */
const tempKeys = async () =>
	(await development.keys(`sandbox.${PROJECT()}.*`)).filter((key) => key.split(".")[2]?.startsWith("eph_"));

async function runBlocks(args: object, as: "creator" | "other" | "viewer" = "creator") {
	const res = await mcpTool(stack, stack.tokens[as], "run_blocks", { projectId: PROJECT(), ...args });
	return { ok: res.ok, text: res.text, body: res.ok ? JSON.parse(res.text) : undefined };
}

const js = (ref: string, value: string) => ({ ref, type: "jsrunner", data: { value } });
const reply = (ref: string) => ({ ref, type: "response", data: { httpCode: "200" } });

describe("a JS chain", () => {
	it("returns the output and the trace, and leaves nothing in Postgres or the bucket", async () => {
		const before = await counts();
		// the key is in the bucket while the run is, so the run is slow enough to see it
		const seen = new Set<string>();
		let watching = true;
		const watch = (async () => {
			while (watching) {
				for (const key of await tempKeys()) seen.add(key);
				await Bun.sleep(50);
			}
		})();

		const res = await runBlocks({
			blocks: [
				js("first", "await new Promise((r) => setTimeout(r, 1200)); return { n: 20 };"),
				js("second", "return { n: input.n + 1 };"),
				reply("answer"),
			],
			edges: [
				{ from: "first", to: "second" },
				{ from: "second", to: "answer" },
			],
			input: { who: "e2e" },
		});
		watching = false;
		await watch;

		expect(res.ok).toBe(true);
		expect(res.body).toMatchObject({ status: 200, body: { n: 21 } });
		expect(res.body.id).toStartWith("eph_");
		expect(res.body.durationMs).toBeGreaterThan(1000);
		// the blocks that ran, by the refs the caller chose
		const trace = res.body.trace.join("\n");
		expect(trace).toContain("first (jsrunner) ok");
		expect(trace).toContain("second (jsrunner) ok");
		// the dev token is added by the admin and never comes back
		expect(res.text).not.toContain("fxd_");

		expect([...seen]).toEqual([`sandbox.${PROJECT()}.${res.body.id}`]);
		expect(await tempKeys()).toEqual([]);
		expect(await development.get(`sandbox.${PROJECT()}.${res.body.id}`)).toBeNull();

		const after = await counts();
		expect({ ...after, ephemeral: 0 }).toEqual({ ...before, ephemeral: 0 });
		// one log row for the run, and it hangs off no recording
		expect(after.ephemeral).toBe(before.ephemeral! + 1);
		const [log] = await admin`SELECT * FROM system_logs WHERE resource_id = ${res.body.id}`;
		expect(log).toMatchObject({
			type: "ephemeral",
			level: "info",
			run_id: null,
			detail: { userId: stack.creatorId, env: "development", status: 200, output: { n: 21 } },
		});
	}, 120_000);

	it("reads the request the way a route does", async () => {
		const res = await runBlocks({
			blocks: [
				js("echo", "return { method: httpRequestMethod, path: httpRequestRoute, got: getRequestBody() };"),
				reply("answer"),
			],
			edges: [{ from: "echo", to: "answer" }],
			method: "POST",
			path: "/hello",
			input: { a: 1 },
		});
		expect(res.body.body).toEqual({ method: "POST", path: "/hello", got: { a: 1 } });
	}, 60_000);
});

describe("a failing block", () => {
	it("returns the error with the block and stack, and leaves one ephemeral log row", async () => {
		const before = await counts();

		const res = await runBlocks({
			blocks: [js("fine", "return 1;"), js("broken", "throw new Error('exploded');"), reply("answer")],
			edges: [
				{ from: "fine", to: "broken" },
				{ from: "broken", to: "answer" },
			],
		});

		expect(res.ok).toBe(true);
		expect(res.body.status).toBe(500);
		expect(res.body.error).toMatchObject({ block: { key: "broken", type: "jsrunner" }, message: "exploded" });
		expect(res.body.trace.join("\n")).toContain("broken (jsrunner) ERROR");

		const after = await counts();
		expect(after.ephemeral).toBe(before.ephemeral! + 1);
		// a failing run is never a recording
		expect(after.trace_runs).toBe(before.trace_runs!);
		const [log] = await admin`SELECT * FROM system_logs WHERE resource_id = ${res.body.id}`;
		expect(log).toMatchObject({ level: "error", message: "exploded" });
		expect(log!.detail.blocks.map((b: any) => b.outcome)).toContain("failure");
		expect(await tempKeys()).toEqual([]);
	}, 60_000);

	it("is seen only by the user who ran it", async () => {
		const mine = await runBlocks({ blocks: [js("n", "return 7;"), reply("answer")], edges: [{ from: "n", to: "answer" }] });
		const logs = (as: "creator" | "other") =>
			api(stack, as, `/v1/projects/${PROJECT()}/system-logs?type=ephemeral&limit=200`).then(
				(r) => r.body.items.map((i: any) => i.resourceId) as string[],
			);

		expect(await logs("creator")).toContain(mine.body.id);
		expect(await logs("other")).not.toContain(mine.body.id);
	}, 60_000);
});

describe("a bad graph and the limits", () => {
	it("is refused with the reasons, before anything is written", async () => {
		const before = await counts();
		const res = await runBlocks({
			blocks: [{ ref: "x", type: "not_a_block", data: {} }],
		});
		expect(res.ok).toBe(false);
		expect(res.text).toContain("Unknown block type");
		expect(await counts()).toEqual(before);
		expect(await tempKeys()).toEqual([]);
	}, 60_000);

	it("honours the timeout, and clamps one outside 1-30", async () => {
		const slow = [js("sleep", "await new Promise((r) => setTimeout(r, 8000)); return 1;"), reply("answer")];
		const edges = [{ from: "sleep", to: "answer" }];

		const started = Date.now();
		const res = await runBlocks({ blocks: slow, edges, timeoutSeconds: 2 });
		const took = Date.now() - started;

		expect(res.body.status).toBeNull();
		expect(res.body.error).toContain("did not finish within 2 seconds");
		expect(took).toBeLessThan(6000);
		expect(await tempKeys()).toEqual([]);

		// 0 is clamped up to 1 second, not read as "no limit"
		const clamped = await runBlocks({ blocks: slow, edges, timeoutSeconds: 0 });
		expect(clamped.body.error).toContain("did not finish within 1 seconds");
	}, 120_000);

	it("is a creator's tool", async () => {
		const res = await runBlocks({ blocks: [js("n", "return 1;")] }, "viewer");
		expect(res.ok).toBe(false);
	}, 60_000);
});

describe("without a development worker", () => {
	it("says how to start one", async () => {
		process.kill(stack.devWorkerPid, "SIGKILL");
		// a node is live for 10 seconds after its last heartbeat
		const deadline = Date.now() + 40_000;
		let res = await runBlocks({ blocks: [js("n", "return 1;")] });
		while (res.ok && Date.now() < deadline) {
			await Bun.sleep(1000);
			res = await runBlocks({ blocks: [js("n", "return 1;")] });
		}
		expect(res.ok).toBe(false);
		expect(res.text).toContain("FLUXIFY_ENV=development");
		expect(await tempKeys()).toEqual([]);
	}, 120_000);
});
