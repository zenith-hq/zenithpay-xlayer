"use client";

import { useEffect, useState } from "react";
import { useConnection } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { CreditCard, ScrollText, Shield, Wallet } from "lucide-react";
import Link from "next/link";
import {
  type AgentPolicy,
  type BalanceResult,
  type LedgerEntry,
  getBalance,
  getLedger,
  getLimitsForOwner,
} from "@/lib/api";

const AGENT_ADDRESS =
  process.env.NEXT_PUBLIC_AGENT_ADDRESS ??
  "0x726Cf0C4Fe559DB9A32396161694C7b88C60C947";

function statusBadgeClass(status: LedgerEntry["status"]): string {
  switch (status) {
    case "approved":
      return "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400";
    case "blocked":
    case "denied":
      return "border-red-600 bg-red-500/10 text-red-700 dark:text-red-400";
    default:
      return "border-amber-600 bg-amber-500/10 text-amber-700 dark:text-amber-400";
  }
}

export default function DashboardPage() {
  const { address } = useConnection();
  const [balance, setBalance] = useState<BalanceResult | null>(null);
  const [policies, setPolicies] = useState<AgentPolicy[]>([]);
  const [transactions, setTransactions] = useState<LedgerEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [balRes, limRes, ledRes] = await Promise.allSettled([
          getBalance(AGENT_ADDRESS),
          address ? getLimitsForOwner(address) : Promise.resolve({ agents: [] }),
          getLedger(AGENT_ADDRESS),
        ]);
        if (balRes.status === "fulfilled") setBalance(balRes.value);
        if (limRes.status === "fulfilled") setPolicies(limRes.value.agents);
        if (ledRes.status === "fulfilled")
          setTransactions(ledRes.value.transactions);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [address]);

  const policy = policies[0];
  const recentTx = transactions.slice(0, 5);
  const pendingCount = transactions.filter((t) => t.status === "pending").length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Agent wallet and spend policy summary
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="rounded-none border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              USDC Balance
            </CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-24 rounded-none" />
            ) : (
              <p className="text-2xl font-bold font-mono">
                ${balance?.usdcBalance ?? "0.00"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-none border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Daily Budget
            </CardTitle>
            <Shield className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-24 rounded-none" />
            ) : (
              <p className="text-2xl font-bold font-mono">
                ${policy?.dailyBudget ?? "—"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-none border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Pending Approvals
            </CardTitle>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-16 rounded-none" />
            ) : (
              <div className="flex items-center gap-2">
                <p className="text-2xl font-bold font-mono">{pendingCount}</p>
                {pendingCount > 0 && (
                  <Link
                    href="/dashboard/approvals"
                    className="text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
                  >
                    review
                  </Link>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-none border">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
              Total Transactions
            </CardTitle>
            <ScrollText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-16 rounded-none" />
            ) : (
              <p className="text-2xl font-bold font-mono">{transactions.length}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-none border">
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase tracking-wider">
              Agent Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between border-b border-dashed pb-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Address
              </span>
              <code className="text-xs font-mono">
                {AGENT_ADDRESS.slice(0, 8)}...{AGENT_ADDRESS.slice(-6)}
              </code>
            </div>
            <div className="flex items-center justify-between border-b border-dashed pb-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Network
              </span>
              <span className="text-xs font-mono">X Layer (196)</span>
            </div>
            <div className="flex items-center justify-between border-b border-dashed pb-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Type
              </span>
              <Badge
                variant="outline"
                className="rounded-none text-xs font-mono"
              >
                OKX TEE Wallet
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                OKB Balance
              </span>
              {loading ? (
                <Skeleton className="h-4 w-16 rounded-none" />
              ) : (
                <span className="text-xs font-mono">
                  {balance?.okbBalance ?? "0.00"} OKB
                </span>
              )}
            </div>
            <Link
              href="/dashboard/wallet"
              className="inline-block pt-2 text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              View wallet details →
            </Link>
          </CardContent>
        </Card>

        <Card className="rounded-none border">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-sm font-medium uppercase tracking-wider">
              Recent Activity
            </CardTitle>
            <Link
              href="/dashboard/ledger"
              className="text-xs text-muted-foreground underline underline-offset-4 hover:text-foreground"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={`skel-${i}`} className="h-8 w-full rounded-none" />
                ))}
              </div>
            ) : recentTx.length === 0 ? (
              <div className="border border-dashed p-6 text-center">
                <p className="text-xs text-muted-foreground">
                  No transactions yet
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentTx.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between border p-2 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`inline-flex items-center border px-1.5 py-0.5 font-mono text-[10px] ${statusBadgeClass(tx.status)}`}
                      >
                        {tx.status}
                      </span>
                      <span className="truncate max-w-[120px] font-mono">
                        {tx.merchant}
                      </span>
                    </div>
                    <span className="font-mono">${tx.amount}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
