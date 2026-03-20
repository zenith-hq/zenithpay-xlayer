import type { Context, Next } from "hono";
import { env } from "../env";

export async function authMiddleware(c: Context, next: Next) {
  const authHeader = c.req.header("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return c.json(
      {
        error: "unauthorized",
        message: "Missing or invalid API key.",
        status: 401,
      },
      401,
    );
  }

  const token = authHeader.slice(7);
  if (token !== env.ZENITHPAY_API_KEY_SECRET) {
    return c.json(
      {
        error: "unauthorized",
        message: "Invalid or expired API key.",
        status: 401,
      },
      401,
    );
  }

  await next();
}
