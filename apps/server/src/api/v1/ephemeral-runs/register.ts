import { describeRoute, resolver, validator } from "hono-openapi";
import { errorSchema } from "../../../errors/customError";
import { validationErrorSchema } from "../../../errors/validationError";
import zodErrorCallbackParser from "../../../middlewares/zodErrorCallbackParser";
import type { HonoContext, HonoServer } from "../../../types";
import { requireLoggedIn, requireProjectAccess } from "../../auth/middleware";
import { projectParamSchema, resultSchema, runBodySchema } from "./dto";
import { runEphemeral } from "./service";

const userOf = (ctx: HonoContext) => (ctx.get("user") as { id?: string } | undefined)?.id ?? "";

/**
 * Ephemeral runs (#741): `/v1/projects/:projectId/ephemeral-runs`. Runs a few
 * blocks once on a development worker and keeps nothing: no sandbox, no
 * recording. Creator only, as it runs user code on development data.
 */
export default {
	name: "ephemeral-runs",
	registerHandler(app: HonoServer) {
		const router = app.basePath("/projects/:projectId/ephemeral-runs");

		router.post(
			"/",
			describeRoute({
				operationId: "run-ephemeral-blocks",
				description:
					"Checks the blocks like a canvas save, compiles them in memory, runs them once on a development worker and deletes them again. Nothing is stored except one system log row (type ephemeral) that only you can read. Answers with the response, the blocks that ran and how long it took",
				tags: ["Ephemeral runs"],
				responses: {
					200: {
						description: "The run's answer, or why it could not be reached",
						content: { "application/json": { schema: resolver(resultSchema) } },
					},
					400: {
						description: "The blocks are not a valid graph",
						content: { "application/json": { schema: resolver(validationErrorSchema) } },
					},
					403: {
						description: "Not a creator in this project",
						content: { "application/json": { schema: resolver(errorSchema) } },
					},
					409: {
						description: "No development worker is running",
						content: { "application/json": { schema: resolver(errorSchema) } },
					},
				},
			}),
			requireLoggedIn(),
			requireProjectAccess("creator", { key: "projectId", source: "param" }),
			validator("param", projectParamSchema, zodErrorCallbackParser),
			validator("json", runBodySchema, zodErrorCallbackParser),
			async (ctx) =>
				ctx.json(
					await runEphemeral(
						ctx.req.valid("param").projectId,
						userOf(ctx),
						ctx.req.valid("json"),
						new URL(ctx.req.url).origin,
					),
				),
		);
	},
};
