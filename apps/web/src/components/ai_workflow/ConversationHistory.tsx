import { watchConversationDto } from "@fluxify/ai-gateway";
import { z } from "zod";
import React, { useEffect, useRef } from "react";
import {
	Stack,
	Group,
	Text,
	Skeleton,
	Center,
	Button,
	Card,
	Code,
	Box,
} from "@mantine/core";
import { TbRefresh } from "react-icons/tb";
import { NodeResultDisplay } from "./NodeResultDisplay";
import { WorkflowExecutionHistory } from "./WorkflowExecutionHistory";

export interface Message {
	id: string;
	status?: string;
	userQuery?: string;
	finalOutput?: {
		nodeId: string;
		result: any;
	};
	workflowExecutionHistory?:
		| {
				type: "node" | "tool";
				id?: string;
				name?: string;
				input?: any;
				status: "running" | "success" | "failure";
				output?: any;
		  }[]
		| null;
	createdAt?: string;
}

interface ConversationHistoryProps {
	messages?: Message[];
	isLoading: boolean;
	isError: boolean;
	error: any;
	onRetry: () => void;
	workflowStatus?: z.infer<
		typeof watchConversationDto.watchResponseSchema
	> | null;
}

export const ConversationHistory = ({
	messages,
	isLoading,
	isError,
	error,
	onRetry,
	workflowStatus,
}: ConversationHistoryProps) => {
	const messagesEndRef = useRef<HTMLDivElement>(null);

	const scrollToBottom = () => {
		messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
	};

	useEffect(() => {
		scrollToBottom();
	}, [messages, workflowStatus]);

	return (
		<Stack
			flex={1}
			style={{ overflowY: "auto", overflowX: "hidden", minHeight: 0 }}
			p="md"
		>
			<Stack w="100%" maw="1050px" mx="auto" flex={1} gap="md">
				<Box style={{ flexGrow: 1, minHeight: 0 }} />

				{isError &&
					(error?.response?.status >= 500 || error?.status >= 500) && (
						<Center h="100%" style={{ flexDirection: "column", gap: "10px" }}>
							<Text c="red">
								Failed to load conversation:{" "}
								{error?.message || "Internal Server Error"}
							</Text>
							<Button
								leftSection={<TbRefresh size={16} />}
								variant="light"
								color="red"
								onClick={onRetry}
							>
								Retry
							</Button>
						</Center>
					)}

				{!isLoading &&
					!isError &&
					messages?.map((msg) => (
						<Stack key={msg.id} gap="md" w="100%">
							{/* User Query - Right aligned */}
							{msg.userQuery && (
								<Group justify="flex-end" w="100%" align="flex-start">
									<Stack
										gap="xs"
										p="md"
										bg="violet.1"
										align="flex-end"
										style={{
											borderRadius: "8px",
											maxWidth: "80%",
											minWidth: "15%",
										}}
									>
										<Text size="sm">{msg.userQuery}</Text>
									</Stack>
								</Group>
							)}

							{/* AI Output - Left aligned */}
							{msg.finalOutput && msg.finalOutput.nodeId && (
								<Group justify="flex-start" w="100%" align="flex-start">
									<Box style={{ maxWidth: "80%", width: "100%" }}>
										<NodeResultDisplay
											nodeId={msg.finalOutput.nodeId}
											result={msg.finalOutput.result}
											executionHistory={msg.workflowExecutionHistory || []}
										/>
									</Box>
								</Group>
							)}
						</Stack>
					))}

				{/* Active Workflow UI */}
				{workflowStatus &&
					workflowStatus.status !== "completed" &&
					workflowStatus.status !== "error" && (
						<Stack gap="md" w="100%">
							{/* Active User Query from Workflow */}
							{workflowStatus.userQuery && (
								<Group justify="flex-end" w="100%" align="flex-start">
									<Stack
										gap="xs"
										p="md"
										bg="violet.1"
										align="flex-end"
										style={{
											borderRadius: "8px",
											maxWidth: "80%",
											minWidth: "15%",
										}}
									>
										<Text size="sm">{workflowStatus.userQuery}</Text>
									</Stack>
								</Group>
							)}

							{/* Active AI Processing */}
							<Group justify="flex-start" w="100%" align="flex-start">
								<Card
									shadow="sm"
									padding="md"
									radius="md"
									withBorder
									w="100%"
									maw="80%"
								>
									<WorkflowExecutionHistory
										history={workflowStatus.executionHistory}
										isRunning={true}
										defaultExpanded={true}
									/>
								</Card>
							</Group>
						</Stack>
					)}

				<div ref={messagesEndRef} />
			</Stack>
		</Stack>
	);
};
