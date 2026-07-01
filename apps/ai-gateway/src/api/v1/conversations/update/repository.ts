import { db, aiChatConversationsEntity } from "@fluxify/server";
import { eq } from "drizzle-orm";

export async function getConversation(conversationId: string) {
	const result = await db
		.select()
		.from(aiChatConversationsEntity)
		.where(eq(aiChatConversationsEntity.id, conversationId))
		.limit(1);
	return result[0];
}

export async function updateConversationTitle(conversationId: string, title: string) {
	const result = await db
		.update(aiChatConversationsEntity)
		.set({ title })
		.where(eq(aiChatConversationsEntity.id, conversationId))
		.returning({
			id: aiChatConversationsEntity.id,
			title: aiChatConversationsEntity.title,
			updatedAt: aiChatConversationsEntity.updatedAt,
		});
	return result[0];
}
