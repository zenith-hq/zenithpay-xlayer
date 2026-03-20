import type { Context, Next } from "hono";

const windowMs = 60_000;
const maxRequests = 100;
const store = new Map<string, { count: number; resetAt: number }>();

export async function rateLimitMiddleware(c: Context, next: Next) {
  const key =
    c.req.header("Authorization") ??
    c.req.header("x-forwarded-for") ??
    "anonymous";
  const now = Date.now();

  let entry = store.get(key);
  if (!entry || now > entry.resetAt) {
    entry = { count: 0, resetAt: now + windowMs };
    store.set(key, entry);
  }

  entry.count++;
  if (entry.count > maxRequests) {
    return c.json(
      {
        error: "rate_limited",
        message: "Too many requests — back off and retry.",
        status: 429,
      },
      429,
    );
  }

  await next();
}
