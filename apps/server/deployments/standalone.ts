import { app } from "../src/server";

const port = Number(process.env.SERVER_PORT) || 5500;

export default {
  fetch: app.fetch,
  port,
};
