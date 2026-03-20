export interface PendingApproval {
  id: string;
  agentAddress: string;
  merchant: string;
  serviceUrl: string;
  amount: string;
  currency: string;
  intent: string;
  status: "pending" | "approved" | "denied";
  requestedAt: string;
  resolvedAt?: string | null;
}

export interface CreateApprovalRequest {
  agentAddress: string;
  merchant: string;
  serviceUrl: string;
  amount: string;
  intent: string;
}
