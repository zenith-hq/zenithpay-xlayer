import { eq } from "drizzle-orm";
import { createPublicClient, http } from "viem";
import { OKB_NATIVE, XLAYER_USDC, xlayer } from "../../config/chains";
import { SPEND_POLICY_ABI, SPEND_POLICY_ADDRESS } from "../../config/contracts";
import { getDb } from "../../db/client";
import { agents } from "../../db/schema/agents";
import * as balanceProvider from "../../providers/onchainos/balance";
import { unitsToUsdc } from "../../utils";
import type { AgentBalance } from "./balance.types";

const viemClient = createPublicClient({
  chain: xlayer,
  transport: http(),
});

export async function getBalance(agentAddress: string): Promise<AgentBalance> {
  const db = getDb();
  const [agent] = await db
    .select()
    .from(agents)
    .where(eq(agents.address, agentAddress));

  const tokenBalances = await balanceProvider.getTokenBalances(agentAddress, [
    XLAYER_USDC,
    OKB_NATIVE,
  ]);

  let usdcBalance = "0";
  let okbBalance = "0";
  for (const tb of tokenBalances) {
    const addr = (tb.tokenContractAddress ?? "").toLowerCase();
    if (addr === XLAYER_USDC.toLowerCase()) {
      usdcBalance = tb.balance;
    }
    if (
      addr === "" ||
      addr === OKB_NATIVE.toLowerCase() ||
      tb.symbol === "OKB"
    ) {
      okbBalance = tb.balance;
    }
  }

  let remainingDailyBudget = "0";
  try {
    const remaining = await viemClient.readContract({
      address: SPEND_POLICY_ADDRESS,
      abi: SPEND_POLICY_ABI,
      functionName: "getRemainingDailyBudget",
      args: [agentAddress as `0x${string}`],
    });
    remainingDailyBudget = unitsToUsdc(remaining as bigint);
  } catch {
    // Contract not deployed yet or agent not registered
  }

  return {
    address: agentAddress,
    label: agent?.label ?? null,
    balances: { USDG: usdcBalance, OKB: okbBalance },
    remainingDailyBudget,
  };
}

export async function getAllAgentBalances(
  ownerEoa: string,
): Promise<AgentBalance[]> {
  const db = getDb();
  const agentList = await db
    .select()
    .from(agents)
    .where(eq(agents.ownerEoa, ownerEoa));

  const results: AgentBalance[] = [];
  for (const agent of agentList) {
    const balance = await getBalance(agent.address);
    results.push(balance);
  }
  return results;
}
