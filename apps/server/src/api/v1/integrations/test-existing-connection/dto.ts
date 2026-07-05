import { z } from "zod";

export const requestRouteSchema = z.object({
  projectId: z.string(),
  id: z.uuidv7(),
});

export const responseSchema = z.object({
  success: z.boolean(),
  error: z.string().optional(),
});
