import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import * as balanceService from "../modules/balance/balance.service";
import * as walletService from "../modules/wallet/wallet.service";

const wallet = new Hono();

wallet.post(
  "/genesis",
  zValidator(
    "json",
    z.object({
      email: z.string().email(),
      label: z.string().optional(),
    }),
  ),
  async (c) => {
    const { email, label } = c.req.valid("json");
    // ownerEoa is provided by the caller via X-Owner-Address header (human EOA that owns this agent)
    const ownerEoa =
      c.req.header("X-Owner-Address") ??
      "0x0000000000000000000000000000000000000000";

    try {
      const result = await walletService.createGenesisWallet(
        { email, label },
        ownerEoa,
      );
      return c.json(result, 201);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Wallet creation failed";
      return c.json({ error: "internal_error", message, status: 500 }, 500);
    }
  },
);

wallet.get("/balance", async (c) => {
  const address = c.req.query("address");

  try {
    if (address) {
      const result = await balanceService.getBalance(address);
      return c.json({ agents: [result] });
    }

    const ownerEoa = c.req.header("X-Owner-Address") ?? "";
    const results = await balanceService.getAllAgentBalances(ownerEoa);
    return c.json({ agents: results });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Balance query failed";
    return c.json({ error: "internal_error", message, status: 500 }, 500);
  }
});

wallet.get("/agents", async (c) => {
  const ownerEoa = c.req.header("X-Owner-Address") ?? "";

  try {
    const agents = await walletService.getAgentsByOwner(ownerEoa);
    return c.json({
      agents: agents.map((a) => ({ address: a.address, label: a.label })),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Agent list failed";
    return c.json({ error: "internal_error", message, status: 500 }, 500);
  }
});

export { wallet };
