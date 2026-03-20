import { Hono } from "hono";
import * as ledgerService from "../modules/ledger/ledger.service";

const ledgerRoute = new Hono();

ledgerRoute.get("/", async (c) => {
  const address = c.req.query("address");
  const limit = c.req.query("limit");
  const offset = c.req.query("offset");
  const status = c.req.query("status");

  try {
    const result = await ledgerService.getTransactions({
      agentAddress: address,
      limit: limit ? Number.parseInt(limit, 10) : undefined,
      offset: offset ? Number.parseInt(offset, 10) : undefined,
      status: status ?? undefined,
    });
    return c.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Ledger query failed";
    return c.json({ error: "internal_error", message, status: 500 }, 500);
  }
});

export { ledgerRoute };
