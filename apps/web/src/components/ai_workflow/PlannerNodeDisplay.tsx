import React, { useState } from "react";
import {
	Stack,
	Group,
	Text,
	Button,
	Paper,
	ThemeIcon,
	Box,
} from "@mantine/core";
import { TbClipboardList, TbX } from "react-icons/tb";
import { PlanReviewModal } from "./PlanReviewModal";
import { WorkflowExecutionHistory } from "./WorkflowExecutionHistory";

interface PlannerNodeDisplayProps {
	result: {
		type: string;
		markdownPlan: string;
		success: boolean;
		warnings?: string[];
		builderStepData?: any;
		rejected?: boolean;
		approved?: boolean;
		reviewed?: boolean;
	};
	executionHistory: any[];
	chatId: string;
	conversationId: string;
	status?: string;
}

export const PlannerNodeDisplay = ({
	result,
	chatId,
	conversationId,
	status,
	executionHistory,
}: PlannerNodeDisplayProps) => {
	const [isModalOpen, setIsModalOpen] = useState(false);
	const isRejected = result.rejected || status === "plan_rejected";
	const isApproved = result.approved;
	const isReviewed = result.reviewed;

	return (
		<Stack gap="xs" w="100%">
			{executionHistory && executionHistory.length > 0 && (
				<Box
					p="md"
					bg="gray.0"
					style={{ borderRadius: "8px", border: "1px solid #e9ecef" }}
				>
					<WorkflowExecutionHistory
						history={executionHistory}
						defaultExpanded={false}
					/>
				</Box>
			)}
			
			{!isApproved && !isReviewed && (
				<Paper
					withBorder
					radius="md"
					p="md"
					bg="violet.0"
					style={{ borderColor: "var(--mantine-color-violet-2)" }}
				>
					<Stack gap="xs">
						<Group gap="sm">
							<ThemeIcon
								size="md"
								radius="xl"
								color={isRejected ? "red" : "violet"}
								variant="light"
							>
								{isRejected ? <TbX size={16} /> : <TbClipboardList size={16} />}
							</ThemeIcon>
							<Text fw={600} size="sm" c={isRejected ? "red.7" : "violet.9"}>
								{isRejected ? "Plan Rejected" : "Proposed Plan Ready"}
							</Text>
						</Group>

						<Text size="sm" c="dimmed">
							{isRejected
								? "The AI's proposed plan was rejected. You can view the rejected plan for reference."
								: "The AI has analyzed your request and created an implementation plan. Please review and approve the plan before we proceed with building the flow."}
						</Text>

						<Group mt="sm">
							<Button
								variant="filled"
								color={isRejected ? "red" : "violet"}
								onClick={() => setIsModalOpen(true)}
							>
								{isRejected ? "See rejected plan" : "View & Review Plan"}
							</Button>
						</Group>
					</Stack>
				</Paper>
			)}

			<PlanReviewModal
				opened={isModalOpen}
				onClose={() => setIsModalOpen(false)}
				plan={result.markdownPlan || "No plan generated."}
				chatId={chatId}
				conversationId={conversationId}
				isReadOnly={isRejected || isApproved || isReviewed}
			/>
		</Stack>
	);
};
