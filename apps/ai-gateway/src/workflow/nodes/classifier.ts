import { BaseNode } from "../../ai";
import type {
	NodeResult,
	ModelFactory,
	WorkflowMetadata,
	WorkflowContext,
} from "../../ai/types";
import { type ModelMessage, type LanguageModel, Output } from "ai";
import { logger } from "@fluxify/common";
import z from "zod";

const classifierSchema = z.object({
	status: z.boolean(),
	reasoning: z.string().default(""),
	data: z.enum(["discussion", "builder"]).optional(),
});

export interface ClassifierParams {
	query: string;
	messageHistory?: ModelMessage[];
	model: LanguageModel; // Required to execute the underlying model
}

export interface ClassifierResult extends NodeResult {
	nextNodeId?: "discussion" | "builder";
	reasoning?: string;
	route?: "discussion" | "builder" | "reject";
	// Forwarded data for the next node in the workflow chain
	query?: string;
	messageHistory?: ModelMessage[];
	model?: LanguageModel;
	metadata?: WorkflowMetadata;
	tokenUsage: {
		input: number;
		output: number;
	};
}

export class ClassifierNode extends BaseNode<
	ClassifierParams,
	ClassifierResult
> {
	constructor(modelFactory: ModelFactory) {
		super("classifier", modelFactory);
	}

	async execute(
		params: ClassifierParams,
		context: WorkflowContext,
	): Promise<ClassifierResult> {
		const { query, messageHistory = [], model } = params;

		try {
			const response = await this.callModel(
				{
					model,
					messages: [...messageHistory, { role: "user", content: query }],
					output: Output.object({
						schema: classifierSchema,
					}),
					tools: {}, // need to override tools to avoid auto-injection of workflow tools
					instructions: `You are the primary Router and Classifier Agent for Fluxify - The Open-Source No-Code REST API builder platform.
Your critical responsibility is to analyze the user's incoming query and decide the absolute best agent to handle the request.
About Fluxify:
- Fluxify allows users to build backend logic without writing code via a visual workflow builder.
- Users drag and drop blocks (e.g., Entrypoint, HTTP Requests, Databases, LLMs) to design business logic.
- Connects to databases like PostgreSQL, integrates with AI models, and supports JavaScript scripting.

Available routes:
1. "discussion": Select this route IF AND ONLY IF the user is asking general questions about the application, documentation, available blocks, requesting an explanation of their current route, or just saying a general greeting.
2. "builder": Select this route IF AND ONLY IF the user explicitly wants to build a new API route from the ground up, or modify an existing graph.
3. "reject": Select this route IF the user query is completely unrelated to the platform, contains inappropriate content, OR if the query is too ambiguous or empty to classify.

CRITICAL INSTRUCTIONS:
- You must carefully analyze the query semantics to determine if the user wants to discuss/learn/greet (discussion) or build/modify (builder).
- If the query lacks sufficient detail to determine a route, documentation or any query renated to *available routes* requirements, you MUST set status to false and provide meaningful reason in reasoning field. Fail early rather than guessing.
- You MUST set status to true and **exactly ONE word** from the available routes: "discussion", "builder" or undefined to data field. 
`,
				},
				context,
			);

			const { status, reasoning, data: route } = response.output;
			if (!status) {
				logger.warn("[ClassifierNode] Query rejected by classifier", {
					reasoning,
				});
				return {
					status: "failure", // Stops the workflow
					route,
					reasoning,
					tokenUsage: {
						input: response.usage.inputTokens || 0,
						output: response.usage.outputTokens || 0,
					},
				};
			}

			return {
				status: "success",
				nextNodeId: route, // "discussion" or "builder"
				route,
				reasoning,
				// Forward data so the next node in the runLoop receives it as params
				query,
				messageHistory,
				model,
				metadata: context.metadata,
				tokenUsage: {
					input: response.usage.inputTokens || 0,
					output: response.usage.outputTokens || 0,
				},
			};
		} catch (error) {
			logger.error("[ClassifierNode] Error during execution", { error });
			return {
				status: "failure",
				tokenUsage: {
					input: 0,
					output: 0,
				},
			};
		}
	}
}
