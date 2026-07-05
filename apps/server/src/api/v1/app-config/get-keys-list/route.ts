import { Hono } from "hono";
import {
  describeRoute,
  DescribeRouteOptions,
  resolver,
  validator,
} from "hono-openapi";
import { requestQuerySchema, requestRouteSchema, responseSchema } from "./dto";
import handleRequest from "./service";
import zodErrorCallbackParser from "../../../../middlewares/zodErrorCallbackParser";
import { HonoServer } from "../../../../types";
import { requireProjectAccess } from "../../../auth/middleware";

const openapiRouteOptions: DescribeRouteOptions = {
  description: "Get list of app config keys",
  operationId: "get-keys-list",
  tags: ["App Config"],
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
  app.get(
    "/keys",
    describeRoute(openapiRouteOptions),
    requireProjectAccess("creator", { key: "projectId", source: "param" }),
    validator("param", requestRouteSchema, zodErrorCallbackParser),
    validator("query", requestQuerySchema, zodErrorCallbackParser),
    async (c) => {
      const { projectId } = c.req.valid("param");
      const { search } = c.req.valid("query");
      const keys = await handleRequest(projectId, search);
      return c.json(keys);
    }
  );
}
