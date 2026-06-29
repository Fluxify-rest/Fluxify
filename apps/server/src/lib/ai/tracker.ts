import { eq } from "drizzle-orm";
import { db } from "../../db";
import { aiChatEntity } from "../../db/schema";
import { publishMessage, CHAN_AI_SSE_PREFIX } from "../../db/redis";
import type z from "zod";
import type {
	BuilderOutputSchema,
	ClassifierOutputSchema,
	DiscussionOutputSchema,
	PlannerOutputSchema,
} from "./schemas";

export type AiChatResponseData = {
	classifierOutput?: z.infer<typeof ClassifierOutputSchema>;
	discussionOutput?: z.infer<typeof DiscussionOutputSchema>;
	plannerOutput?: z.infer<typeof PlannerOutputSchema>;
	builderOutput?: z.infer<typeof BuilderOutputSchema>;
};

export class AiChatTracker {
	constructor(
		public messageId: string,
		public routeId: string,
		public userId: string,
	) {}

	async update(
		stage: number,
		status: "started" | "success" | "error",
		nodeName: string,
		partialResponse?: Partial<AiChatResponseData>,
		error?: string,
	) {
		const updateData: any = {
			messageStage: stage,
		};

		if (partialResponse) {
			updateData.aiResponse = partialResponse;
		}

		if (status === "error") {
			updateData.messageStage = -1; // -1 for error
		}

		await db
			.update(aiChatEntity)
			.set(updateData)
			.where(eq(aiChatEntity.id, this.messageId));

		const channel = `${CHAN_AI_SSE_PREFIX}${this.userId}:${this.routeId}`;

		await publishMessage(channel, {
			messageId: this.messageId,
			routeId: this.routeId,
			userId: this.userId,
			stage,
			status,
			nodeName,
			data: partialResponse,
			error,
		});
	}
}
