import {
	describeRoute,
	DescribeRouteOptions,
	resolver,
	validator,
} from "hono-openapi";
import zodErrorCallbackParser from "../../../../middlewares/zodErrorCallbackParser";
import { requestParamSchema, requestBodySchema, responseSchema } from "./dto";
import { errorSchema } from "../../../../errors/customError";
import * as service from "./service";
import { validationErrorSchema } from "../../../../errors/validationError";
import { HonoServer } from "../../../../types";

const openapiRouteOptions: DescribeRouteOptions = {
	description: "Posts a message to AI agent.",
	operationId: "post-ai-message",
	tags: ["AI Chat"],
	responses: {
		200: {
			description: "Successful",
			content: {
				"application/json": {
					schema: resolver(responseSchema),
				},
			},
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
	app.post(
		"/:routeId",
		describeRoute(openapiRouteOptions),
		validator("param", requestParamSchema, zodErrorCallbackParser),
		validator("json", requestBodySchema, zodErrorCallbackParser),
		async (ctx) => {
			const { routeId } = ctx.req.valid("param");
			const { content } = ctx.req.valid("json");
			const user = ctx.get("user");
			if (!user) return ctx.json({ error: "Unauthorized" }, 401);

			const result = await service.postMessage(routeId, user.id, content);

			if ("error" in result) {
				return ctx.json({ error: result.error }, result.status as any);
			}

			return ctx.json(result);
		},
	);
}
