import { z } from "zod";
import * as ledgerService from "../../modules/ledger/ledger.service";
import { mcpServer } from "../server";

mcpServer.tool(
  "zenithpay_ledger",
  "Query the agent's full on-chain + internal transaction audit trail.",
  {
    limit: z.number().optional(),
    offset: z.number().optional(),
    status: z.string().optional(),
  },
  async ({ limit, offset, status }) => {
    const agentAddress = process.env.AGENT_ADDRESS ?? "";
    const result = await ledgerService.getTransactions({
      agentAddress,
      limit,
      offset,
      status,
    });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result) }],
    };
  },
);
