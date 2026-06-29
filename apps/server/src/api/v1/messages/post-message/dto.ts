import { z } from "zod";

export const requestParamSchema = z.object({
	routeId: z.string().describe("The ID of the route"),
});

export const requestBodySchema = z.object({
	content: z
		.string()
		.describe("The user prompt or message content to be sent to the AI"),
});

export const responseSchema = z.any().describe("The saved initial AI Message");
