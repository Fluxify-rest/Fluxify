import { z } from "zod";

export const requestRouteSchema = z.object({
	projectId: z.string(),
});

export const responseSchema = z.array(
	z.object({
		id: z.string(),
		name: z.string(),
		group: z.string(),
		variant: z.string(),
	}),
);
