import { describeRoute, DescribeRouteOptions, resolver, validator } from "hono-openapi";
import zodErrorCallbackParser from "../../../../middlewares/zodErrorCallbackParser";
import { requestBodySchema, requestParamSchema, responseSchema } from "./dto";
import { errorSchema } from "../../../../errors/customError";
import handleRequest from "./service";
import { validationErrorSchema } from "../../../../errors/validationError";
import { HonoServer } from "../../../../types";
import { requireLoggedIn } from "../../../auth/middleware";

const openapiRouteOptions: DescribeRouteOptions = {
  description: "Updates an existing custom block",
  operationId: "update-custom-block",
  tags: ["Custom Blocks"],
  responses: {
    200: {
      description: "Successful",
      content: { "application/json": { schema: resolver(responseSchema) } },
    },
    400: {
      description: "Invalid data",
      content: { "application/json": { schema: resolver(validationErrorSchema) } },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: resolver(errorSchema) } },
    },
    409: {
      description: "Duplicate name",
      content: { "application/json": { schema: resolver(errorSchema) } },
    },
  },
};

export default function (app: HonoServer) {
  app.put(
    "/:id",
    describeRoute(openapiRouteOptions),
    requireLoggedIn(),
    validator("param", requestParamSchema, zodErrorCallbackParser),
    validator("json", requestBodySchema, zodErrorCallbackParser),
    async (ctx) => {
      const { id } = ctx.req.valid("param");
      const data = ctx.req.valid("json");
      const user = ctx.get("user") as any;
      const acl = ctx.get("acl") || [];
      const result = await handleRequest(id, data, user, acl);
      return ctx.json(result);
    }
  );
}
