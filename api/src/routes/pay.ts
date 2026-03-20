import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { z } from "zod";
import * as paymentService from "../modules/payment/payment.service";

const pay = new Hono();

pay.post(
  "/",
  zValidator(
    "json",
    z.object({
      agentAddress: z.string().startsWith("0x"),
      serviceUrl: z.string().url(),
      maxAmount: z.string(),
      intent: z.string().min(1),
    }),
  ),
  async (c) => {
    const body = c.req.valid("json");

    try {
      const result = await paymentService.executePayment(body);
      const statusCode =
        result.status === "approved"
          ? 200
          : result.status === "pending"
            ? 202
            : 422;
      return c.json(result, statusCode);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Payment execution failed";
      return c.json({ error: "internal_error", message, status: 500 }, 500);
    }
  },
);

export { pay };
