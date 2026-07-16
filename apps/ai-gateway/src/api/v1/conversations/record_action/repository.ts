import { db, aiChatHistoryEntity } from "@fluxify/server";
import { eq, sql } from "drizzle-orm";

export async function getChatMessageById(chatId: string) {
	const chatMessages = await db
		.select()
		.from(aiChatHistoryEntity)
		.where(eq(aiChatHistoryEntity.id, chatId));

	return chatMessages[0];
}

export async function updateChatMessagePlanStatus(
	chatId: string,
	finalOutput: any,
	newHistoryItem: any,
	status: "plan_rejected" | "completed",
) {
	await db
		.update(aiChatHistoryEntity)
		.set({
			status,
			finalOutput,
			workflowExecutionHistory: sql`${aiChatHistoryEntity.workflowExecutionHistory} || ${JSON.stringify([newHistoryItem])}::jsonb`,
		})
		.where(eq(aiChatHistoryEntity.id, chatId));
}
