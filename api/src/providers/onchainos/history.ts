import { XLAYER_CHAIN_ID } from "../../config/chains";
import { okxFetchAll } from "./client";

interface TransactionRecord {
  txHash: string;
  from: string;
  to: string;
  value: string;
  tokenAddress: string;
  symbol: string;
  status: string;
  timestamp: string;
  blockNumber: string;
  gasUsed: string;
}

export async function getTransactionHistory(
  address: string,
  limit: string = "20",
): Promise<TransactionRecord[]> {
  return okxFetchAll<TransactionRecord>(
    "/api/v6/dex/transaction/transaction-list",
    {
      params: {
        chainIndex: XLAYER_CHAIN_ID,
        address,
        limit,
      },
    },
  );
}

export async function getTransactionDetail(
  txHash: string,
): Promise<TransactionRecord> {
  const results = await okxFetchAll<TransactionRecord>(
    "/api/v6/dex/transaction/transaction-detail",
    { params: { chainIndex: XLAYER_CHAIN_ID, txHash } },
  );
  return results[0];
}
