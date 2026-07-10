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
import ConfirmDialog from "@/components/dialog/confirmDialog";
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
	python: <TbBrandPython size={80} color="#6b7280" />,
	javascript: <TbBrandJavascript size={80} color="#6b7280" />,
	database: <TbDatabase size={80} color="#6b7280" />,
	cloud: <TbCloud size={80} color="#6b7280" />,
	mail: <TbMail size={80} color="#6b7280" />,
	message: <TbMessage size={80} color="#6b7280" />,
	api: <TbApi size={80} color="#6b7280" />,
	webhook: <TbWebhook size={80} color="#6b7280" />,
	lock: <TbLock size={80} color="#6b7280" />,
	key: <TbKey size={80} color="#6b7280" />,
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
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const router = useRouter();
	const queryClient = useQueryClient();



	const deleteMutation = useMutation({
		mutationFn: (id: string) => customBlocksService.delete(id),
		onSuccess: () => {
			customBlocksQueries.getAll.invalidate(queryClient, projectId);
			setDeleteDialogOpen(false);
		},
	});

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
				w={180}
				h={180}
				style={{
					position: "relative",
					display: "flex",
					flexDirection: "column",
					alignItems: "center",
					justifyContent: "center",
					borderColor: "#e5e7eb",
					boxShadow: hovered ? "0 4px 12px rgba(0,0,0,0.05)" : "none",
					transition: "box-shadow 0.2s ease",
					cursor: "pointer",
				}}
				onMouseEnter={() => setHovered(true)}
				onMouseLeave={() => setHovered(false)}
				onClick={() =>
					router.push(
						APP_ROUTES.PROJECT_CUSTOM_BLOCKS(projectId) + `/edit/${block.id}`,
					)
				}
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
					onClick={(e) => e.stopPropagation()}
				>
					<Menu position="bottom-end" withinPortal>
						<Menu.Target>
							<ActionIcon variant="light" color="violet" size="md">
								<TbDots size={20} />
							</ActionIcon>
						</Menu.Target>
						<Menu.Dropdown>
							<Menu.Item
								leftSection={<TbEdit size={14} />}
								onClick={(e) => {
									e.stopPropagation();
									router.push(
										APP_ROUTES.PROJECT_CUSTOM_BLOCKS(projectId) +
											`/edit/${block.id}/settings`,
									);
								}}
							>
								Edit
							</Menu.Item>
							<Menu.Item
								leftSection={<TbTrash size={14} />}
								color="red"
								onClick={(e) => {
									e.stopPropagation();
									setDeleteDialogOpen(true);
								}}
							>
								Delete
							</Menu.Item>
						</Menu.Dropdown>
					</Menu>
				</Box>

				{/* Center Icon */}
				<Center>
					{isCustomIcon ? (
						<Image src={block.iconUrl} w={80} h={80} fit="contain" alt="icon" />
					) : (
						premadeIconMap[block.iconUrl] || (
							<TbBrandJavascript size={80} color="#6b7280" />
						)
					)}
				</Center>
			</Paper>
			
			<ConfirmDialog
				open={deleteDialogOpen}
				onClose={() => setDeleteDialogOpen(false)}
				title="Delete Custom Block"
				confirmText="Delete"
				onConfirm={() => deleteMutation.mutate(block.id)}
			>
				Are you sure you want to delete {block.label || block.name}?
			</ConfirmDialog>
		</Box>
	);
}
