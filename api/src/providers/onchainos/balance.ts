import { XLAYER_CHAIN_ID } from "../../config/chains";
import { okxFetchAll } from "./client";

export interface TokenBalance {
  chainIndex: string;
  tokenContractAddress: string;
  symbol: string;
  balance: string;
  rawBalance: string;
  tokenPrice: string;
  isRiskToken: boolean;
  address: string;
}

interface BalanceWrapper {
  tokenAssets: TokenBalance[];
}

interface TotalValueWrapper {
  totalValue: string;
}

export async function getTokenBalances(
  address: string,
  tokenAddresses?: string[],
): Promise<TokenBalance[]> {
  if (tokenAddresses?.length) {
    const tokenContractAddresses = tokenAddresses
      .filter((addr) => addr !== "0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee")
      .map((addr) => ({
        chainIndex: XLAYER_CHAIN_ID,
        tokenContractAddress: addr,
      }));

    tokenContractAddresses.push({
      chainIndex: XLAYER_CHAIN_ID,
      tokenContractAddress: "",
    });

    const wrappers = await okxFetchAll<BalanceWrapper>(
      "/api/v6/dex/balance/token-balances-by-address",
      {
        method: "POST",
        body: {
          address,
          tokenContractAddresses,
        },
      },
    );
    return wrappers.flatMap((w) => w.tokenAssets ?? []);
  }

  const wrappers = await okxFetchAll<BalanceWrapper>(
    "/api/v6/dex/balance/all-token-balances-by-address",
    { params: { address, chains: XLAYER_CHAIN_ID } },
  );
  return wrappers.flatMap((w) => w.tokenAssets ?? []);
}

export async function getAllTokenBalances(
  address: string,
): Promise<TokenBalance[]> {
  const wrappers = await okxFetchAll<BalanceWrapper>(
    "/api/v6/dex/balance/all-token-balances-by-address",
    { params: { address, chains: XLAYER_CHAIN_ID } },
  );
  return wrappers.flatMap((w) => w.tokenAssets ?? []);
}

export async function getTotalValue(address: string): Promise<string> {
  const wrappers = await okxFetchAll<TotalValueWrapper>(
    "/api/v6/dex/balance/total-value-by-address",
    { params: { address, chains: XLAYER_CHAIN_ID } },
  );
  return wrappers[0]?.totalValue ?? "0";
}
