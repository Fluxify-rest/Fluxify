import {
  describeRoute,
  DescribeRouteOptions,
  resolver,
  validator,
} from "hono-openapi";
import zodErrorCallbackParser from "../../../../middlewares/zodErrorCallbackParser";
import { requestParamSchema, responseSchema } from "./dto";
import { validationErrorSchema } from "../../../../errors/validationError";
import { errorSchema } from "../../../../errors/customError";
import handleRequest from "./service";
import { HonoServer } from "../../../../types";
import { requireLoggedIn } from "../../../auth/middleware";

const openapiRouteOptions: DescribeRouteOptions = {
  description: "Returns a custom block by id",
  operationId: "get-custom-block-by-id",
  tags: ["Custom Blocks"],
  responses: {
    200: {
      description: "Successful",
      content: { "application/json": { schema: resolver(responseSchema) } },
    },
    400: {
      description: "Invalid id",
      content: {
        "application/json": { schema: resolver(validationErrorSchema) },
      },
    },
    404: {
      description: "Not found",
      content: { "application/json": { schema: resolver(errorSchema) } },
    },
  },
};

export default function (app: HonoServer) {
  app.get(
    "/:id",
    describeRoute(openapiRouteOptions),
    requireLoggedIn(),
    validator("param", requestParamSchema, zodErrorCallbackParser),
    async (ctx) => {
      const { id } = ctx.req.valid("param");
      const user = ctx.get("user") as any;
      const acl = ctx.get("acl") || [];
      const result = await handleRequest(id, user, acl);
      return ctx.json(result);
    }
  );
}
