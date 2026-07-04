import { QueryClient, useMutation } from "@tanstack/react-query";
import { aiGatewayWorkflowsService } from "@/services/aiGatewayWorkflows";
import { z } from "zod";
import { postMessageDto } from "@fluxify/ai-gateway";

type PostMessageParam = z.infer<typeof postMessageDto.requestParamSchema>;
type PostMessageBodyParams = z.infer<typeof postMessageDto.requestBodySchema>;

export const aiGatewayWorkflowsQuery = {
  postMessage: {
    useMutation(queryClient: QueryClient) {
      return useMutation({
        mutationFn: ({ param, body }: { param: PostMessageParam; body: PostMessageBodyParams }) =>
          aiGatewayWorkflowsService.postMessage(param, body),
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
