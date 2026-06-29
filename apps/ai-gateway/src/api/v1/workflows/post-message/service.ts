import { z } from "zod";
import { requestBodySchema, requestQuerySchema, responseSchema } from "./dto";
import {
	START_WORKFLOW_JOB_NAME,
	workflowQueue,
} from "../../../../workflow/queue";
import { buildConversationId, getConversationKey } from "../../../../workflow";
import { hasCacheKey } from "@fluxify/server";
import { getProjectIdByRouteId } from "./repository";

export default async function handleRequest(
	query: z.infer<typeof requestQuerySchema>,
	body: z.infer<typeof requestBodySchema>,
	userId: string,
): Promise<z.infer<typeof responseSchema>> {
	const conversationId = buildConversationId(
		userId,
		query.routeId || "none",
		query.projectId || "none",
		query.location,
	);
	const exists = await hasCacheKey(getConversationKey(conversationId));

	if (exists) {
		return {
			conversationId,
			status: "failed",
			reason: "Workflow is already running",
		};
	}

	let projectId = query.projectId;
	if (!projectId && query.routeId) {
		projectId = (await getProjectIdByRouteId(query.routeId)) || "none";
	}

	workflowQueue.add(START_WORKFLOW_JOB_NAME, {
		type: "start",
		data: {
			location: query.location,
			routeId: query.routeId || "none",
			userQuery: body.userQuery,
			projectId: projectId || "none",
			userId,
		},
	});
	return {
		conversationId,
		status: "queued",
		reason: "Workflow queued successfully",
	};
}
