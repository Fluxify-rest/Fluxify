import { Hono } from "hono";
import { requestParamSchema, requestBodySchema } from "./dto";
import handleRequest from "./service";
import { validator } from "hono-openapi";
import { zodErrorCallbackParser, type User } from "@fluxify/server";
import { requireWorkflowAccess } from "../middleware";
import { getConversationById } from "./repository";

export default function (app: Hono) {
	app.post(
		"/:conversationId",
		validator("param", requestParamSchema, zodErrorCallbackParser),
		validator("json", requestBodySchema, zodErrorCallbackParser),
		requireWorkflowAccess(async (c: any) => {
			const param = c.req.valid("param");
			const conv = await getConversationById(param.conversationId);
			if (!conv) return {};
			return {
				location: conv.metadata.location,
				routeId: conv.metadata.routeId,
				projectId: conv.projectId,
			};
		}),
		async (c) => {
			const param = c.req.valid("param");
			const body = c.req.valid("json");
			// @ts-ignore
			const user = c.get("user") as User;
			const result = await handleRequest(param, body, user.id);
			return c.json(result);
		},
	);
}
