import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import * as limitsService from "../modules/limits/limits.service";

const limits = new Hono();

limits.get("/", async (c) => {
  const address = c.req.query("address");

  try {
    if (address) {
      const policy = await limitsService.getLimits(address);
      return c.json({ agents: [policy] });
    }

    const ownerEoa = c.req.header("X-Owner-Address") ?? "";
    const policies = await limitsService.getLimitsForOwner(ownerEoa);
    return c.json({ agents: policies });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Limits query failed";
    return c.json({ error: "internal_error", message, status: 500 }, 500);
  }
});

limits.post(
  "/",
  zValidator(
    "json",
    z.object({
      agentAddress: z.string().startsWith("0x"),
      perTxLimit: z.string(),
      dailyBudget: z.string(),
      allowlist: z.array(z.string()).optional(),
      approvalThreshold: z.string().optional(),
      autoSwapEnabled: z.boolean().optional(),
      swapSlippageTolerance: z.string().optional(),
      humanSignature: z.string().startsWith("0x"),
      timestamp: z.number().int().positive().optional(),
    }),
  ),
  async (c) => {
    const body = c.req.valid("json");

    try {
      const result = await limitsService.setLimits(body);
      return c.json(result, 201);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Limits update failed";
      if (message.includes("Unauthorized")) {
        return c.json({ error: "forbidden", message, status: 403 }, 403);
      }
      if (message.includes("not found")) {
        return c.json({ error: "not_found", message, status: 404 }, 404);
      }
      return c.json({ error: "internal_error", message, status: 500 }, 500);
    }
  },
);

export { limits };
