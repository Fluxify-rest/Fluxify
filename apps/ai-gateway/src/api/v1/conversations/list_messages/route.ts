import { queryParamsSchema, routeParamsSchema } from "./dto";
import handleRequest from "./service";
import { zodErrorCallbackParser } from "@fluxify/server";
import { Hono } from "hono";
import { verifyConversationAccess } from "../middleware";
import { validator } from "hono-openapi";

export default function (app: Hono) {
	app.get(
		"/:conversationId/messages",
		validator("param", routeParamsSchema, zodErrorCallbackParser),
		validator("query", queryParamsSchema, zodErrorCallbackParser),
		verifyConversationAccess,
		async (c) => {
			const query = c.req.valid("query");
			// @ts-ignore
			const conversation = c.get("conversation") as {
				id: string;
				title: string | null;
				createdAt: Date;
				updatedAt: Date;
			};

			const result = await handleRequest(
				conversation,
				query.page,
				query.perPage,
			);
			return c.json(result);
		},
	);
}
