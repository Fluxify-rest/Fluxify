import type { Hono } from "hono";
import { registerWorkflowRoutes } from "./v1/workflow/register";

export function registerRoutes(app: Hono) {
	const subRoute = app.basePath("/_/admin/ai/v1");
	registerWorkflowRoutes(subRoute);
}
