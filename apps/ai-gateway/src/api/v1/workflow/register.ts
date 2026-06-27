import type { Hono } from "hono";
import mapPostMessageRoute from "./post-message/route";

export function registerWorkflowRoutes(app: Hono) {
	const subRoute = app.basePath("/workflows");
	mapPostMessageRoute(subRoute);
}
