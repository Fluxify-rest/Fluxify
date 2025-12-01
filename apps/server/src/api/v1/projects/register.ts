import { HonoServer } from "../../../types";
import createProjectRoute from "./create/route";
import getAllProjectRoute from "./get-all/route";
import updateProjectRoute from "./update/route";

export default {
  name: "routes",
  registerHandler(app: HonoServer) {
    const router = app.basePath("/projects");
    createProjectRoute(router);
    getAllProjectRoute(router);
    updateProjectRoute(router);
  },
};
