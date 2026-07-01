import { db, routesEntity, aiChatConversationsEntity } from "@fluxify/server";
import { eq } from "drizzle-orm";

export async function getRouteById(id: string) {
	const result = await db
		.select()
		.from(routesEntity)
		.where(eq(routesEntity.id, id))
		.limit(1);
	return result[0];
}

export async function getConversation(conversationId: string) {
	const result = await db
		.select()
		.from(aiChatConversationsEntity)
		.where(eq(aiChatConversationsEntity.id, conversationId))
		.limit(1);
	return result[0];
}
