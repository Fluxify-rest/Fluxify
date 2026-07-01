import { zValidator } from "@hono/zod-validator";
import { requestBodySchema, routeParamsSchema } from "./dto";
import handleRequest from "./service";
import { zodErrorCallbackParser } from "@fluxify/server";
import { Hono } from "hono";
import { verifyConversationOwner } from "../middleware";

export default function (app: Hono) {
	app.put(
		"/:conversationId",
		zValidator("param", routeParamsSchema, zodErrorCallbackParser),
		zValidator("json", requestBodySchema, zodErrorCallbackParser),
		verifyConversationOwner,
		async (c) => {
			const param = c.req.valid("param");
			const body = c.req.valid("json");
			// @ts-ignore
			const conversation = c.get("conversation") as any;

			const result = await handleRequest(
				param.conversationId,
				body.title,
				conversation.projectId,
			);
			return c.json(result);
		},
	);
}
