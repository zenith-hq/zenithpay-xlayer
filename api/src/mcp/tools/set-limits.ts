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
    autoSwapEnabled: z.boolean().optional(),
    swapSlippageTolerance: z.string().optional(),
    humanSignature: z.string(),
  },
  async ({
    perTxLimit,
    dailyBudget,
    allowlist,
    approvalThreshold,
    autoSwapEnabled,
    swapSlippageTolerance,
    humanSignature,
  }) => {
    const agentAddress = process.env.AGENT_ADDRESS ?? "";
    const result = await limitsService.setLimits({
      agentAddress,
      perTxLimit,
      dailyBudget,
      allowlist,
      approvalThreshold,
      autoSwapEnabled,
      swapSlippageTolerance,
      humanSignature,
    });
    return {
      content: [{ type: "text" as const, text: JSON.stringify(result) }],
    };
  },
);
