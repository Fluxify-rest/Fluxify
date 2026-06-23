import z from "zod";
import { httpClient } from "@/lib/http";
import {
	requestQuerySchema,
	responseSchema as getResponseSchema,
} from "@fluxify/server/src/api/v1/messages/get-by-route-id/dto";
import { requestBodySchema } from "@fluxify/server/src/api/v1/messages/post-message/dto";
import { responseSchema as deleteResponseSchema } from "@fluxify/server/src/api/v1/messages/clear-messages/dto";

const baseUrl = `/v1/messages`;

export type GetMessagesQueryType = z.infer<typeof requestQuerySchema>;

export const aiMessagesService = {
	async getByRouteId(
		routeId: string,
		query: GetMessagesQueryType,
	): Promise<any> {
		const filterParams = new URLSearchParams();
		if (query.skip !== undefined)
			filterParams.append("skip", query.skip.toString());
		if (query.limit !== undefined)
			filterParams.append("limit", query.limit.toString());
		const result = await httpClient.get(
			`${baseUrl}/${routeId}?${filterParams.toString()}`,
		);
		return result.data;
	},

	async postMessage(routeId: string, data: z.infer<typeof requestBodySchema>) {
		const result = await httpClient.post(`${baseUrl}/${routeId}`, data);
		return result.data;
	},

	async clearMessages(
		routeId: string,
	): Promise<z.infer<typeof deleteResponseSchema>> {
		const result = await httpClient.delete(`${baseUrl}/${routeId}`);
		return result.data;
	},
};
