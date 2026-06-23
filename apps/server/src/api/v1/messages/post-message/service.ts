import * as repo from "./repository";
import { generateID } from "@fluxify/lib";
import { publishMessage, CHAN_AI_WORKER } from "../../../../db/redis";
import { db } from "../../../../db";
import { routesEntity, projectSettingsEntity } from "../../../../db/schema";
import { eq, and } from "drizzle-orm";
import { ProjectSettingsKeyType } from "../../projects/settings/keys/keySchemaMap";

export async function postMessage(
	routeId: string,
	userId: string,
	content: string,
) {
	if (process.env.ENABLE_AI !== "true") {
		return { error: "AI is currently disabled.", status: 403 };
	}

	const routeResult = await db
		.select({
			projectId: routesEntity.projectId,
			aiConnector: projectSettingsEntity.value,
		})
		.from(routesEntity)
		.leftJoin(
			projectSettingsEntity,
			and(
				eq(projectSettingsEntity.projectId, routesEntity.projectId!),
				eq(
					projectSettingsEntity.key,
					"settings.ai.agentConnectionId" as ProjectSettingsKeyType,
				),
			),
		)
		.where(eq(routesEntity.id, routeId))
		.limit(1);

	if (routeResult.length === 0) {
		return { error: "Route not found.", status: 404 };
	}

	if (!routeResult[0].aiConnector) {
		return {
			error:
				"No AI connector configured. Please set it in the project settings.",
			status: 400,
		};
	}

	const userMsgId = generateID();
	await repo.createMessage({
		id: userMsgId,
		role: "user",
		content,
		routeId,
		userId,
	});

	const aiMsgId = generateID();
	const newAiMsg = await repo.createMessage({
		id: aiMsgId,
		role: "ai",
		content: "",
		routeId,
		userId,
		messageStage: 0,
		actionState: 0,
	});

	// The worker thread subscribes to this channel.
	// By sending this, the worker can fetch the rest of the details and execute LangGraph!
	await publishMessage(CHAN_AI_WORKER, {
		messageId: aiMsgId,
		userMessageId: userMsgId,
		routeId,
		userId,
		content,
	});

	return newAiMsg;
}
