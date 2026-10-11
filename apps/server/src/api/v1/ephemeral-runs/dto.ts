import { z } from "zod";
import { callResultSchema } from "../routes/call/service";
import { sandboxCallSchema } from "../sandboxes/call";

export { projectParamSchema } from "../sandboxes/dto";

/** the bounds of one run's wait, in seconds; 30 is the route default */
export const MIN_TIMEOUT_SECONDS = 1;
export const MAX_TIMEOUT_SECONDS = 30;
export const DEFAULT_TIMEOUT_SECONDS = 10;

/**
 * Blocks and edges the way `edit_canvas` names them: by a ref you choose, not an
 * id. The ref doubles as the block's id for the run, which is why it is short
 * and plain: an edge's handle id is `<ref>-<handle>` and has to stay under 50.
 */
export const refSchema = z
	.string()
	.regex(/^[A-Za-z][A-Za-z0-9_]{0,31}$/, "A ref is letters, digits and _, starting with a letter");

const blockSchema = z.object({
	ref: refSchema,
	type: z
		.string()
		.min(1)
		.max(100)
		.describe("Block type from get_block_schemas, or a custom block's name"),
	data: z.record(z.string(), z.unknown()).default({}).describe("The block's settings"),
});

const edgeSchema = z.object({
	from: z.string().min(1).max(60).describe('A block ref, or "ref.handle" such as "check.success"'),
	to: refSchema,
	handle: z.string().optional().describe("Output handle on the from block; omit for its default"),
});

const runCallSchema = sandboxCallSchema.omit({ debug: true }).extend({
	blocks: z.array(blockSchema).min(1).max(100),
	edges: z.array(edgeSchema).max(300).default([]),
	timeoutSeconds: z
		.number()
		.finite()
		.optional()
		.describe(
			`Seconds to wait; clamped to ${MIN_TIMEOUT_SECONDS}-${MAX_TIMEOUT_SECONDS}. The project's setting when omitted`,
		),
});

export const runBodySchema = runCallSchema.transform((data) => ({
	...data,
	method: data.method ?? (data.body !== undefined ? "POST" : "GET"),
}));

export type RunBody = z.infer<typeof runBodySchema>;

export const resultSchema = callResultSchema.omit({ runId: true }).extend({
	/** names this run's `ephemeral` system log row (resourceId) */
	id: z.string(),
	/** canvas rule warnings; errors refuse the run */
	warnings: z.array(z.string()).optional(),
});
