import * as repo from "./repository";

export async function deleteMessages(routeId: string, userId: string) {
	await repo.deleteMessages(routeId, userId);
	return { success: true };
}
