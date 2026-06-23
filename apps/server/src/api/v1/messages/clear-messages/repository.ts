import { db } from "../../../../db";
import { aiChatEntity } from "../../../../db/schema";
import { eq, and } from "drizzle-orm";

export async function deleteMessages(routeId: string, userId: string) {
	return await db
		.delete(aiChatEntity)
		.where(
			and(eq(aiChatEntity.routeId, routeId), eq(aiChatEntity.userId, userId)),
		);
}
