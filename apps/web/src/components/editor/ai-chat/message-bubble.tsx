import {
	Box,
	Card,
	Group,
	Loader,
	Stack,
	Text,
	Tooltip,
	Accordion,
	Badge,
	ActionIcon,
	useMantineTheme,
	Modal,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { TbMessageDots, TbCheck, TbEye } from "react-icons/tb";
import Editor from "@monaco-editor/react";
import type z from "zod";
import type { aiChatMessageSchema } from "@fluxify/server/src/api/v1/messages/get-by-route-id/dto";

export type AiChatMessage = z.infer<typeof aiChatMessageSchema>;

export type StreamingStatus = {
	messageId: string;
	routeId: string;
	userId: string;
	stage: number;
	status: "started" | "success" | "error";
	nodeName: string;
	data?: any;
	error?: string;
};

type MessageBubbleProps = {
	message: AiChatMessage;
	streamingStatus?: StreamingStatus | null;
};

export const MessageBubble = ({
	message,
	streamingStatus,
}: MessageBubbleProps) => {
	if (message.role === "user") {
		return <UserMessageBubble message={message} />;
	}
	return (
		<AiMessageBubble message={message} streamingStatus={streamingStatus} />
	);
};

const UserMessageBubble = ({ message }: { message: AiChatMessage }) => {
	const theme = useMantineTheme();

	return (
		<Group justify="flex-end" w="100%" mb="xs">
			<Box
				bg={theme.colors.violet[6]}
				c="white"
				p="sm"
				style={{
					borderRadius: theme.radius.md,
					borderBottomRightRadius: 0,
					maxWidth: "85%",
				}}
			>
				<Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
					{message.content}
				</Text>
			</Box>
		</Group>
	);
};

const AiMessageBubble = ({ message, streamingStatus }: MessageBubbleProps) => {
	const theme = useMantineTheme();
	const [opened, { open, close }] = useDisclosure(false);

	const isStreamingTarget =
		streamingStatus && streamingStatus.messageId === message.id;

	const messageStage = isStreamingTarget
		? streamingStatus.stage
		: (message.messageStage ?? 0);
	const toolCalls = isStreamingTarget ? undefined : message.toolCalls;
	const tokenUsage = isStreamingTarget ? undefined : message.tokenUsage;
	const isComplete = messageStage === 4;
	const hasError = messageStage === -1;
	const content =
		hasError && isStreamingTarget ? streamingStatus.error : message.content;

	const aiData = isStreamingTarget
		? streamingStatus.data
		: message.aiResponse || {};

	const classifierOutput = aiData?.classifierOutput;
	const plannerOutput = aiData?.plannerOutput;
	const discussionOutput = aiData?.discussionOutput;
	const builderOutput = aiData?.builderOutput;

	const isDiscussion =
		Boolean(discussionOutput) ||
		(!plannerOutput && !builderOutput && Boolean(content));
	return (
		<Group justify="flex-start" w="100%" mb="xs">
			<Card
				withBorder
				p="sm"
				w="100%"
				style={{
					borderRadius: theme.radius.md,
					borderBottomLeftRadius: 0,
					maxWidth: "95%",
				}}
			>
				<Stack gap="xs">
					{isDiscussion ? (
						<Text size="sm" style={{ whiteSpace: "pre-wrap" }}>
							{content || discussionOutput?.output || "Generating response..."}
							{!isComplete && !hasError && (
								<Loader ml="xs" size="xs" type="dots" />
							)}
						</Text>
					) : (
						<Stack gap="xs">
							{/* Stage 0-1: classifying */}
							{!isComplete && !hasError && messageStage < 2 && (
								<Group align="center">
									<Loader size="xs" />
									<Text size="xs" c="dimmed">
										Analyzing request...
									</Text>
								</Group>
							)}

							{/* Stage >= 2: planner */}
							{(plannerOutput || messageStage >= 2) && (
								<Accordion variant="separated" radius="md">
									{plannerOutput ? (
										<Accordion.Item value="planner">
											<Accordion.Control
												icon={
													<StatusIcon
														loading={messageStage === 2}
														success={messageStage > 2 || isComplete}
													/>
												}
											>
												<Text size="sm" fw={500}>
													Planning Phase ({plannerOutput.status})
												</Text>
											</Accordion.Control>
											<Accordion.Panel>
												<Text size="sm">{plannerOutput.reasoning}</Text>
												{plannerOutput.plannedBlockNames?.length ? (
													<Group gap="xs" mt="xs">
														{plannerOutput.plannedBlockNames.map(
															(b: string) => (
																<Badge key={b} variant="light">
																	{b}
																</Badge>
															),
														)}
													</Group>
												) : null}
											</Accordion.Panel>
										</Accordion.Item>
									) : (
										<Accordion.Item value="planner-pending">
											<Accordion.Control icon={<Loader size="xs" />}>
												<Text size="sm" fw={500} c="dimmed">
													Planning...
												</Text>
											</Accordion.Control>
										</Accordion.Item>
									)}
								</Accordion>
							)}

							{/* Stage >= 3: builder, only appears after planner */}
							{plannerOutput && (builderOutput || messageStage >= 3) && (
								<Group justify="space-between" mt="xs">
									{builderOutput ? (
										<>
											<Text size="sm" fw={500}>
												Builder Output Ready
											</Text>
											<Tooltip label="View Details">
												<ActionIcon
													variant="light"
													color="violet"
													onClick={open}
												>
													<TbEye />
												</ActionIcon>
											</Tooltip>
											<Modal
												opened={opened}
												onClose={close}
												title="Builder Output (Debug)"
												size="xl"
											>
												<Editor
													height={500}
													language="json"
													theme="vs-dark"
													value={JSON.stringify(builderOutput, null, 2)}
													options={{
														readOnly: true,
														minimap: { enabled: false },
														scrollBeyondLastLine: false,
														folding: true,
														wordWrap: "on",
													}}
												/>
											</Modal>
										</>
									) : (
										<Group align="center">
											<Loader size="xs" />
											<Text size="xs" c="dimmed">
												Building flow...
											</Text>
										</Group>
									)}
								</Group>
							)}

							{hasError && (
								<Text size="sm" c="red.6">
									{content || "An error occurred."}
								</Text>
							)}

							{(plannerOutput?.clarificationQuestion ||
								builderOutput?.clarificationQuestion) && (
								<Card withBorder bg="yellow.0" p="xs" mt="xs">
									<Text size="sm" fw={600} c="yellow.9">
										Clarification Needed:
									</Text>
									<Text size="sm" c="yellow.9">
										{plannerOutput?.clarificationQuestion ||
											builderOutput?.clarificationQuestion}
									</Text>
								</Card>
							)}
						</Stack>
					)}

					<Group justify="space-between" mt="0.5rem">
						{toolCalls?.length ? (
							<Text size="10px" c="dimmed">
								Tools used: {toolCalls.join(", ")}
							</Text>
						) : (
							<span />
						)}
						{tokenUsage ? (
							<Text size="10px" c="dimmed">
								{tokenUsage} tokens
							</Text>
						) : (
							<span />
						)}
					</Group>
				</Stack>
			</Card>
		</Group>
	);
};

const StatusIcon = ({
	loading,
	success,
}: {
	loading?: boolean;
	success?: boolean;
}) => {
	if (loading) return <Loader size="xs" />;
	if (success) return <TbCheck color="green" />;
	return <TbMessageDots />;
};
