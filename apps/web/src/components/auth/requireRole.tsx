"use client";
import { useAuthStore } from "@/store/auth";
import type { AccessControlRole } from "@fluxify/server";
import { canAccess } from "@fluxify/server/src/lib/acl";
import React from "react";

type Props = {
	children?: React.ReactNode;
	requiredRole: AccessControlRole;
	projectId: string;
};

const RequireRole = ({ children, requiredRole, projectId }: Props) => {
	const { acl, userData } = useAuthStore();
	if (userData?.isSystemAdmin) {
		return <>{children}</>;
	}

	const hasAccess = canAccess(acl[projectId], requiredRole);
	if (!hasAccess) {
		return <></>;
	}
	return children;
};

export default RequireRole;
