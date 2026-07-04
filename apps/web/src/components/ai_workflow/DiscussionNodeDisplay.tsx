import React from "react";
import { Stack, Text, Box } from "@mantine/core";
import { WorkflowExecutionHistory } from "./WorkflowExecutionHistory";
import ReactMarkdown from "react-markdown";

export interface DiscussionNodeDisplayProps {
	result: any;
	executionHistory: any[];
}

export const DiscussionNodeDisplay = ({ result, executionHistory }: DiscussionNodeDisplayProps) => {
	const content = result?.response || "";

	return (
		<Stack gap="xs" p="md" bg="gray.0" style={{ borderRadius: "8px", border: "1px solid #e9ecef" }}>
			<WorkflowExecutionHistory history={executionHistory} defaultExpanded={false} />
			<Box fz="sm" style={{ overflowX: "auto" }}>
				<ReactMarkdown>{content}</ReactMarkdown>
			</Box>
		</Stack>
	);
};
