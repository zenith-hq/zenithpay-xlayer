export interface AgentBalance {
  address: string;
  label: string | null;
  balances: {
    USDC: string;
    OKB: string;
  };
  remainingDailyBudget: string;
}
