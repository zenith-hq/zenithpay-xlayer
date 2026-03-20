import { Hono } from "hono";
import * as approvalsService from "../modules/approvals/approvals.service";

const approvalsRoute = new Hono();

approvalsRoute.get("/", async (c) => {
  const address = c.req.query("address");

  try {
    const result = await approvalsService.getPendingApprovals(address);
    return c.json(result);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Approvals query failed";
    return c.json({ error: "internal_error", message, status: 500 }, 500);
  }
});

approvalsRoute.post("/:id/approve", async (c) => {
  const { id } = c.req.param();

  try {
    const result = await approvalsService.approvePayment(id);
    return c.json({
      id: result.id,
      status: "approved",
      txHash: "0x",
      amount: result.amount,
      merchant: result.merchant,
      settledAt: result.resolvedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Approval failed";
    const status = message.includes("not found")
      ? 404
      : message.includes("already")
        ? 409
        : 500;
    return c.json(
      {
        error: status === 404 ? "not_found" : "internal_error",
        message,
        status,
      },
      status,
    );
  }
});

approvalsRoute.post("/:id/deny", async (c) => {
  const { id } = c.req.param();

  try {
    const result = await approvalsService.denyPayment(id);
    return c.json({
      id: result.id,
      status: "denied",
      merchant: result.merchant,
      amount: result.amount,
      deniedAt: result.resolvedAt,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Denial failed";
    const status = message.includes("not found")
      ? 404
      : message.includes("already")
        ? 409
        : 500;
    return c.json(
      {
        error: status === 404 ? "not_found" : "internal_error",
        message,
        status,
      },
      status,
    );
  }
});

export { approvalsRoute };
