import { getConversationsByProjectId } from "./repository";
import z from "zod";
import { aiConversationLocationEnum, getCache, setCacheEx } from "@fluxify/server";

export default async function handleRequest(
	projectId: string,
	userId: string,
	location?: z.infer<typeof aiConversationLocationEnum>,
) {
	const cacheKey = `conversations:list:${projectId}:${userId}:${location || "all"}`;
	const cached = await getCache(cacheKey);
	if (cached) return JSON.parse(cached);

	const conversations = await getConversationsByProjectId(
		projectId,
		userId,
		location,
	);

	await setCacheEx(cacheKey, JSON.stringify(conversations), 300);
	return conversations;
}
