import React from "react";
import { Stack, Text, Code } from "@mantine/core";
import { WorkflowExecutionHistory } from "./WorkflowExecutionHistory";

export interface ClassifierNodeDisplayProps {
	result: any;
	executionHistory: any[];
}

export const ClassifierNodeDisplay = ({ result, executionHistory }: ClassifierNodeDisplayProps) => {
	return (
		<Stack gap="xs" p="md" bg="gray.0" style={{ borderRadius: "8px", border: "1px solid #e9ecef" }}>
			<WorkflowExecutionHistory history={executionHistory} defaultExpanded={false} />
			<Text fw={600} size="sm" c="grape.7">
				Classification Result
			</Text>
			<Code block bg="white" style={{ maxHeight: "200px", overflowY: "auto", maxWidth: "100%" }}>
				{JSON.stringify(result, null, 2)}
			</Code>
		</Stack>
	);
};
