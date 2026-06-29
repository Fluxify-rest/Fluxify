import { createConversation } from "./repository";

export default async function handleRequest(
	userId: string,
	projectId: string,
	query: { location: "canvas" | "ai_window"; routeId?: string },
	body: { title?: string },
) {
	const result = await createConversation({
		userId,
		projectId,
		title: body.title,
		metadata: {
			location: query.location,
			routeId: query.routeId,
		},
	});

	return result;
}
