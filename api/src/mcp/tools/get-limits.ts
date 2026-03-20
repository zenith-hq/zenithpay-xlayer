import { z } from "zod";
import * as limitsService from "../../modules/limits/limits.service";
import { mcpServer } from "../server";

mcpServer.tool(
  "zenithpay_get_limits",
  "Read the agent's current on-chain spend policy (read-only). Call this before spending to understand limits.",
  { agentAddress: z.string().optional() },
  async ({ agentAddress }) => {
    const address = agentAddress ?? process.env.AGENT_ADDRESS ?? "";
    const result = await limitsService.getLimits(address);
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result) }],
    };
  },
);
