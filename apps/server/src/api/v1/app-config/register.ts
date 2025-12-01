import { Hono } from "hono";
import registerGetAllRoute from "./get-all/route";
import registerGetByIdRoute from "./get-by-id/route";
import registerCreateRoute from "./create/route";
import registerUpdateRoute from "./update/route";
import registerDeleteRoute from "./delete/route";
import registerDeleteBulkRoute from "./delete-bulk/route";
import registerGetKeysListRoute from "./get-keys-list/route";
import { HonoServer } from "../../../types";

export default {
  name: "app-config",
  registerHandler(app: HonoServer) {
    const router = app.basePath("/app-config");
    registerGetAllRoute(router);
    registerGetKeysListRoute(router);
    registerCreateRoute(router);
    registerUpdateRoute(router);
    registerDeleteRoute(router);
    registerDeleteBulkRoute(router);
    registerGetByIdRoute(router);
  },
};
