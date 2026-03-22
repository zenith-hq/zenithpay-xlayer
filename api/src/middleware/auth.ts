import { eq } from "drizzle-orm";
import type { Context, Next } from "hono";
import { getDb } from "../db/client";
import { agents } from "../db/schema/agents";
import { env } from "../env";

// Public paths that never require auth
const PUBLIC_PATHS = new Set([
  "POST /wallet/genesis",
  "POST /agents/link",
  "POST /limits",
]);

export async function authMiddleware(c: Context, next: Next) {
  const key = `${c.req.method} ${c.req.path}`;
  if (PUBLIC_PATHS.has(key)) {
    return next();
  }

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

  // Admin fallback — shared secret from env
  if (token === env.ZENITHPAY_API_KEY_SECRET) {
    return next();
  }

  // Per-agent API key — look up in DB
  if (token.startsWith("zpk_")) {
    const db = getDb();
    const rows = await db
      .select({ address: agents.address })
      .from(agents)
      .where(eq(agents.apiKey, token));

    if (rows.length > 0) {
      return next();
    }
  }

  return c.json(
    {
      error: "unauthorized",
      message: "Invalid or expired API key.",
      status: 401,
    },
    401,
  );
}
