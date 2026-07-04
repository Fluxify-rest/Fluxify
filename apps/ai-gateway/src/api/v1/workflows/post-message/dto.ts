import { z } from "zod";

export const responseSchema = z.object({
	conversationId: z.string(),
	status: z.enum(["queued", "failed"]),
	reason: z.string().optional(),
});

export const requestBodySchema = z.object({
	userQuery: z.string(),
});

export const requestParamSchema = z.object({
	conversationId: z.string(),
});
