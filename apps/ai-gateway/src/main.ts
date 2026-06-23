import { Hono } from "hono";
import { cors } from "hono/cors";
import { Worker } from "worker_threads";
import { serve } from "bun";
import path from "path";
import { mapMcpServer } from "./mcp";
import { logger, initializeLogger } from "./lib/logger";

export async function runMain() {
	initializeLogger({ serviceName: "fluxify.api-gateway-main" });
	logger.info("Hello from Fluxify API Gateway (Main Process)!");

	const app = new Hono<any>();
	app.use(
		"*",
		cors({
			origin: "*",
			allowMethods: ["POST", "GET", "PUT", "DELETE", "OPTIONS"],
			allowHeaders: ["*"],
			credentials: true,
		}),
	);
	mapMcpServer(app);

	// Spawn the worker thread targeting index.ts
	const workerPath = path.join(import.meta.dirname, "index.ts");
	const worker = new Worker(workerPath);

	app.use("*", (ctx, next) => {
		ctx.set("ai_worker", worker);
		return next();
	});

	const server = serve({
		fetch: app.fetch,
		port: 8001,
	});
	logger.info(
		`Server running at http://${server.hostname}:${server.port}/_/admin\nMCP: /_/admin/mcp`,
	);
}
