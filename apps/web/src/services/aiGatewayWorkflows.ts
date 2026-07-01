import { z } from "zod";
import { httpClient } from "@/lib/http";
import { postMessageDto } from "@fluxify/ai-gateway";

const baseUrl = "ai/v1/workflows";

export const aiGatewayWorkflowsService = {
	async postMessage(
		query: z.infer<typeof postMessageDto.requestQuerySchema>,
		body: z.infer<typeof postMessageDto.requestBodySchema>,
	): Promise<z.infer<typeof postMessageDto.responseSchema>> {
		const queryParams = new URLSearchParams();
		if (query.location) queryParams.set("location", query.location);
		if (query.routeId) queryParams.set("routeId", query.routeId);
		if (query.projectId) queryParams.set("projectId", query.projectId);

		const result = await httpClient.post(
			`${baseUrl}/post-message?${queryParams.toString()}`,
			body,
		);
		return result.data;
	},

	watchConversation(
		conversationId: string,
		onUpdate: (status: any) => void,
		onError?: (err: Event) => void,
		onComplete?: () => void,
	): () => void {
		const eventSource = new EventSource(
			`/_/admin/api${baseUrl}/${conversationId}/watch`,
		);

		eventSource.onmessage = (event) => {
			try {
				const data = JSON.parse(event.data);
				onUpdate(data);
				if (data.status === "error" || data.status === "completed") {
					eventSource.close();
					if (onComplete) onComplete();
				}
			} catch (e) {
				console.error("Error parsing SSE data", e);
			}
		};

		eventSource.onerror = (err) => {
			if (onError) onError(err);
			eventSource.close();
		};

		// Return a cleanup function
		return () => {
			eventSource.close();
		};
	},
};
