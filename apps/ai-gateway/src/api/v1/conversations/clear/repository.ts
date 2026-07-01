import { db, aiChatHistoryEntity, aiChatConversationsEntity } from "@fluxify/server";
import { eq } from "drizzle-orm";

export async function getConversation(conversationId: string) {
	const result = await db
		.select()
		.from(aiChatConversationsEntity)
		.where(eq(aiChatConversationsEntity.id, conversationId))
		.limit(1);
	return result[0];
}

export async function deleteMessages(conversationId: string) {
	await db.delete(aiChatHistoryEntity).where(eq(aiChatHistoryEntity.conversationId, conversationId));
}
