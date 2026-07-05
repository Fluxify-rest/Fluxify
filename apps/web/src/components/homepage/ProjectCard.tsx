import React from "react";
import { Box, Card, Stack, Text } from "@mantine/core";
import { getTimeAgo } from "@/lib/datetime";
import { useRouter } from "next/navigation";

import { APP_ROUTES } from "@/constants/routes";

type ProjectCardProps = {
	id: string;
	name: string;
	updatedAt: string | Date;
	createdAt: string | Date;
};

const ProjectCard = ({ id, name, updatedAt, createdAt }: ProjectCardProps) => {
	const router = useRouter();

	const handleCardClick = () => {
		router.push(APP_ROUTES.PROJECT_ROUTES(id));
	};

	return (
		<Card
			shadow="sm"
			padding="0"
			radius="md"
			withBorder
			style={{ cursor: "pointer", transition: "transform 0.2s" }}
			onClick={handleCardClick}
		>
			<Box h={120} bg="violet.2" style={{ borderBottom: "1px solid #eee" }}>
				{/* Abstract design placeholder */}
			</Box>
			<Stack p="md" gap="xs" bg="gray.1">
				<Text fw={500} size="lg">
					{name}
				</Text>
				<Stack gap={0}>
					<Text size="xs" c="dimmed">
						Updated At: {getTimeAgo(updatedAt)}
					</Text>
					<Text size="xs" c="dimmed">
						Created At: {getTimeAgo(createdAt)}
					</Text>
				</Stack>
			</Stack>
		</Card>
	);
};

export default ProjectCard;
