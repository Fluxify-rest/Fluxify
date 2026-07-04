"use client";
import React, { useState, useEffect } from "react";
import { Stack, Group, Center, Text, Container, Box } from "@mantine/core";
import { TbSparkles } from "react-icons/tb";
import ConversationHeader from "./ConversationHeader";
import EmptyArtifactPanel from "./EmptyArtifactPanel";
import { AIPromptInput } from "./AIPromptInput";
import { ConversationHistory } from "./ConversationHistory";
import { useRouter } from "next/navigation";
import { APP_ROUTES } from "@/constants/routes";
import { useQueryClient } from "@tanstack/react-query";
import { aiGatewayWorkflowsQuery } from "@/query/aiGatewayWorkflowsQuery";
import { aiGatewayConversationsQuery } from "@/query/aiGatewayConversationsQuery";
import { showErrorNotification } from "@/lib/errorNotifier";
import { aiGatewayWorkflowsService } from "@/services/aiGatewayWorkflows";
import { watchConversationDto } from "@fluxify/ai-gateway";
import z from "zod";

interface Props {
	projectId: string;
	conversationId?: string;
}

const FluxifyAIPage = ({ projectId, conversationId }: Props) => {
	const router = useRouter();
	const queryClient = useQueryClient();
	const [message, setMessage] = useState("");
	const [showArtifactPanel, setShowArtifactPanel] = useState(false);
	const [isWatching, setIsWatching] = useState(false);
	const [workflowStatus, setWorkflowStatus] = useState<z.infer<
		typeof watchConversationDto.watchResponseSchema
	> | null>(null);

	// Fetch messages if in an existing conversation
	const {
		data: messagesData,
		isLoading,
		isError,
		error,
		refetch,
	} = aiGatewayConversationsQuery.listMessages.useQuery(conversationId || "", {
		page: 1,
		perPage: 20,
	});

	const postMessageMutation =
		aiGatewayWorkflowsQuery.postMessage.useMutation(queryClient);

	const createConversationMutation =
		aiGatewayConversationsQuery.create.useMutation(queryClient);

	useEffect(() => {
		if (isError && error) {
			const status = (error as any)?.response?.status || (error as any)?.status;
			if (status === 404) {
				showErrorNotification(new Error("Conversation not found"));
				router.push(APP_ROUTES.PROJECT_AI(projectId));
			}
		}
	}, [isError, error, router, projectId]);

	const [watchTrigger, setWatchTrigger] = useState(0);

	useEffect(() => {
		if (!conversationId) return;

		let cleanup: (() => void) | undefined;
		let isMounted = true;
		let timeoutId: NodeJS.Timeout;

		setWorkflowStatus(null);

		const connect = (retriesLeft: number) => {
			if (!isMounted) return;
			setIsWatching(true);
			if (cleanup) cleanup();

			cleanup = aiGatewayWorkflowsService.watchConversation(
				conversationId,
				(status) => {
					setWorkflowStatus(status);
					// Invalidate the messages query to trigger a refetch for partial changes
					queryClient.invalidateQueries({
						queryKey: ["ai-conversations", "listMessages", conversationId],
					});
				},
				(err) => {
					if (retriesLeft > 0) {
						console.log(
							`Watch connection failed. Retrying... (${retriesLeft} left)`,
						);
						timeoutId = setTimeout(() => connect(retriesLeft - 1), 1000);
					} else {
						console.error("Workflow watch error after retries", err);
						setIsWatching(false);
					}
				},
				() => {
					setIsWatching(false);
					setWorkflowStatus(null);
					queryClient.invalidateQueries({
						queryKey: ["ai-conversations", "listMessages", conversationId],
					});
				},
			);
		};

		connect(3); // Start connection with 3 retries

		return () => {
			isMounted = false;
			clearTimeout(timeoutId);
			if (cleanup) cleanup();
		};
	}, [conversationId, queryClient, watchTrigger]);

	const handleSelectConversation = (id: string) => {
		router.push(APP_ROUTES.PROJECT_AI_CONVERSATION(projectId, id));
	};

	const handleNewConversation = () => {
		router.push(APP_ROUTES.PROJECT_AI(projectId));
	};

	const handleSend = () => {
		if (!message.trim()) return;

		const userQuery = message;
		setMessage("");

		if (!conversationId) {
			createConversationMutation.mutate(
				{
					query: { location: "ai_window" },
					body: {
						projectId,
						startWorkflow: true,
						initialUserQuery: userQuery,
					},
				},
				{
					onSuccess: (data) => {
						if (data && data.id) {
							router.push(
								APP_ROUTES.PROJECT_AI_CONVERSATION(projectId, data.id),
							);
						}
					},
					onError: () => {
						setMessage(userQuery); // Restore message on error
						showErrorNotification(new Error("Failed to start conversation"));
					},
				},
			);
		} else {
			postMessageMutation.mutate(
				{
					param: { conversationId },
					body: { userQuery },
				},
				{
					onSuccess: () => {
						setWatchTrigger((prev) => prev + 1);
					},
					onError: () => {
						setMessage(userQuery); // Restore message on error
						showErrorNotification(new Error("Failed to send message"));
					},
				},
			);
		}
	};

	const isNewOrEmpty =
		!conversationId ||
		(!isLoading && !isError && messagesData?.messages?.length === 0);
	const isActionLoading =
		postMessageMutation.isPending ||
		createConversationMutation.isPending ||
		isWatching;

	return (
		<Group h="100%" gap={0} wrap="nowrap" align="stretch">
			{/* Main Chat Area */}
			<Stack
				flex={1}
				h="100%"
				p="md"
				gap="md"
				style={{ minWidth: 0, minHeight: 0 }}
			>
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
										style={{
											letterSpacing: "-1px",
											lineHeight: 1.3,
											paddingBottom: "4px",
										}}
									>
										Fluxify AI
									</Text>
								</Group>
								<Text size="lg" c="dimmed" ta="center" maw={500}>
									Your intelligent assistant to design and build backend APIs.
									Describe what you need, and let the AI do the heavy lifting.
								</Text>
							</Stack>

							<Box w="100%">
								<AIPromptInput
									value={message}
									onChange={setMessage}
									onSend={handleSend}
									isLoading={isActionLoading}
									showSidebarToggle={!!conversationId && !showArtifactPanel}
									onToggleSidebar={() => setShowArtifactPanel(true)}
									minRows={2}
								/>
							</Box>
						</Stack>
					</Center>
				) : (
					<ConversationHistory
						messages={messagesData?.messages}
						isLoading={isLoading}
						isError={isError}
						error={error}
						onRetry={refetch}
						workflowStatus={workflowStatus}
					/>
				)}

				{!isNewOrEmpty && (
					<Container size="md" w="100%" p={0}>
						<AIPromptInput
							value={message}
							onChange={setMessage}
							onSend={handleSend}
							isLoading={isActionLoading}
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
