import { pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";
import { agents } from "./agents";

export const approvals = pgTable("approvals", {
  id: text("id").primaryKey(),
  agentAddress: varchar("agent_address", { length: 42 })
    .notNull()
    .references(() => agents.address),
  merchant: text("merchant").notNull(),
  serviceUrl: text("service_url").notNull(),
  amount: text("amount").notNull(),
  currency: text("currency").default("USDC").notNull(),
  intent: text("intent").notNull(),
  status: text("status").default("pending").notNull(),
  requestedAt: timestamp("requested_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  resolvedAt: timestamp("resolved_at", { withTimezone: true }),
});
