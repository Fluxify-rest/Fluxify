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
import { errorSchema } from "../../../../errors/customError";
import { validationErrorSchema } from "../../../../errors/validationError";
import { HonoServer } from "../../../../types";
import { requireProjectAccess } from "../../../auth/middleware";

const openapiRouteOptions: DescribeRouteOptions = {
  description: "Create app config",
  operationId: "create-app-config",
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
    400: {
      description: "Validation Error",
      content: {
        "application/json": {
          schema: resolver(validationErrorSchema),
        },
      },
    },
    409: {
      description: "Key already exists",
      content: {
        "application/json": {
          schema: resolver(errorSchema),
        },
      },
    },
    500: {
      description: "Internal Server Error",
      content: {
        "application/json": {
          schema: resolver(errorSchema),
        },
      },
    },
  },
};

export default function (app: HonoServer) {
  app.post(
    "/",
    describeRoute(openapiRouteOptions),
    requireProjectAccess("creator", { key: "projectId", source: "param" }),
    validator("param", requestRouteSchema, zodErrorCallbackParser),
    validator("json", requestBodySchema, zodErrorCallbackParser),
    async (c) => {
      const { projectId } = c.req.valid("param");
      const body = c.req.valid("json");
      const result = await handleRequest(projectId, body);
      return c.json(result);
    }
  );
}
