import { z } from "zod";
import * as balanceService from "../../modules/balance/balance.service";
import { mcpServer } from "../server";

mcpServer.tool(
  "zenithpay_balance",
  "Get agent USDG and OKB balance plus remaining daily budget on X Layer",
  { agentAddress: z.string().optional() },
  async ({ agentAddress }) => {
    const address = agentAddress ?? process.env.AGENT_ADDRESS ?? "";
    const result = await balanceService.getBalance(address);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result) }],
    };
  },
);
