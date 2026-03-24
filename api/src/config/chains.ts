import { defineChain } from "viem";

export const xlayer = defineChain({
  id: 196,
  name: "X Layer",
  nativeCurrency: { name: "OKB", symbol: "OKB", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.xlayer.tech"] },
  },
  blockExplorers: {
    default: { name: "OKLink", url: "https://www.oklink.com/xlayer" },
  },
});

export const XLAYER_CHAIN_ID = "196";
// USDG on X Layer — OKX's stablecoin, supported by OKX x402 Payments API
// Contract: https://www.oklink.com/xlayer/address/0x4ae46a509f6b1d9056937ba4500cb143933d2dc8
export const XLAYER_USDC =
  "0x4ae46a509f6b1d9056937ba4500cb143933d2dc8" as const;
export const XLAYER_USDG = XLAYER_USDC; // alias — USDG is the canonical x402 settlement token
export const XLAYER_USDG_DECIMALS = 6;
export const XLAYER_X402_NETWORK = "eip155:196" as const;
export const OKB_NATIVE = "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee" as const;
