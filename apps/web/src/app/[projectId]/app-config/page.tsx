"use server";
import AppConfigList from "@/components/panels/appConfigList";
import { AppConfigProvider } from "@/context/appConfigPage";
import { authClient } from "@/lib/auth";
import { canAccess } from "@fluxify/server/src/lib/acl";
import { Stack, Text } from "@mantine/core";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

const Page = async () => {
	const headersList = await headers();
	const session = await authClient.getSession({
		fetchOptions: { headers: headersList },
	});
	if (!session.data?.user) {
		redirect("/login");
	}
	const hasAccess = canAccess((session.data as any).acl, "creator");
	if (!hasAccess) {
		redirect("/");
	}
	return (
		<AppConfigProvider>
			<Stack pt={"md"} px={"xs"} h="100%">
				<div style={{ flex: 1, overflowY: "auto" }}>
					<AppConfigList />
				</div>
			</Stack>
		</AppConfigProvider>
	);
};

export default Page;
