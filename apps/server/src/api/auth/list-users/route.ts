import { validator } from "hono-openapi";
import handleRequest from "./service";
import { requestBodySchema, responseSchema } from "./dto";
import zodErrorCallbackParser from "../../../middlewares/zodErrorCallbackParser";
import { requireRoleAccess } from "../middleware";
import { HonoServer } from "../../../types";
import { describeRoute, DescribeRouteOptions, resolver } from "hono-openapi";
import { validationErrorSchema } from "../../../errors/validationError";

const openapiRouteOptions: DescribeRouteOptions = {
  operationId: "auth-list-users",
  description: "List all users",
  tags: ["Auth"],
  responses: {
    200: {
      description: "Successful",
      content: { "application/json": { schema: resolver(responseSchema) } },
    },
    400: {
      description: "Validation error",
      content: {
        "application/json": { schema: resolver(validationErrorSchema) },
      },
    },
  },
};

export default function (app: HonoServer) {
  app.get(
    "/list-users",
    describeRoute(openapiRouteOptions),
    validator("query", requestBodySchema, zodErrorCallbackParser),
    requireRoleAccess("viewer"),
    async (ctx) => {
      const query = ctx.req.valid("query");
      const result = await handleRequest(query);
      return ctx.json(result);
    },
  );
}
