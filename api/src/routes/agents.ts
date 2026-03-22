import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import * as walletService from "../modules/wallet/wallet.service";

const agents = new Hono();

agents.post(
  "/link",
  zValidator(
    "json",
    z.object({
      agentAddress: z
        .string()
        .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid agent address"),
      ownerAddress: z
        .string()
        .regex(/^0x[a-fA-F0-9]{40}$/, "Invalid owner address"),
    }),
  ),
  async (c) => {
    const { agentAddress, ownerAddress } = c.req.valid("json");

    try {
      const result = await walletService.linkAgent(agentAddress, ownerAddress);
      return c.json(result, 200);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Link failed";
      const status = message.includes("already linked")
        ? 409
        : message.includes("not found")
          ? 404
          : 500;
      return c.json({ error: "link_failed", message, status }, status);
    }
  },
);

export { agents as agentsRoute };
