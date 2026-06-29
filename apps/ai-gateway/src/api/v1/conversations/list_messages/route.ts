import { zValidator } from "@hono/zod-validator";
import { queryParamsSchema, routeParamsSchema } from "./dto";
import handleRequest from "./service";
import { zodErrorCallbackParser } from "@fluxify/server";
import { Hono } from "hono";
import { verifyConversationAccess } from "./middleware";

export default function (app: Hono) {
	app.get(
		"/:conversationId/messages",
		zValidator("param", routeParamsSchema, zodErrorCallbackParser),
		zValidator("query", queryParamsSchema, zodErrorCallbackParser),
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
