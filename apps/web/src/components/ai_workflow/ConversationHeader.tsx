"use client";
import React, { useState, useEffect } from "react";
import { Group, TextInput, Menu, ActionIcon } from "@mantine/core";
import ConversationListPopover from "./ConversationListPopover";
import AIProviderInfo from "./AIProviderInfo";
import { aiGatewayConversationsQuery } from "@/query/aiGatewayConversationsQuery";
import { useQueryClient } from "@tanstack/react-query";
import { TbDotsVertical, TbEraser, TbTrash } from "react-icons/tb";
import ConfirmDialog from "../dialog/confirmDialog";
import { useRouter } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";

interface Props {
	projectId: string;
	activeConversationId: string | null;
	activeConversationName: string;
	onSelectConversation: (id: string) => void;
	onNewConversation: () => void;
}

const ConversationHeader = ({
	projectId,
	activeConversationId,
	activeConversationName,
	onSelectConversation,
	onNewConversation,
}: Props) => {
	const [title, setTitle] = useState(activeConversationName);
	const [isClearModalOpen, setIsClearModalOpen] = useState(false);
	const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
	const router = useRouter();
	const queryClient = useQueryClient();

	const updateMutation = aiGatewayConversationsQuery.update.useMutation(
		activeConversationId || "",
		queryClient,
	);

	const clearMutation = aiGatewayConversationsQuery.clear.useMutation(
		activeConversationId || "",
		queryClient,
	);

	const deleteMutation =
		aiGatewayConversationsQuery.delete.useMutation(queryClient);

	useEffect(() => {
		setTitle(activeConversationName);
	}, [activeConversationName]);

	const handleTitleBlur = () => {
		if (
			activeConversationId &&
			title !== activeConversationName &&
			title.trim()
		) {
			updateMutation.mutate({ title });
		}
	};

	const handleClearChat = () => {
		if (activeConversationId) {
			clearMutation.mutate(
				{ confirm: true },
				{
					onSuccess: () => {
						setIsClearModalOpen(false);
					},
				},
			);
		}
	};

	const handleDeleteChat = () => {
		if (activeConversationId) {
			deleteMutation.mutate(activeConversationId, {
				onSuccess: () => {
					setIsDeleteModalOpen(false);
					router.push(APP_ROUTES.PROJECT_AI(projectId));
				},
			});
		}
	};

	return (
		<Group
			justify="space-between"
			align="center"
			w="100%"
			pb="md"
			style={{ borderBottom: "1px solid #eee" }}
		>
			<Group>
				<ConversationListPopover
					projectId={projectId}
					activeConversationId={activeConversationId}
					onSelectConversation={onSelectConversation}
					onNewConversation={onNewConversation}
				/>
				{activeConversationId && (
					<TextInput
						placeholder="New Conversation"
						value={title}
						onChange={(e) => setTitle(e.currentTarget.value)}
						onBlur={handleTitleBlur}
						styles={{ input: { fontSize: 18, fontWeight: 500 } }}
						disabled={!activeConversationId}
					/>
				)}
			</Group>

			<Group gap="sm">
				<AIProviderInfo projectId={projectId} />

				{activeConversationId && (
					<>
						<Menu position="bottom-end" shadow="md">
							<Menu.Target>
								<ActionIcon variant="subtle" color="gray" size="lg">
									<TbDotsVertical size={20} />
								</ActionIcon>
							</Menu.Target>

							<Menu.Dropdown>
								<Menu.Item
									leftSection={<TbEraser size={16} />}
									onClick={() => setIsClearModalOpen(true)}
								>
									Clear Chat
								</Menu.Item>
								<Menu.Item
									color="red"
									leftSection={<TbTrash size={16} />}
									onClick={() => setIsDeleteModalOpen(true)}
								>
									Delete Chat
								</Menu.Item>
							</Menu.Dropdown>
						</Menu>

						<ConfirmDialog
							open={isClearModalOpen}
							onClose={() => setIsClearModalOpen(false)}
							title="Clear Chat"
							confirmText="Clear"
							confirmColor="red"
							onConfirm={handleClearChat}
						>
							Are you sure you want to clear this chat? This action cannot be
							undone and will remove all messages from this conversation.
						</ConfirmDialog>

						<ConfirmDialog
							open={isDeleteModalOpen}
							onClose={() => setIsDeleteModalOpen(false)}
							title="Delete Chat"
							confirmText="Delete"
							confirmColor="red"
							onConfirm={handleDeleteChat}
						>
							Are you sure you want to delete this chat entirely? This action is
							permanent and cannot be undone.
						</ConfirmDialog>
					</>
				)}
			</Group>
		</Group>
	);
};

export default ConversationHeader;
