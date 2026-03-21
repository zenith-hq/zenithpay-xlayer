"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, Loader2, ShieldCheck, X } from "lucide-react";
import {
  type PendingApproval,
  approvePayment,
  denyPayment,
  getApprovals,
} from "@/lib/api";

const AGENT_ADDRESS =
  process.env.NEXT_PUBLIC_AGENT_ADDRESS ??
  "0x726Cf0C4Fe559DB9A32396161694C7b88C60C947";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function ApprovalsPage() {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<string | null>(null);

  useEffect(() => {
    loadApprovals();
  }, []);

  async function loadApprovals() {
    setLoading(true);
    try {
      const res = await getApprovals(AGENT_ADDRESS);
      setApprovals(res.approvals);
    } finally {
      setLoading(false);
    }
  }

  async function handleApprove(id: string) {
    setProcessingId(id);
    try {
      await approvePayment(id);
      await loadApprovals();
    } finally {
      setProcessingId(null);
    }
  }

  async function handleDeny(id: string) {
    setProcessingId(id);
    try {
      await denyPayment(id);
      await loadApprovals();
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <ShieldCheck className="size-4" />
            Pending Approvals ({loading ? "..." : pending.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="space-y-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={`skel-${i}`} className="h-24 w-full" />
              ))}
            </div>
          ) : pending.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No pending approvals — all clear
            </p>
          ) : (
            <div className="space-y-3">
              {pending.map((approval) => (
                <div
                  key={approval.id}
                  className="rounded-md border p-4 space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{approval.merchant}</p>
                      <p className="text-xs text-muted-foreground">
                        {approval.serviceUrl}
                      </p>
                    </div>
                    <p className="text-lg font-bold font-mono">
                      ${approval.amount}
                    </p>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {approval.intent}
                  </p>

                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      Requested {formatDate(approval.requestedAt)}
                    </span>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="destructive"
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
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Resolved ({resolved.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {resolved.map((approval) => (
                <div
                  key={approval.id}
                  className="flex items-center justify-between rounded-md border p-3 text-sm"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        approval.status === "approved"
                          ? "default"
                          : "destructive"
                      }
                      className="text-xs"
                    >
                      {approval.status}
                    </Badge>
                    <span className="truncate max-w-[200px]">
                      {approval.merchant}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono">${approval.amount}</span>
                    {approval.resolvedAt && (
                      <span className="text-xs text-muted-foreground">
                        {formatDate(approval.resolvedAt)}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
