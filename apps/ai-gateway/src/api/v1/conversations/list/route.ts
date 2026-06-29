import { zValidator } from "@hono/zod-validator";
import { queryParamsSchema, routeParamsSchema } from "./dto";
import handleRequest from "./service";
import { zodErrorCallbackParser, type User } from "@fluxify/server";
import { Hono } from "hono";
import { verifyAccessAndProject } from "./middleware";

export default function (app: Hono) {
	app.get(
		"/list/:projectId",
		zValidator("param", routeParamsSchema, zodErrorCallbackParser),
		zValidator("query", queryParamsSchema, zodErrorCallbackParser),
		verifyAccessAndProject,
		async (c: any) => {
			const user = c.get("user") as User;
			const param = c.req.valid("param");
			const query = c.req.valid("query");
			const projectId = param.projectId;

			const result = await handleRequest(projectId, user.id, query.location);
			return c.json(result);
		},
	);
}
