import { tool } from "@langchain/core/tools";
import { z } from "zod";
import { logger } from "@fluxify/common";
import type { WorkflowMetadata } from "../../ai/types";
import type { DbService } from "../internal/dbService";
import type { ResourceType } from "../../workflow/nodes/builder/types";

export const createFindResourceTool = (
	dbService: DbService,
	metadata: WorkflowMetadata,
) => {
	return tool(
		async ({ searchQuery, resourceType }) => {
			logger.info(
				`[Tools] Searching ${resourceType} for '${searchQuery}' in project ${metadata.projectId}`,
			);

			let results: any[] = [];
			switch (resourceType as ResourceType) {
				case "route":
					results = await dbService.findRoutes(metadata.projectId, searchQuery);
					break;
				case "app_config":
					results = await dbService.findAppConfigs(
						metadata.projectId,
						searchQuery,
					);
					break;
				case "integration":
					results = await dbService.findIntegrations(
						metadata.projectId,
						searchQuery,
					);
					break;
				case "custom_block":
					results = await dbService.findCustomBlocks(
						metadata.projectId,
						searchQuery,
					);
					break;
			}

			if (!results || results.length === 0) {
				return "No resources found.";
			}

			// Format as Markdown table
			const keys = Object.keys(results[0]);
			const header = `| ${keys.join(" | ")} |\n| ${keys.map(() => "---").join(" | ")} |`;
			const rows = results.map(row => 
				`| ${keys.map(key => String(row[key] ?? "").replace(/\|/g, "\\|").replace(/\n/g, " ")).join(" | ")} |`
			).join("\n");

			return `${header}\n${rows}`;
		},
		{
			name: "find_resource",
			description:
				"Search the production database for existing resources (routes, app configs, integrations, custom blocks) in the user's project.",
			schema: z.object({
				searchQuery: z
					.string()
					.describe("The name, path, or description keyword to search for."),
				resourceType: z
					.enum(["route", "app_config", "integration", "custom_block"])
					.describe("The type of resource to search for."),
			}),
		},
	);
};
