import { Hono } from "hono";
import { requestQuerySchema, requestBodySchema } from "./dto";
import handleRequest from "./service";
import { validator } from "hono-openapi";
import { zodErrorCallbackParser, type User } from "@fluxify/server";
import { requireWorkflowAccess } from "../middleware";

export default function (app: Hono) {
	app.post(
		"/post-message",
		validator("query", requestQuerySchema, zodErrorCallbackParser),
		validator("json", requestBodySchema, zodErrorCallbackParser),
		requireWorkflowAccess((c: any) => c.req.valid("query")),
		async (c) => {
			const query = c.req.valid("query");
			const body = c.req.valid("json");
			// @ts-ignore
			const user = c.get("user") as User;
			const result = await handleRequest(query, body, user.id);
			return c.json(result);
		},
	);
}
