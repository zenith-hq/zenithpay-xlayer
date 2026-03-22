import { and, count, desc, eq } from "drizzle-orm";
import { getDb } from "../../db/client";
import { ledger } from "../../db/schema/ledger";
import { generateId } from "../../utils";
import type { LedgerEntry, LedgerQuery, LedgerResult } from "./ledger.types";

export async function getTransactions(
  query: LedgerQuery,
): Promise<LedgerResult> {
  const db = getDb();
  const limit = Math.min(query.limit ?? 50, 200);
  const offset = query.offset ?? 0;

  const conditions = [];
  if (query.agentAddress) {
    conditions.push(eq(ledger.agentAddress, query.agentAddress));
  }
  if (query.status) {
    conditions.push(eq(ledger.status, query.status));
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const [rows, [totalRow]] = await Promise.all([
    db
      .select()
      .from(ledger)
      .where(where)
      .orderBy(desc(ledger.timestamp))
      .limit(limit)
      .offset(offset),
    db.select({ count: count() }).from(ledger).where(where),
  ]);

  const transactions: LedgerEntry[] = rows.map((r) => ({
    id: r.id,
    agentAddress: r.agentAddress,
    merchant: r.merchant,
    amount: r.amount,
    currency: r.currency,
    intent: r.intent,
    status: r.status as LedgerEntry["status"],
    reason: r.reason,
    txHash: r.txHash,
    swapUsed: r.swapUsed,
    okbSpent: r.okbSpent,
    createdAt: r.timestamp.toISOString(),
  }));

  return {
    transactions,
    total: totalRow.count,
    limit,
    offset,
  };
}

export async function writeTransaction(
  entry: Omit<LedgerEntry, "id" | "createdAt">,
): Promise<LedgerEntry> {
  const db = getDb();
  const id = generateId("txn");
  const now = new Date();

  await db.insert(ledger).values({
    id,
    agentAddress: entry.agentAddress,
    merchant: entry.merchant,
    amount: entry.amount,
    currency: entry.currency,
    intent: entry.intent,
    status: entry.status,
    reason: entry.reason ?? null,
    txHash: entry.txHash ?? null,
    swapUsed: entry.swapUsed,
    okbSpent: entry.okbSpent ?? null,
    timestamp: now,
  });

  return {
    ...entry,
    id,
    createdAt: now.toISOString(),
  };
}
