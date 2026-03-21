"use client";

import { AuthGate } from "@/components/auth-gate";
import { AppSidebar } from "@/components/dashboard/app-sidebar";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import type { ReactNode } from "react";

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <AuthGate>
      <div style={{ "--radius": "0rem" } as React.CSSProperties} className="flex min-h-screen w-full">
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <main className="flex flex-col flex-1 p-6 min-w-0">{children}</main>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </AuthGate>
  );
}
