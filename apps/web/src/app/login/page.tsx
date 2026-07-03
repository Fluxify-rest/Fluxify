"use server";
import LoginForm from "@/components/forms/login";
import { authClient } from "@/lib/auth";
import { Center, Stack, Text } from "@mantine/core";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import React from "react";

const LoginPage = async ({
	searchParams,
}: {
	searchParams: Promise<{ next?: string }>;
}) => {
	const headerObj = await headers();
	const session = await authClient.getSession({
		fetchOptions: { headers: headerObj },
	});

	if (session.data?.user) {
		return redirect((await searchParams).next || "/");
	}
	return (
		<Stack w={"100vw"} h={"100vh"}>
			<Center h={"100%"}>
				<LoginForm />
			</Center>
		</Stack>
	);
};

export default LoginPage;
