import {
	env,
	FeatureExtractionPipeline,
	pipeline,
} from "@huggingface/transformers";
import { EMBEDDING_MODEL } from "../constants";
import path from "path";

let pipe: FeatureExtractionPipeline = null!;
const LOCAL_MODELS_DIR = path.resolve("./.models");

env.localModelPath = LOCAL_MODELS_DIR;
env.cacheDir = LOCAL_MODELS_DIR;
env.allowLocalModels = true;

export async function loadEmbeddingModel() {
	pipe = await pipeline("feature-extraction", EMBEDDING_MODEL);
}

export async function generateEmbedding(text: string) {
	const embedding = await pipe(text, {
		pooling: "mean",
		normalize: true,
	});
	return [...embedding.data] as number[];
}
