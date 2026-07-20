import type { SubAgentMetadata } from "./types";
import { AgentNode } from "../../types";
export * from "./routeConfig";

export const subAgents: SubAgentMetadata[] = [
	{
		name: "Route Config Agent",
		nodeName: AgentNode.ROUTE_CONFIG_AGENT,
		ability: "Create, modify, or delete route configurations and schemas",
		description:
			"Responsible for configuring routes, including their method, path, and request validation schemas (body, query, params) based on custom schema definitions.",
	},
];
