import { z } from "zod";
import {
	paginationRequestQuerySchema,
	paginationResponseSchema,
} from "@fluxify/server";

export const routeParamsSchema = z.object({
	conversationId: z.string(),
});

export const queryParamsSchema = z.clone(paginationRequestQuerySchema).extend({
	perPage: z.coerce.number().min(5).max(30).default(20),
});

export const messageSchema = z.object({
	id: z.string(),
	status: z.string().nullable().optional(),
	finalOutput: z.any().nullable().optional(),
	workflowExecutionHistory: z.any().nullable().optional(),
	updatedAt: z.union([z.string(), z.date()]),
});

export const responseSchema = z.object({
	conversation: z.object({
		title: z.string().nullable().optional(),
		createdAt: z.union([z.string(), z.date()]),
		updatedAt: z.union([z.string(), z.date()]),
	}),
	messages: z.array(messageSchema),
	pagination: paginationResponseSchema,
});
