export interface GenesisWalletRequest {
  email?: string;
  label?: string;
}

export interface GenesisWalletResult {
  agentAddress: string;
  label: string | null;
  balances: {
    USDC: string;
    OKB: string;
  };
  createdAt: string;
  message: string;
}
