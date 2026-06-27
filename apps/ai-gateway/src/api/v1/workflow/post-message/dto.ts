import { z } from "zod";

export const responseSchema = z.object({
	conversationId: z.string(),
	status: z.enum(["queued", "failed"]),
	reason: z.string().optional(),
});

export const requestBodySchema = z.object({
	userQuery: z.string(),
});

export const requestQuerySchema = z.object({
	location: z.enum(["canvas", "project", "integrations", "appconfig"]),
	routeId: z.uuid().optional(), // Only if canvas
	projectId: z.uuid().optional(), // Only if project routes list page
});
