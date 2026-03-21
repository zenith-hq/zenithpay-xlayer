import { eq } from "drizzle-orm";
import { getDb } from "../../db/client";
import { agents } from "../../db/schema/agents";
import * as agenticWallet from "../../providers/onchainos/agentic-wallet";
import type { GenesisWalletRequest, GenesisWalletResult } from "./wallet.types";

export async function createGenesisWallet(
  request: GenesisWalletRequest,
  ownerEoa: string,
): Promise<GenesisWalletResult> {
  const db = getDb();

  const session = await agenticWallet.akLogin();

  const xlayerAddr = session.addressList.find(
    (a) => a.chainIndex === "196",
  );
  const agentAddress = xlayerAddr?.address ?? session.addressList[0]?.address;

  if (!agentAddress) {
    throw new Error("No wallet address available from OKX Agentic Wallet");
  }

  const existing = await db
    .select()
    .from(agents)
    .where(eq(agents.address, agentAddress));

  if (existing.length > 0) {
    return {
      agentAddress,
      label: existing[0].label,
      balances: { USDC: "0.00", OKB: "0.00" },
      createdAt: existing[0].createdAt?.toISOString() ?? new Date().toISOString(),
    };
  }

  await db.insert(agents).values({
    address: agentAddress,
    label: request.label ?? null,
    ownerEoa,
    email: request.email ?? null,
  });

  return {
    agentAddress,
    label: request.label ?? null,
    balances: { USDC: "0.00", OKB: "0.00" },
    createdAt: new Date().toISOString(),
  };
}

export async function getAgentsByOwner(ownerEoa: string) {
  const db = getDb();
  return db.select().from(agents).where(eq(agents.ownerEoa, ownerEoa));
}
