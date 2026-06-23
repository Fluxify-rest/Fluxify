import { GetMessagesQueryType, aiMessagesService } from "@/services/aiMessages";
import { QueryClient, useQuery, useMutation } from "@tanstack/react-query";

export const aiMessagesQueries = {
	getByRouteId: {
		useQuery(routeId: string, query: GetMessagesQueryType) {
			return useQuery({
				queryKey: ["aiMessages", routeId, JSON.stringify(query)],
				queryFn: async () => {
					return await aiMessagesService.getByRouteId(routeId, query);
				},
				refetchOnWindowFocus: false,
			});
		},
		useMutation(client: QueryClient) {
			return useMutation({
				mutationFn: async ({
					routeId,
					data,
				}: {
					routeId: string;
					data: { content: string };
				}) => {
					return await aiMessagesService.postMessage(routeId, data);
				},
			});
		},
		invalidate(client: QueryClient, routeId: string) {
			return client.invalidateQueries({
				queryKey: ["aiMessages", routeId],
				exact: false,
			});
		},
	},
	clearMessages: {
		useMutation(client: QueryClient) {
			return useMutation({
				mutationFn: async (routeId: string) => {
					return await aiMessagesService.clearMessages(routeId);
				},
				onSuccess: (_, routeId) => {
					aiMessagesQueries.getByRouteId.invalidate(client, routeId);
				},
			});
		},
	},
};
