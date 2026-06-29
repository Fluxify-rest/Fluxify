import * as repo from "./repository";

export async function getLatestMessageStatus(routeId: string, userId: string) {
	const latest = await repo.getLatestAiMessage(routeId, userId);
	if (!latest) return null;
	return {
		id: latest.id,
		messageStage: latest.messageStage,
		stageData: latest.aiResponse,
	};
}
