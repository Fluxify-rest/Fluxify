"use server";
import AddIntegrationButton from "@/components/buttons/addIntegrationButton";
import IntegrationFilter from "@/components/filters/integrationFilter";
import AvailableConnectors from "@/components/panels/availableConnectors";
import IntegrationsList from "@/components/panels/integrationsList";
import { Group, Stack, Text } from "@mantine/core";
import { authClient } from "@/lib/auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { canAccess } from "@fluxify/server/src/lib/acl";

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
		<Stack h="100%" py="xs" px="md" gap="lg">
			{/* Fixed Header */}
			<Group justify="space-between" align="center">
				<Stack gap="xs">
					<Text size="1.4rem" fw={500}>
						Integrations
					</Text>
					<Text size="sm" c="gray">
						Connect & Configure 3rd Party Services
					</Text>
				</Stack>
				<AddIntegrationButton />
			</Group>

			{/* Full-height 3-column layout */}
			<Group
				wrap="nowrap"
				align="stretch"
				flex={1}
				style={{ overflow: "hidden" }}
			>
				{/* Left Panel - Available Connectors */}
				<Stack w="20%" h="100%" style={{ minWidth: 0, overflowY: "auto" }}>
					<AvailableConnectors />
				</Stack>

				{/* Center - Main Content */}
				<Stack
					flex={1}
					h="100%"
					style={{
						minWidth: 0,
						overflow: "hidden",
						display: "flex",
						flexDirection: "column",
					}}
					bg="white"
				>
					<Stack
						flex={1}
						style={{
							overflowY: "auto",
							overflowX: "hidden",
						}}
					>
						<IntegrationsList />
					</Stack>
				</Stack>

				{/* Right Panel - Filter */}
				<IntegrationFilter />
			</Group>
		</Stack>
	);
};

export default Page;
