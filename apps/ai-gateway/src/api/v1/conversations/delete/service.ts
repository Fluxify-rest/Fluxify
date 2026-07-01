import { deleteConversation } from "./repository";
import { deleteCacheKeysByPattern } from "@fluxify/server";

export default async function handleRequest(conversationId: string, projectId: string) {
	await deleteConversation(conversationId);
	await deleteCacheKeysByPattern(`conversations:list_messages:${conversationId}:*`);
	await deleteCacheKeysByPattern(`conversations:list:${projectId}:*`);
	return { success: true, message: "Conversation deleted successfully" };
}
