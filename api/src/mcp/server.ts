import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export const mcpServer = new McpServer({
  name: "zenithpay",
  version: "1.0.0",
});

export function registerTools() {
  require("./tools/balance");
  require("./tools/pay-service");
  require("./tools/get-limits");
  require("./tools/set-limits");
  require("./tools/verify-merchant");
  require("./tools/ledger");
}
