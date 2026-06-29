import z from "zod";
import { aiConversationLocationEnum } from "@fluxify/server";

export const routeParamsSchema = z.object({
	projectId: z.string().min(1, "projectId is required"),
});

export const queryParamsSchema = z.object({
	location: aiConversationLocationEnum.optional(),
});

export const listConversationsResponseSchema = z.array(
	z.object({
		id: z.string(),
		title: z.string().nullable().default("New chat"),
		createdAt: z.date().or(z.string()),
		updatedAt: z.date().or(z.string()),
	}),
);
