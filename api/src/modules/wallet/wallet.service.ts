import { eq } from "drizzle-orm";
import { getDb } from "../../db/client";
import { agents } from "../../db/schema/agents";
import * as agenticWallet from "../../providers/onchainos/agentic-wallet";
import type { GenesisWalletRequest, GenesisWalletResult } from "./wallet.types";

export async function createGenesisWallet(
  request: GenesisWalletRequest,
  ownerEoa: string,
): Promise<GenesisWalletResult> {
  // OKX Agentic Wallet login initiates email OTP flow — the OTP verification step
  // requires user interaction and is handled by the dashboard before calling this endpoint.
  const loginResult = await agenticWallet.walletLogin(request.email);
  const walletResult = await agenticWallet.walletCreate(
    loginResult.sessionToken,
    request.label,
  );

  const db = getDb();
  await db.insert(agents).values({
    address: walletResult.address,
    label: request.label ?? null,
    ownerEoa,
    email: request.email,
  });

  return {
    agentAddress: walletResult.address,
    label: request.label ?? null,
    balances: { USDC: "0.00", OKB: "0.00" },
    createdAt: new Date().toISOString(),
  };
}

export async function getAgentsByOwner(ownerEoa: string) {
  const db = getDb();
  return db.select().from(agents).where(eq(agents.ownerEoa, ownerEoa));
}
