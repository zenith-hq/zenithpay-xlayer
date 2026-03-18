"use client";

import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { useConnection } from "wagmi";
import { Button } from "@/components/ui/button";

export function CTASection() {
  const { isConnected: authenticated } = useConnection();

  return (
    <section className="mx-auto w-full max-w-7xl border-x border-t">
      <div className="px-5 py-20 sm:px-8 lg:px-12 flex flex-col items-center text-center">
        <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground font-mono mb-3">
          [05] Get started
        </span>
        <h2 className="text-[28px] sm:text-[36px] font-bold tracking-tight max-w-xl">
          Give your agent a budget.
        </h2>
        <p className="mt-3 text-[16px] text-muted-foreground max-w-md">
          Real budgets. Real policies. Real audit trail. Everything your agent
          needs to spend safely — without you building it from scratch.
        </p>

        <div className="mt-8">
          <Button
            asChild
            className="rounded-none cursor-pointer relative overflow-hidden focus-visible:ring-0 h-9 px-4 group"
          >
            <Link href={authenticated ? "/dashboard" : "/signin"}>
              <span className="shine absolute -top-1/2 -left-full h-[200%] w-3/4 skew-x-[-20deg] bg-linear-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
              {authenticated ? "Go to Dashboard" : "Get started"}
              <ArrowRightIcon className="size-4 w-0 opacity-0 group-hover:w-4 group-hover:opacity-100 transition-all duration-200" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
