import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

export const mcpServer = new McpServer({
  name: "zenithpay",
  version: "1.0.0",
});

// Tools self-register by importing the mcpServer instance
import "./tools/balance";
import "./tools/pay-service";
import "./tools/get-limits";
import "./tools/set-limits";
import "./tools/verify-merchant";
import "./tools/ledger";
