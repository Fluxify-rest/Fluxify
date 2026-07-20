import { BaseAgent } from "./base";
import { type GlobalGraphState, AgentNode } from "../types";
import { dispatchAgentEvent } from "../callbacks";
import { blockAiDescriptions } from "@fluxify/blocks";
import { z } from "zod";

function buildBlockCatalogTable(): string {
	const header = "| Block Name | Description |\n| --- | --- |";
	const rows = blockAiDescriptions.map(
		(b) => `| ${b.name} | ${b.description} |`,
	);
	return [header, ...rows].join("\n");
}

const BLOCK_CATALOG_TABLE = buildBlockCatalogTable();

const plannerSchema = z.object({
	markdownPlan: z
		.string()
		.describe(
			"A detailed, clear, and user-friendly markdown plan with numbered task bullets. Do NOT leak implementation details.",
		),
	scratchpadNote: z
		.string()
		.optional()
		.describe(
			"Contextual notes, resource IDs, or warnings to pass to downstream sub-agents.",
		),
	confidenceScore: z
		.number()
		.min(1)
		.max(5)
		.describe(
			"Confidence score (1-5) that builder sub-agents can implement this without human reviews.",
		),
	implementationComplexity: z
		.enum(["high", "mid", "low"])
		.describe(
			"Complexity of the system if AI builds it without human reviews.",
		),
});

export class PlannerAgent extends BaseAgent {
	constructor(state: GlobalGraphState) {
		super(state);
	}

	async execute(): Promise<Partial<GlobalGraphState>> {
		await dispatchAgentEvent({
			name: "agent_status",
			data: {
				status: "generating plan",
				agent: AgentNode.PLANNER,
			},
		});

		const scratchPadText = this.state.scratchpad?.length
			? `\n\n## Context / Scratch Pad from Previous Agents\nHere is information gathered from previous steps:\n${this.state.scratchpad.map((s) => `- ${s}`).join("\n")}`
			: "";

		const systemPrompt = `You are the Expert Planner Agent for Fluxify — a No/Low-Code Backend Engine.
Fluxify allows users to build, deploy, and scale APIs visually without writing boilerplate code. It uses a visual graph where "Blocks" (units of logic like DB fetching, AI generation, or JS VM execution) are connected by "Edges" (defining direct flow, decision paths, and error handling paths).

## Your Responsibility
Your task is to analyze the user's request, read existing documentation/context, and create a highly detailed, user-friendly markdown plan. The user will review this plan. If approved, the orchestrator and builder sub-agents will execute it.
If the user provides feedback or reviews an existing plan, you must modify and update the plan to incorporate their changes fully while adhering to all platform constraints.

## Platform Capabilities & Constraints
- **REST only**: Pure request/response model. No file uploads, WebSockets, or streaming.
- **Block-based logic**: API routes and custom blocks are built using a directed acyclic graph of blocks.
- **No arbitrary code**: You must use the available blocks. (The JS Runner block can be used for inline logic).

## Available Blocks
${BLOCK_CATALOG_TABLE}

## External Dependencies
Some blocks (like DB or AI blocks) require an **integration ID**.
Other blocks may require secrets from **app configs**.
- If an integration/config is missing based on context, DO NOT reject the request. Instead, add a prominent warning in your \`markdownPlan\` stating that the user must create it.

## Output Instructions
1. **Markdown Plan (\`markdownPlan\`)**: Create a crystal clear, user-perspective markdown plan.
   - For each task, explain WHAT will change (e.g., "Create a new 'getUser' route", "Add authentication").
   - **Format Rules**: Use minimal markdown features. Use mostly headings, plain text, and bullet points. Use blockquotes, bolding, italic, or underlines for important hints. Use tables ONLY if strictly necessary. DO NOT use hyperlinks.
   - Group tasks logically under section headers.
   - **Crucial:** Keep it crystal clear for the user. DO NOT leak internal implementation details (e.g., "I will use a DbQueryBlock with ID xyz"). Describe the behavior and architecture from a user's perspective.
   - Flag any missing dependencies clearly as warnings.
2. **Scratchpad (\`scratchpadNote\`)**: Accumulate all resource lookup results (IDs, names), internal reasoning, and technical implementation details into the \`scratchpadNote\`. This is appended to the next agent's prompt so they don't have to re-search and know exactly what blocks to use.
3. **Confidence Score (\`confidenceScore\`)**: 1-5 score indicating if sub-agents can build this without human reviews.
4. **Implementation Complexity (\`implementationComplexity\`)**: 'high', 'mid', or 'low' based on how complex the system becomes if AI builds it without human reviews.
5. **Handling Reviews**: If the user is reviewing a plan (check message history), address their concerns and regenerate the plan accordingly.

Plan carefully, thoroughly, and output excellent English craft for the user's plan.${scratchPadText}`;

		const response = (await this.state.agentWrapper.invokeAgent({
			zodSchema: plannerSchema,
			systemPrompt,
			messages: this.state.messages,
			userQuery: this.state.userQuery,
		})) as z.infer<typeof plannerSchema>;

		const requiresHITL =
			(response.confidenceScore < 4 &&
				response.implementationComplexity === "high") ||
			(response.confidenceScore > 4 &&
				response.implementationComplexity !== "high");

		// Halting the workflow loop to wait for user review (HITL) via nextRoute
		if (requiresHITL) {
			await dispatchAgentEvent({
				name: "human_in_the_loop_required",
				data: {
					agent: "planner",
					reason: "plan_review",
					data: response,
				},
			});
		}

		await dispatchAgentEvent({
			name: "agent_status",
			data: {
				status: "Plan generated",
				agent: AgentNode.PLANNER,
				data: response,
			},
		});

		return {
			currentAgent: AgentNode.PLANNER,
			nextRoute: requiresHITL
				? AgentNode.HUMAN_IN_THE_LOOP
				: AgentNode.ORCHESTRATOR,
			plannerState: {
				markdownPlan: response.markdownPlan,
				confidenceScore: response.confidenceScore,
				implementationComplexity: response.implementationComplexity,
			},
			scratchpad: response.scratchpadNote ? [response.scratchpadNote] : [],
		};
	}
}
