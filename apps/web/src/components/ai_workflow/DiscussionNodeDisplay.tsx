import React from "react";
import { Stack, Box, Alert } from "@mantine/core";
import {
	WorkflowExecutionHistory,
	WorkflowExecutionHistoryProps,
} from "./WorkflowExecutionHistory";
import { MarkdownViewer } from "./MarkdownViewer";
import type { DiscussionResult } from "@fluxify/ai-gateway";
import { TbAlertCircle } from "react-icons/tb";

export interface DiscussionNodeDisplayProps {
	result: DiscussionResult | string;
	executionHistory: NonNullable<WorkflowExecutionHistoryProps["history"]>;
}

export const DiscussionNodeDisplay = ({
	result,
	executionHistory,
}: DiscussionNodeDisplayProps) => {
	const content = typeof result === "string" ? result : result.response;
	const isFailure = typeof result === "string";

	return (
		<Stack
			gap="xs"
			p="md"
			bg="gray.0"
			style={{ borderRadius: "8px", border: "1px solid #e9ecef" }}
		>
			<WorkflowExecutionHistory
				history={executionHistory}
				defaultExpanded={false}
			/>
			{isFailure ? (
				<Alert
					variant="light"
					color="red"
					title="Discussion Failed"
					icon={<TbAlertCircle size={16} />}
					styles={{ title: { fontWeight: 600 } }}
				>
					{(result as any).reasoning ||
						(result as any).error ||
						"The discussion agent encountered an error and was unable to generate a response."}
				</Alert>
			) : (
				<Box fz="sm" style={{ overflowX: "auto" }}>
					<MarkdownViewer content={content!} />
				</Box>
			)}
		</Stack>
	);
};
