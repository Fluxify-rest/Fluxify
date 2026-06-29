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

const openapiRouteOptions: DescribeRouteOptions = {
	description: "Clears message history for a route.",
	operationId: "clear-ai-messages",
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
			description: "Invalid param",
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
	app.delete(
		"/:routeId",
		describeRoute(openapiRouteOptions),
		validator("param", requestParamSchema, zodErrorCallbackParser),
		async (ctx) => {
			const { routeId } = ctx.req.valid("param");
			const user = ctx.get("user");
			if (!user) return ctx.json({ error: "Unauthorized" }, 401);

			const result = await service.deleteMessages(routeId, user.id);
			return ctx.json(result);
		},
	);
}
