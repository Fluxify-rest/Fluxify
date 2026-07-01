import { validator } from "hono-openapi";
import { queryParamsSchema, requestBodySchema } from "./dto";
import handleRequest from "./service";
import { zodErrorCallbackParser } from "@fluxify/server";
import type { User } from "better-auth";
import { verifyCreateConversationAccess } from "../middleware";
import type { Hono } from "hono";

export default function (app: Hono) {
	app.post(
		"/",
		validator("query", queryParamsSchema, zodErrorCallbackParser),
		validator("json", requestBodySchema, zodErrorCallbackParser),
		verifyCreateConversationAccess,
		async (c: any) => {
			const user = c.get("user") as User;
			const query = c.req.valid("query");
			const body = c.req.valid("json");
			const projectId = c.get("projectId") as string;

			const result = await handleRequest(user.id, projectId, query, body);
			return c.json(result);
		},
	);
}
