import { initVectorDB } from "./db/vector";
import { loadEmbeddingModel } from "./lib/embedding-model";
import { logger, initializeLogger } from "./lib/logger";

export async function runWorker() {
	initializeLogger({ serviceName: "fluxify.api-gateway-worker" });
	logger.info("Hello from Fluxify API Gateway (Worker Process)!");

	await initVectorDB();
	await loadEmbeddingModel();
}
