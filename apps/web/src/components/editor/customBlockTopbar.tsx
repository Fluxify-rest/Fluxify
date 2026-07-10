import {
	Paper,
	Grid,
	Group,
	Box,
	Flex,
	Button,
	Text,
	Menu,
	ActionIcon,
} from "@mantine/core";
import React from "react";
import SaveEditorButton from "./saveEditorButton";
import { useParams, useRouter } from "next/navigation";
import RequireRole from "../auth/requireRole";
import { customBlocksQueries } from "@/query/customBlocksQuery";
import { APP_ROUTES } from "@/constants/routes";
import { TbArrowLeft, TbDots, TbEdit, TbTrash } from "react-icons/tb";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { customBlocksService } from "@/services/customBlocks";
import { useFlowEditorContext } from "./flowEditor/flowEditorContext";
import ConfirmDialog from "../dialog/confirmDialog";
import { useState } from "react";

const CustomBlockTopbar = () => {
	const { blockId } = useParams();
	const { data: block } = customBlocksQueries.getById.useQuery(
		blockId!.toString(),
	);
	const projectId = block?.projectId;
	const router = useRouter();
	const queryClient = useQueryClient();
	const { readonly } = useFlowEditorContext();
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

	const deleteMutation = useMutation({
		mutationFn: () => customBlocksService.delete(blockId as string),
		onSuccess: () => {
			customBlocksQueries.getAll.invalidate(queryClient, projectId as string);
			router.push(APP_ROUTES.PROJECT_CUSTOM_BLOCKS(projectId as string));
		},
	});

	const handleEdit = () => {
		router.push(
			APP_ROUTES.PROJECT_CUSTOM_BLOCKS(projectId as string) +
				`/edit/${blockId}/settings`,
		);
	};

	return (
		<Paper style={{ zIndex: 10 }} shadow="sm" p={"sm"} pos={"relative"}>
			<Grid justify="space-between" align="center">
				<Grid.Col span={5}>
					<Group gap="md">
						<Button
							variant="subtle"
							color="gray"
							leftSection={<TbArrowLeft size={16} />}
							onClick={() =>
								router.push(
									APP_ROUTES.PROJECT_CUSTOM_BLOCKS(projectId as string),
								)
							}
							px="xs"
							size="sm"
						>
							<Group gap="xs">
								<Text>Custom Blocks</Text>
							</Group>
						</Button>
						<Text c="dimmed">/</Text>
						<Text fw={600}>{block?.label}</Text>
					</Group>
				</Grid.Col>

				<Grid.Col span={5}>
					<Group justify="end" gap={"xl"}>
						<RequireRole projectId={projectId || ""} requiredRole="creator">
							{!readonly && (
								<Group gap="sm">
									<SaveEditorButton />
									<Menu position="bottom-end" shadow="md">
										<Menu.Target>
											<ActionIcon variant="default" size={30} radius="md">
												<TbDots size={18} />
											</ActionIcon>
										</Menu.Target>
										<Menu.Dropdown>
											<Menu.Item
												leftSection={<TbEdit size={14} />}
												onClick={handleEdit}
											>
												Settings
											</Menu.Item>
											<Menu.Item
												leftSection={<TbTrash size={14} />}
												color="red"
												onClick={() => setDeleteDialogOpen(true)}
											>
												Delete Custom Block
											</Menu.Item>
										</Menu.Dropdown>
									</Menu>
								</Group>
							)}
						</RequireRole>
					</Group>
				</Grid.Col>
			</Grid>

			<ConfirmDialog
				open={deleteDialogOpen}
				onClose={() => setDeleteDialogOpen(false)}
				title="Delete Custom Block"
				confirmText="Delete"
				onConfirm={() => deleteMutation.mutate()}
			>
				Are you sure you want to delete the custom block "
				{block?.label || block?.name}"? This action cannot be undone.
			</ConfirmDialog>
		</Paper>
	);
};

export default CustomBlockTopbar;
