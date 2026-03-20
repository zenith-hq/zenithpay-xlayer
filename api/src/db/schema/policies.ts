import { pgTable, text, varchar } from "drizzle-orm/pg-core";
import { agents } from "./agents";

export const policies = pgTable("policies", {
  agentAddress: varchar("agent_address", { length: 42 })
    .primaryKey()
    .references(() => agents.address),
  perTxLimit: text("per_tx_limit").notNull(),
  dailyBudget: text("daily_budget").notNull(),
  allowlist: text("allowlist").array(),
  approvalThreshold: text("approval_threshold"),
  contractAddress: varchar("contract_address", { length: 42 }),
});
