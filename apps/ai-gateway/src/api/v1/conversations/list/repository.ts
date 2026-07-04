import { db, aiChatConversationsEntity, aiConversationLocationEnum } from "@fluxify/server";
import { eq, and, desc, sql } from "drizzle-orm";
import z from "zod";

export const getConversationsByProjectId = async (
	projectId: string,
	userId: string,
	location?: z.infer<typeof aiConversationLocationEnum>,
) => {
	let condition = and(
		eq(aiChatConversationsEntity.projectId, projectId),
		eq(aiChatConversationsEntity.userId, userId),
	);

	if (location) {
		condition = and(
			condition,
			sql`${aiChatConversationsEntity.metadata} @> ${JSON.stringify({ location })}::jsonb`,
		);
	}

	return await db
		.select({
			id: aiChatConversationsEntity.id,
			title: aiChatConversationsEntity.title,
			createdAt: aiChatConversationsEntity.createdAt,
			updatedAt: aiChatConversationsEntity.updatedAt,
		})
		.from(aiChatConversationsEntity)
		.where(condition)
		.orderBy(desc(aiChatConversationsEntity.updatedAt));
};
