"use client";
import React, { useState, useEffect } from "react";
import { Group, TextInput } from "@mantine/core";
import ConversationListPopover from "./ConversationListPopover";
import AIProviderInfo from "./AIProviderInfo";
import { aiGatewayConversationsQuery } from "@/query/aiGatewayConversationsQuery";
import { useQueryClient } from "@tanstack/react-query";

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
	const queryClient = useQueryClient();
	const updateMutation = aiGatewayConversationsQuery.update.useMutation(
		activeConversationId || "",
		queryClient,
	);

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
						variant="unstyled"
						placeholder="New Conversation"
						value={title}
						onChange={(e) => setTitle(e.currentTarget.value)}
						onBlur={handleTitleBlur}
						styles={{ input: { fontSize: 18, fontWeight: 500 } }}
						disabled={!activeConversationId}
					/>
				)}
			</Group>

			<AIProviderInfo projectId={projectId} />
		</Group>
	);
};

export default ConversationHeader;
