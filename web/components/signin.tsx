"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { useConnect, useConnectors, useConnection } from "wagmi";
import { LogoMark } from "@/components/logo-mark";
import ModeToggle from "./theme-toggle/mode-toggle";
import { Button } from "./ui/button";

export default function SignIn({
  onProviderClick,
}: {
  onProviderClick?: () => void;
} = {}) {
  const { isConnected } = useConnection();
  const { mutate: connect, isPending } = useConnect();
  const connectors = useConnectors();
  const router = useRouter();

  useEffect(() => {
    if (isConnected) {
      router.push("/dashboard");
    }
  }, [isConnected, router]);

  function handleSignIn() {
    onProviderClick?.();
    connect({ connector: connectors[0] });
  }

  return (
    <div className="h-full w-full">
      <div className="flex h-full">
        <div className="relative flex flex-col items-center justify-center w-full">
          <ModeToggle className="absolute top-2 right-2 dark:hover:bg-transparent w-auto h-auto" />
          <div className="flex flex-col items-center w-sm mb-5 text-center">
            <LogoMark className="size-6 mb-3" />
            <h2 className="text-2xl font-bold mb-1">Sign in to ZenithPay</h2>
            <p className="text-sm text-muted-foreground">
              Manage your agents, set spending policies, and more.
            </p>
          </div>


          <div className="flex flex-col gap-4 w-sm my-5">
            <div className="relative w-full group">
              <Button
                variant="outline"
                className="w-full cursor-pointer h-10 text-md rounded-none relative overflow-hidden border-dashed"
                onClick={handleSignIn}
                disabled={isPending}
              >
                <span className="shine absolute -top-1/2 -left-full h-[200%] w-3/4 skew-x-[-20deg] bg-linear-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
                Connect Wallet
              </Button>
              <span className="absolute h-2 w-2 border-foreground border-b border-r bottom-0 right-0" />
              <span className="absolute h-2 w-2 border-foreground border-b border-l bottom-0 left-0" />
              <span className="absolute h-2 w-2 border-foreground border-t border-r top-0 right-0" />
              <span className="absolute h-2 w-2 border-foreground border-t border-l top-0 left-0" />
            </div>
          </div>

          <p className="text-xs text-muted-foreground text-center max-w-xs">
            Supports OKX Wallet or any EIP-6963 compatible wallet
          </p>
        </div>
      </div>
    </div>
  );
}
