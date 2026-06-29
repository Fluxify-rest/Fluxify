import { db } from "../../../../db";
import { aiChatEntity } from "../../../../db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getLatestAiMessage(routeId: string, userId: string) {
	return (
		await db
			.select()
			.from(aiChatEntity)
			.where(
				and(
					eq(aiChatEntity.routeId, routeId),
					eq(aiChatEntity.userId, userId),
					eq(aiChatEntity.role, "ai"),
				),
			)
			.orderBy(desc(aiChatEntity.createdAt))
			.limit(1)
	)[0];
}
