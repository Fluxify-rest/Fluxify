import { requireWorkflowAccess } from "../middleware";
import { getConversationDetails } from "./repository";
import { NotFoundError } from "@fluxify/server";
import type { User } from "@fluxify/server";
import type { Context } from "hono";

export const requireWatchAccess = requireWorkflowAccess(async (c: Context) => {
	const conversationId = c.req.param("conversationId") as string;
	const user = c.get("user") as User;

	const details = await getConversationDetails(conversationId, user.id);
	if (!details) {
		throw new NotFoundError("Conversation not found");
	}

	return {
		location: details.location,
		projectId: details.projectId,
		routeId: details.routeId,
	};
});
