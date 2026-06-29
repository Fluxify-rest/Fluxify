import { type MiddlewareHandler } from "hono";
import {
	hasProjectAccess,
	ForbiddenError,
	NotFoundError,
	type User,
	type AuthACL,
} from "@fluxify/server";
import { routeParamsSchema } from "./dto";
import { getConversation } from "./repository";
import z from "zod";

export const verifyConversationAccess: MiddlewareHandler = async (c, next) => {
	const user = c.get("user") as User & { isSystemAdmin: boolean };
	const acl = c.get("acl") as AuthACL[];

	const param = c.req.valid("param" as never) as z.infer<
		typeof routeParamsSchema
	>;

	const conversation = await getConversation(param.conversationId);
	if (!conversation) {
		throw new NotFoundError("Conversation not found");
	}

	if (!hasProjectAccess(user, acl, conversation.projectId!, "viewer")) {
		throw new ForbiddenError();
	}

	c.set("conversation", conversation);
	await next();
};
