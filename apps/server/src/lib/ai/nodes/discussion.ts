import { GraphNode } from "@langchain/langgraph";
import { AgentStateSchema } from "../state";
import { DiscussionOutputSchema } from "../schemas";
import { withRetry } from "../../agentRetry";
import { searchDocsTool, readDocsContentTool } from "../tools/docs";

export const DISCUSSION_NODE_ID = "discussion";

export const DiscussionNode: GraphNode<typeof AgentStateSchema> = async (
  state,
) => {
  const { userPrompt, messages, modelFactory } = state;
  const model = modelFactory.createModel();
  model.bindTools([searchDocsTool, readDocsContentTool]);
  const result = await withRetry(
    async (history) => {
      const response = await model.invoke(history);
      return response.content.toString();
    },
    DiscussionOutputSchema,
    [
      ...messages,
      [
        "system",
        `You are Fluxi, a helpful Discussion Agent for Fluxify.
  
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
</output_format>`,
      ],
      ["human", userPrompt],
    ],
  );
  if (result) {
    state.discussionMode = result;
  }
  return state;
};
