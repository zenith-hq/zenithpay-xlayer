"use client";

import {
  BookOpen,
  CreditCard,
  LayoutDashboard,
  ScrollText,
  Settings,
  Shield,
  ShieldCheck,
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
  SidebarRail,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { UserDropdown } from "@/components/user-dropdown";

const mainNav = [
  { title: "Overview", href: "/dashboard", icon: LayoutDashboard, exact: true },
  { title: "Pay", href: "/dashboard/pay", icon: CreditCard, exact: false },
  { title: "Limits", href: "/dashboard/limits", icon: Shield, exact: false },
  { title: "Ledger", href: "/dashboard/ledger", icon: ScrollText, exact: false },
  { title: "Approvals", href: "/dashboard/approvals", icon: ShieldCheck, exact: false },
];

const accountNav = [
  { title: "Docs", href: "https://docs.usezenithpay.xyz", icon: BookOpen, exact: false, external: true },
  { title: "Settings", href: "/dashboard/settings", icon: Settings, exact: false, external: false },
];

export function AppSidebar() {
  const pathname = usePathname();

  function isActive(href: string, exact: boolean) {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  }

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader className="border-b border-border">
        <div className="flex items-center justify-between px-2 py-2">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 group-data-[collapsible=icon]:hidden"
          >
            <LogoMark />
            <span className="font-[family-name:var(--font-pixel-square)] text-sm tracking-wider">
              ZenithPay
            </span>
          </Link>
          <span className="hidden group-data-[collapsible=icon]:flex">
            <LogoMark />
          </span>
          <SidebarTrigger className="ml-auto group-data-[collapsible=icon]:ml-0" />
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Main</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.href, item.exact)}
                    tooltip={item.title}
                  >
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
          <SidebarGroupLabel>Account</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {accountNav.map((item) => (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={!item.external && isActive(item.href, item.exact)}
                    tooltip={item.title}
                  >
                    <Link
                      href={item.href}
                      {...(item.external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                    >
                      <item.icon className="size-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-border p-4">
        <UserDropdown />
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
