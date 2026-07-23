import z from "zod";

export const addBodySchema = z.object({
	email: z.email(),
});

export const allowlistItemSchema = z.object({
	id: z.string(),
	email: z.string(),
	userId: z.string().nullable(),
	createdAt: z.date().or(z.string()),
	updatedAt: z.date().or(z.string()),
});
