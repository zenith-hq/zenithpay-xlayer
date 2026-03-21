export interface AgentPolicy {
  address: string;
  perTxLimit: string;
  dailyBudget: string;
  allowlist: string[];
  approvalThreshold: string | null;
  policyContract: string;
}

export interface SetLimitsRequest {
  agentAddress: string;
  perTxLimit: string;
  dailyBudget: string;
  allowlist?: string[];
  approvalThreshold?: string;
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
}
