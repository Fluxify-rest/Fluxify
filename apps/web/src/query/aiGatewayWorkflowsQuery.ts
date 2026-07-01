import { QueryClient, useMutation } from "@tanstack/react-query";
import { aiGatewayWorkflowsService } from "@/services/aiGatewayWorkflows";
import { z } from "zod";
import { postMessageDto } from "@fluxify/ai-gateway";

type PostMessageQueryParams = z.infer<typeof postMessageDto.requestQuerySchema>;
type PostMessageBodyParams = z.infer<typeof postMessageDto.requestBodySchema>;

export const aiGatewayWorkflowsQuery = {
  postMessage: {
    useMutation(queryClient: QueryClient) {
      return useMutation({
        mutationFn: ({ query, body }: { query: PostMessageQueryParams; body: PostMessageBodyParams }) =>
          aiGatewayWorkflowsService.postMessage(query, body),
        onSuccess: (data) => {
          // If we know the conversation ID, we can invalidate its messages
          if (data && data.conversationId) {
            queryClient.invalidateQueries({
              queryKey: ["ai-conversations", "listMessages", data.conversationId],
            });
          }
        },
      });
    },
  },
};
