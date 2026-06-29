import type { MiddlewareHandler } from "hono";
import { getRouteById } from "./repository";
import {
	hasProjectAccess,
	type User,
	type AuthACL,
	ForbiddenError,
	BadRequestError,
	NotFoundError,
} from "@fluxify/server";
import type { CreateConversationBody, CreateConversationQuery } from "./dto";

export const verifyAccessAndProject: MiddlewareHandler = async (c, next) => {
	const user = c.get("user") as User & { isSystemAdmin: boolean };
	const acl = c.get("acl") as AuthACL[];

	const query = c.req.valid("query" as never) as CreateConversationQuery;
	const body = c.req.valid("json" as never) as CreateConversationBody;

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
		throw new ForbiddenError();
	}

	c.set("projectId", projectId);

	await next();
};
