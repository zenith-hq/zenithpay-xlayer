"use client";

import { useEffect, useState } from "react";
import { useConnection, useSignMessage } from "wagmi";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertTriangle,
  Copy,
  ExternalLink,
  Eye,
  EyeOff,
  Loader2,
  Settings,
} from "lucide-react";
import {
  type AgentPolicy,
  getLimitsForOwner,
  setLimits,
} from "@/lib/api";
import { useAgent } from "@/components/dashboard/agent-context";

const EXPLORER_URL = "https://www.oklink.com/xlayer";
const SPEND_POLICY_ADDRESS =
  process.env.NEXT_PUBLIC_SPEND_POLICY_ADDRESS ??
  "0xF5875F25ccEB2edDc57F218eaF1F71c5CF161f21";

export default function SettingsPage() {
  const { address } = useConnection();
  const { agentAddress: AGENT_ADDRESS } = useAgent();
  const { signMessageAsync } = useSignMessage();
  const [policy, setPolicy] = useState<AgentPolicy | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [autoSwapEnabled, setAutoSwapEnabled] = useState(true);
  const [swapSlippageTolerance, setSwapSlippageTolerance] = useState("0.01");

  const [copied, setCopied] = useState<string | null>(null);
  const [showKey, setShowKey] = useState(false);

  useEffect(() => {
    async function load() {
      if (!address) return;
      try {
        const res = await getLimitsForOwner(address);
        const existing = res.agents[0];
        if (existing) {
          setPolicy(existing);
          setAutoSwapEnabled(existing.autoSwapEnabled);
          setSwapSlippageTolerance(existing.swapSlippageTolerance);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [address]);

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  async function handleSaveSwapSettings() {
    if (!address || !policy) return;
    setSaving(true);
    setSaveError(null);
    setSaved(false);

    try {
      const message = JSON.stringify({
        agentAddress: AGENT_ADDRESS,
        autoSwapEnabled,
        swapSlippageTolerance,
        timestamp: Date.now(),
      });
      const signature = await signMessageAsync({ message });

      const res = await setLimits({
        agentAddress: AGENT_ADDRESS,
        perTxLimit: policy.perTxLimit,
        dailyBudget: policy.dailyBudget,
        allowlist: policy.allowlist,
        approvalThreshold: policy.approvalThreshold ?? undefined,
        autoSwapEnabled,
        swapSlippageTolerance,
        humanSignature: signature,
      });
      setPolicy(res);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setSaving(false);
    }
  }

  const maskedKey = "zpk_••••••••••••••••••••••••••••••••";
  const curlCommand = `curl https://api.usezenithpay.xyz/skill.md`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Agent configuration, auto-swap, and API access
        </p>
      </div>

      <Card className="rounded-none border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider">
            <Settings className="size-4" />
            Agent Configuration
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-0">
          <div className="flex items-center justify-between border-b border-dashed py-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Agent Address
            </span>
            <div className="flex items-center gap-2">
              <code className="text-xs font-mono">
                {AGENT_ADDRESS.slice(0, 10)}...{AGENT_ADDRESS.slice(-8)}
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
            <div className="flex items-center gap-2">
              <span className="text-xs font-mono">X Layer mainnet</span>
              <Badge variant="outline" className="rounded-none text-[10px] font-mono">
                chain 196
              </Badge>
            </div>
          </div>

          <div className="flex items-center justify-between border-b border-dashed py-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              Wallet Type
            </span>
            <Badge variant="outline" className="rounded-none text-xs font-mono">
              OKX TEE Wallet
            </Badge>
          </div>

          <div className="flex items-center justify-between py-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wider">
              SpendPolicy Contract
            </span>
            {loading ? (
              <Skeleton className="h-4 w-32 rounded-none" />
            ) : (
              <a
                href={`${EXPLORER_URL}/address/${policy?.policyContract ?? SPEND_POLICY_ADDRESS}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs font-mono text-muted-foreground hover:text-foreground underline underline-offset-4"
              >
                {(policy?.policyContract ?? SPEND_POLICY_ADDRESS).slice(0, 10)}...
                {(policy?.policyContract ?? SPEND_POLICY_ADDRESS).slice(-8)}
                <ExternalLink className="size-2.5" />
              </a>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-none border">
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-wider">
            Auto-Swap Settings
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border border-dashed p-3 text-xs text-muted-foreground">
            Auto-swap exchanges OKB for USDC when the agent wallet has
            insufficient USDC. Only the exact amount needed is swapped.
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Auto-Swap OKB → USDC</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Automatically acquire USDC before payments
              </p>
            </div>
            <Switch
              checked={autoSwapEnabled}
              onCheckedChange={setAutoSwapEnabled}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="slippage" className="text-xs uppercase tracking-wider">
              Slippage Tolerance
            </Label>
            <Input
              id="slippage"
              className="rounded-none font-mono text-xs"
              placeholder="0.01"
              value={swapSlippageTolerance}
              onChange={(e) => setSwapSlippageTolerance(e.target.value)}
              disabled={!autoSwapEnabled}
            />
            <p className="text-[10px] text-muted-foreground">
              e.g. 0.01 = 1% max slippage on OKB→USDC swaps
            </p>
          </div>

          {saveError && (
            <div className="border border-red-600 bg-red-500/10 p-3">
              <p className="text-xs font-mono text-red-700 dark:text-red-400">
                {saveError}
              </p>
            </div>
          )}

          {saved && (
            <div className="border border-emerald-600 bg-emerald-500/10 p-3">
              <p className="text-xs font-mono text-emerald-700 dark:text-emerald-400">
                Settings saved
              </p>
            </div>
          )}

          <Button
            className="rounded-none text-xs"
            size="sm"
            onClick={handleSaveSwapSettings}
            disabled={saving || !address || !policy}
          >
            {saving ? (
              <>
                <Loader2 className="size-3 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Swap Settings"
            )}
          </Button>
        </CardContent>
      </Card>

      <Card className="rounded-none border">
        <CardHeader>
          <CardTitle className="text-sm font-medium uppercase tracking-wider">
            API Access
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider">
              ZenithPay API Key
            </Label>
            <div className="flex items-center gap-2">
              <Input
                className="rounded-none font-mono text-xs"
                value={showKey ? "zpk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" : maskedKey}
                readOnly
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-none shrink-0"
                onClick={() => setShowKey((v) => !v)}
              >
                {showKey ? <EyeOff className="size-3" /> : <Eye className="size-3" />}
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-none shrink-0"
                onClick={() => copyToClipboard(maskedKey, "key")}
              >
                <Copy className="size-3" />
              </Button>
            </div>
            {copied === "key" && (
              <p className="text-[10px] text-muted-foreground">Copied</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label className="text-xs uppercase tracking-wider">Agent Skill</Label>
            <div className="flex items-center gap-2">
              <Input
                className="rounded-none font-mono text-xs"
                value={curlCommand}
                readOnly
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-9 rounded-none shrink-0"
                onClick={() => copyToClipboard(curlCommand, "curl")}
              >
                <Copy className="size-3" />
              </Button>
            </div>
            {copied === "curl" && (
              <p className="text-[10px] text-muted-foreground">Copied</p>
            )}
            <p className="text-[10px] text-muted-foreground">
              Agents curl this URL to discover ZenithPay tools
            </p>
          </div>

          <a
            href="https://api.usezenithpay.xyz/skill.md"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground underline underline-offset-4"
          >
            View skill.md
            <ExternalLink className="size-3" />
          </a>
        </CardContent>
      </Card>

      <Card className="rounded-none border border-red-600/30">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider text-red-700 dark:text-red-400">
            <AlertTriangle className="size-4" />
            Danger Zone
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between border border-dashed p-3">
            <div>
              <p className="text-sm font-medium">Deactivate Agent</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Pauses the agent — policy remains on-chain
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-none text-xs border-red-600 text-red-700 hover:bg-red-500/10 dark:text-red-400"
              disabled={!address}
            >
              Deactivate
            </Button>
          </div>

          <div className="flex items-center justify-between border border-red-600/50 bg-red-500/5 p-3">
            <div>
              <p className="text-sm font-medium text-red-700 dark:text-red-400">
                Revoke Agent Permanently
              </p>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Irreversible. Agent loses all authorization forever.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-none text-xs border-red-600 bg-red-500/10 text-red-700 hover:bg-red-500/20 dark:text-red-400"
              disabled={!address}
            >
              Revoke
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
