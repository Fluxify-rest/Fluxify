import { z } from "zod";

export const responseSchema = z.object({});

export const requestBodySchema = z.object({});

export const requestRouteSchema = z.object({
	conversationId: z.uuid(),
});
