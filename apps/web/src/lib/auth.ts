import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  basePath: "/_/admin/api/auth/",
  baseURL:
    process.env.NODE_ENV === "production"
      ? process.env.SERVER_URL
      : "http://localhost:8000",
});
