"use client";
import React, { useState, useEffect } from "react";
import {
	Stack,
	Group,
	Center,
	Text,
	Container,
	Skeleton,
	Button,
	Box,
} from "@mantine/core";
import { TbRefresh, TbSparkles } from "react-icons/tb";
import ConversationHeader from "./ConversationHeader";
import EmptyArtifactPanel from "./EmptyArtifactPanel";
import { AIPromptInput } from "./AIPromptInput";
import { useRouter } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";
import { useQueryClient } from "@tanstack/react-query";
import { aiGatewayWorkflowsQuery } from "@/query/aiGatewayWorkflowsQuery";
import { aiGatewayConversationsQuery } from "@/query/aiGatewayConversationsQuery";
import { showErrorNotification } from "@/lib/errorNotifier";

interface Props {
	projectId: string;
	conversationId?: string;
}

const FluxifyAIPage = ({ projectId, conversationId }: Props) => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [message, setMessage] = useState("");
	const [showArtifactPanel, setShowArtifactPanel] = useState(false);

	// Fetch messages if in an existing conversation
	const {
		data: messagesData,
		isLoading,
		isError,
		error,
		refetch,
	} = aiGatewayConversationsQuery.listMessages.useQuery(
		conversationId || "",
		{
			page: 1,
			perPage: 100,
		},
	);

	const postMessageMutation =
		aiGatewayWorkflowsQuery.postMessage.useMutation(queryClient);

	useEffect(() => {
		if (isError && error) {
			const status = (error as any)?.response?.status || (error as any)?.status;
			if (status === 404) {
				showErrorNotification(new Error("Conversation not found"));
				router.push(APP_ROUTES.PROJECT_AI(projectId));
			}
		}
	}, [isError, error, router, projectId]);

	const handleSelectConversation = (id: string) => {
		router.push(APP_ROUTES.PROJECT_AI_CONVERSATION(projectId, id));
	};

	const handleNewConversation = () => {
		router.push(APP_ROUTES.PROJECT_AI(projectId));
	};

	const handleSend = () => {
		if (!message.trim()) return;

		postMessageMutation.mutate(
			{
				query: { projectId, location: "project" },
				body: { userQuery: message },
			},
			{
				onSuccess: (data) => {
					setMessage("");

					queryClient.invalidateQueries({
						queryKey: ["ai-conversations", "list", projectId],
					});

					if (!conversationId && data?.conversationId) {
						router.push(
							APP_ROUTES.PROJECT_AI_CONVERSATION(
								projectId,
								data.conversationId,
							),
						);
					}
				},
			},
		);
	};

	const isNewOrEmpty = !conversationId || (!isLoading && !isError && messagesData?.messages?.length === 0);

	return (
		<Group h="100%" gap={0} wrap="nowrap" align="stretch">
			{/* Main Chat Area */}
			<Stack flex={1} h="100%" p="md" gap="md">
				<ConversationHeader
					projectId={projectId}
					activeConversationId={conversationId || null}
					activeConversationName={
						conversationId ? "Conversation" : "New Conversation"
					}
					onSelectConversation={handleSelectConversation}
					onNewConversation={handleNewConversation}
				/>

				{isNewOrEmpty ? (
					<Center flex={1} style={{ flexDirection: "column" }} px="md">
						<Stack align="center" gap="xl" w="100%" maw={700}>
							<Stack align="center" gap="md" mb="md">
								<Group gap="xs" align="center">
									<TbSparkles size={32} color="#7950f2" />
									<Text
										size="42px"
										fw={800}
										variant="gradient"
										gradient={{ from: "violet", to: "grape", deg: 45 }}
										style={{ letterSpacing: "-1px", lineHeight: 1.3, paddingBottom: "4px" }}
									>
										Fluxify AI
									</Text>
								</Group>
								<Text size="lg" c="dimmed" ta="center" maw={500}>
									Your intelligent assistant to design and build backend APIs. Describe what you need, and let the AI do the heavy lifting.
								</Text>
							</Stack>

							<Box w="100%">
								<AIPromptInput
									value={message}
									onChange={setMessage}
									onSend={handleSend}
									isLoading={postMessageMutation.isPending}
									showSidebarToggle={!!conversationId && !showArtifactPanel}
									onToggleSidebar={() => setShowArtifactPanel(true)}
									minRows={2}
								/>
							</Box>
						</Stack>
					</Center>
				) : (
					<Stack
						flex={1}
						justify="flex-end"
						style={{ overflowY: "auto" }}
						p="md"
					>
						{isLoading && (
							<Stack w="100%" gap="md">
								<Group justify="flex-end">
									<Skeleton height={40} width="60%" radius="md" />
								</Group>
								<Group justify="flex-start">
									<Skeleton height={60} width="70%" radius="md" />
								</Group>
								<Group justify="flex-end">
									<Skeleton height={40} width="50%" radius="md" />
								</Group>
							</Stack>
						)}
						{isError && ((error as any)?.response?.status >= 500 || (error as any)?.status >= 500) && (
							<Center h="100%" style={{ flexDirection: "column", gap: "10px" }}>
								<Text c="red">Failed to load conversation: {(error as Error)?.message || "Internal Server Error"}</Text>
								<Button leftSection={<TbRefresh size={16} />} variant="light" color="red" onClick={() => refetch()}>
									Retry
								</Button>
							</Center>
						)}
						{!isLoading && !isError && messagesData?.messages?.map((msg: any) => (
							<Group
								key={msg.id}
								justify={msg.role === "user" ? "flex-end" : "flex-start"}
							>
								<Text
									p="sm"
									bg={msg.role === "user" ? "violet.1" : "gray.1"}
									style={{ borderRadius: "8px", maxWidth: "80%" }}
								>
									{msg.content}
								</Text>
							</Group>
						))}
					</Stack>
				)}

				{!isNewOrEmpty && (
					<Container size="md" w="100%" p={0}>
						<AIPromptInput
							value={message}
							onChange={setMessage}
							onSend={handleSend}
							isLoading={postMessageMutation.isPending}
							showSidebarToggle={!!conversationId && !showArtifactPanel}
							onToggleSidebar={() => setShowArtifactPanel(true)}
						/>
					</Container>
				)}
			</Stack>

			{/* Artifact Panel */}
			{showArtifactPanel && (
				<EmptyArtifactPanel onClose={() => setShowArtifactPanel(false)} />
			)}
		</Group>
	);
};

export default FluxifyAIPage;
