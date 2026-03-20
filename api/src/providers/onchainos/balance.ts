import { XLAYER_CHAIN_ID } from "../../config/chains";
import { okxFetch, okxFetchAll } from "./client";

interface TokenBalance {
  chainIndex: string;
  tokenAddress: string;
  symbol: string;
  balance: string;
  tokenPrice: string;
  tokenType: string;
}

interface TotalValue {
  totalValue: string;
}

export async function getTokenBalances(
  address: string,
  tokenAddresses?: string[],
): Promise<TokenBalance[]> {
  const params: Record<string, string> = {
    address,
    chainIndex: XLAYER_CHAIN_ID,
  };
  if (tokenAddresses?.length) {
    params.tokenAddresses = tokenAddresses.join(",");
  }

  return okxFetchAll<TokenBalance>(
    "/api/v6/dex/balance/token-balances-by-address",
    { params },
  );
}

export async function getAllTokenBalances(
  address: string,
): Promise<TokenBalance[]> {
  return okxFetchAll<TokenBalance>(
    "/api/v6/dex/balance/all-token-balances-by-address",
    { params: { address, chainIndex: XLAYER_CHAIN_ID } },
  );
}

export async function getTotalValue(address: string): Promise<TotalValue> {
  return okxFetch<TotalValue>("/api/v6/dex/balance/total-value", {
    params: { address, chainIndex: XLAYER_CHAIN_ID },
  });
}
