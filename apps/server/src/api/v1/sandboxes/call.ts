import { z } from "zod";
import { ConflictError } from "../../../errors/conflictError";
import { DEV_WORKER_URL, getEnv } from "../../../lib/env";
import { devWorkerOnline } from "../../../modules/orchestrator/status";
import { DEV_TOKEN_HEADER } from "../../../modules/requestRouter/devToken";
import { readDevToken } from "../projects/settings/dev-token/service";
import { callBodySchema, sendCall } from "../routes/call/service";
import { specServerUrl } from "../routes/openapi/service";
import { mustOwn } from "./service";

export const NO_DEV_WORKER = "start a worker with FLUXIFY_ENV=development";

export const sandboxCallSchema = callBodySchema.omit({ params: true }).extend({
	method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]).default("GET"),
	/** after `/_sandbox/<id>`; the sandbox's blocks see it as the request path */
	path: z.string().default("/"),
});

/**
 * One request to a sandbox (#735), from the admin, the way call_route reaches a
 * route: over HTTP to `/_sandbox/<id>/<path>` on the development worker, with
 * the project's development token added here. The token never leaves this
 * function: it is not in the answer, and the worker strips it before the
 * blocks run.
 */
export async function callSandbox(
	projectId: string,
	id: string,
	userId: string,
	input: z.infer<typeof sandboxCallSchema>,
	requestOrigin: string,
) {
	await mustOwn(projectId, id, userId);
	if (!(await devWorkerOnline(projectId))) throw new ConflictError(NO_DEV_WORKER);

	// DEV_WORKER_URL, else the project's address, whose proxy sends /_sandbox to the development worker
	const base = DEV_WORKER_URL ?? specServerUrl(projectId, getEnv("SERVER_URL") || requestOrigin);
	const path = input.path.startsWith("/") ? input.path : `/${input.path}`;
	const url = new URL(`/_sandbox/${id}${path}`, base);
	for (const [k, v] of Object.entries(input.query ?? {})) url.searchParams.set(k, v);

	const { token } = await readDevToken(projectId);
	const result = await sendCall(url, input.method, input, {
		target: { projectId, id },
		timeoutSeconds: 30,
		headers: { [DEV_TOKEN_HEADER]: token },
	});
	return {
		...result,
		...(result.runId && {
			recording: `/v1/projects/${projectId}/sandboxes/${id}/runs/${result.runId}`,
		}),
	};
}
