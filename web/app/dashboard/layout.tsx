"use client";

import type { ReactNode } from "react";
import { AuthGate } from "@/components/auth-gate";
import { AgentProvider } from "@/components/dashboard/agent-context";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { NoAgentDialog } from "@/components/dashboard/no-agent-dialog";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { useAgent } from "@/components/dashboard/agent-context";

function DashboardShell({ children }: { children: ReactNode }) {
  const { hasAgent, loading } = useAgent();

  return (
    <>
      <NoAgentDialog hasAgent={hasAgent} loading={loading} />
      <AppSidebar />
      <SidebarInset>
        <main className="flex flex-col flex-1 p-6 min-w-0">{children}</main>
      </SidebarInset>
    </>
  );
}

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <div
        style={{ "--radius": "0rem" } as React.CSSProperties}
        className="flex min-h-screen w-full"
      >
        <SidebarProvider
          style={{ "--sidebar-width": "14rem" } as React.CSSProperties}
        >
          <AgentProvider>
            <DashboardShell>{children}</DashboardShell>
          </AgentProvider>
        </SidebarProvider>
      </div>
    </AuthGate>
  );
}
