import { GraphNode } from "@langchain/langgraph";
import { withRetry } from "../../agentRetry";
import { AgentStateSchema } from "../state";
import z from "zod";
import { blockAiDescriptions } from "@fluxify/blocks";

export const PLANNER_NODE_ID = "planner";

const plannerSchema = z.object({
  status: z.enum(["success", "vague", "impossible"]),
  reasoning: z.string(),
  clarificationQuestion: z.string().nullable(),
  plannedBlockNames: z.array(z.string()).default([]),
});

const blockListStr = blockAiDescriptions
  .map((b) => `- ${b.name}: ${b.description}`)
  .join("\n");

export const PlannerNode: GraphNode<typeof AgentStateSchema> = async (
  state,
) => {
  const { userPrompt, messages, modelFactory, metadata } = state;
  const emptyIntegrationListStr = "No integrations available.";
  const integrationListStr = metadata.integrationsList
    .map((i) => `- ${i.id} | ${i.name} | ${i.group} | ${i.variant}`)
    .join("\n");
  const emptyConfigListStr = "No configs available.";
  const appConfigListStr = metadata.configsList
    .map((c) => `- ${c.name} | ${c.description}`)
    .join("\n");
  const model = modelFactory.createModel();
  const result = await withRetry(
    async (history) => {
      const response = await model.invoke(history);
      return response.content.toString();
    },
    plannerSchema,
    [
      ...messages,
      [
        "system",
        `You are Fluxi, an expert API Architect and Planner for a Low-Code API builder.

<objective>
Analyze the user's request to design a feasible node-based flow. You must select the necessary blocks and verify that the required external resources (Integrations/Configs) exist.
</objective>

<step_by_step_reasoning>
1. **Identify Blocks**: Determine which blocks from <available_resources.blocks> are needed to fulfill the request.
2. **Check Resources**:
   - Does the request require external APIs (e.g., Postgres, OpenAI)? Check <available_resources.integrations>.
   - Does the request require secrets/env vars? Check <available_resources.configs>.
3. **Verify Feasibility**:
   - If specific required Integrations or Configs are missing -> status="impossible".
   - If the request is ambiguous -> status="vague".
   - If all necessary resources exist -> status="success".
</step_by_step_reasoning>

<available_resources>
<blocks>
Name | Description
 ${blockListStr}
</blocks>

<integrations>
ID | Name | Group | Variant
 ${integrationListStr || emptyIntegrationListStr}
</integrations>

<configs>
Name | Description
 ${appConfigListStr || emptyConfigListStr}
</configs>
</available_resources>

<constraints>
1. Output valid JSON ONLY. No markdown fences.
2. Use Block **Names** in the output.
3. Do not invent resources. If a required resource is missing, set status to "impossible".
4. If status is "vague" or "impossible", you MUST provide a helpful clarificationQuestion.
</constraints>

<output_format>
{
"status": "success | vague | impossible",
"reasoning": "string (Explain why the flow is possible or what is missing)",
"clarificationQuestion": "string | null",
"plannedBlockNames": ["string"]
}
</output_format>
`,
      ],
      ["human", userPrompt],
    ],
  );
  if (result) {
    state.buildMode = { plannerOutput: result };
  }
  return state;
};
