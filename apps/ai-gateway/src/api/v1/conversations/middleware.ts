import { type MiddlewareHandler } from "hono";
import {
	hasProjectAccess,
	ForbiddenError,
	NotFoundError,
	BadRequestError,
	type User,
	type AuthACL,
} from "@fluxify/server";
import { getConversation, getRouteById } from "./repository";

export const verifyConversationAccess: MiddlewareHandler = async (c, next) => {
	const user = c.get("user") as User & { isSystemAdmin: boolean };
	const acl = c.get("acl") as AuthACL[];

	const conversationId = c.req.param("conversationId");
	if (!conversationId) {
		throw new NotFoundError("Conversation ID is required");
	}

	const conversation = await getConversation(conversationId);

	if (!conversation) {
		throw new NotFoundError("Conversation not found");
	}

	if (!hasProjectAccess(user, acl, conversation.projectId!, "viewer")) {
		throw new ForbiddenError();
	}

	c.set("conversation", conversation);
	await next();
};

export const verifyConversationOwner: MiddlewareHandler = async (c, next) => {
	const user = c.get("user") as User & { isSystemAdmin: boolean };

	const conversationId = c.req.param("conversationId");
	if (!conversationId) {
		throw new NotFoundError("Conversation ID is required");
	}

	const conversation = await getConversation(conversationId);

	if (!conversation) {
		throw new NotFoundError("Conversation not found");
	}

	if (conversation.userId !== user.id && !user.isSystemAdmin) {
		throw new ForbiddenError("You do not own this conversation");
	}

	c.set("conversation", conversation);
	await next();
};

export const verifyProjectConversationsAccess: MiddlewareHandler = async (
	c,
	next,
) => {
	const user = c.get("user") as User & { isSystemAdmin: boolean };
	const acl = c.get("acl") as AuthACL[];

	const projectId = c.req.param("projectId");

	if (!projectId) {
		throw new BadRequestError("projectId parameter is required");
	}

	if (!hasProjectAccess(user, acl, projectId, "viewer")) {
		throw new ForbiddenError("You do not have access to this project");
	}

	await next();
};

export const verifyCreateConversationAccess: MiddlewareHandler = async (
	c,
	next,
) => {
	const user = c.get("user") as User & { isSystemAdmin: boolean };
	const acl = c.get("acl") as AuthACL[];

	const query = c.req.valid("query" as never) as {
		location?: string;
		routeId?: string;
	};
	const body = c.req.valid("json" as never) as { projectId?: string };

	let projectId = body.projectId;

	if (query.location === "canvas" && !query.routeId) {
		throw new BadRequestError("routeId is mandatory when location is canvas");
	}

	if (query.routeId) {
		const route = await getRouteById(query.routeId);
		if (!route) {
			throw new NotFoundError("Route not found");
		}
		projectId = route.projectId ?? projectId;
	}

	if (!projectId) {
		throw new BadRequestError(
			"projectId is mandatory when routeId is not filled",
		);
	}

	if (!hasProjectAccess(user, acl, projectId, "creator")) {
		throw new ForbiddenError("You do not have creator access to this project");
	}

	c.set("projectId", projectId);

	await next();
};
