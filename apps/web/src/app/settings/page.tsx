"use server";
import SettingsTabs from "@/components/settings/tabs";
import { authClient } from "@/lib/auth";
import { Box, Stack, Text } from "@mantine/core";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

const Page = async () => {
	const headersList = await headers();
	const session = await authClient.getSession({
		fetchOptions: { headers: headersList },
	});
	if (!session.data?.user) {
		redirect("/login");
	}
	return (
		<Box p={"sm"}>
			<Stack>
				<Text size="2rem" fw={"500"} c="dark">
					Settings
				</Text>
				<SettingsTabs />
			</Stack>
		</Box>
	);
};

export default Page;
