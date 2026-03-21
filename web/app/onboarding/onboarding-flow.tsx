"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useConnect, useConnection, useConnectors, useSignMessage } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LogoMark } from "@/components/logo-mark";
import {
  Check,
  ChevronRight,
  Copy,
  Loader2,
  Shield,
  Wallet,
} from "lucide-react";
import { setLimits } from "@/lib/api";

type Step = "connect" | "policy" | "signing" | "fund" | "done";

const PRESETS = {
  conservative: {
    label: "Conservative",
    description: "$0.10 per tx, $1 daily",
    perTxLimit: "0.10",
    dailyBudget: "1.00",
    approvalThreshold: "0.05",
  },
  balanced: {
    label: "Balanced",
    description: "$0.25 per tx, $3 daily",
    perTxLimit: "0.25",
    dailyBudget: "3.00",
    approvalThreshold: "0.10",
  },
  open: {
    label: "Open",
    description: "$1 per tx, $10 daily",
    perTxLimit: "1.00",
    dailyBudget: "10.00",
    approvalThreshold: "0.50",
  },
} as const;

const XLAYER_USDC = "0x74b7f16337b8972027f6196a17a631ac6de26d22";

export function OnboardingFlow() {
  const searchParams = useSearchParams();
  const agentAddress = searchParams.get("agent");

  const { address, isConnected } = useConnection();
  const { mutate: connect, isPending: connectPending } = useConnect();
  const connectors = useConnectors();
  const { signMessageAsync } = useSignMessage();

  const [step, setStep] = useState<Step>(isConnected ? "policy" : "connect");

  useEffect(() => {
    if (isConnected && step === "connect") {
      setStep("policy");
    }
  }, [isConnected, step]);
  const [selectedPreset, setSelectedPreset] =
    useState<keyof typeof PRESETS>("balanced");
  const [perTxLimit, setPerTxLimit] = useState<string>(PRESETS.balanced.perTxLimit);
  const [dailyBudget, setDailyBudget] = useState<string>(PRESETS.balanced.dailyBudget);
  const [approvalThreshold, setApprovalThreshold] = useState<string>(
    PRESETS.balanced.approvalThreshold,
  );
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function handleConnect() {
    connect({ connector: connectors[0] });
  }

  function applyPreset(key: keyof typeof PRESETS) {
    setSelectedPreset(key);
    setPerTxLimit(PRESETS[key].perTxLimit);
    setDailyBudget(PRESETS[key].dailyBudget);
    setApprovalThreshold(PRESETS[key].approvalThreshold);
  }

  async function handleSign() {
    if (!agentAddress || !address) return;
    setSigning(true);
    setError(null);

    try {
      const message = JSON.stringify({
        agentAddress,
        perTxLimit,
        dailyBudget,
        timestamp: Date.now(),
      });
      const signature = await signMessageAsync({ message });

      setStep("signing");

      await setLimits({
        agentAddress,
        perTxLimit,
        dailyBudget,
        approvalThreshold,
        autoSwapEnabled: true,
        swapSlippageTolerance: "0.01",
        humanSignature: signature,
      });

      setStep("fund");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to set policy");
      setStep("policy");
    } finally {
      setSigning(false);
    }
  }

  function copyAddress() {
    if (!agentAddress) return;
    navigator.clipboard.writeText(agentAddress);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!agentAddress) {
    return (
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <p className="text-sm text-muted-foreground">
            Missing agent address. Use the deep link from your agent terminal:
          </p>
          <code className="mt-2 block text-xs">
            usezenithpay.xyz/onboarding?agent=0x...
          </code>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full max-w-lg space-y-6">
      <div className="text-center space-y-2">
        <LogoMark className="mx-auto size-8" />
        <h1 className="text-2xl font-semibold tracking-tight">
          Activate Your Agent
        </h1>
        <p className="text-sm text-muted-foreground">
          Set a spend policy to enable your agent to transact
        </p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm font-medium">Agent Detected</CardTitle>
            <Badge variant="outline">X Layer (196)</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <code className="text-xs break-all">{agentAddress}</code>
        </CardContent>
      </Card>

      {/* Progress */}
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <span
          className={step === "connect" ? "text-foreground font-medium" : ""}
        >
          Connect
        </span>
        <ChevronRight className="size-3" />
        <span
          className={step === "policy" ? "text-foreground font-medium" : ""}
        >
          Policy
        </span>
        <ChevronRight className="size-3" />
        <span className={step === "fund" ? "text-foreground font-medium" : ""}>
          Fund
        </span>
        <ChevronRight className="size-3" />
        <span className={step === "done" ? "text-foreground font-medium" : ""}>
          Done
        </span>
      </div>

      {/* Step 1: Connect */}
      {step === "connect" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Wallet className="size-4" />
              Connect Wallet
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Connect your EOA wallet to sign the spend policy. This wallet
              becomes the policy owner — only you can modify the agent&apos;s
              limits.
            </p>
            <Button
              className="w-full"
              onClick={handleConnect}
              disabled={connectPending}
            >
              {connectPending ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Connecting...
                </>
              ) : (
                "Connect Wallet"
              )}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Supports OKX Wallet or any EIP-6963 compatible wallet
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 2: Policy */}
      {step === "policy" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Shield className="size-4" />
              Set Spend Policy
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(PRESETS) as (keyof typeof PRESETS)[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  className={`rounded-md border p-3 text-left transition-colors ${
                    selectedPreset === key
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => applyPreset(key)}
                >
                  <p className="text-sm font-medium">{PRESETS[key].label}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {PRESETS[key].description}
                  </p>
                </button>
              ))}
            </div>

            <div className="space-y-3 pt-2">
              <div className="space-y-1">
                <Label htmlFor="perTx" className="text-xs">
                  Per-Transaction Limit (USDC)
                </Label>
                <Input
                  id="perTx"
                  value={perTxLimit}
                  onChange={(e) => setPerTxLimit(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="daily" className="text-xs">
                  Daily Budget (USDC)
                </Label>
                <Input
                  id="daily"
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(e.target.value)}
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="threshold" className="text-xs">
                  Approval Threshold (USDC)
                </Label>
                <Input
                  id="threshold"
                  value={approvalThreshold}
                  onChange={(e) => setApprovalThreshold(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Payments above this amount require your manual approval
                </p>
              </div>
            </div>

            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            <Button
              className="w-full"
              onClick={handleSign}
              disabled={signing || !perTxLimit || !dailyBudget}
            >
              {signing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing...
                </>
              ) : (
                "Sign & Activate Policy"
              )}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              This deploys the policy onchain — ZenithPay cannot override it
            </p>
          </CardContent>
        </Card>
      )}

      {/* Step 2.5: Signing in progress */}
      {step === "signing" && (
        <Card>
          <CardContent className="py-8 text-center space-y-3">
            <Loader2 className="mx-auto size-6 animate-spin" />
            <p className="text-sm">Deploying spend policy to X Layer...</p>
          </CardContent>
        </Card>
      )}

      {/* Step 3: Fund */}
      {step === "fund" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Check className="size-4 text-green-500" />
              Policy Activated
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Your agent can now transact within the limits you set. Fund the
              agent wallet to start:
            </p>

            <div className="rounded-md border p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">
                  Agent address
                </span>
                <button
                  type="button"
                  className="flex items-center gap-1 text-xs text-primary hover:underline"
                  onClick={copyAddress}
                >
                  {copied ? "Copied" : "Copy"}
                  <Copy className="size-3" />
                </button>
              </div>
              <code className="text-xs break-all block">{agentAddress}</code>
            </div>

            <div className="text-sm space-y-1">
              <p>
                <span className="text-muted-foreground">Network:</span> X Layer
                mainnet (chain ID 196)
              </p>
              <p>
                <span className="text-muted-foreground">USDC:</span>{" "}
                <code className="text-xs">{XLAYER_USDC}</code>
              </p>
              <p>
                <span className="text-muted-foreground">Gas:</span> Send a small
                amount of OKB for transaction fees
              </p>
            </div>

            <Button className="w-full" onClick={() => setStep("done")}>
              I&apos;ve funded the wallet
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Step 4: Done */}
      {step === "done" && (
        <Card>
          <CardContent className="py-8 text-center space-y-4">
            <div className="mx-auto flex size-12 items-center justify-center rounded-full bg-green-500/10">
              <Check className="size-6 text-green-500" />
            </div>
            <div>
              <h2 className="text-lg font-semibold">Agent Activated</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Return to your agent terminal and continue. The agent will
                verify the policy is active.
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" asChild>
                <a href="/overview">Open Dashboard</a>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
