"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CreditCard, Loader2 } from "lucide-react";
import { type PaymentResult, executePayment } from "@/lib/api";

const AGENT_ADDRESS =
  process.env.NEXT_PUBLIC_AGENT_ADDRESS ??
  "0x726Cf0C4Fe559DB9A32396161694C7b88C60C947";

export default function PayPage() {
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
        <h1 className="text-2xl font-semibold tracking-tight">Pay</h1>
        <p className="text-sm text-muted-foreground">
          Execute policy-gated x402 payments through the agent
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CreditCard className="size-4" />
              New Payment
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="serviceUrl">Service URL</Label>
                <Input
                  id="serviceUrl"
                  placeholder="https://api.example.com/resource"
                  value={serviceUrl}
                  onChange={(e) => setServiceUrl(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">
                  The x402-enabled endpoint to pay
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxAmount">Max Amount (USDC)</Label>
                <Input
                  id="maxAmount"
                  placeholder="10.00"
                  value={maxAmount}
                  onChange={(e) => setMaxAmount(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="intent">Intent</Label>
                <Textarea
                  id="intent"
                  placeholder="Describe what this payment is for..."
                  value={intent}
                  onChange={(e) => setIntent(e.target.value)}
                  rows={3}
                  required
                />
              </div>

              <Button type="submit" className="w-full" disabled={submitting}>
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

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Result</CardTitle>
          </CardHeader>
          <CardContent>
            {!result && !error && (
              <p className="text-sm text-muted-foreground">
                Submit a payment to see the result
              </p>
            )}

            {error && (
              <div className="rounded-md border border-destructive/50 bg-destructive/10 p-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
            )}

            {result && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">Status</span>
                  <Badge
                    variant={
                      result.status === "approved"
                        ? "default"
                        : result.status === "blocked"
                          ? "destructive"
                          : "secondary"
                    }
                  >
                    {result.status}
                  </Badge>
                </div>

                {result.txHash && (
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Tx Hash</span>
                    <code className="block break-all text-xs">{result.txHash}</code>
                  </div>
                )}

                {result.amount && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Amount</span>
                    <span className="text-sm font-mono">${result.amount}</span>
                  </div>
                )}

                {result.merchant && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Merchant</span>
                    <span className="text-sm">{result.merchant}</span>
                  </div>
                )}

                {result.swapUsed && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Auto-swap</span>
                    <Badge variant="outline">
                      {result.okbSpent} OKB used
                    </Badge>
                  </div>
                )}

                {result.reason && (
                  <div className="space-y-1">
                    <span className="text-sm text-muted-foreground">Reason</span>
                    <p className="text-sm">{result.reason}</p>
                  </div>
                )}

                {result.remainingDailyBudget && (
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">
                      Budget remaining
                    </span>
                    <span className="text-sm font-mono">
                      ${result.remainingDailyBudget}
                    </span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
