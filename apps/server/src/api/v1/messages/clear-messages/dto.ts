import { z } from "zod";

export const requestParamSchema = z.object({
	routeId: z.string().describe("The ID of the route"),
});

export const responseSchema = z
	.object({
		success: z.boolean(),
	})
	.describe("Operation result");
