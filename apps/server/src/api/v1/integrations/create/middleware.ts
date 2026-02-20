import { Context, Next } from "hono";
import { requestBodySchema } from "./dto";
import z, { ZodType } from "zod";
import { getSchema } from "../helpers";
import { BadRequestError } from "../../../../errors/badRequestError";
import { ValidationError } from "../../../../errors/validationError";
import { mapZodErrorToFieldErrors } from "../../../../lib/errors";

export async function requestBodyValidator(ctx: Context, next: Next) {
  const jsonData = await ctx.req.json();
  const data = integrationConfigValidator(jsonData);
  ctx.set("config", data);
  return next();
}

function integrationConfigValidator(
  jsonData: z.infer<typeof requestBodySchema>,
) {
  const config = jsonData.config;
  let schema: z.ZodType | null = getSchema(jsonData.group, jsonData.variant);
  if (!schema) {
    throw new BadRequestError("Invalid variant");
  }
  const result = schema.safeParse(config);
  if (!result.success) {
    const errors = mapZodErrorToFieldErrors(result.error);
    throw new ValidationError(errors);
  }
  return result.data;
}
