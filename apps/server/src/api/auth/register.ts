import { Hono } from "hono";
import { auth } from "../../lib/auth";
import createAuthUserRoute from "./create-user/route";
import { HonoServer } from "../../types";

export default {
  name: "authentication",
  registerHandler(app: HonoServer) {
    const router = app.basePath("/_/admin/api/auth");
    createAuthUserRoute(router);
    app.on(["GET", "POST"], "/_/admin/api/auth/*", (c) =>
      auth.handler(c.req.raw)
    );
  },
};
