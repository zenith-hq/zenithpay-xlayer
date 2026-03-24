"use client";

import type { EIP1193Provider } from "viem";

export const XLAYER_CHAIN_ID = 196;

declare global {
  interface Window {
    okxwallet?: EIP1193Provider;
  }
}

type WalletConnector = {
  id: string;
  name: string;
};

export function hasOkxWallet(): boolean {
  return typeof window !== "undefined" && typeof window.okxwallet !== "undefined";
}

export function getOkxConnector<T extends WalletConnector>(
  connectors: readonly T[],
): T | undefined {
  return connectors.find((connector) =>
    /okx/i.test(`${connector.id} ${connector.name}`),
  );
}
