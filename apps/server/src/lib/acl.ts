import { AccessControlRole, AuthACL } from "../db/schema";

const roleHierarchy: Record<AccessControlRole, number> = {
  system_admin: 3,
  project_admin: 2,
  creator: 1,
  viewer: 0,
};

export function canAccess(
  userRole: AccessControlRole,
  requiredRole: AccessControlRole
) {
  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}

export function canAccessProject(
  acl: AuthACL[],
  projectId: string,
  requiredRole: AccessControlRole
) {
  return acl.some(
    (item: AuthACL) =>
      item.projectId === projectId && canAccess(item.role, requiredRole)
  );
}
