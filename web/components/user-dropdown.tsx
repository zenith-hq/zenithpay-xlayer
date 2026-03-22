"use client";

import { LogOut } from "lucide-react";
import Link from "next/link";
import { useConnect, useConnection, useConnectors, useDisconnect } from "wagmi";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAgent } from "@/components/dashboard/agent-context";

function truncateAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export function UserDropdown() {
  const { address, isConnected, status } = useConnection();
  const { mutate: connect } = useConnect();
  const connectors = useConnectors();
  const { mutate: disconnect } = useDisconnect();
  const { agentDisplayName } = useAgent();
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

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className="w-full px-3 h-9 rounded-none border border-border bg-muted flex items-center gap-2 focus:outline-none hover:bg-muted/80 transition-colors"
        >
          <div className="flex flex-col items-start min-w-0 flex-1">
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
      <DropdownMenuContent align="end" className="rounded-none border-border w-48">
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
