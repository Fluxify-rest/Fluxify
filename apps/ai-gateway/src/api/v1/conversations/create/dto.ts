import { z } from "zod";
import { aiConversationLocationEnum } from "@fluxify/server";

export const queryParamsSchema = z.object({
	location: aiConversationLocationEnum,
	routeId: z.string().optional(),
});

export const requestBodySchema = z.object({
	title: z.string().optional(),
	projectId: z.string().optional(),
	startWorkflow: z.boolean().default(false),
	initialUserQuery: z.string().optional(),
});

export const responseSchema = z.object({
	id: z.string(),
});

export type CreateConversationQuery = z.infer<typeof queryParamsSchema>;
export type CreateConversationBody = z.infer<typeof requestBodySchema>;
export type CreateConversationResponse = z.infer<typeof responseSchema>;
