import { z } from "zod";
import { blockKeys, MAX_RESPONSE_CHARS, traceLines, truncate, withBlockKey } from "./routeTools";
import { type McpTool, pick, projectId } from "./tools";

const SAVE = { readOnlyHint: false, destructiveHint: false };
const DELETE = { readOnlyHint: false, destructiveHint: true, idempotentHint: true };
/** A call runs the graph for real, on development data: it can write, send and call out. */
const RUN = { readOnlyHint: false, destructiveHint: true, openWorldHint: true };

const sandboxId = z.string().describe("Sandbox id, from list_sandboxes");
const base = (a: { projectId: string }) => `/v1/projects/${a.projectId}/sandboxes`;
const fields = ["id", "name", "settings", "updatedAt"];

/**
 * Sandboxes (#735): your own scratch canvases, run on a development worker with
 * development values. Every tool goes through the sandbox endpoints, which
 * answer 404 to anyone but the owner, so an agent acting as you sees only yours.
 */
export const sandboxTools: McpTool[] = [
	{
		name: "list_sandboxes",
		title: "List sandboxes",
		description:
			"Your sandboxes in a project: private scratch canvases that run on development data. Other people's are never listed.",
		role: "creator",
		input: { projectId },
		call: async ({ get }, a) =>
			(await get(base(a))).data.map((s: Record<string, unknown>) => pick(s, fields)),
	},
	{
		name: "get_sandbox",
		title: "Get sandbox",
		description:
			"One of your sandboxes: name and settings. Its canvas comes from get_canvas with target { kind: 'sandbox', id, projectId }.",
		role: "creator",
		input: { projectId, sandboxId },
		call: async ({ get }, a) => pick(await get(`${base(a)}/${a.sandboxId}`), fields),
	},
	{
		name: "create_sandbox",
		title: "Create sandbox",
		description:
			"Create a sandbox: a private canvas to try blocks on development data (inspect a table with DB Native, test a custom block) without touching real routes. It starts with an entrypoint. Build it with get_canvas and edit_canvas (target { kind: 'sandbox', id, projectId }), then call_sandbox or run_sandbox.",
		role: "creator",
		annotations: SAVE,
		input: { projectId, name: z.string().min(1).max(255) },
		call: async ({ send }, a) => send("POST", base(a), { name: a.name }),
	},
	{
		name: "delete_sandbox",
		title: "Delete sandbox",
		description: "Delete one of your sandboxes, its canvas, its runs and its triggers.",
		role: "creator",
		annotations: DELETE,
		input: { projectId, sandboxId },
		call: async ({ send }, a) => {
			await send("DELETE", `${base(a)}/${a.sandboxId}`);
			return { deleted: a.sandboxId };
		},
	},
	{
		name: "call_sandbox",
		title: "Call sandbox",
		description: `Send a REAL HTTP request to your sandbox on a development worker: any method, any path (the blocks see it as the request path), any body. It runs on development data and can still write it. The development token is added for you. Returns status, headers and body (cut at ${MAX_RESPONSE_CHARS} characters), runId and recording (read the run with get_recording, kind 'sandbox'). When it fails, error has the real cause; trace lists the blocks that ran. Without a development worker it says how to start one.`,
		role: "creator",
		annotations: RUN,
		input: {
			projectId,
			sandboxId,
			method: z
				.enum(["GET", "POST", "PUT", "PATCH", "DELETE"])
				.optional()
				.describe("GET by default"),
			path: z.string().optional().describe("After /_sandbox/<id>, e.g. /users/1. / by default"),
			query: z.record(z.string(), z.string()).optional(),
			headers: z.record(z.string(), z.string()).optional(),
			body: z.unknown().optional().describe("JSON body; a string is sent as-is"),
		},
		call: async ({ get, send }, { projectId: p, sandboxId: id, ...a }) => {
			const { debugError, debugTrace, ...result } = await send(
				"POST",
				`${base({ projectId: p })}/${id}/call`,
				{ ...a, debug: true },
			);
			const target = { kind: "sandbox" as const, id, projectId: p };
			const keys = debugError || debugTrace ? await blockKeys(get, target) : new Map();
			return {
				...result,
				body: truncate(result.body),
				...(debugError && { error: withBlockKey(keys, debugError) }),
				...(debugTrace && { trace: traceLines(keys, debugTrace) }),
			};
		},
	},
	{
		name: "run_sandbox",
		title: "Run sandbox",
		description:
			"Run your sandbox once as a workflow on a development worker, with payload as the trigger's data. Returns the job id at once; the run is recorded (list_recordings, kind 'sandbox').",
		role: "creator",
		annotations: RUN,
		input: { projectId, sandboxId, payload: z.unknown().optional() },
		call: async ({ send }, a) =>
			send("POST", `${base(a)}/${a.sandboxId}/run`, { payload: a.payload }),
	},
];
