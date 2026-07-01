import { z } from "zod";

export const routeParamsSchema = z.object({
	conversationId: z.string(),
});

export const responseSchema = z.object({
	success: z.boolean(),
	message: z.string().optional(),
});
