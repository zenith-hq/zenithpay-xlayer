import { eq } from "drizzle-orm";
import { Hono } from "hono";
import { recoverMessageAddress } from "viem";
import { getDb } from "../db/client";
import { agents } from "../db/schema/agents";
import { approvals } from "../db/schema/approvals";
import * as approvalsService from "../modules/approvals/approvals.service";

const approvalsRoute = new Hono();

async function verifyApprovalSignature(
  approvalId: string,
  action: "approve" | "deny",
  humanSignature: string,
  timestamp: number,
): Promise<void> {
  const db = getDb();

  const [approval] = await db
    .select({ agentAddress: approvals.agentAddress })
    .from(approvals)
    .where(eq(approvals.id, approvalId));

  if (!approval) throw new Error(`Approval ${approvalId} not found`);

  const [agent] = await db
    .select({ ownerEoa: agents.ownerEoa })
    .from(agents)
    .where(eq(agents.address, approval.agentAddress));

  if (!agent) throw new Error("Agent not found");

  const message = JSON.stringify({ action, approvalId, timestamp });
  const signer = await recoverMessageAddress({
    message,
    signature: humanSignature as `0x${string}`,
  });

  if (signer.toLowerCase() !== agent.ownerEoa.toLowerCase()) {
    throw new Error("Unauthorized: signer is not the agent owner");
  }
}

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
    const body = await c.req.json<{
      humanSignature: string;
      timestamp: number;
    }>();

    if (!body.humanSignature || !body.timestamp) {
      return c.json(
        {
          error: "bad_request",
          message: "humanSignature and timestamp are required",
          status: 400,
        },
        400,
      );
    }

    await verifyApprovalSignature(
      id,
      "approve",
      body.humanSignature,
      body.timestamp,
    );

    const result = await approvalsService.approvePayment(id);
    return c.json({
      id: result.id,
      status: "approved",
      txHash: result.txHash ?? null,
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
        : message.includes("Unauthorized")
          ? 403
          : 500;
    return c.json(
      {
        error:
          status === 404
            ? "not_found"
            : status === 403
              ? "forbidden"
              : "internal_error",
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
    const body = await c.req.json<{
      humanSignature: string;
      timestamp: number;
    }>();

    if (!body.humanSignature || !body.timestamp) {
      return c.json(
        {
          error: "bad_request",
          message: "humanSignature and timestamp are required",
          status: 400,
        },
        400,
      );
    }

    await verifyApprovalSignature(
      id,
      "deny",
      body.humanSignature,
      body.timestamp,
    );

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
        : message.includes("Unauthorized")
          ? 403
          : 500;
    return c.json(
      {
        error:
          status === 404
            ? "not_found"
            : status === 403
              ? "forbidden"
              : "internal_error",
        message,
        status,
      },
      status,
    );
  }
});

export { approvalsRoute };
