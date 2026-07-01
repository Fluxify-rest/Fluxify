import { zValidator } from "@hono/zod-validator";
import { routeParamsSchema } from "./dto";
import handleRequest from "./service";
import { zodErrorCallbackParser } from "@fluxify/server";
import { Hono } from "hono";
import { verifyConversationOwner } from "../middleware";

export default function (app: Hono) {
	app.delete(
		"/:conversationId",
		zValidator("param", routeParamsSchema, zodErrorCallbackParser),
		verifyConversationOwner,
		async (c) => {
			const param = c.req.valid("param");
			// @ts-ignore
			const conversation = c.get("conversation") as any;

			const result = await handleRequest(
				param.conversationId,
				conversation.projectId,
			);
			return c.json(result);
		},
	);
}
