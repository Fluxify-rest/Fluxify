import { z } from "zod";
import { requestBodySchema, requestParamSchema, responseSchema } from "./dto";
import {
	START_WORKFLOW_JOB_NAME,
	workflowQueue,
} from "../../../../workflow/queue";
import { getConversationKey } from "../../../../workflow";
import { hasCacheKey } from "@fluxify/server";

export default async function handleRequest(
	param: z.infer<typeof requestParamSchema>,
	body: z.infer<typeof requestBodySchema>,
	userId: string,
): Promise<z.infer<typeof responseSchema>> {
	const conversationId = param.conversationId;
	const exists = await hasCacheKey(getConversationKey(conversationId));

	if (exists) {
		return {
			conversationId,
			status: "failed",
			reason: "Workflow is already running",
		};
	}

	workflowQueue.add(START_WORKFLOW_JOB_NAME, {
		type: "continue",
		data: {
			conversationId,
			userQuery: body.userQuery,
		},
	});
	return {
		conversationId,
		status: "queued",
		reason: "Workflow queued successfully",
	};
}
