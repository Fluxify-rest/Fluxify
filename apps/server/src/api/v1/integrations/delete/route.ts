import { Hono } from "hono";
import {
  describeRoute,
  DescribeRouteOptions,
  resolver,
  validator,
} from "hono-openapi";
import handleRequest from "./service";
import { requestRouteSchema } from "./dto";
import { errorSchema } from "../../../../errors/customError";
import zodErrorCallbackParser from "../../../../middlewares/zodErrorCallbackParser";
import { HonoServer } from "../../../../types";
import { requireProjectAccess } from "../../../auth/middleware";

const openapiRouteOptions: DescribeRouteOptions = {
  description: "Delete an integration",
  operationId: "delete-integration",
  tags: ["Integrations"],
  responses: {
    204: {
      description: "No Content",
    },
    404: {
      description: "Integration not found",
      content: {
        "application/json": {
          schema: resolver(errorSchema),
        },
      },
    },
  },
};

export default function (app: HonoServer) {
  app.delete(
    "/:id",
    describeRoute(openapiRouteOptions),
    requireProjectAccess("creator", { key: "projectId", source: "param" }),
    validator("param", requestRouteSchema, zodErrorCallbackParser),
    async (c) => {
      const { projectId, id } = c.req.valid("param");
      await handleRequest(projectId, id);
      return c.body(null, 204);
    }
  );
}
