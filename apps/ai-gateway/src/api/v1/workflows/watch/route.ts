import { Hono } from "hono";
import { requestRouteSchema } from "./dto";
import handleWatchRequest from "./service";
import { validator } from "hono-openapi";
import { zodErrorCallbackParser } from "@fluxify/server";
import { requireWatchAccess } from "./middleware";

export default function (app: Hono) {
	app.get(
		"/:conversationId/watch",
		validator("param", requestRouteSchema, zodErrorCallbackParser),
		requireWatchAccess,
		async (c) => {
			const { conversationId } = c.req.valid("param");
			return handleWatchRequest(c, conversationId);
		},
	);
}
