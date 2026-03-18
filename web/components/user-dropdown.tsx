"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { useConnect, useConnectors, useConnection, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
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
  const { mutate: connect } = useConnect();
  const connectors = useConnectors();
  const { mutate: disconnect } = useDisconnect();
  const isReady = status !== "connecting" && status !== "reconnecting";

  if (!isReady) {
    return <div className="size-8 rounded-none bg-muted animate-pulse" />;
  }

  if (!isConnected) {
    return (
      <Button
        variant="ghost"
        className="rounded-none"
        onClick={() => connect({ connector: connectors[0] })}
      >
        Sign in
      </Button>
    );
  }

  const triggerLabel = address ? truncateAddress(address) : "0x...";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="h-8 w-[110px] px-3 rounded-none border border-border bg-muted flex items-center justify-center gap-1.5 focus:outline-none hover:bg-muted/80 transition-colors"
        >
          <span className="text-xs font-mono text-foreground/70">
            {triggerLabel}
          </span>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="rounded-none border-border">
        <DropdownMenuLabel className="font-normal">
          {address && (
            <div className="text-xs text-muted-foreground font-mono">
              {truncateAddress(address)}
            </div>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild className="rounded-none">
          <Link href="/dashboard">Dashboard</Link>
        </DropdownMenuItem>
        <DropdownMenuItem className="rounded-none" onClick={() => disconnect()}>
          <LogOut className="mr-2 size-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
