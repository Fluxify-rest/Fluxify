import { restoreFromFile } from "@orama/plugin-data-persistence/server";
import { search } from "@orama/orama";
import { VECTOR_STORE_PATH } from "../constants";
import type { AnyOrama, Result } from "@orama/orama";
import { generateEmbedding } from "../lib/embedding-model";

type Document = {
	id: string;
	title: string;
	chunk: number;
	description: string;
	content: string;
	vector: number[];
};

export interface VectorDB extends AnyOrama<Document> {}

let vectorDB: VectorDB = null!;

export async function initVectorDB() {
	vectorDB = await restoreFromFile("binary", VECTOR_STORE_PATH);
}

export async function queryVectorDB(query: string, limit: number = 5) {
	const embedding = await generateEmbedding(query);
	const results = await search(vectorDB, {
		mode: "vector",
		vector: { value: embedding, property: "embedding" },
		similarity: 0.85,
		limit,
	});
	return results.hits.map((hit) => hit.document as Document);
}
