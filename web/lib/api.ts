const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`API ${res.status}: ${body}`);
  }

  return res.json() as Promise<T>;
}

export interface AgentBalance {
  balance: string;
  walletAddress: string;
  policy: AgentPolicy | null;
  remainingBudget: string | null;
}

export interface AgentPolicy {
  perTxLimit: string;
  dailyBudget: string;
  dailySpent: string;
  allowlist: string[];
}

export interface AgentTransaction {
  id: string;
  agentAddress: string;
  merchantAddress: string;
  amount: string;
  amountUsdc: string;
  status: "allowed" | "blocked" | "pending";
  reason: string | null;
  intent: string | null;
  xlayerTxId: string | null;
  onchainTxHash: string | null;
  createdAt: string;
}

export interface Agent {
  id: string;
  name: string;
  walletAddress: string;
  ownerAddress: string;
  createdAt: string;
}

export interface AgentCreationResult {
  walletAddress: string;
  ownerAddress: string;
  privateKey: string;
  apiKey: string;
  agentId: string;
}

export function getBalance(agentAddress: string) {
  return apiFetch<AgentBalance>(`/balance?agentAddress=${agentAddress}`);
}

export function getPolicy(agentAddress: string) {
  return apiFetch<{ policy: AgentPolicy | null }>(
    `/policy?agentAddress=${agentAddress}`,
  );
}

export function getTransactions(agentAddress: string) {
  return apiFetch<{ transactions: AgentTransaction[] }>(
    `/transactions?agentAddress=${agentAddress}`,
  );
}

export function setPolicy(params: {
  agentAddress: string;
  perTxLimit: string;
  dailyBudget: string;
  allowlist: string[];
}) {
  return apiFetch<{ success: boolean; txHash?: string }>("/policy", {
    method: "POST",
    body: JSON.stringify(params),
  });
}

export function createAgent(params: { name: string; ownerAddress: string }) {
  return apiFetch<AgentCreationResult>("/agents/register", {
    method: "POST",
    body: JSON.stringify(params),
  });
}
