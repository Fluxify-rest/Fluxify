"use client";

import React, { useState } from "react";
import {
	Paper,
	Text,
	Menu,
	ActionIcon,
	Box,
	Image,
	Center,
} from "@mantine/core";
import { TbDots, TbEdit, TbTrash } from "react-icons/tb";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { customBlocksService } from "@/services/customBlocks";
import { customBlocksQueries } from "@/query/customBlocksQuery";
import { useRouter } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";
import {
	TbBrandPython,
	TbBrandJavascript,
	TbDatabase,
	TbCloud,
	TbMail,
	TbMessage,
	TbApi,
	TbWebhook,
	TbLock,
	TbKey,
} from "react-icons/tb";

const premadeIconMap: Record<string, React.ReactNode> = {
	python: <TbBrandPython size={64} color="#6b7280" />,
	javascript: <TbBrandJavascript size={64} color="#6b7280" />,
	database: <TbDatabase size={64} color="#6b7280" />,
	cloud: <TbCloud size={64} color="#6b7280" />,
	mail: <TbMail size={64} color="#6b7280" />,
	message: <TbMessage size={64} color="#6b7280" />,
	api: <TbApi size={64} color="#6b7280" />,
	webhook: <TbWebhook size={64} color="#6b7280" />,
	lock: <TbLock size={64} color="#6b7280" />,
	key: <TbKey size={64} color="#6b7280" />,
};

interface CustomBlockCardProps {
	block: any;
	projectId: string;
}

export default function CustomBlockCard({
	block,
	projectId,
}: CustomBlockCardProps) {
	const [hovered, setHovered] = useState(false);
	const router = useRouter();
	const queryClient = useQueryClient();

	const deleteMutation = useMutation({
		mutationFn: (id: string) => customBlocksService.delete(id),
		onSuccess: () => {
			customBlocksQueries.getAll.invalidate(queryClient, projectId);
		},
	});

	const handleDelete = () => {
		if (
			confirm(`Are you sure you want to delete ${block.label || block.name}?`)
		) {
			deleteMutation.mutate(block.id);
		}
	};

	const isCustomIcon = block.icon === "custom";

	return (
		<Box style={{ display: "flex", flexDirection: "column", gap: 8 }}>
			<Text fw={600} size="sm" ta="center" c="dark.3">
				{block.title || block.name}
			</Text>
			<Paper
				withBorder
				radius="md"
				bg="white"
				w={140}
				h={140}
				style={{
					position: "relative",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					borderColor: "#e5e7eb",
					boxShadow: hovered ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
					transition: "box-shadow 0.2s ease",
				}}
				onMouseEnter={() => setHovered(true)}
				onMouseLeave={() => setHovered(false)}
			>
				{/* Top Input Node (Rectangle) */}
				<Box
					style={{
						position: "absolute",
						top: -4,
						left: "50%",
						transform: "translateX(-50%)",
						width: 36,
						height: 10,
						backgroundColor: "#808080",
						borderRadius: 2,
					}}
				/>

				{/* Bottom Output Node (Circle) */}
				<Box
					style={{
						position: "absolute",
						bottom: -6,
						left: "50%",
						transform: "translateX(-50%)",
						width: 16,
						height: 16,
						backgroundColor: "#808080",
						borderRadius: "50%",
					}}
				/>

				{/* Hover Options Menu */}
				<Box
					style={{
						position: "absolute",
						top: 8,
						right: 8,
						opacity: hovered ? 1 : 0,
						transition: "opacity 0.2s",
					}}
				>
					<Menu position="bottom-end" withinPortal>
						<Menu.Target>
							<ActionIcon variant="light" color="violet" size="sm">
								<TbDots size={16} />
							</ActionIcon>
						</Menu.Target>
						<Menu.Dropdown>
							<Menu.Item
								leftSection={<TbEdit size={14} />}
								onClick={() =>
									router.push(
										APP_ROUTES.PROJECT_CUSTOM_BLOCKS(projectId) +
											`/edit/${block.id}`,
									)
								}
							>
								Edit
							</Menu.Item>
							<Menu.Item
								leftSection={<TbTrash size={14} />}
								color="red"
								onClick={handleDelete}
							>
								Delete
							</Menu.Item>
						</Menu.Dropdown>
					</Menu>
				</Box>

				{/* Center Icon */}
				<Center>
					{isCustomIcon ? (
						<Image src={block.iconUrl} w={64} h={64} fit="contain" alt="icon" />
					) : (
						premadeIconMap[block.iconUrl] || (
							<TbBrandJavascript size={64} color="#6b7280" />
						)
					)}
				</Center>
			</Paper>
		</Box>
	);
}
