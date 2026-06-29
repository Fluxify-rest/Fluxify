import { type MiddlewareHandler } from "hono";
import {
	hasProjectAccess,
	ForbiddenError,
	type User,
	type AuthACL,
} from "@fluxify/server";
import { routeParamsSchema } from "./dto";
import z from "zod";

export const verifyAccessAndProject: MiddlewareHandler = async (c, next) => {
	const user = c.get("user") as User & { isSystemAdmin: boolean };
	const acl = c.get("acl") as AuthACL[];

	const param = c.req.valid("param" as never) as z.infer<
		typeof routeParamsSchema
	>;

	if (!hasProjectAccess(user, acl, param.projectId, "viewer")) {
		throw new ForbiddenError();
	}

	await next();
};
