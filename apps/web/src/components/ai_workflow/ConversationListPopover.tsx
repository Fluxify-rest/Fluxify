"use client";
import React, { useState } from "react";
import {
	Popover,
	ActionIcon,
	Stack,
	Group,
	Text,
	ScrollArea,
	Menu,
	UnstyledButton,
	Loader,
} from "@mantine/core";
import { TbMenu2, TbPlus, TbDots, TbTrash } from "react-icons/tb";
import { aiGatewayConversationsQuery } from "@/query/aiGatewayConversationsQuery";
import { useQueryClient } from "@tanstack/react-query";
import ConfirmDialog from "@/components/dialog/confirmDialog";

interface Props {
	projectId: string;
	activeConversationId: string | null;
	onSelectConversation: (id: string) => void;
	onNewConversation: () => void;
}

const ConversationListPopover = ({
	projectId,
	activeConversationId,
	onSelectConversation,
	onNewConversation,
}: Props) => {
	const [opened, setOpened] = useState(false);
	const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
	const [conversationToDelete, setConversationToDelete] = useState<{
		id: string;
		name: string;
	} | null>(null);

	const queryClient = useQueryClient();
	const { data, isLoading } = aiGatewayConversationsQuery.list.useQuery(
		projectId,
		{} as any,
	);
	const deleteMutation =
		aiGatewayConversationsQuery.delete.useMutation(queryClient);

	const handleDelete = () => {
		if (conversationToDelete) {
			deleteMutation.mutate(conversationToDelete.id, {
				onSuccess: () => {
					setDeleteConfirmOpen(false);
					setConversationToDelete(null);
					if (activeConversationId === conversationToDelete.id) {
						onNewConversation();
					}
				},
			});
		}
	};

	return (
		<>
			<Popover
				opened={opened}
				onChange={setOpened}
				position="bottom-start"
				withArrow
				shadow="md"
			>
				<Popover.Target>
					<ActionIcon
						size="lg"
						variant="default"
						onClick={() => setOpened((o) => !o)}
					>
						<TbMenu2 size={20} />
					</ActionIcon>
				</Popover.Target>
				<Popover.Dropdown p={0}>
					<Stack w={300} gap={0}>
						<Group
							justify="space-between"
							p="md"
							style={{ borderBottom: "1px solid #eee" }}
						>
							<Text fw={500}>Recent Conversations</Text>
							<ActionIcon
								variant="subtle"
								color="violet"
								onClick={() => {
									onNewConversation();
									setOpened(false);
								}}
							>
								<TbPlus size={16} />
							</ActionIcon>
						</Group>

						<ScrollArea h={400}>
							{isLoading ? (
								<Stack align="center" p="md">
									<Loader size="sm" />
								</Stack>
							) : data?.length === 0 ? (
								<Text size="sm" c="dimmed" p="md" ta="center">
									No recent conversations.
								</Text>
							) : (
								<Stack gap={0}>
									{data?.map((conv: any) => (
										<Group
											key={conv.id}
											wrap="nowrap"
											px="md"
											py="sm"
											style={{
												cursor: "pointer",
												backgroundColor:
													activeConversationId === conv.id
														? "#f3f0ff"
														: "transparent",
												borderBottom: "1px solid #f8f9fa",
											}}
											onClick={() => {
												onSelectConversation(conv.id);
												setOpened(false);
											}}
										>
											<Text size="sm" truncate style={{ flex: 1 }}>
												{conv.name || "New Conversation"}
											</Text>
											<Menu position="bottom-end" shadow="sm">
												<Menu.Target>
													<ActionIcon
														variant="subtle"
														color="violet"
														size="sm"
														onClick={(e) => e.stopPropagation()}
													>
														<TbDots size={16} />
													</ActionIcon>
												</Menu.Target>
												<Menu.Dropdown>
													<Menu.Item
														color="red"
														leftSection={<TbTrash size={14} />}
														onClick={(e) => {
															e.stopPropagation();
															setConversationToDelete({
																id: conv.id,
																name: conv.name || "Conversation",
															});
															setDeleteConfirmOpen(true);
														}}
													>
														Delete
													</Menu.Item>
												</Menu.Dropdown>
											</Menu>
										</Group>
									))}
								</Stack>
							)}
						</ScrollArea>
					</Stack>
				</Popover.Dropdown>
			</Popover>

			<ConfirmDialog
				open={deleteConfirmOpen}
				onClose={() => setDeleteConfirmOpen(false)}
				title="Delete Conversation"
				confirmText="Delete"
				confirmColor="red"
				onConfirm={handleDelete}
			>
				<Text size="sm">
					Are you sure you want to delete the conversation "
					{conversationToDelete?.name}"? This action cannot be undone.
				</Text>
			</ConfirmDialog>
		</>
	);
};

export default ConversationListPopover;
