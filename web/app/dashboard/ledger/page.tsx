"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useAgent } from "@/components/dashboard/agent-context";

const EXPLORER_URL = "https://www.oklink.com/xlayer";

function StatusBadge({ status }: { status: LedgerEntry["status"] }) {
  const cls =
    status === "approved"
      ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
      : status === "blocked" || status === "denied"
        ? "border-red-600 bg-red-500/10 text-red-700 dark:text-red-400"
        : "border-amber-600 bg-amber-500/10 text-amber-700 dark:text-amber-400";

  return (
    <span className={`inline-flex border px-1.5 py-0.5 font-mono text-[10px] ${cls}`}>
      {status}
    </span>
  );
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
  const { agentAddress } = useAgent();
  const [transactions, setTransactions] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await getLedger(agentAddress);
        setTransactions(res.transactions);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [agentAddress]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Ledger</h1>
        <p className="text-sm text-muted-foreground">
          Complete transaction audit trail for the agent
        </p>
      </div>

      <Card className="rounded-none border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider">
            <ScrollText className="size-4" />
            Transactions{" "}
            <span className="font-mono text-muted-foreground">
              ({loading ? "..." : transactions.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="space-y-px p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={`skel-${i}`} className="h-10 w-full rounded-none" />
              ))}
            </div>
          ) : transactions.length === 0 ? (
            <div className="border-t border-dashed m-4 p-6 text-center">
              <p className="text-xs text-muted-foreground">
                No transactions recorded yet
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-b hover:bg-transparent">
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground h-8">
                    Date
                  </TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground h-8">
                    Merchant
                  </TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground h-8">
                    Amount
                  </TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground h-8">
                    Intent
                  </TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground h-8">
                    Status
                  </TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground h-8">
                    Swap
                  </TableHead>
                  <TableHead className="text-[10px] uppercase tracking-wider text-muted-foreground h-8">
                    Tx
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => (
                  <TableRow key={tx.id} className="border-b">
                    <TableCell className="text-[10px] text-muted-foreground font-mono py-2">
                      {formatDate(tx.createdAt)}
                    </TableCell>
                    <TableCell className="py-2">
                      <span className="truncate max-w-[140px] block text-xs font-mono">
                        {tx.merchant}
                      </span>
                    </TableCell>
                    <TableCell className="font-mono text-xs py-2">
                      ${tx.amount} {tx.currency}
                    </TableCell>
                    <TableCell className="py-2">
                      <span className="truncate max-w-[120px] block text-[10px] text-muted-foreground">
                        {tx.intent ?? "—"}
                      </span>
                    </TableCell>
                    <TableCell className="py-2">
                      <StatusBadge status={tx.status} />
                    </TableCell>
                    <TableCell className="py-2">
                      {tx.swapUsed ? (
                        <span className="border border-dashed px-1.5 py-0.5 font-mono text-[10px]">
                          {tx.okbSpent} OKB
                        </span>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell className="py-2">
                      {tx.txHash ? (
                        <a
                          href={`${EXPLORER_URL}/tx/${tx.txHash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1 text-[10px] font-mono text-muted-foreground hover:text-foreground"
                        >
                          {tx.txHash.slice(0, 8)}...
                          <ExternalLink className="size-2.5" />
                        </a>
                      ) : (
                        <span className="text-[10px] text-muted-foreground">—</span>
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
