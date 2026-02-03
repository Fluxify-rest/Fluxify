import { operatorSchema } from "@fluxify/lib";
import z from "zod";

export const whereConditionSchema = z.object({
  attribute: z.string().describe("column name / attribute name"),
  operator: operatorSchema
    .exclude(["js", "is_empty", "is_not_empty"])
    .describe("operator for comparison"),
  value: z.string().or(z.number()).describe("value"),
  chain: z.enum(["and", "or"]).describe("conditional chain"),
});
