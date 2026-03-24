"use client";

import { LayoutDashboard, LogOut } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { useChainId, useConnect, useConnection, useConnectors, useDisconnect, useSwitchChain } from "wagmi";
import { useAgent } from "@/components/dashboard/agent-context";
import ModeToggle from "@/components/theme-toggle/mode-toggle";
import { Button } from "@/components/ui/button";
import { getOkxConnector, hasOkxWallet, XLAYER_CHAIN_ID } from "@/lib/okx-wallet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function UserDropdown() {
  const { address, isConnected, status } = useConnection();
  const { connectAsync } = useConnect();
  const { switchChainAsync } = useSwitchChain();
  const chainId = useChainId();
  const connectors = useConnectors();
  const { mutate: disconnect } = useDisconnect();
  const { agentDisplayName } = useAgent();
  const isReady = status !== "connecting" && status !== "reconnecting";

  if (!isReady) {
    return <div className="size-8 rounded-none bg-muted animate-pulse" />;
  }

  async function handleConnect() {
    if (!hasOkxWallet()) {
      toast.error("OKX Wallet extension not detected", {
        description: "Install OKX Wallet to connect to ZenithPay.",
      });
      return;
    }

    const okxConnector = getOkxConnector(connectors);
    if (!okxConnector) {
      toast.error("OKX Wallet connector unavailable");
      return;
    }

    try {
      await connectAsync({ connector: okxConnector });
      if (chainId !== XLAYER_CHAIN_ID) {
        await switchChainAsync({ chainId: XLAYER_CHAIN_ID });
      }
    } catch {
      toast.error("Wallet connection was cancelled or failed");
    }
  }

  if (!isConnected) {
    return (
      <Button
        variant="ghost"
        className="rounded-none"
        onClick={handleConnect}
      >
        Sign in
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="w-full px-3 h-9 rounded-none border border-border bg-muted flex items-center gap-2 focus:outline-none hover:bg-muted/80 transition-colors"
        >
          {/* Collapsed: show only 0x identifier */}
          <span className="hidden group-data-[collapsible=icon]:block text-[10px] font-mono text-muted-foreground truncate">
            0x
          </span>
          {/* Expanded: full name + address */}
          <div className="flex flex-col items-start min-w-0 flex-1 group-data-[collapsible=icon]:hidden">
            <span className="text-xs font-medium truncate w-full text-left">
              {agentDisplayName}
            </span>
            {address && (
              <span className="text-[10px] font-mono text-muted-foreground">
                {truncateAddress(address)}
              </span>
            )}
          </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="rounded-none border-border w-48"
      >
        <DropdownMenuLabel className="font-normal">
          <div className="space-y-0.5">
            <p className="text-xs font-medium">{agentDisplayName}</p>
            {address && (
              <p className="text-[10px] text-muted-foreground font-mono">
                {truncateAddress(address)}
              </p>
            )}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="rounded-none">
          <Link href="/dashboard">
            <LayoutDashboard className="mr-2 size-4" />
            Dashboard
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className="rounded-none p-0">
          <ModeToggle
            showLabel
            className="px-2 h-8 text-sm font-normal hover:bg-accent"
            variant="ghost"
            size="sm"
          />
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem className="rounded-none" onClick={() => disconnect()}>
          <LogOut className="mr-2 size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
