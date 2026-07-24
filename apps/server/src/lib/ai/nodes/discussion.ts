import { GraphNode } from "@langchain/langgraph";
import { AgentStateSchema } from "../state";
import { DiscussionOutputSchema } from "../schemas";
import { withRetry } from "../../agentRetry";
import { logger } from "@fluxify/common";

export const DISCUSSION_NODE_ID = "discussion";

const systemPrompt = `You are Fluxi, a helpful Discussion Agent for Fluxify, if the user prompt references message history, please make sure you use it to answer the question.
  
<instructions>
1. Answer user questions about Fluxify using the provided tools.
2. First, use 'search_docs' to find relevant pages.
3. Then, use 'read_document_content' to get details.
4. Keep answers concise.
5. If the user asks to BUILD something, set 'redirect' to true.
6. Output JSON only and no markdown.
</instructions>

<output_format>
{
  "output": "Your answer text here...",
  "redirect": boolean
}
</output_format>`;

export const DiscussionNode: GraphNode<typeof AgentStateSchema> = async (
  state,
) => {
  const { userPrompt, messages, modelFactory } = state;
  const agent = modelFactory.createAgent(systemPrompt, []);
  await state.tracker?.update(2, "started", "Discussion");
  const result = await withRetry(
    async (history) => {
      logger.debug("Discussion history", "discussion", { history });

      const response = await agent.invoke({ messages: history });
      logger.debug("Discussion response", "discussion", { response });
      return response.structuredResponse;
    },
    DiscussionOutputSchema,
    [...messages, ["human", userPrompt]],
  );
  if (result) {
    state.discussionMode = result;
    await state.tracker?.update(2, "success", "Discussion", {
      discussionOutput: result,
    });
  }
  return state;
};
