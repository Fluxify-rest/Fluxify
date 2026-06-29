import { logger } from "@fluxify/common";
import { initializeAIWorkflow } from "./workflow";
import { loadAppConfig, loadIntegrations } from "@fluxify/server";
import { initDocsDB } from "./db/vector";

export async function runWorker() {
	logger.info("[Worker] Starting worker process...");
	await initDocsDB();
	await loadAppConfig();
	await loadIntegrations();
	initializeAIWorkflow();
	logger.info("[Worker] Worker process started successfully.");
}
