import { eq } from "drizzle-orm";
import { createPublicClient, http } from "viem";
import { xlayer } from "../../config/chains";
import { SPEND_POLICY_ABI, SPEND_POLICY_ADDRESS } from "../../config/contracts";
import { getDb } from "../../db/client";
import { agents } from "../../db/schema/agents";
import { policies } from "../../db/schema/policies";
import { unitsToUsdc } from "../../utils";
import type {
  AgentPolicy,
  SetLimitsRequest,
  SetLimitsResult,
} from "./limits.types";

const viemClient = createPublicClient({
  chain: xlayer,
  transport: http(),
});

export async function getLimits(agentAddress: string): Promise<AgentPolicy> {
  const db = getDb();
  const [localPolicy] = await db
    .select()
    .from(policies)
    .where(eq(policies.agentAddress, agentAddress));

  let perTxLimit = "0";
  let dailyBudget = "0";

  try {
    const onchainPolicy = (await viemClient.readContract({
      address: SPEND_POLICY_ADDRESS,
      abi: SPEND_POLICY_ABI,
      functionName: "getPolicy",
      args: [agentAddress as `0x${string}`],
    })) as {
      perTxLimit: bigint;
      dailyLimit: bigint;
      dailySpent: bigint;
      windowStart: bigint;
      status: number;
      merchantAllowlistEnabled: boolean;
      humanOwner: string;
    };

    perTxLimit = unitsToUsdc(onchainPolicy.perTxLimit);
    dailyBudget = unitsToUsdc(onchainPolicy.dailyLimit);
  } catch {
    // Contract not deployed or agent not registered — fall back to DB
    if (localPolicy) {
      perTxLimit = localPolicy.perTxLimit;
      dailyBudget = localPolicy.dailyBudget;
    }
  }

  return {
    address: agentAddress,
    perTxLimit,
    dailyBudget,
    allowlist: localPolicy?.allowlist ?? [],
    approvalThreshold: localPolicy?.approvalThreshold ?? null,
    policyContract: SPEND_POLICY_ADDRESS,
  };
}

export async function getLimitsForOwner(
  ownerEoa: string,
): Promise<AgentPolicy[]> {
  const db = getDb();
  const agentList = await db
    .select()
    .from(agents)
    .where(eq(agents.ownerEoa, ownerEoa));

  const results: AgentPolicy[] = [];
  for (const agent of agentList) {
    const policy = await getLimits(agent.address);
    results.push(policy);
  }
  return results;
}

export async function setLimits(
  request: SetLimitsRequest,
): Promise<SetLimitsResult> {
  const db = getDb();

  // Store policy locally (off-chain components like approvalThreshold)
  await db
    .insert(policies)
    .values({
      agentAddress: request.agentAddress,
      perTxLimit: request.perTxLimit,
      dailyBudget: request.dailyBudget,
      allowlist: request.allowlist ?? [],
      approvalThreshold: request.approvalThreshold ?? null,
      contractAddress: SPEND_POLICY_ADDRESS,
    })
    .onConflictDoUpdate({
      target: policies.agentAddress,
      set: {
        perTxLimit: request.perTxLimit,
        dailyBudget: request.dailyBudget,
        allowlist: request.allowlist ?? [],
        approvalThreshold: request.approvalThreshold ?? null,
      },
    });

  // TODO: broadcast on-chain tx using humanSignature to call registerAgent/updatePolicy
  // For hackathon, the human signs from the dashboard and we broadcast via gateway
  const txHash = `0x${"0".repeat(64)}` as `0x${string}`;

  return {
    status: "deployed",
    policyContract: SPEND_POLICY_ADDRESS,
    txHash,
    agentAddress: request.agentAddress,
    perTxLimit: request.perTxLimit,
    dailyBudget: request.dailyBudget,
    allowlist: request.allowlist ?? [],
  };
}
