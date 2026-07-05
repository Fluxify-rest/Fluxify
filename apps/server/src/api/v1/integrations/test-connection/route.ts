import { Hono } from "hono";
import {
  describeRoute,
  DescribeRouteOptions,
  resolver,
  validator,
} from "hono-openapi";
import { requestBodySchema, requestRouteSchema, responseSchema } from "./dto";
import handleRequest from "./service";
import zodErrorCallbackParser from "../../../../middlewares/zodErrorCallbackParser";
import { HonoServer } from "../../../../types";
import { requireProjectAccess } from "../../../auth/middleware";

const openapiRouteOptions: DescribeRouteOptions = {
  description: "Test integration connection",
  operationId: "test-connection",
  tags: ["Integrations"],
  responses: {
    200: {
      description: "Successful",
      content: {
        "application/json": {
          schema: resolver(responseSchema),
        },
      },
    },
  },
};

export default function (app: HonoServer) {
  app.post(
    "/test-connection",
    describeRoute(openapiRouteOptions),
    requireProjectAccess("creator", { key: "projectId", source: "param" }),
    validator("param", requestRouteSchema, zodErrorCallbackParser),
    validator("json", requestBodySchema, zodErrorCallbackParser),
    async (c) => {
      const { projectId } = c.req.valid("param");
      const body = c.req.valid("json");
      const result = await handleRequest(projectId, body);
      return c.json(result, result.success ? 200 : 400);
    }
  );
}
