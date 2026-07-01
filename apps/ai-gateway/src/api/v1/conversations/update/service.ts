import { updateConversationTitle } from "./repository";
import { deleteCacheKeysByPattern } from "@fluxify/server";

export default async function handleRequest(conversationId: string, title: string, projectId: string) {
	const result = await updateConversationTitle(conversationId, title);
	await deleteCacheKeysByPattern(`conversations:list_messages:${conversationId}:*`);
	await deleteCacheKeysByPattern(`conversations:list:${projectId}:*`);
	return result;
}
