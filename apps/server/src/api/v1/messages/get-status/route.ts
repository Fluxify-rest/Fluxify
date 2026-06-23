import {
	describeRoute,
	DescribeRouteOptions,
	resolver,
	validator,
} from "hono-openapi";
import zodErrorCallbackParser from "../../../../middlewares/zodErrorCallbackParser";
import { requestParamSchema, responseSchema } from "./dto";
import { errorSchema } from "../../../../errors/customError";
import * as service from "./service";
import { validationErrorSchema } from "../../../../errors/validationError";
import { HonoServer } from "../../../../types";
import { streamSSE } from "hono/streaming";
import { subscribeToChannel, CHAN_AI_SSE_PREFIX } from "../../../../db/redis";

const openapiRouteOptions: DescribeRouteOptions = {
	description: "SSE connection to get message status.",
	operationId: "get-ai-status",
	tags: ["AI Chat"],
	responses: {
		200: {
			description: "Successful Stream",
		},
		400: {
			description: "Invalid data",
			content: {
				"application/json": {
					schema: resolver(validationErrorSchema),
				},
			},
		},
		401: {
			description: "Unauthorized",
			content: {
				"application/json": {
					schema: resolver(errorSchema),
				},
			},
		},
	},
};

export default function (app: HonoServer) {
	app.get(
		"/:routeId/status",
		describeRoute(openapiRouteOptions),
		validator("param", requestParamSchema, zodErrorCallbackParser),
		async (ctx) => {
			const { routeId } = ctx.req.valid("param");
			const user = ctx.get("user");
			if (!user) return ctx.json({ error: "Unauthorized" }, 401);

			// Check first if there's any active status instantly
			const initialStatus = await service.getLatestMessageStatus(
				routeId,
				user.id,
			);

			return streamSSE(ctx as any, async (stream) => {
				if (initialStatus) {
					await stream.writeSSE({
						data: JSON.stringify(initialStatus),
						event: "status",
					});
				}

				const channel = `${CHAN_AI_SSE_PREFIX}${user.id}:${routeId}`;
				const unsubscribe = await subscribeToChannel(
					channel,
					async (dataStr) => {
						await stream.writeSSE({
							data: dataStr,
							event: "status",
						});
					},
				);

				stream.onAbort(() => {
					unsubscribe();
				});

				// Wait continuously
				while (true) {
					await stream.sleep(1000);
				}
			});
		},
	);
}
