import { z } from "zod";

export const requestParamSchema = z.object({
	routeId: z.string().describe("The ID of the route"),
});

export const requestQuerySchema = z.object({
	skip: z.coerce
		.number()
		.default(0)
		.optional()
		.describe("Number of items to skip"),
	limit: z.coerce
		.number()
		.default(5)
		.optional()
		.describe("Number of items to limit"),
});

import { createSelectSchema } from "drizzle-zod";
import { aiChatEntity } from "../../../../db/schema";

export const aiChatMessageSchema = createSelectSchema(aiChatEntity);

export const responseSchema = z
	.array(aiChatMessageSchema)
	.describe("List of AI messages");
