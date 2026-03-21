"use client";

import { useEffect, useState } from "react";
import { useAccount } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Wallet } from "lucide-react";
import { type BalanceResult, getBalance } from "@/lib/api";

const AGENT_ADDRESS =
  process.env.NEXT_PUBLIC_AGENT_ADDRESS ??
  "0x726Cf0C4Fe559DB9A32396161694C7b88C60C947";

const EXPLORER_URL = "https://www.oklink.com/xlayer";

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
}

export default function WalletPage() {
  const { address } = useAccount();
  const [balance, setBalance] = useState<BalanceResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      try {
        const res = await getBalance(AGENT_ADDRESS);
        setBalance(res);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Wallet</h1>
        <p className="text-sm text-muted-foreground">
          Agent wallet details and balances on X Layer
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="size-4" />
              Agent Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Address</span>
                <div className="flex items-center gap-2">
                  <code className="text-xs">{shortenAddress(AGENT_ADDRESS)}</code>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="size-6"
                    onClick={() => copyToClipboard(AGENT_ADDRESS, "agent")}
                  >
                    <Copy className="size-3" />
                  </Button>
                  {copied === "agent" && (
                    <span className="text-xs text-muted-foreground">Copied</span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Network</span>
                <span className="text-sm">X Layer (196)</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Type</span>
                <Badge variant="secondary">OKX TEE Wallet</Badge>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Explorer</span>
                <a
                  href={`${EXPLORER_URL}/address/${AGENT_ADDRESS}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1 text-sm text-primary underline-offset-4 hover:underline"
                >
                  View on OKLink
                  <ExternalLink className="size-3" />
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Balances</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {loading ? (
              <div className="space-y-3">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">USDC</p>
                    <p className="text-xs text-muted-foreground">Stablecoin</p>
                  </div>
                  <p className="text-lg font-bold font-mono">
                    ${balance?.usdcBalance ?? "0.00"}
                  </p>
                </div>

                <div className="flex items-center justify-between rounded-md border p-3">
                  <div>
                    <p className="text-sm font-medium">OKB</p>
                    <p className="text-xs text-muted-foreground">Native gas token</p>
                  </div>
                  <p className="text-lg font-bold font-mono">
                    {balance?.okbBalance ?? "0.00"} OKB
                  </p>
                </div>

                {balance?.remainingDailyBudget && (
                  <div className="flex items-center justify-between rounded-md border border-dashed p-3">
                    <div>
                      <p className="text-sm font-medium">Daily Budget Left</p>
                      <p className="text-xs text-muted-foreground">Resets at midnight UTC</p>
                    </div>
                    <p className="text-lg font-bold font-mono">
                      ${balance.remainingDailyBudget}
                    </p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {address && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Connected Wallet (Owner)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <code className="text-xs">{shortenAddress(address)}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-6"
                  onClick={() => copyToClipboard(address, "owner")}
                >
                  <Copy className="size-3" />
                </Button>
                {copied === "owner" && (
                  <span className="text-xs text-muted-foreground">Copied</span>
                )}
              </div>
              <Badge variant="outline">Owner / Policy Signer</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
