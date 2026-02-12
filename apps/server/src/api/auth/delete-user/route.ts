import { zValidator } from "@hono/zod-validator";
import { User } from "better-auth";
import { HonoServer } from "../../../types";
import { requireSystemAdmin } from "../middleware";
import { requestParamsSchema, responseSchema } from "./dto";
import handleRequest from "./service";
import { describeRoute, DescribeRouteOptions, resolver } from "hono-openapi";
import { validationErrorSchema } from "../../../errors/validationError";

const openapiRouteOptions: DescribeRouteOptions = {
  operationId: "auth-delete-user",
  description: "Delete a user",
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
  app.delete(
    "/delete-user/:userId",
    describeRoute(openapiRouteOptions),
    requireSystemAdmin,
    zValidator("param", requestParamsSchema),
    async (c) => {
      const params = c.req.valid("param");
      const user = c.get("user") as User;
      const result = await handleRequest(user, params);

      const response = responseSchema.parse(result);

      return c.json(response);
    },
  );
}
