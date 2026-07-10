import registerCreateRoute from "./create/route";
import registerUpdateRoute from "./update/route";
import registerGetAllRoute from "./get-all/route";
import registerGetByIdRoute from "./get-by-id/route";
import registerDeleteRoute from "./delete/route";
import { HonoServer } from "../../../types";

export default {
  name: "custom-blocks",
  registerHandler(app: HonoServer) {
    const router = app.basePath("/custom-blocks");
    registerGetAllRoute(router);
    registerGetByIdRoute(router);
    registerCreateRoute(router);
    registerUpdateRoute(router);
    registerDeleteRoute(router);
  },
};
