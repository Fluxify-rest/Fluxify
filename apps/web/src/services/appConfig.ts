import z from "zod";
import {
  requestQuerySchema as getAllRequestQuerySchema,
  responseSchema as getAllResponseSchema,
} from "@fluxify/server/src/api/v1/app-config/get-all/dto";
import {
  requestBodySchema as createRequestBodySchema,
  responseSchema as createResponseSchema,
} from "@fluxify/server/src/api/v1/app-config/create/dto";
import {
  requestBodySchema as updateRequestBodySchema,
  responseSchema as updateResponseSchema,
} from "@fluxify/server/src/api/v1/app-config/update/dto";
import { responseSchema as getOneResponseSchema } from "@fluxify/server/src/api/v1/app-config/get-by-id/dto";
import { httpClient } from "@/lib/http";
import {
  requestBodySchema as deleteBulkRequestBodySchema,
  responseSchema as deleteBulkResponseSchema,
} from "@fluxify/server/src/api/v1/app-config/delete-bulk/dto";

const baseUrl = "/v1/app-config";

export const appConfigService = {
  async getAll(
    query: z.infer<typeof getAllRequestQuerySchema>
  ): Promise<z.infer<typeof getAllResponseSchema>> {
    const { data, success } = getAllRequestQuerySchema.safeParse(query);
    if (!success) {
      throw new Error("Invalid query params for getAll appConfig");
    }
    const queryParams = new URLSearchParams();
    if (query?.page) {
      queryParams.set("page", query.page.toString());
    }
    if (query?.perPage) {
      queryParams.set("perPage", query.perPage.toString());
    }
    if (query?.search) {
      queryParams.set("search", query.search);
    }
    if (query?.sortBy) {
      queryParams.set("sortBy", query.sortBy);
    }
    if (query?.sort) {
      queryParams.set("sort", query.sort);
    }
    const url = `${baseUrl}/list?${queryParams.toString()}`;
    const result = await httpClient.get(url);
    return result.data;
  },
  async create(
    body: z.infer<typeof createRequestBodySchema>
  ): Promise<z.infer<typeof createResponseSchema>> {
    const result = await httpClient.post(baseUrl, body);
    return result.data;
  },
  async update(
    id: string,
    body: z.infer<typeof updateRequestBodySchema>
  ): Promise<z.infer<typeof updateResponseSchema>> {
    const result = await httpClient.put(`${baseUrl}/${id}`, body);
    return result.data;
  },
  async delete(id: string): Promise<void> {
    const result = await httpClient.delete(`${baseUrl}/${id}`);
    return result.data;
  },
  async getById(id: string): Promise<z.infer<typeof getOneResponseSchema>> {
    const result = await httpClient.get(`${baseUrl}/${id}`);
    return result.data;
  },
  async deleteBulk(
    body: z.infer<typeof deleteBulkRequestBodySchema>
  ): Promise<z.infer<typeof deleteBulkResponseSchema>> {
    const result = await httpClient.post(`${baseUrl}/delete-bulk`, body);
    return result.data;
  },
  async getKeysList(search: string): Promise<string[]> {
    const queryParams = new URLSearchParams();
    if (search) {
      queryParams.set("search", search);
    }
    const url = `${baseUrl}/keys?${queryParams.toString()}`;
    const result = await httpClient.get(url);
    return result.data;
  },
  deleteBulkRequestBodySchema,
  createRequestBodySchema,
  updateRequestBodySchema,
  getAllRequestQuerySchema,
  getAllResponseSchema,
};
