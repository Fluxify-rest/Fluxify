import { deleteMessages } from "./repository";
import { deleteCacheKeysByPattern } from "@fluxify/server";

export default async function handleRequest(conversationId: string, confirm: boolean) {
	if (!confirm) {
		return { success: false, message: "Confirmation required to clear messages" };
	}
	await deleteMessages(conversationId);
	await deleteCacheKeysByPattern(`conversations:list_messages:${conversationId}:*`);
	return { success: true, message: "Conversation messages cleared successfully" };
}
