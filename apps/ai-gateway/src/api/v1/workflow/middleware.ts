import type { Context, Next } from "hono";
import {
	ForbiddenError,
	hasAdminAccess,
	hasRoleAccess,
	hasProjectAccess,
} from "@fluxify/server";
import type { User, AuthACL } from "@fluxify/server";
import { getProjectIdByRouteId } from "./post-message/repository";

export function requireWorkflowAccess(
	selector: (c: Context) => Promise<{
		location?: "canvas" | "project" | "integrations" | "appconfig" | null;
		routeId?: string | null;
		projectId?: string | null;
	}> | {
		location?: "canvas" | "project" | "integrations" | "appconfig" | null;
		routeId?: string | null;
		projectId?: string | null;
	}
) {
	return async (c: Context, next: Next) => {
		const user = c.get("user") as (User & { isSystemAdmin: boolean }) | null;
		const acl = c.get("acl") as AuthACL[] | null;
		const systemAccessKey = c.req.header("SYSTEM_ACCESS_KEY");

		// 1. System admin check bypass (using the extracted function)
		if (hasAdminAccess(user, systemAccessKey)) {
			return next();
		}

		// 2. Retrieve selection values
		const params = await selector(c);
		if (!params) {
			throw new ForbiddenError("Missing authorization parameters");
		}

		const { location, projectId, routeId } = params;

		// 3. Perform access checks based on location
		if (location === "canvas") {
			if (!routeId) {
				throw new ForbiddenError("Route ID is required for canvas location");
			}
			const resolvedProjectId = await getProjectIdByRouteId(routeId);
			if (!resolvedProjectId || !hasProjectAccess(user, acl, resolvedProjectId, "creator")) {
				throw new ForbiddenError("Access denied for this route's project");
			}
		} else if (location === "project") {
			if (!projectId || !hasProjectAccess(user, acl, projectId, "creator")) {
				throw new ForbiddenError("Access denied for this project");
			}
		} else if (location === "integrations" || location === "appconfig") {
			if (!hasRoleAccess(user, acl, "creator")) {
				throw new ForbiddenError("Access denied. Creator role required");
			}
		} else {
			throw new ForbiddenError("Invalid or missing location");
		}

		return next();
	};
}
