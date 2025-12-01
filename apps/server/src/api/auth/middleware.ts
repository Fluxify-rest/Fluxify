import { Context, Next } from "hono";
import { auth } from "../../lib/auth";
import { AuthACL } from "../../db/schema";
import { UnauthorizedError } from "../../errors/unauthorizedError";
import { HonoContext } from "../../types";
import { AccessControlRole } from "../../db/schema";
import { canAccessProject } from "../../lib/acl";

export async function requireSystemAdmin(ctx: Context, next: Next) {
  const session = await auth.api.getSession({
    headers: ctx.req.raw.headers,
  });
  if (
    ctx.req.header("SYSTEM_ACCESS_KEY") === process.env.SYSTEM_ACCESS_KEY ||
    session?.acl.some((acl: AuthACL) => acl.role === "system_admin")
  ) {
    return next();
  }
  throw new UnauthorizedError("Only system admins can access");
}

export async function requireAccess(
  requiredRole: AccessControlRole,
  projectId: string
) {
  return function (ctx: HonoContext, next: Next) {
    const acl = ctx.get("acl");
    if (!acl || !canAccessProject(acl, projectId, requiredRole)) {
      throw new UnauthorizedError("Operation not allowed");
    }
    return next();
  };
}
