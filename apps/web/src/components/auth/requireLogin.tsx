"use client";
import React, { useMemo } from "react";
import type { AccessControlRole } from "@fluxify/server/src/db/schema";
import { canAccess } from "@fluxify/server/src/lib/acl";
import { useAuthStore } from "@/store/auth";

type Props = {
	children?: React.ReactNode;
};

const RequireLogin = ({ children }: Props) => {
	const { acl, userData } = useAuthStore();

	const hasAccess = useMemo(() => {
		return !!userData;
	}, [acl]);

	if (userData?.isSystemAdmin) {
		return <>{children}</>;
	}

	if (!hasAccess) {
		return <></>;
	}

	return children;
};

export default RequireLogin;
