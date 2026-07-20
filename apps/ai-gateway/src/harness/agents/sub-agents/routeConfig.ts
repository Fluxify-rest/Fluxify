import { BaseAgent } from "../base";
import { type GlobalGraphState, AgentNode } from "../../types";
import { dispatchAgentEvent } from "../../callbacks";
import { z } from "zod";

const routeConfigSchema = z.object({
	action: z.enum(["create", "delete", "update-partial"]).describe("The operation to perform"),
	routeId: z.string().optional().describe("The UUID of the route. Leave empty for create action."),
	data: z.object({
		method: z.string().optional(),
		path: z.string().optional(),
		bodySchema: z.any().optional(),
		paramsSchema: z.any().optional(),
		querySchema: z.any().optional(),
	}).optional().describe("The configuration of the route"),
});

export class RouteConfigAgent extends BaseAgent {
	constructor(state: GlobalGraphState) {
		super(state);
	}

	async execute(): Promise<Partial<GlobalGraphState>> {
		const activeTask = this.state.activeTask;
		if (!activeTask) {
			throw new Error("RouteConfigAgent requires an active task.");
		}

		await dispatchAgentEvent({
			name: "agent_status",
			data: {
				status: "Analyzing route configuration requirements...",
				agent: AgentNode.ROUTE_CONFIG_AGENT,
			},
		});

		const systemPrompt = `You are the Route Config Agent for Fluxify — an Agentic Low Code Backend Development Platform.
Your responsibility is to determine the exact Create, Update, or Delete (CUD) intent for a route based on the task description.

## Route Schemas Overview
Fluxify routes use a structured data schema for validation.
Available schemas are:
- \`bodySchema\`: Validates the JSON data in the request body (POST, PUT).
- \`querySchema\`: Validates URL query parameters (e.g., ?page=2).
- \`paramsSchema\`: Validates URL path values (e.g., /users/:id). 

Path parameters must precisely match between the URL path (e.g. /:userId) and the \`paramsSchema\` keys.
All schemas use a structured JSON format that will later be converted to Zod on the backend. 

### Custom Schema Types
Valid property types include String, Integer, Float, Boolean, Array, Object, Enum, and JavaScript (for custom validation).

## Instructions
1. Analyze the assigned task to understand the exact route modifications required.
2. Determine if the action is \`create\`, \`delete\`, or \`update-partial\`.
3. If creating or updating a route, define the \`method\`, \`path\`, and relevant schemas in the \`data\` object.
4. **DO NOT generate a UUID for new routes.** Leave \`routeId\` empty/undefined when the action is \`create\`. The system will generate it.
5. If the action is \`update-partial\` or \`delete\`, you MUST include the \`routeId\` extracted from the task context.
6. The orchestrator will use your exact structured output to apply the changes after human approval.`;

		const userQuery = `Task Title: ${activeTask.title}
Task Description: ${activeTask.description}

Determine the exact route configuration intent.`;

		const response = (await this.state.agentWrapper.invokeAgent({
			zodSchema: routeConfigSchema,
			systemPrompt,
			messages: [], 
			userQuery: userQuery,
		})) as z.infer<typeof routeConfigSchema>;

		await dispatchAgentEvent({
			name: "agent_status",
			data: {
				status: "Route configuration intent formulated",
				agent: AgentNode.ROUTE_CONFIG_AGENT,
				data: response,
			},
		});

		// Ensure we initialize subAgentResults if it's undefined
		const currentResults = this.state.orchestratorState?.subAgentResults || {};

		return {
			currentAgent: AgentNode.ROUTE_CONFIG_AGENT,
			orchestratorState: {
				...this.state.orchestratorState,
				subAgentResults: {
					...currentResults,
					[activeTask.id]: response,
				},
			},
		};
	}
}
