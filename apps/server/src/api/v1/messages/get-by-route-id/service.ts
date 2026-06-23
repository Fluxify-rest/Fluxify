import * as repo from "./repository";

export async function getMessages(
	routeId: string,
	userId: string,
	skip: number,
	limit: number,
) {
	return await repo.getMessages(routeId, userId, skip, limit);
}
