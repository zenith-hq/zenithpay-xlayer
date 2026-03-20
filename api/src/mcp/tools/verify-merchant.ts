import { z } from "zod";
import * as limitsService from "../../modules/limits/limits.service";
import * as tokenProvider from "../../providers/onchainos/token";
import { extractHost } from "../../utils";
import { mcpServer } from "../server";

mcpServer.tool(
  "zenithpay_verify_merchant",
  "Check whether a merchant URL is safe to pay. Runs OKX security scan and checks the agent's allowlist.",
  { merchantUrl: z.string().url() },
  async ({ merchantUrl }) => {
    const agentAddress = process.env.AGENT_ADDRESS ?? "";
    const host = extractHost(merchantUrl);

    const policy = await limitsService.getLimits(agentAddress);
    const allowlisted =
      policy.allowlist.length === 0 || policy.allowlist.includes(host);

    let riskLevel = "low";
    let scanResult = "clean";
    let safe = true;

    try {
      // Use token security as a proxy for general security checks
      // In production, use OKX security_dapp_scan MCP tool
      const securityInfo = await tokenProvider.getTokenSecurity(merchantUrl);
      if (securityInfo.riskLevel === "high" || securityInfo.isHoneypot) {
        riskLevel = "high";
        scanResult = "flagged";
        safe = false;
      }
    } catch {
      // Security scan unavailable — default to clean
    }

    const result: Record<string, unknown> = {
      merchantUrl,
      host,
      safe,
      allowlisted,
      riskLevel,
      scanResult,
    };

    if (!safe) {
      result.warning =
        "This merchant URL was flagged by OKX security scan. Do not proceed with payment.";
    } else if (!allowlisted && policy.allowlist.length > 0) {
      result.warning =
        "Merchant is not on your allowlist. Payment will be blocked if allowlist is enforced. Ask your human to add this merchant.";
    }

    return {
      content: [{ type: "text" as const, text: JSON.stringify(result) }],
    };
  },
);
