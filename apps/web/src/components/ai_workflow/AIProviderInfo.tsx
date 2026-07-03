"use client";
import React from "react";
import { Group, Text, Button, Paper, Loader, ActionIcon } from "@mantine/core";
import { projectSettingsQuery } from "@/query/projectSettingsQuery";
import { integrationsQuery } from "@/query/integrationsQuery";
import {
	integrationIcons,
	IntegrationVariants,
} from "@/components/integrationIcons";
import { useRouter } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";
import { TbAlertCircle, TbExternalLink } from "react-icons/tb";

interface AIProviderInfoProps {
	projectId: string;
}

const AIProviderInfo = ({ projectId }: AIProviderInfoProps) => {
	const router = useRouter();

	const { data: projectSettings, isLoading: isProjectSettingsLoading } =
		projectSettingsQuery.getAll.useQuery(projectId);
	const agentConnectionId = projectSettings?.["settings.ai.agentConnectionId"];

	const { data: integration, isLoading: isIntegrationLoading } =
		integrationsQuery.getById.query(agentConnectionId || "");

	if (isProjectSettingsLoading || isIntegrationLoading) {
		return <Loader size="sm" />;
	}

	if (!agentConnectionId || !integration) {
		return (
			<Paper withBorder p="xs" radius="md" bg="gray.0">
				<Group gap="xs">
					<TbAlertCircle color="orange" size={20} />
					<Text size="sm" c="dimmed">
						No AI provider selected.
					</Text>
					<Button
						size="compact-sm"
						variant="light"
						onClick={() => router.push(APP_ROUTES.PROJECT_SETTINGS(projectId))}
					>
						Configure
					</Button>
				</Group>
			</Paper>
		);
	}

	const IconComponent =
		integrationIcons[integration.variant as IntegrationVariants] || null;

	return (
		<Paper withBorder p="xs" radius="md" bg="gray.0">
			<Group gap="xs">
				{IconComponent}
				<Text size="sm" fw={500}>
					{integration.name}
				</Text>
				<ActionIcon
					size="sm"
					variant="subtle"
					onClick={() =>
						window.open(APP_ROUTES.PROJECT_INTEGRATIONS(projectId), "_blank")
					}
				>
					<TbExternalLink size={16} />
				</ActionIcon>
			</Group>
		</Paper>
	);
};

export default AIProviderInfo;
