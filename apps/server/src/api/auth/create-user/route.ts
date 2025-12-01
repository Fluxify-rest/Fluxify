import { Hono } from "hono";
import { validator } from "hono-openapi";
import handleRequest from "./service";
import { requestBodySchema } from "./dto";
import zodErrorCallbackParser from "../../../middlewares/zodErrorCallbackParser";
import { requireSystemAdmin } from "../middleware";
import { HonoServer } from "../../../types";

export default function (app: HonoServer) {
  app.post(
    "/create-user",
    validator("json", requestBodySchema, zodErrorCallbackParser),
    requireSystemAdmin,
    async (ctx) => {
      const data = ctx.req.valid("json");
      const result = await handleRequest(data);
      return ctx.json(result);
    }
  );
}
