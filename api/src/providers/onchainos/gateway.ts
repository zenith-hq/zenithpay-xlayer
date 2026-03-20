import { XLAYER_CHAIN_ID } from "../../config/chains";
import { okxFetch } from "./client";

interface SimulateResult {
  simulation: {
    success: boolean;
    gasUsed: string;
    error?: string;
  };
}

interface BroadcastResult {
  orderId: string;
  txHash: string;
}

interface GasPriceResult {
  gasPrice: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

interface GasLimitResult {
  gasLimit: string;
}

interface OrderResult {
  orderId: string;
  txHash: string;
  status: string;
  blockNumber?: string;
}

export async function getGasPrice(): Promise<GasPriceResult> {
  return okxFetch<GasPriceResult>("/api/v6/dex/pre-transaction/gas-price", {
    params: { chainIndex: XLAYER_CHAIN_ID },
  });
}

export async function getGasLimit(
  fromAddress: string,
  toAddress: string,
  txData: string,
  value: string = "0",
): Promise<GasLimitResult> {
  return okxFetch<GasLimitResult>("/api/v6/dex/pre-transaction/gas-limit", {
    params: {
      chainIndex: XLAYER_CHAIN_ID,
      fromAddress,
      toAddress,
      txData,
      value,
    },
  });
}

export async function simulateTransaction(
  fromAddress: string,
  toAddress: string,
  txData: string,
  value: string = "0",
): Promise<SimulateResult> {
  return okxFetch<SimulateResult>("/api/v6/dex/pre-transaction/simulate", {
    method: "POST",
    body: {
      chainIndex: XLAYER_CHAIN_ID,
      fromAddress,
      toAddress,
      txData,
      value,
    },
  });
}

export async function broadcastTransaction(
  signedTx: string,
): Promise<BroadcastResult> {
  return okxFetch<BroadcastResult>("/api/v6/dex/transaction/broadcast", {
    method: "POST",
    body: { chainIndex: XLAYER_CHAIN_ID, signedTx },
  });
}

export async function getTransactionOrders(
  orderId: string,
): Promise<OrderResult> {
  return okxFetch<OrderResult>("/api/v6/dex/transaction/orders", {
    params: { chainIndex: XLAYER_CHAIN_ID, orderId },
  });
}
