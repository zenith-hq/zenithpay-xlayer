import { z } from "zod";
import * as limitsService from "../../modules/limits/limits.service";
import { mcpServer } from "../server";

mcpServer.tool(
  "zenithpay_set_limits",
  "Set or update the agent's spend policy on-chain. Requires human EOA signature.",
  {
    perTxLimit: z.string(),
    dailyBudget: z.string(),
    allowlist: z.array(z.string()).optional(),
    approvalThreshold: z.string().optional(),
    humanSignature: z.string(),
  },
  async ({
    perTxLimit,
    dailyBudget,
    allowlist,
    approvalThreshold,
    humanSignature,
  }) => {
    const agentAddress = process.env.AGENT_ADDRESS ?? "";
    const result = await limitsService.setLimits({
      agentAddress,
      perTxLimit,
      dailyBudget,
      allowlist,
      approvalThreshold,
      humanSignature,
    });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result) }],
    };
  },
);
