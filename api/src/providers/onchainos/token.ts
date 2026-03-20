import { XLAYER_CHAIN_ID } from "../../config/chains";
import { okxFetch, okxFetchAll } from "./client";

interface TokenInfo {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  decimals: string;
  totalSupply: string;
  logoUrl: string;
}

interface TokenSearchResult {
  tokenAddress: string;
  tokenSymbol: string;
  tokenName: string;
  chainIndex: string;
}

interface SecurityInfo {
  riskLevel: string;
  isHoneypot: boolean;
  hasMintFunction: boolean;
  canTakeBackOwnership: boolean;
  transferPausable: boolean;
}

export async function searchToken(
  keyword: string,
): Promise<TokenSearchResult[]> {
  return okxFetchAll<TokenSearchResult>("/api/v6/dex/token/search", {
    params: { chainIndex: XLAYER_CHAIN_ID, keyword },
  });
}

export async function getTokenInfo(tokenAddress: string): Promise<TokenInfo> {
  return okxFetch<TokenInfo>("/api/v6/dex/token/token-info", {
    params: { chainIndex: XLAYER_CHAIN_ID, tokenContractAddress: tokenAddress },
  });
}

export async function getTokenSecurity(
  tokenAddress: string,
): Promise<SecurityInfo> {
  return okxFetch<SecurityInfo>("/api/v6/dex/token/token-advanced-info", {
    params: { chainIndex: XLAYER_CHAIN_ID, tokenContractAddress: tokenAddress },
  });
}

export async function getTrendingTokens(): Promise<TokenSearchResult[]> {
  return okxFetchAll<TokenSearchResult>("/api/v6/dex/token/trending", {
    params: { chainIndex: XLAYER_CHAIN_ID },
  });
}
