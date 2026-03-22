import crypto from "node:crypto";
import { and, eq } from "drizzle-orm";
import { getDb } from "../../db/client";
import { agents } from "../../db/schema/agents";
import * as agenticWallet from "../../providers/onchainos/agentic-wallet";
import type { GenesisWalletRequest, GenesisWalletResult } from "./wallet.types";

const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

function generateApiKey(): string {
  return `zpk_${crypto.randomBytes(32).toString("hex")}`;
}

export async function createGenesisWallet(
  request: GenesisWalletRequest,
  ownerEoa: string,
): Promise<GenesisWalletResult> {
  const db = getDb();

  const session = await agenticWallet.akLogin();

  const xlayerAddr = session.addressList.find((a) => a.chainIndex === "196");
  const agentAddress = xlayerAddr?.address ?? session.addressList[0]?.address;

  if (!agentAddress) {
    throw new Error("No wallet address available from OKX Agentic Wallet");
  }

  const existing = await db
    .select()
    .from(agents)
    .where(eq(agents.address, agentAddress));

  if (existing.length > 0) {
    // Return existing API key — idempotent genesis
    const apiKey = existing[0].apiKey ?? generateApiKey();
    if (!existing[0].apiKey) {
      await db
        .update(agents)
        .set({ apiKey, label: request.label ?? existing[0].label })
        .where(eq(agents.address, agentAddress));
    } else if (request.label && request.label !== existing[0].label) {
      await db
        .update(agents)
        .set({ label: request.label })
        .where(eq(agents.address, agentAddress));
    }
    return {
      agentAddress,
      apiKey,
      label: request.label ?? existing[0].label,
      createdAt:
        existing[0].createdAt?.toISOString() ?? new Date().toISOString(),
      message: `Wallet created. Activate at https://usezenithpay.xyz/onboarding?agent=${agentAddress}`,
    };
  }

  const apiKey = generateApiKey();

  await db.insert(agents).values({
    address: agentAddress,
    apiKey,
    label: request.label ?? null,
    ownerEoa,
    email: request.email ?? null,
  });

  return {
    agentAddress,
    apiKey,
    label: request.label ?? null,
    createdAt: new Date().toISOString(),
    message: `Wallet created. Activate at https://usezenithpay.xyz/onboarding?agent=${agentAddress}`,
  };
}

export async function getAgentsByOwner(ownerEoa: string) {
  const db = getDb();
  return db.select().from(agents).where(eq(agents.ownerEoa, ownerEoa));
}

export async function linkAgent(
  agentAddress: string,
  ownerAddress: string,
): Promise<{ agentAddress: string; ownerAddress: string }> {
  const db = getDb();

  const rows = await db
    .select()
    .from(agents)
    .where(
      and(eq(agents.address, agentAddress), eq(agents.ownerEoa, ZERO_ADDRESS)),
    );

  if (rows.length === 0) {
    const existing = await db
      .select()
      .from(agents)
      .where(eq(agents.address, agentAddress));
    if (existing.length === 0) {
      throw new Error("Agent not found");
    }
    throw new Error("Agent already linked to an owner");
  }

  await db
    .update(agents)
    .set({ ownerEoa: ownerAddress })
    .where(
      and(eq(agents.address, agentAddress), eq(agents.ownerEoa, ZERO_ADDRESS)),
    );

  return { agentAddress, ownerAddress };
}
