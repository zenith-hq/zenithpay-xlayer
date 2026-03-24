export interface AgentBalance {
  address: string;
  label: string | null;
  balances: {
    USDG: string;
    OKB: string;
  };
  remainingDailyBudget: string;
}
