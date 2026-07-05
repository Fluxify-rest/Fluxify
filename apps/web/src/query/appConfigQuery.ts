import { appConfigService } from "@/services/appConfig";
import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { z } from "zod";

type GetAllAppConfigQueryParams = z.infer<
  typeof appConfigService.getAllRequestQuerySchema
>;
type CreateAppConfigBodyParams = z.infer<
  typeof appConfigService.createRequestBodySchema
>;
type UpdateAppConfigBodyParams = z.infer<
  typeof appConfigService.updateRequestBodySchema
>;

export const appConfigQuery = {
  getAll: {
    useQuery(projectId: string, query: GetAllAppConfigQueryParams) {
      return useQuery({
        queryKey: ["app-config", projectId, "list", query],
        queryFn: () => appConfigService.getAll(projectId, query),
        refetchOnWindowFocus: false,
        enabled: !!projectId,
      });
    },
    invalidate(projectId: string, query: GetAllAppConfigQueryParams, queryClient: QueryClient) {
      queryClient.invalidateQueries({
        queryKey: ["app-config", projectId, "list", query],
      });
    },
  },
  getById: {
    useQuery(projectId: string, id: string) {
      return useQuery({
        queryKey: ["app-config", projectId, "getById", id],
        queryFn: () => {
          if (!projectId || !id) {
            return null;
          }
          return appConfigService.getById(projectId, id);
        },
        refetchOnWindowFocus: false,
        enabled: !!projectId && !!id,
      });
    },
    invalidate(projectId: string, id: string, queryClient: QueryClient) {
      queryClient.invalidateQueries({
        queryKey: ["app-config", projectId, "getById", id],
      });
    },
  },
  getKeysList: {
    useQuery(projectId: string, search: string) {
      return useQuery({
        queryKey: ["app-config", projectId, "getKeysList", search],
        queryFn: () => appConfigService.getKeysList(projectId, search),
        refetchOnWindowFocus: false,
        enabled: !!projectId,
      });
    },
    invalidate(projectId: string, search: string, queryClient: QueryClient) {
      queryClient.invalidateQueries({
        queryKey: ["app-config", projectId, "getKeysList", search],
      });
    },
  },
  create: {
    useMutation(projectId: string, queryClient: QueryClient) {
      return useMutation({
        mutationFn: (data: CreateAppConfigBodyParams) =>
          appConfigService.create(projectId, data),
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["app-config", projectId],
          });
        },
      });
    },
  },
  update: {
    useMutation(projectId: string, id: string, queryClient: QueryClient) {
      return useMutation({
        mutationFn: (data: UpdateAppConfigBodyParams) =>
          appConfigService.update(projectId, id, data),
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["app-config", projectId],
          });
        },
      });
    },
  },
  delete: {
    useMutation(projectId: string, queryClient: QueryClient) {
      return useMutation({
        mutationFn: (id: string) => appConfigService.delete(projectId, id),
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["app-config", projectId],
          });
        },
      });
    },
  },
  deleteBulk: {
    useMutation(projectId: string, queryClient: QueryClient) {
      return useMutation({
        mutationFn: (
          data: z.infer<typeof appConfigService.deleteBulkRequestBodySchema>
        ) => appConfigService.deleteBulk(projectId, data),
        onSuccess: () => {
          queryClient.invalidateQueries({
            queryKey: ["app-config", projectId],
          });
        },
      });
    },
  },
};
