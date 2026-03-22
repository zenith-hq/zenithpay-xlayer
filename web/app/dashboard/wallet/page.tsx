"use client";

import { useEffect, useState } from "react";
import { useConnection } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink } from "lucide-react";
import { type BalanceResult, getBalance } from "@/lib/api";
import { useAgent } from "@/components/dashboard/agent-context";

const EXPLORER_URL = "https://www.oklink.com/xlayer";

function shortenAddress(addr: string): string {
  return `${addr.slice(0, 8)}...${addr.slice(-6)}`;
}

export default function WalletPage() {
  const { address } = useConnection();
  const { agentAddress: AGENT_ADDRESS } = useAgent();
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
  }, [AGENT_ADDRESS]);

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
        <Card className="rounded-none border">
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase tracking-wider">
              Agent Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-0">
            <div className="flex items-center justify-between border-b border-dashed py-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Address
              </span>
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono">
                  {shortenAddress(AGENT_ADDRESS)}
                </code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5 rounded-none"
                  onClick={() => copyToClipboard(AGENT_ADDRESS, "agent")}
                >
                  <Copy className="size-3" />
                </Button>
                {copied === "agent" && (
                  <span className="text-[10px] text-muted-foreground">Copied</span>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between border-b border-dashed py-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Network
              </span>
              <span className="text-xs font-mono">X Layer (196)</span>
            </div>

            <div className="flex items-center justify-between border-b border-dashed py-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Type
              </span>
              <Badge variant="outline" className="rounded-none text-xs font-mono">
                OKX TEE Wallet
              </Badge>
            </div>

            <div className="flex items-center justify-between py-3">
              <span className="text-xs text-muted-foreground uppercase tracking-wider">
                Explorer
              </span>
              <a
                href={`${EXPLORER_URL}/address/${AGENT_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                View on OKLink
                <ExternalLink className="size-3" />
              </a>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border">
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase tracking-wider">
              Balances
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading ? (
              <>
                <Skeleton className="h-14 w-full rounded-none" />
                <Skeleton className="h-14 w-full rounded-none" />
              </>
            ) : (
              <>
                <div className="flex items-center justify-between border p-3">
                  <div>
                    <p className="text-sm font-medium">USDC</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Stablecoin
                    </p>
                  </div>
                  <p className="text-lg font-bold font-mono">
                    ${balance?.usdcBalance ?? "0.00"}
                  </p>
                </div>

                <div className="flex items-center justify-between border p-3">
                  <div>
                    <p className="text-sm font-medium">OKB</p>
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                      Native gas token
                    </p>
                  </div>
                  <p className="text-lg font-bold font-mono">
                    {balance?.okbBalance ?? "0.00"} OKB
                  </p>
                </div>

                {balance?.remainingDailyBudget && (
                  <div className="flex items-center justify-between border border-dashed p-3">
                    <div>
                      <p className="text-sm font-medium">Daily Budget Left</p>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider">
                        Resets at midnight UTC
                      </p>
                    </div>
                    <p className="text-lg font-bold font-mono">
                      ${balance.remainingDailyBudget}
                    </p>
                  </div>
                )}

                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="rounded-none text-xs"
                    onClick={() => copyToClipboard(AGENT_ADDRESS, "fund")}
                  >
                    {copied === "fund" ? (
                      "Address copied"
                    ) : (
                      <>
                        <Copy className="size-3 mr-1" />
                        Copy address to fund
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {address && (
        <Card className="rounded-none border">
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase tracking-wider">
              Connected Wallet (Owner)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <code className="text-xs font-mono">{shortenAddress(address)}</code>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-5 rounded-none"
                  onClick={() => copyToClipboard(address, "owner")}
                >
                  <Copy className="size-3" />
                </Button>
                {copied === "owner" && (
                  <span className="text-[10px] text-muted-foreground">Copied</span>
                )}
              </div>
              <Badge variant="outline" className="rounded-none text-xs font-mono">
                Owner / Policy Signer
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
