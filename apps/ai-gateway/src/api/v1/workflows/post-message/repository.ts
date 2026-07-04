import { db, routesEntity, aiChatConversationsEntity } from "@fluxify/server";
import { eq } from "drizzle-orm";

export async function getProjectIdByRouteId(
	routeId: string,
): Promise<string | null> {
	const result = await db
		.select({ projectId: routesEntity.projectId })
		.from(routesEntity)
		.where(eq(routesEntity.id, routeId))
		.then((res: any) => res[0]);

	return result?.projectId || null;
}

export async function getConversationById(id: string) {
	const result = await db
		.select()
		.from(aiChatConversationsEntity)
		.where(eq(aiChatConversationsEntity.id, id))
		.then((res: any) => res[0]);
	return result || null;
}
