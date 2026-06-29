import {
	db,
	aiChatHistoryEntity,
	aiChatConversationsEntity,
} from "@fluxify/server";
import { eq, desc, sql } from "drizzle-orm";

export async function getConversation(conversationId: string) {
	const result = await db
		.select()
		.from(aiChatConversationsEntity)
		.where(eq(aiChatConversationsEntity.id, conversationId))
		.limit(1);
	return result[0];
}

export async function getMessages(
	conversationId: string,
	limit: number,
	offset: number,
) {
	return await db
		.select({
			id: aiChatHistoryEntity.id,
			status: aiChatHistoryEntity.status,
			finalOutput: aiChatHistoryEntity.finalOutput,
			workflowExecutionHistory: aiChatHistoryEntity.workflowExecutionHistory,
			updatedAt: aiChatHistoryEntity.updatedAt,
		})
		.from(aiChatHistoryEntity)
		.where(eq(aiChatHistoryEntity.conversationId, conversationId))
		.orderBy(desc(aiChatHistoryEntity.createdAt))
		.limit(limit)
		.offset(offset);
}

export async function countMessages(conversationId: string) {
	const result = await db
		.select({ count: sql<number>`count(*)` })
		.from(aiChatHistoryEntity)
		.where(eq(aiChatHistoryEntity.conversationId, conversationId));
	return Number(result[0]?.count || 0);
}
