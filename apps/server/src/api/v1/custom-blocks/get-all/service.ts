import z from "zod";
import { requestQuerySchema, responseSchema } from "./dto";
import { getCustomBlocks } from "./repository";

export default async function handleRequest(
  query: z.infer<typeof requestQuerySchema>
): Promise<z.infer<typeof responseSchema>> {
  const blocks = await getCustomBlocks(query.projectId);
  return blocks.map((block) => ({
    id: block.id,
    title: block.label,
    name: block.name,
    icon: block.icon,
    iconUrl: block.iconUrl,
    inputType: block.inputParams,
  }));
}
