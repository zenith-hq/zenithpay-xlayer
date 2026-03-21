export type AgentAddress = `0x${string}`;
export type TxHash = `0x${string}`;

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  status: number;
}

export interface OkxApiResponse<T> {
  code: string;
  msg: string;
  data: T[];
}

export type PaymentStatus = "approved" | "blocked" | "pending" | "denied";

export type BlockReason =
  | "per_tx_limit_exceeded"
  | "daily_budget_exceeded"
  | "merchant_not_allowlisted"
  | "insufficient_balance"
  | "swap_quote_failed"
  | "payment_failed"
  | "agent_not_active"
  | "policy_check_failed";
