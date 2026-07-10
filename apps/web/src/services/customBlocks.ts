import z from "zod";
import {
  requestQuerySchema as getAllRequestQuerySchema,
  responseSchema as getAllResponseSchema,
} from "@fluxify/server/src/api/v1/custom-blocks/get-all/dto";
import {
  requestBodySchema as createRequestSchema,
  responseSchema as createResponseSchema,
} from "@fluxify/server/src/api/v1/custom-blocks/create/dto";
import {
  requestBodySchema as updateRequestSchema,
  responseSchema as updateResponseSchema,
} from "@fluxify/server/src/api/v1/custom-blocks/update/dto";
import { responseSchema as getByIdResponseSchema } from "@fluxify/server/src/api/v1/custom-blocks/get-by-id/dto";
import { httpClient } from "@/lib/http";

const baseUrl = `/v1/custom-blocks`;

export type GetAllCustomBlocksQueryType = z.infer<
  typeof getAllRequestQuerySchema
>;

export const customBlocksService = {
  async getAll(
    query: GetAllCustomBlocksQueryType
  ): Promise<z.infer<typeof getAllResponseSchema>> {
    const result = await httpClient.get(
      `${baseUrl}/list?projectId=${query.projectId}`
    );
    return result.data;
  },
  async getByID(id: string): Promise<z.infer<typeof getByIdResponseSchema>> {
    const result = await httpClient.get(`${baseUrl}/${id}`);
    return result.data;
  },
  async create(
    data: z.infer<typeof createRequestSchema>
  ): Promise<z.infer<typeof createResponseSchema>> {
    const result = await httpClient.post(`${baseUrl}`, data);
    return result.data;
  },
  async update(
    id: string,
    data: z.infer<typeof updateRequestSchema>
  ): Promise<z.infer<typeof updateResponseSchema>> {
    const result = await httpClient.put(`${baseUrl}/${id}`, data);
    return result.data;
  },
  async delete(id: string) {
    await httpClient.delete(`${baseUrl}/${id}`);
  },
  // zod schemas
  createRequestSchema,
  updateRequestSchema,
};
