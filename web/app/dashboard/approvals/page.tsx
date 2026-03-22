"use client";

import { Check, Loader2, ShieldCheck, X } from "lucide-react";
import { useEffect, useState } from "react";
import { useSignMessage } from "wagmi";
import { useAgent } from "@/components/dashboard/agent-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  approvePayment,
  denyPayment,
  getApprovals,
  type PendingApproval,
} from "@/lib/api";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ApprovalsPage() {
  const { agentAddress } = useAgent();
  const { signMessageAsync } = useSignMessage();
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [signError, setSignError] = useState<string | null>(null);

  async function loadApprovals() {
    setLoading(true);
    try {
      const res = await getApprovals(agentAddress);
      setApprovals(res.approvals);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadApprovals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentAddress]);

  async function handleApprove(id: string) {
    setProcessingId(id);
    setSignError(null);
    try {
      const timestamp = Date.now();
      const message = JSON.stringify({
        action: "approve",
        approvalId: id,
        timestamp,
      });
      const signature = await signMessageAsync({ message });
      await approvePayment(id, { humanSignature: signature, timestamp });
      await loadApprovals();
    } catch (err) {
      setSignError(err instanceof Error ? err.message : "Failed to approve");
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDeny(id: string) {
    setProcessingId(id);
    setSignError(null);
    try {
      const timestamp = Date.now();
      const message = JSON.stringify({
        action: "deny",
        approvalId: id,
        timestamp,
      });
      const signature = await signMessageAsync({ message });
      await denyPayment(id, { humanSignature: signature, timestamp });
      await loadApprovals();
    } catch (err) {
      setSignError(err instanceof Error ? err.message : "Failed to deny");
    } finally {
      setProcessingId(null);
    }
  }

  const pending = approvals.filter((a) => a.status === "pending");
  const resolved = approvals.filter((a) => a.status !== "pending");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Approvals</h1>
        <p className="text-sm text-muted-foreground">
          Review and approve agent payments above your threshold
        </p>
      </div>

      {signError && (
        <div className="border border-red-600 bg-red-500/10 p-3">
          <p className="text-xs font-mono text-red-700 dark:text-red-400">
            {signError}
          </p>
        </div>
      )}

      <Card className="rounded-none border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm font-medium uppercase tracking-wider">
            <ShieldCheck className="size-4" />
            Pending{" "}
            <span className="font-mono text-muted-foreground">
              ({loading ? "..." : pending.length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton
                  key={`skel-${i}`}
                  className="h-24 w-full rounded-none"
                />
              ))}
            </div>
          ) : pending.length === 0 ? (
            <div className="border border-dashed p-8 text-center">
              <ShieldCheck className="mx-auto size-6 text-muted-foreground mb-2" />
              <p className="text-xs text-muted-foreground">
                No pending approvals — all clear
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {pending.map((approval) => (
                <div
                  key={approval.id}
                  className="border border-amber-600/30 bg-amber-500/5 p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium font-mono">
                        {approval.merchant}
                      </p>
                      <p className="text-[10px] text-muted-foreground break-all">
                        {approval.serviceUrl}
                      </p>
                    </div>
                    <p className="text-lg font-bold font-mono ml-4 shrink-0">
                      ${approval.amount}
                    </p>
                  </div>

                  <p className="text-xs text-muted-foreground border-t border-dashed pt-2">
                    {approval.intent}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Requested {formatDate(approval.requestedAt)}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-none text-xs border-red-600 text-red-700 hover:bg-red-500/10 dark:text-red-400"
                        onClick={() => handleDeny(approval.id)}
                        disabled={processingId === approval.id}
                      >
                        {processingId === approval.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <X className="size-3" />
                        )}
                        Deny
                      </Button>
                      <Button
                        size="sm"
                        className="rounded-none text-xs hover:opacity-90 transition-opacity"
                        style={{
                          background: "var(--brand-accent)",
                          color: "var(--background)",
                        }}
                        onClick={() => handleApprove(approval.id)}
                        disabled={processingId === approval.id}
                      >
                        {processingId === approval.id ? (
                          <Loader2 className="size-3 animate-spin" />
                        ) : (
                          <Check className="size-3" />
                        )}
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {resolved.length > 0 && (
        <Card className="rounded-none border">
          <CardHeader>
            <CardTitle className="text-sm font-medium uppercase tracking-wider">
              Resolved{" "}
              <span className="font-mono text-muted-foreground">
                ({resolved.length})
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div>
              {resolved.map((approval) => {
                const isApproved = approval.status === "approved";
                const statusCls = isApproved
                  ? "border-emerald-600 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                  : "border-red-600 bg-red-500/10 text-red-700 dark:text-red-400";

                return (
                  <div
                    key={approval.id}
                    className="flex items-center justify-between border-b px-4 py-2.5 text-xs"
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`inline-flex border px-1.5 py-0.5 font-mono text-[10px] ${statusCls}`}
                      >
                        {approval.status}
                      </span>
                      <span className="truncate max-w-[200px] font-mono">
                        {approval.merchant}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-mono">${approval.amount}</span>
                      {approval.resolvedAt && (
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {formatDate(approval.resolvedAt)}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
