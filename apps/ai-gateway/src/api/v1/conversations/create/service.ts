import { createConversation } from "./repository";
import { START_WORKFLOW_JOB_NAME, workflowQueue } from "../../../../workflow/queue";

export default async function handleRequest(
	userId: string,
	projectId: string,
	query: { location: "canvas" | "ai_window"; routeId?: string },
	body: { title?: string; startWorkflow?: boolean; initialUserQuery?: string },
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

	if (body.startWorkflow && body.initialUserQuery?.trim()) {
		workflowQueue.add(START_WORKFLOW_JOB_NAME, {
			type: "start",
			data: {
				conversationId: result.id,
				userQuery: body.initialUserQuery.trim(),
			},
		});
	}

	return result;
}
