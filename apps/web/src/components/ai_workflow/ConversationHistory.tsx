import { watchConversationDto } from "@fluxify/ai-gateway";
import { z } from "zod";
import React from "react";
import {
	Stack,
	Group,
	Text,
	Skeleton,
	Center,
	Button,
	Card,
	Code,
} from "@mantine/core";
import { TbRefresh } from "react-icons/tb";

export interface Message {
	id: string;
	status?: string;
	userQuery?: string;
	finalOutput?: {
		nodeId: string;
		result: any;
	};
	workflowExecutionHistory?: {
		type: "node" | "tool";
		id: string;
		input: any;
		status: "running" | "success" | "failure";
		output: any;
	}[];
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
	// Sort by latest (descending order by createdAt if available, otherwise assume already sorted)
	// We'll reverse the array to show latest at the bottom (or keep it if it's already sorted)
	// Since standard chats show latest at the bottom, we'll keep the array order
	// assuming it's returned sorted by createdAt ASC.

	return (
		<Stack flex={1} justify="flex-end" style={{ overflowY: "auto" }} p="md">
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

			{isError && (error?.response?.status >= 500 || error?.status >= 500) && (
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
					<Stack
						key={msg.id}
						gap="xs"
						p="md"
						bg="gray.0"
						style={{ borderRadius: "8px", border: "1px solid #e9ecef" }}
					>
						<Text fw={600} size="sm" c="violet.7">
							User Query
						</Text>
						<Code block bg="white">
							{msg.userQuery || "No query provided"}
						</Code>

						<Text fw={600} size="sm" c="grape.7" mt="sm">
							Final Output (AI)
						</Text>
						<Code
							block
							bg="white"
							style={{ maxHeight: "200px", overflowY: "auto" }}
						>
							{JSON.stringify(msg.finalOutput || null, null, 2)}
						</Code>

						<Text fw={600} size="sm" c="blue.7" mt="sm">
							Execution History
						</Text>
						<Code
							block
							bg="white"
							style={{ maxHeight: "300px", overflowY: "auto" }}
						>
							{JSON.stringify(msg.workflowExecutionHistory || [], null, 2)}
						</Code>
					</Stack>
				))}

			{workflowStatus &&
				workflowStatus.status !== "completed" &&
				workflowStatus.status !== "error" && (
					<Group justify="flex-start" w="100%">
						<Card shadow="sm" padding="md" radius="md" withBorder w="100%">
							<Text fw={500} size="sm" mb="xs" c="dimmed">
								AI is processing...
							</Text>
							<Code
								block
								style={{ maxHeight: "300px", overflowY: "auto" }}
								fz="xs"
							>
								{JSON.stringify(workflowStatus, null, 2)}
							</Code>
						</Card>
					</Group>
				)}
		</Stack>
	);
};
