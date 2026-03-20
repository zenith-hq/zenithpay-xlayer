import { OKB_NATIVE, XLAYER_CHAIN_ID, XLAYER_USDC } from "../../config/chains";
import { okxFetch } from "./client";

interface SwapQuoteResult {
  routerResult: {
    toTokenAmount: string;
    fromTokenAmount: string;
    estimateGasFee: string;
  };
}

interface SwapApproveResult {
  data: string;
  to: string;
  gasLimit: string;
}

interface SwapResult {
  tx: {
    data: string;
    to: string;
    value: string;
    gasLimit: string;
    gasPrice: string;
  };
  routerResult: {
    toTokenAmount: string;
    fromTokenAmount: string;
  };
}

export async function getSwapQuote(
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  userWalletAddress: string,
): Promise<SwapQuoteResult> {
  return okxFetch<SwapQuoteResult>("/api/v6/dex/aggregator/quote", {
    params: {
      chainIndex: XLAYER_CHAIN_ID,
      fromTokenAddress,
      toTokenAddress,
      amount,
      userWalletAddress,
    },
  });
}

export async function getSwapApprove(
  tokenAddress: string,
  approveAmount: string,
): Promise<SwapApproveResult> {
  return okxFetch<SwapApproveResult>(
    "/api/v6/dex/aggregator/approve-transaction",
    {
      params: {
        chainIndex: XLAYER_CHAIN_ID,
        tokenContractAddress: tokenAddress,
        approveAmount,
      },
    },
  );
}

export async function executeSwap(
  fromTokenAddress: string,
  toTokenAddress: string,
  amount: string,
  userWalletAddress: string,
  slippage: string = "0.01",
): Promise<SwapResult> {
  return okxFetch<SwapResult>("/api/v6/dex/aggregator/swap", {
    params: {
      chainIndex: XLAYER_CHAIN_ID,
      fromTokenAddress,
      toTokenAddress,
      amount,
      userWalletAddress,
      slippage,
    },
  });
}

export async function quoteOkbToUsdc(
  usdcAmountNeeded: string,
  agentAddress: string,
): Promise<SwapQuoteResult> {
  return getSwapQuote(OKB_NATIVE, XLAYER_USDC, usdcAmountNeeded, agentAddress);
}

export async function swapOkbToUsdc(
  amount: string,
  agentAddress: string,
): Promise<SwapResult> {
  return executeSwap(OKB_NATIVE, XLAYER_USDC, amount, agentAddress);
}
