import { tool } from "langchain";
import z from "zod";
import { docsSearch } from "../../docs";
import { ToolsContext } from "../schemas";

export const searchDocsTool = tool(
  async ({ query }: { query: string }, config: { context: ToolsContext }) => {
    config.context.toolCalls.add(searchDocsTool.name);
    const results = docsSearch.search(query).map((doc) => ({
      id: doc.id,
      title: doc.title,
      description: doc.description,
    }));
    return `ID | Title | Description
${results.map((doc) => `${doc.id} | ${doc.title} | ${doc.description}`).join("\n")}
`;
  },
  {
    name: "search_docs",
    description:
      "Search the documentation library for relevant pages. Returns a list of page titles and IDs.",
    schema: z.object({
      query: z.string().describe("The search query, e.g., 'javascript logic'"),
    }),
  },
);

export const readDocsContentTool = tool(
  async ({ id }: { id: number }, config: { context: ToolsContext }) => {
    config.context.toolCalls.add(readDocsContentTool.name);
    const content = docsSearch.getById(id)?.content;
    return content || "ERROR: Document content not found.";
  },
  {
    name: "read_document_content",
    description:
      "Retrieve the full markdown content of a specific documentation page by its ID.",
    schema: z.object({
      id: z
        .number()
        .describe("The ID of the document retrieved from search_docs"),
    }),
  },
);
