import { Hono } from "hono";
import v1Register from "./v1/register";
import { readFileSync } from "fs";
import { join } from "path";
import { HonoServer } from "../types";

export function mapVersionedAdminRoutes(app: HonoServer) {
  const router = app.basePath("/_/admin/api");
  router.get("/openapi/ui", (c) => {
    try {
      const htmlContent = loadHtmlContent();
      return c.html(htmlContent);
    } catch (error) {
      return c.text("OpenAPI UI file not found", 404);
    }
  });
  v1Register.registerHandler(router);
}

let cachedHtmlContent: string | null = null;

// Function to load and cache HTML content
function loadHtmlContent(): string {
  if (cachedHtmlContent) {
    return cachedHtmlContent;
  }

  try {
    const htmlPath = join(process.cwd(), "src/public/openapi.html");
    cachedHtmlContent = readFileSync(htmlPath, "utf-8");
    return cachedHtmlContent;
  } catch (error) {
    throw new Error("OpenAPI UI file not found");
  }
}
