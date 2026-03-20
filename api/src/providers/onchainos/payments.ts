import { okxFetch } from "./client";

interface X402VerifyResult {
  valid: boolean;
  paymentRequired: boolean;
  amount: string;
  currency: string;
  network: string;
  receiver: string;
}

interface X402SettleResult {
  txHash: string;
  status: string;
  amount: string;
  currency: string;
}

interface X402SupportedResult {
  supported: boolean;
  chains: string[];
  tokens: string[];
}

export async function verifyX402(
  serviceUrl: string,
  payerAddress: string,
  maxAmount: string,
): Promise<X402VerifyResult> {
  return okxFetch<X402VerifyResult>("/api/v6/x402/verify", {
    method: "POST",
    body: {
      serviceUrl,
      payerAddress,
      maxAmount,
      chainIndex: "196",
      tokenAddress: "0x74b7f16337b8972027f6196a17a631ac6de26d22",
    },
  });
}

export async function settleX402(
  serviceUrl: string,
  payerAddress: string,
  amount: string,
  signature: string,
): Promise<X402SettleResult> {
  return okxFetch<X402SettleResult>("/api/v6/x402/settle", {
    method: "POST",
    body: {
      serviceUrl,
      payerAddress,
      amount,
      signature,
      chainIndex: "196",
      tokenAddress: "0x74b7f16337b8972027f6196a17a631ac6de26d22",
    },
  });
}

export async function getX402Supported(): Promise<X402SupportedResult> {
  return okxFetch<X402SupportedResult>("/api/v6/x402/supported");
}
