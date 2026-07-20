import { type GlobalGraphState, type Task } from "../types";
import { subAgents } from "./sub-agents";
import { z } from "zod";
import { dispatchAgentEvent } from "../callbacks";

function buildSubAgentsTable(): string {
	if (subAgents.length === 0) {
		return "No sub-agents currently available.";
	}
	const header =
		"| Agent Name | Node Name | Ability | Description |\n| --- | --- | --- | --- |";
	const rows = subAgents.map(
		(a) => `| ${a.name} | ${a.nodeName} | ${a.ability} | ${a.description} |`,
	);
	return [header, ...rows].join("\n");
}

const SUB_AGENTS_TABLE = buildSubAgentsTable();

const taskSchema = z.object({
	tasks: z
		.array(
			z.object({
				id: z
					.string()
					.describe("Short unique ID (3 chars and 2 digits, e.g., a12bc)"),
				title: z.string().describe("Title of the task"),
				description: z
					.string()
					.describe("Detailed description of what needs to be done"),
				dependsOnAgentId: z
					.array(z.string())
					.describe(
						"List of previous task IDs where their output gets injected to this task",
					),
				assignedAgentNode: z
					.string()
					.describe("The Node Name of the sub-agent assigned to this task"),
			}),
		)
		.describe("Directed Acyclic Graph (DAG) of tasks to execute the plan"),
});

export class TaskGeneratorAgent {
	private state: GlobalGraphState;

	constructor(state: GlobalGraphState) {
		this.state = state;
	}

	async execute(): Promise<Task[]> {
		await dispatchAgentEvent({
			name: "agent_status",
			data: {
				status: "Generating tasks...",
				agent: "orchestrator" as any, // Task generator is called by Orchestrator
			},
		});

		const scratchPadText = this.state.scratchpad?.length
			? `\n\n## Context / Scratch Pad from Previous Agents\nHere is information gathered from previous steps:\n${this.state.scratchpad.map((s) => `- ${s}`).join("\n")}`
			: "";

		const systemPrompt = `You are the Expert Task Generator Agent for Fluxify — an Agentic Low Code Backend Development Platform.
Your role is to act as the task planner for the Orchestrator. You receive a verified plan (created by the Planner Agent) and must break it down into a list of tasks. 
Each task must be assigned to an existing specialized sub-agent.

## Sub-Agents Available
The orchestrator relies on the following sub-agents. You MUST assign tasks ONLY to the \`Node Name\` of these sub-agents.
${SUB_AGENTS_TABLE}

## Instructions
1. Analyze the user's plan and the scratchpad.
2. Create a list of tasks that perfectly represent the steps needed to fulfill the plan.
3. Formulate these tasks into a Dependency Graph (DAG) by specifying \`dependsOnAgentId\` for tasks that require the output of prior tasks. 
4. Provide a clear title and a highly detailed description for each task. The sub-agent will solely rely on your description and context.
5. Generate a short 5-character ID for each task (3 letters, 2 digits).
6. **STRICT NO-CYCLE RULE**: Ensure the Dependency Graph is strictly acyclic. No task should depend on itself or form a circular dependency chain.
7. **Resource Identifiers**: The plan may contain \`@resource(type, identifier)\` tags. You MUST extract the exact \`identifier\` from these tags and explicitly include it in the task description for the assigned sub-agent so they know exactly which resource to operate on.

If there are no sub-agents available, output an empty task list.
${scratchPadText}`;

		// Provide the plan as the query to focus the LLM on breaking it down
		const planText = this.state.plannerState?.markdownPlan
			? `Plan to execute:\n${this.state.plannerState.markdownPlan}`
			: "No plan provided.";

		const response = (await this.state.agentWrapper.invokeAgent({
			zodSchema: taskSchema,
			systemPrompt,
			messages: [], // We only pass the plan to keep it strictly focused
			userQuery: planText,
		})) as z.infer<typeof taskSchema>;

		// Map to our internal state type
		const generatedTasks: Task[] = response.tasks.map((t) => ({
			...t,
			assignedAgentNode: t.assignedAgentNode as any,
			status: "pending",
		}));

		return generatedTasks;
	}
}
