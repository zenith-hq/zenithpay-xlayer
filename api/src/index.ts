import { app } from "./app";
import { env } from "./env";

const server = Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
});

console.log(`ZenithPay API running on http://localhost:${server.port}`);
