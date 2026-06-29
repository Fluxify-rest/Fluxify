import { db, aiChatConversationsEntity } from "@fluxify/server";
import { and, eq } from "drizzle-orm";

export async function getConversationDetails(
	conversationId: string,
	userId: string,
) {
	const result = await db
		.select({
			projectId: aiChatConversationsEntity.projectId,
			metadata: aiChatConversationsEntity.metadata,
		})
		.from(aiChatConversationsEntity)
		.where(
			and(
				eq(aiChatConversationsEntity.id, conversationId),
				eq(aiChatConversationsEntity.userId, userId),
			),
		)
		.then((res: any) => res[0]);

	if (!result) return null;

	return {
		projectId: result.projectId,
		location: result.metadata.location,
		routeId: result.metadata.routeId,
	};
}
