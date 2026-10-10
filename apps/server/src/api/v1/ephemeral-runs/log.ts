import type { z } from "zod";
import { EPHEMERAL_LOG_TYPE, systemLog } from "../../../lib/systemLogs";
import type { callResultSchema } from "../routes/call/service";

/** Bigger outputs are cut when logged, with a note saying so. */
export const MAX_LOGGED_OUTPUT_BYTES = 64 * 1024;

type Answer = z.infer<typeof callResultSchema>;

/** The output as logged: whole when it fits, else its first 64 KB and a note. */
export function capOutput(value: unknown) {
	const text = typeof value === "string" ? value : (JSON.stringify(value) ?? "");
	const bytes = Buffer.from(text);
	if (bytes.length <= MAX_LOGGED_OUTPUT_BYTES) return { output: value };
	return {
		output: bytes.subarray(0, MAX_LOGGED_OUTPUT_BYTES).toString("utf8"),
		note: `Output cut at 64 KB; the run produced ${bytes.length} bytes.`,
	};
}

/**
 * The run's one log row (#741), written by the admin for every run that
 * reached a worker: success, failure and timeout. It is the only thing kept, so
 * it carries the block trace, the output (or the error and its stack), the
 * duration and the owner; `listSystemLogs` shows it to that user alone.
 */
export async function writeEphemeralLog(o: {
	projectId: string;
	userId: string;
	id: string;
	answer: Answer;
}) {
	const { answer } = o;
	const failed = answer.status === null || answer.status >= 500 || answer.debugError !== undefined;
	const { debugError, debugTrace } = answer;
	await systemLog[failed ? "error" : "info"]({
		projectId: o.projectId,
		resourceType: "ephemeral",
		resourceId: o.id,
		type: EPHEMERAL_LOG_TYPE,
		message: failed
			? (debugError?.message ?? answer.error ?? `The run answered ${answer.status}`)
			: `The run answered ${answer.status} in ${answer.durationMs} ms`,
		detail: {
			userId: o.userId,
			env: "development",
			status: answer.status,
			durationMs: answer.durationMs,
			...capOutput(answer.body),
			...(answer.error && { error: answer.error }),
			...(debugError && {
				block: debugError.block,
				...(debugError.detail && { cause: debugError.detail }),
				...(debugError.stack && { stack: debugError.stack }),
			}),
			blocks: debugTrace?.spans ?? [],
			...(debugTrace?.more && { more: debugTrace.more }),
		},
	});
	return failed;
}
