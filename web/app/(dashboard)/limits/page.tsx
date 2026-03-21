"use client";

import { useEffect, useState } from "react";
import { useAccount, useSignMessage } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, Shield } from "lucide-react";
import {
  type AgentPolicy,
  getLimitsForOwner,
  setLimits,
} from "@/lib/api";

const AGENT_ADDRESS =
  process.env.NEXT_PUBLIC_AGENT_ADDRESS ??
  "0x726Cf0C4Fe559DB9A32396161694C7b88C60C947";

const PRESETS = [
  { label: "Conservative", perTx: "5", daily: "25" },
  { label: "Standard", perTx: "25", daily: "100" },
  { label: "Power User", perTx: "100", daily: "500" },
];

export default function LimitsPage() {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const [policy, setPolicy] = useState<AgentPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [perTxLimit, setPerTxLimit] = useState("");
  const [dailyBudget, setDailyBudget] = useState("");
  const [approvalThreshold, setApprovalThreshold] = useState("");
  const [autoSwapEnabled, setAutoSwapEnabled] = useState(true);
  const [swapSlippageTolerance, setSwapSlippageTolerance] = useState("0.01");
  const [allowlistInput, setAllowlistInput] = useState("");

  useEffect(() => {
    async function load() {
      if (!address) return;
      try {
        const res = await getLimitsForOwner(address);
        const existing = res.agents[0];
        if (existing) {
          setPolicy(existing);
          setPerTxLimit(existing.perTxLimit);
          setDailyBudget(existing.dailyBudget);
          setApprovalThreshold(existing.approvalThreshold ?? "");
          setAutoSwapEnabled(existing.autoSwapEnabled);
          setSwapSlippageTolerance(existing.swapSlippageTolerance);
          setAllowlistInput(existing.allowlist.join(", "));
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [address]);

  function applyPreset(preset: (typeof PRESETS)[number]) {
    setPerTxLimit(preset.perTx);
    setDailyBudget(preset.daily);
  }

  async function handleSave() {
    if (!address) return;
    setSaving(true);

    try {
      const message = JSON.stringify({
        agentAddress: AGENT_ADDRESS,
        perTxLimit,
        dailyBudget,
        timestamp: Date.now(),
      });
      const signature = await signMessageAsync({ message });

      const allowlist = allowlistInput
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await setLimits({
        agentAddress: AGENT_ADDRESS,
        perTxLimit,
        dailyBudget,
        allowlist: allowlist.length > 0 ? allowlist : undefined,
        approvalThreshold: approvalThreshold || undefined,
        autoSwapEnabled,
        swapSlippageTolerance,
        humanSignature: signature,
      });
      setPolicy(res);
    } catch {
      // error handled by UI state
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Spend Limits</h1>
        <p className="text-sm text-muted-foreground">
          Configure agent spend policy — enforced on-chain via SpendPolicy.sol
        </p>
      </div>

      {loading ? (
        <div className="space-y-4">
          <Skeleton className="h-48 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Shield className="size-4" />
                Policy Configuration
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                {PRESETS.map((preset) => (
                  <Button
                    key={preset.label}
                    variant="outline"
                    size="sm"
                    onClick={() => applyPreset(preset)}
                  >
                    {preset.label}
                  </Button>
                ))}
              </div>

              <div className="space-y-2">
                <Label htmlFor="perTxLimit">Per-Transaction Limit (USDC)</Label>
                <Input
                  id="perTxLimit"
                  placeholder="25.00"
                  value={perTxLimit}
                  onChange={(e) => setPerTxLimit(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  On-chain hard limit per transaction
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="dailyBudget">Daily Budget (USDC)</Label>
                <Input
                  id="dailyBudget"
                  placeholder="100.00"
                  value={dailyBudget}
                  onChange={(e) => setDailyBudget(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  On-chain daily spending cap, resets at midnight UTC
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="approvalThreshold">
                  Approval Threshold (USDC)
                </Label>
                <Input
                  id="approvalThreshold"
                  placeholder="50.00"
                  value={approvalThreshold}
                  onChange={(e) => setApprovalThreshold(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Off-chain — payments above this require human approval
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="allowlist">
                  Merchant Allowlist (comma-separated URLs)
                </Label>
                <Input
                  id="allowlist"
                  placeholder="https://api.example.com, https://service.io"
                  value={allowlistInput}
                  onChange={(e) => setAllowlistInput(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Auto-Swap Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">Auto-Swap OKB → USDC</p>
                    <p className="text-xs text-muted-foreground">
                      Automatically swap OKB when USDC balance is low
                    </p>
                  </div>
                  <Switch
                    checked={autoSwapEnabled}
                    onCheckedChange={setAutoSwapEnabled}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="slippage">Slippage Tolerance</Label>
                  <Input
                    id="slippage"
                    placeholder="0.01"
                    value={swapSlippageTolerance}
                    onChange={(e) => setSwapSlippageTolerance(e.target.value)}
                    disabled={!autoSwapEnabled}
                  />
                  <p className="text-xs text-muted-foreground">
                    Max slippage for OKB→USDC swaps (e.g. 0.01 = 1%)
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Current Policy</CardTitle>
              </CardHeader>
              <CardContent>
                {policy ? (
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Per-Tx Limit</span>
                      <span className="font-mono">${policy.perTxLimit}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Daily Budget</span>
                      <span className="font-mono">${policy.dailyBudget}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Approval Gate</span>
                      <span className="font-mono">
                        {policy.approvalThreshold
                          ? `$${policy.approvalThreshold}`
                          : "None"}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Auto-Swap</span>
                      <Badge variant={policy.autoSwapEnabled ? "default" : "secondary"}>
                        {policy.autoSwapEnabled ? "Enabled" : "Disabled"}
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Contract</span>
                      <code className="text-xs">
                        {policy.policyContract.slice(0, 10)}...
                      </code>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No policy set yet — configure and save to activate
                  </p>
                )}
              </CardContent>
            </Card>

            <Button
              className="w-full"
              onClick={handleSave}
              disabled={saving || !perTxLimit || !dailyBudget}
            >
              {saving ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  Signing & Saving...
                </>
              ) : (
                "Sign & Save Policy"
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
