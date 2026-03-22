"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ExternalLink, Loader2 } from "lucide-react";
import { FlaskConical } from "lucide-react";
import { type PaymentResult, executePayment } from "@/lib/api";
import { useAgent } from "@/components/dashboard/agent-context";

const EXPLORER_URL = "https://www.oklink.com/xlayer";

function StatusDisplay({ result }: { result: PaymentResult }) {
  const statusClass =
    result.status === "approved"
      ? "border-emerald-600 bg-emerald-500/10"
      : result.status === "blocked"
        ? "border-red-600 bg-red-500/10"
        : "border-amber-600 bg-amber-500/10";

  const statusLabelClass =
    result.status === "approved"
      ? "text-emerald-700 dark:text-emerald-400"
      : result.status === "blocked"
        ? "text-red-700 dark:text-red-400"
        : "text-amber-700 dark:text-amber-400";

  return (
    <div className={`border p-4 space-y-3 ${statusClass}`}>
      <div className="flex items-center gap-2">
        <span className="text-xs text-muted-foreground uppercase tracking-wider">
          Status
        </span>
        <span className={`font-mono text-sm font-semibold ${statusLabelClass}`}>
          {result.status.toUpperCase()}
        </span>
      </div>

      {result.txHash && (
        <div className="space-y-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Tx Hash
          </span>
          <div className="flex items-center gap-2">
            <code className="text-xs font-mono break-all flex-1">
              {result.txHash}
            </code>
            <a
              href={`${EXPLORER_URL}/tx/${result.txHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-muted-foreground hover:text-foreground"
            >
              <ExternalLink className="size-3" />
            </a>
          </div>
        </div>
      )}

      {result.amount && (
        <div className="flex items-center justify-between border-t border-dashed pt-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Amount
          </span>
          <span className="text-sm font-mono">${result.amount}</span>
        </div>
      )}

      {result.merchant && (
        <div className="flex items-center justify-between border-t border-dashed pt-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Merchant
          </span>
          <span className="text-xs font-mono">{result.merchant}</span>
        </div>
      )}

      {result.swapUsed && (
        <div className="flex items-center justify-between border-t border-dashed pt-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Auto-swap
          </span>
          <span className="font-mono text-xs border border-dashed px-2 py-0.5">
            {result.okbSpent} OKB used
          </span>
        </div>
      )}

      {result.reason && (
        <div className="border-t border-dashed pt-2 space-y-1">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Reason
          </span>
          <p className="text-xs font-mono">{result.reason}</p>
        </div>
      )}

      {result.remainingDailyBudget && (
        <div className="flex items-center justify-between border-t border-dashed pt-2">
          <span className="text-xs text-muted-foreground uppercase tracking-wider">
            Budget remaining
          </span>
          <span className="text-sm font-mono">${result.remainingDailyBudget}</span>
        </div>
      )}
    </div>
  );
}

export default function PayPage() {
  const { agentAddress: AGENT_ADDRESS } = useAgent();
  const [serviceUrl, setServiceUrl] = useState("");
  const [maxAmount, setMaxAmount] = useState("");
  const [intent, setIntent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<PaymentResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setResult(null);
    setError(null);

    try {
      const res = await executePayment({
        agentAddress: AGENT_ADDRESS,
        serviceUrl,
        maxAmount,
        intent,
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Payment failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Demo</h1>
        <p className="text-sm text-muted-foreground">
          Trigger a test payment to see the full policy enforcement flow live.
          In production, your agent executes this automatically via the skill.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="rounded-none border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider">
              <FlaskConical className="size-4" />
              Test Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="serviceUrl" className="text-xs uppercase tracking-wider">
                  Service URL
                </Label>
                <Input
                  id="serviceUrl"
                  className="rounded-none font-mono text-xs"
                  placeholder="https://api.example.com/resource"
                  value={serviceUrl}
                  onChange={(e) => setServiceUrl(e.target.value)}
                  required
                />
                <p className="text-[10px] text-muted-foreground">
                  x402-enabled endpoint to pay
                </p>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="maxAmount" className="text-xs uppercase tracking-wider">
                  Max Amount (USDC)
                </Label>
                <Input
                  id="maxAmount"
                  className="rounded-none font-mono text-xs"
                  placeholder="10.00"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="intent" className="text-xs uppercase tracking-wider">
                  Intent
                </Label>
                <Textarea
                  id="intent"
                  className="rounded-none font-mono text-xs resize-none"
                  placeholder="Describe what this payment is for..."
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full rounded-none"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <Loader2 className="size-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  "Execute Payment"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-none border">
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase tracking-wider">
              Result
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!result && !error && (
              <div className="border border-dashed p-6 text-center">
                <p className="text-xs text-muted-foreground">
                  Submit a payment to see the result
                </p>
              </div>
            )}

            {error && (
              <div className="border border-red-600 bg-red-500/10 p-4">
                <p className="text-xs font-mono text-red-700 dark:text-red-400">
                  {error}
                </p>
              </div>
            )}

            {result && <StatusDisplay result={result} />}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
