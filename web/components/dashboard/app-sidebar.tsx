"use client";

import {
  ArrowLeftRight,
  CreditCard,
  LayoutDashboard,
  ScrollText,
  Shield,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoMark } from "@/components/logo-mark";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { UserDropdown } from "@/components/user-dropdown";

const navItems = [
  { title: "Overview", href: "/overview", icon: LayoutDashboard },
  { title: "Wallet", href: "/wallet", icon: Wallet },
  { title: "Pay", href: "/pay", icon: CreditCard },
  { title: "Limits", href: "/limits", icon: Shield },
  { title: "Ledger", href: "/ledger", icon: ScrollText },
  { title: "Approvals", href: "/approvals", icon: ShieldCheck },
];

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-border px-4 py-3">
        <Link href="/" className="flex items-center gap-2">
          <LogoMark />
          <span className="font-[family-name:var(--font-pixel-square)] text-sm tracking-wider">
            ZenithPay
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Agent Controls</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton asChild isActive={pathname === item.href}>
                    <Link href={item.href}>
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel>Integration</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild>
                  <Link
                    href="https://api.usezenithpay.xyz/skill.md"
                    target="_blank"
                  >
                    <ArrowLeftRight className="size-4" />
                    <span>Agent Skill</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <UserDropdown />
      </SidebarFooter>
    </Sidebar>
  );
}
