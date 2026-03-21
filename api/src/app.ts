import { WebStandardStreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/webStandardStreamableHttp.js";
import { Hono } from "hono";
import { cors } from "hono/cors";
import { mcpServer, registerTools } from "./mcp/server";
import { authMiddleware } from "./middleware/auth";
import { loggerMiddleware } from "./middleware/logger";
import { rateLimitMiddleware } from "./middleware/rate-limit";
import { approvalsRoute } from "./routes/approvals";
import { ledgerRoute } from "./routes/ledger";
import { limits } from "./routes/limits";
import { pay } from "./routes/pay";
import { wallet } from "./routes/wallet";

registerTools();

const ENDPOINT_LIST = [
  "/health",
  "/wallet/genesis",
  "/wallet/balance",
  "/wallet/agents",
  "/pay",
  "/limits",
  "/ledger",
  "/approvals",
  "/mcp",
  "/skill.md",
];

const app = new Hono();

// Global middleware
app.use("*", cors());
app.use("*", loggerMiddleware);

// Public endpoints — no auth
app.get("/health", (c) =>
  c.json({
    status: "ok",
    service: "zenithpay-api",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  }),
);

app.get("/skill.md", async (c) => {
  const res = await fetch(
    "https://raw.githubusercontent.com/zenith-hq/zenithpay-xlayer/main/skills/spend-agent/SKILL.md",
  );
  const content = await res.text();
  return c.text(content, 200, {
    "Content-Type": "text/markdown; charset=utf-8",
  });
});

// MCP endpoint — stateless transport, new instance per request
app.all("/mcp", async (c) => {
  const transport = new WebStandardStreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
  });
  await mcpServer.connect(transport);
  const response = await transport.handleRequest(c.req.raw);
  return response;
});

// Protected endpoints — require API key
// Use both exact path and wildcard to catch root and sub-routes
app.use("/wallet/*", rateLimitMiddleware, authMiddleware);
app.use("/pay", rateLimitMiddleware, authMiddleware);
app.use("/pay/*", rateLimitMiddleware, authMiddleware);
app.use("/limits", rateLimitMiddleware, authMiddleware);
app.use("/limits/*", rateLimitMiddleware, authMiddleware);
app.use("/ledger", rateLimitMiddleware, authMiddleware);
app.use("/ledger/*", rateLimitMiddleware, authMiddleware);
app.use("/approvals", rateLimitMiddleware, authMiddleware);
app.use("/approvals/*", rateLimitMiddleware, authMiddleware);

// Mount routes
app.route("/wallet", wallet);
app.route("/pay", pay);
app.route("/limits", limits);
app.route("/ledger", ledgerRoute);
app.route("/approvals", approvalsRoute);

// Global error handler — structured JSON for all unhandled errors
app.onError((err, c) => {
  console.error(`Unhandled error: ${err.message}`);
  return c.json(
    {
      error: "internal_error",
      message:
        process.env.NODE_ENV === "production"
          ? "An unexpected error occurred."
          : err.message,
      status: 500,
    },
    500,
  );
});

// Not found handler — structured JSON for unknown routes
app.notFound((c) =>
  c.json(
    {
      error: "not_found",
      message: `Route ${c.req.method} ${c.req.path} not found.`,
      endpoints: ENDPOINT_LIST,
      status: 404,
    },
    404,
  ),
);

export { app };
