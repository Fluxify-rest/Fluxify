import { z } from "zod";

export const requestParamSchema = z.object({
	routeId: z.string().describe("The ID of the route"),
});

export const responseSchema = z
	.object({
		id: z.string(),
		messageStage: z.number().nullable(),
		stageData: z.any().nullable(),
	})
	.describe("Status of the latest AI message");
