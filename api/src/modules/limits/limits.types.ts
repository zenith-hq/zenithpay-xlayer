export interface AgentPolicy {
  address: string;
  perTxLimit: string;
  dailyBudget: string;
  allowlist: string[];
  approvalThreshold: string | null;
  autoSwapEnabled: boolean;
  swapSlippageTolerance: string;
  policyContract: string;
}

export interface SetLimitsRequest {
  agentAddress: string;
  perTxLimit: string;
  dailyBudget: string;
  allowlist?: string[];
  approvalThreshold?: string;
  autoSwapEnabled?: boolean;
  swapSlippageTolerance?: string;
  humanSignature: string;
}

export interface SetLimitsResult {
  status: "deployed";
  policyContract: string;
  txHash: string | null;
  agentAddress: string;
  perTxLimit: string;
  dailyBudget: string;
  allowlist: string[];
  autoSwapEnabled: boolean;
  swapSlippageTolerance: string;
}
