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
  /** Required for browser onboarding path (POST /limits). Omit for direct MCP tool calls. */
  timestamp?: number;
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
