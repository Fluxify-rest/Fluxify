"use client";

import {
	ActionIcon,
	Box,
	Button,
	Center,
	Divider,
	Group,
	Paper,
	Skeleton,
	Stack,
	Text,
	Textarea,
	useMantineTheme,
	ScrollArea,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import ConfirmDialog from "../dialog/confirmDialog";
import Link from "next/link";
import { BiBrush } from "react-icons/bi";
import { IoMdReturnLeft } from "react-icons/io";
import { MdErrorOutline } from "react-icons/md";
import { TbMessage2Plus, TbSend } from "react-icons/tb";
import { useParams } from "next/navigation";
import { useState, useEffect, useRef } from "react";
import { aiMessagesQueries } from "@/query/aiMessagesQuery";
import { useQueryClient } from "@tanstack/react-query";
import {
	MessageBubble,
	type AiChatMessage,
	type StreamingStatus,
} from "./ai-chat/message-bubble";

const AiChatDrawer = () => {
	const { id: routeId } = useParams<{ id: string }>();
	const [content, setContent] = useState("");
	const [streamingStatus, setStreamingStatus] =
		useState<StreamingStatus | null>(null);
	const [clearOpened, { open: openClear, close: closeClear }] =
		useDisclosure(false);

	const queryClient = useQueryClient();

	const { data: messages = [], isLoading } =
		aiMessagesQueries.getByRouteId.useQuery(routeId, { skip: 0, limit: 100 });

	const postMutation = aiMessagesQueries.getByRouteId.useMutation(queryClient);
	const clearMutation =
		aiMessagesQueries.clearMessages.useMutation(queryClient);

	const isAiWorking = Boolean(
		postMutation.isPending ||
		messages.some(
			(m: AiChatMessage) =>
				m.role === "ai" &&
				(m.messageStage ?? 0) > -1 &&
				(m.messageStage ?? 0) < 4,
		) ||
		(streamingStatus &&
			streamingStatus.stage < 4 &&
			streamingStatus.stage > -1),
	);

	useEffect(() => {
		if (!routeId || !isAiWorking) return;

		// Connect to SSE
		const source = new EventSource(
			`/_/admin/api/v1/messages/${routeId}/status`,
			{
				withCredentials: true,
			},
		);

		source.addEventListener("status", (e) => {
			try {
				const data = JSON.parse(e.data);
				setStreamingStatus((prev) => {
					let newData = data.data;
					if (prev && prev.messageId === data.messageId && prev.data) {
						newData = { ...prev.data, ...(data.data || {}) };
					}
					return { ...data, data: newData };
				});
				if (data.stage === 4 || data.stage === -1) {
					// Process finish
					aiMessagesQueries.getByRouteId.invalidate(queryClient, routeId);
				}
			} catch (err) {}
		});

		return () => {
			source.close();
		};
	}, [routeId, queryClient, isAiWorking]);

	const handleSend = () => {
		if (!content.trim()) return;
		postMutation.mutate(
			{ routeId, data: { content } },
			{
				onSuccess: () => {
					setContent("");
					aiMessagesQueries.getByRouteId.invalidate(queryClient, routeId);
				},
			},
		);
	};

	const viewport = useRef<HTMLDivElement>(null);
	useEffect(() => {
		// Auto scroll bottom when new message arrives or streams
		if (viewport.current) {
			viewport.current.scrollTo({
				top: viewport.current.scrollHeight,
				behavior: "smooth",
			});
		}
	}, [messages.length, streamingStatus]);

	return (
		<Paper h={"100%"} withBorder>
			<Stack gap={"xs"} h={"100%"}>
				<Group justify="space-between" px={"md"} align="center" w={"100%"}>
					<img
						src="/_/admin/ui/ai_window_logo.webp"
						style={{ width: "80px" }}
						alt=""
					/>
					<ActionIcon
						title="Clear Chat"
						variant="light"
						color="red.9"
						loading={clearMutation.isPending}
						onClick={openClear}
					>
						<BiBrush style={{ transform: "rotate(180deg)" }} />
					</ActionIcon>
					<ConfirmDialog
						open={clearOpened}
						onClose={closeClear}
						title="Clear Chat History"
						confirmText="Clear"
						onConfirm={() => {
							clearMutation.mutate(routeId, {
								onSuccess: () => {
									closeClear();
								},
							});
						}}
					>
						<Text size="sm">
							Are you sure you want to clear your entire chat history? This
							action cannot be undone.
						</Text>
					</ConfirmDialog>
				</Group>
				<Divider />
				<ScrollArea
					viewportRef={viewport}
					style={{ flex: 1, height: "100%", padding: "0 16px" }}
				>
					<ChatListRenderer
						chatMessages={[...messages].reverse()}
						aiProviderExist={true}
						loading={isLoading}
						streamingStatus={streamingStatus}
					/>
				</ScrollArea>
				<Group m={"xs"} pos={"relative"}>
					<Textarea
						w={"100%"}
						rows={4}
						placeholder={"Ask Fluxify AI"}
						value={content}
						onChange={(e) => setContent(e.currentTarget.value)}
						disabled={isAiWorking}
						onKeyDown={(e) => {
							if (e.key === "Enter" && !e.shiftKey) {
								e.preventDefault();
								handleSend();
							}
						}}
					/>
					<Group
						bottom={0}
						left={0}
						right={0}
						pos={"absolute"}
						w={"100%"}
						justify="space-between"
					>
						<Button
							variant="light"
							ml={"auto"}
							leftSection={<TbSend />}
							color={"violet"}
							loading={postMutation.isPending}
							disabled={isAiWorking}
							onClick={handleSend}
						>
							Send
						</Button>
					</Group>
				</Group>
			</Stack>
		</Paper>
	);
};

type ChatListRendererProps = {
	chatMessages: AiChatMessage[];
	aiProviderExist?: boolean;
	loading?: boolean;
	streamingStatus?: StreamingStatus | null;
};

const ChatListRenderer = (props: ChatListRendererProps) => {
	const colors = useMantineTheme().colors;

	if (props.loading) {
		return (
			<Stack justify="end" h={"100%"} p={"sm"}>
				<Skeleton h={100} w={"80%"} />
				<Skeleton h={80} ml={"auto"} w={"80%"} />
				<Skeleton h={120} w={"80%"} />
				<Skeleton h={60} ml={"auto"} w={"80%"} />
			</Stack>
		);
	}

	if (props.chatMessages.length === 0) {
		return (
			<Stack justify="center" align="center" h={"100%"} mt="xl">
				<TbMessage2Plus size={80} color={colors.gray[4]} />
				<Stack gap={"xs"} c={colors.dark[7]} align="center" mt="md">
					<Text fw={500}>No chat history found</Text>
					<Text size="sm" c="dimmed">
						Start a conversation by sending a message to AI
					</Text>
				</Stack>
			</Stack>
		);
	}

	return (
		<Stack gap="sm" pb="48px">
			{props.chatMessages.map((msg) => (
				<MessageBubble
					key={msg.id}
					message={msg}
					streamingStatus={props.streamingStatus}
				/>
			))}
		</Stack>
	);
};

export default AiChatDrawer;
