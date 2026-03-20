import { XLAYER_CHAIN_ID } from "../../config/chains";
import { okxFetch } from "./client";

interface TokenPrice {
  price: string;
  time: string;
}

export async function getTokenPrice(tokenAddress: string): Promise<TokenPrice> {
  return okxFetch<TokenPrice>("/api/v6/dex/market/price", {
    params: {
      chainIndex: XLAYER_CHAIN_ID,
      tokenContractAddress: tokenAddress,
    },
  });
}

interface PortfolioOverview {
  totalValue: string;
  chainDistribution: Record<string, string>;
}

export async function getPortfolioOverview(
  address: string,
): Promise<PortfolioOverview> {
  return okxFetch<PortfolioOverview>("/api/v6/dex/balance/total-value", {
    params: { address, chainIndex: XLAYER_CHAIN_ID },
  });
}
