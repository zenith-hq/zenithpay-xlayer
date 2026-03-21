"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ExternalLink, ScrollText } from "lucide-react";
import { type LedgerEntry, getLedger } from "@/lib/api";

const AGENT_ADDRESS =
  process.env.NEXT_PUBLIC_AGENT_ADDRESS ??
  "0x726Cf0C4Fe559DB9A32396161694C7b88C60C947";

const EXPLORER_URL = "https://www.oklink.com/xlayer";

function statusVariant(status: LedgerEntry["status"]) {
  switch (status) {
    case "approved":
      return "default" as const;
    case "blocked":
      return "destructive" as const;
    case "denied":
      return "destructive" as const;
    default:
      return "secondary" as const;
  }
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function LedgerPage() {
  const [transactions, setTransactions] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getLedger(AGENT_ADDRESS);
        setTransactions(res.transactions);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ledger</h1>
        <p className="text-sm text-muted-foreground">
          Complete transaction audit trail for the agent
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ScrollText className="size-4" />
            Transactions ({loading ? "..." : transactions.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={`skel-${i}`} className="h-10 w-full" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No transactions recorded yet
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Merchant</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Swap</TableHead>
                  <TableHead>Tx</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id}>
                    <TableCell className="text-xs text-muted-foreground">
                      {formatDate(tx.createdAt)}
                    </TableCell>
                    <TableCell>
                      <span className="truncate max-w-[160px] block text-sm">
                        {tx.merchant}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      ${tx.amount} {tx.currency}
                    </TableCell>
                    <TableCell>
                      <Badge variant={statusVariant(tx.status)} className="text-xs">
                        {tx.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {tx.swapUsed ? (
                        <Badge variant="outline" className="text-xs">
                          {tx.okbSpent} OKB
                        </Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {tx.txHash ? (
                        <a
                          href={`${EXPLORER_URL}/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-xs text-primary hover:underline"
                        >
                          {tx.txHash.slice(0, 8)}...
                          <ExternalLink className="size-3" />
                        </a>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
