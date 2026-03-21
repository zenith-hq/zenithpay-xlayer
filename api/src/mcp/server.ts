import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export const mcpServer = new McpServer({
  name: "zenithpay",
  version: "1.0.0",
});

export async function registerTools() {
  await import("./tools/balance");
  await import("./tools/pay-service");
  await import("./tools/get-limits");
  await import("./tools/set-limits");
  await import("./tools/verify-merchant");
  await import("./tools/ledger");
}
