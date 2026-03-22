export interface GenesisWalletRequest {
  email?: string;
  label?: string;
}

export interface GenesisWalletResult {
  agentAddress: string;
  apiKey: string;
  label: string | null;
  createdAt: string;
  message: string;
}
