import React from "react";
import { ClassifierNodeDisplay } from "./ClassifierNodeDisplay";
import { DiscussionNodeDisplay } from "./DiscussionNodeDisplay";
import { Stack, Text, Code } from "@mantine/core";
import { WorkflowExecutionHistory } from "./WorkflowExecutionHistory";

interface NodeResultDisplayProps {
	nodeId: string;
	result: any;
	executionHistory: any[];
}

export const NodeResultDisplay = ({ nodeId, result, executionHistory }: NodeResultDisplayProps) => {
	switch (nodeId) {
		case "classifier":
			return <ClassifierNodeDisplay result={result} executionHistory={executionHistory} />;
		case "discussion":
			return <DiscussionNodeDisplay result={result} executionHistory={executionHistory} />;
		default:
			// Fallback display
			return (
				<Stack gap="xs" p="md" bg="gray.0" style={{ borderRadius: "8px", border: "1px solid #e9ecef" }}>
					<WorkflowExecutionHistory history={executionHistory} defaultExpanded={false} />
					<Text fw={600} size="sm" c="gray.7">
						Unknown Node Result ({nodeId})
					</Text>
					<Code block bg="white" style={{ maxHeight: "200px", overflowY: "auto", maxWidth: "100%" }}>
						{JSON.stringify(result, null, 2)}
					</Code>
				</Stack>
			);
	}
};
