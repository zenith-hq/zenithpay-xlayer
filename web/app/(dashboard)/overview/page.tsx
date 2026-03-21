"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
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

export default function OverviewPage() {
  const { address } = useAccount();
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Overview</h1>
        <p className="text-sm text-muted-foreground">
          Agent wallet and spend policy summary
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">USDC Balance</CardTitle>
            <Wallet className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <p className="text-2xl font-bold">
                ${balance?.usdcBalance ?? "0.00"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">OKB Balance</CardTitle>
            <CreditCard className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <p className="text-2xl font-bold">
                {balance?.okbBalance ?? "0.00"} OKB
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Daily Budget</CardTitle>
            <Shield className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-24" />
            ) : (
              <p className="text-2xl font-bold">
                ${policy?.dailyBudget ?? "—"}
              </p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Transactions</CardTitle>
            <ScrollText className="size-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-7 w-16" />
            ) : (
              <p className="text-2xl font-bold">{transactions.length}</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Agent Wallet</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Address</span>
              <code className="text-xs">{AGENT_ADDRESS}</code>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Network</span>
              <span className="text-sm">X Layer (196)</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Type</span>
              <Badge variant="secondary">OKX TEE Wallet</Badge>
            </div>
            <Link
              href="/wallet"
              className="inline-block text-sm text-primary underline-offset-4 hover:underline"
            >
              View wallet details
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent Activity</CardTitle>
            <Link
              href="/ledger"
              className="text-sm text-primary underline-offset-4 hover:underline"
            >
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={`skel-${i}`} className="h-8 w-full" />
                ))}
              </div>
            ) : recentTx.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No transactions yet
              </p>
            ) : (
              <div className="space-y-2">
                {recentTx.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between rounded-md border p-2 text-sm"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant={
                          tx.status === "approved"
                            ? "default"
                            : tx.status === "blocked"
                              ? "destructive"
                              : "secondary"
                        }
                        className="text-xs"
                      >
                        {tx.status}
                      </Badge>
                      <span className="truncate max-w-[120px]">
                        {tx.merchant}
                      </span>
                    </div>
                    <span className="font-mono text-xs">
                      ${tx.amount}
                    </span>
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
