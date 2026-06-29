import { db } from "@fluxify/server";
import { aiChatConversationsEntity, routesEntity } from "@fluxify/server";
import { eq } from "drizzle-orm";

export async function createConversation(data: {
	userId: string;
	projectId: string;
	title?: string;
	metadata: {
		location: "canvas" | "ai_window";
		routeId?: string;
	};
}) {
	const [result] = await db
		.insert(aiChatConversationsEntity)
		.values({
			userId: data.userId,
			projectId: data.projectId,
			title: data.title || "New chat",
			metadata: data.metadata,
			status: "not_started",
		})
		.returning();
	return { id: result!.id };
}

export async function getRouteById(id: string) {
	const [route] = await db
		.select({ projectId: routesEntity.projectId })
		.from(routesEntity)
		.where(eq(routesEntity.id, id));
	return route;
}
