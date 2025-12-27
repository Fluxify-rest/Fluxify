import { Hono } from "hono";
import registerGetAllRoute from "./get-all/route";
import registerGetByIdRoute from "./get-by-id/route";
import registerCreateRoute from "./create/route";
import registerUpdateRoute from "./update/route";
import registerDeleteRoute from "./delete/route";
import registerTestConnectionRoute from "./test-connection/route";
import registerTestExistingConnectionRoute from "./test-existing-connection/route";
import { HonoServer } from "../../../types";

export default {
  name: "integrations",
  registerHandler(app: HonoServer) {
    const router = app.basePath("/integrations");
    registerGetAllRoute(router);
    registerGetByIdRoute(router);
    registerCreateRoute(router);
    registerUpdateRoute(router);
    registerDeleteRoute(router);
    registerTestConnectionRoute(router);
    registerTestExistingConnectionRoute(router);
  },
};
