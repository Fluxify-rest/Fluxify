import { db } from "../../../../db";
import { aiChatEntity } from "../../../../db/schema";
import { eq, and, desc } from "drizzle-orm";

export async function getMessages(
	routeId: string,
	userId: string,
	skip: number,
	limit: number,
) {
	return await db
		.select()
		.from(aiChatEntity)
		.where(
			and(eq(aiChatEntity.routeId, routeId), eq(aiChatEntity.userId, userId)),
		)
		.orderBy(desc(aiChatEntity.createdAt))
		.limit(limit)
		.offset(skip);
}
