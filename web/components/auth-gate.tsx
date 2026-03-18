"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { useConnection } from "wagmi";

interface AuthGateProps {
  children: ReactNode;
}

export function AuthGate({ children }: AuthGateProps) {
  const { isConnected, status } = useConnection();
  const router = useRouter();
  const isReady = status !== "connecting" && status !== "reconnecting";

  useEffect(() => {
    if (isReady && !isConnected) {
      router.push("/signin");
    }
  }, [isReady, isConnected, router]);

  if (!isReady) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="size-8 animate-pulse rounded-none bg-muted" />
      </div>
    );
  }

  if (!isConnected) {
    return null;
  }

  return <>{children}</>;
}
