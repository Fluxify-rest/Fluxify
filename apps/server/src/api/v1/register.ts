import { openAPIRouteHandler } from "hono-openapi";
import routes from "./routes/register";
import projects from "./projects/register";
import appConfig from "./app-config/register";
import integrations from "./integrations/register";
import { HonoServer } from "../../types";

export default {
  name: "v1",
  registerHandler(app: HonoServer) {
    const router = app.basePath("/v1");
    router.get(
      "/openapi.json",
      openAPIRouteHandler(router, {
        documentation: {
          info: {
            title: "CBE API",
            version: "v1",
            description: "CBE API Documentation",
          },
        },
      })
    );
    routes.registerHandler(router);
    projects.registerHandler(router);
    appConfig.registerHandler(router);
    integrations.registerHandler(router);
  },
};
