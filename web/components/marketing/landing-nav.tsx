"use client";

import { useConnection } from "wagmi";
import { Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { LogoMark } from "@/components/logo-mark";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/components/user-dropdown";

function LandingNavActions() {
  const { isConnected, status } = useConnection();
  const isReady = status !== "connecting" && status !== "reconnecting";

  if (!isReady) {
    return <div className="h-8 w-24 rounded-none bg-muted animate-pulse" />;
  }

  if (!isConnected) {
    return (
      <div className="relative group">
        <Button
          asChild
          className="rounded-none cursor-pointer relative overflow-hidden focus-visible:ring-0 h-9 px-4"
        >
          <Link href="/signin">
            <span className="shine absolute -top-1/2 -left-full h-[200%] w-3/4 skew-x-[-20deg] bg-linear-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
            Sign In
          </Link>
        </Button>
        <span className="absolute h-2 w-2 border-foreground border-dashed border-b border-r bottom-0 right-0" />
        <span className="absolute h-2 w-2 border-foreground border-dashed border-b border-l bottom-0 left-0" />
        <span className="absolute h-2 w-2 border-foreground border-dashed border-t border-r top-0 right-0" />
        <span className="absolute h-2 w-2 border-foreground border-dashed border-t border-l top-0 left-0" />
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <Button
          asChild
          className="rounded-none cursor-pointer relative overflow-hidden focus-visible:ring-0 h-8 w-[110px] px-3 py-1"
        >
          <Link href="/dashboard">
            <span className="shine absolute -top-1/2 -left-full h-[200%] w-3/4 skew-x-[-20deg] bg-linear-to-r from-transparent via-white/50 to-transparent pointer-events-none" />
            Dashboard
          </Link>
        </Button>
        <span className="absolute h-2 w-2 border-foreground border-dashed border-b border-r bottom-0 right-0" />
        <span className="absolute h-2 w-2 border-foreground border-dashed border-b border-l bottom-0 left-0" />
        <span className="absolute h-2 w-2 border-foreground border-dashed border-t border-r top-0 right-0" />
        <span className="absolute h-2 w-2 border-foreground border-dashed border-t border-l top-0 left-0" />
      </div>
      <UserDropdown />
    </div>
  );
}

const NAV_LINKS = [
  { label: "Features", href: "#features", isAnchor: true },
  { label: "How it works", href: "#how-it-works", isAnchor: true },
  { label: "Docs", href: "/docs", isAnchor: false },
];

export function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col border-x">
        <nav className="relative flex h-(--nav-height) items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-pixel-square text-[20px] font-semibold"
          >
            <LogoMark />
            <span>ZenithPay</span>
          </Link>

          <div className="hidden sm:flex items-center gap-6">
            {NAV_LINKS.map(({ label, href, isAnchor }) =>
              isAnchor ? (
                <a
                  key={label}
                  href={href}
                  className="font-mono font-medium text-xs uppercase tracking-widest text-foreground/70 hover:text-foreground transition-colors"
                >
                  {label}
                </a>
              ) : (
                <Link
                  key={label}
                  href={href}
                  className="font-mono font-medium text-xs uppercase tracking-widest text-foreground/70 hover:text-foreground transition-colors"
                >
                  {label}
                </Link>
              ),
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              className="sm:hidden p-1.5 text-foreground/70 hover:text-foreground transition-colors"
              onClick={() => setMenuOpen((prev) => !prev)}
              aria-label="Toggle menu"
            >
              {menuOpen ? (
                <X className="size-5" />
              ) : (
                <Menu className="size-5" />
              )}
            </button>
            <LandingNavActions />
          </div>

          <div className="z-10 absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 size-2.5 rounded-full border border-border bg-background" />
          <div className="z-10 absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 size-2.5 rounded-full border border-border bg-background" />
          <div className="border-b absolute bottom-0 left-1/2 -translate-x-1/2 w-screen" />
        </nav>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2, ease: "easeInOut" }}
              className="sm:hidden overflow-hidden"
            >
              <div className="flex flex-col border-t border-border px-4 py-3 gap-3">
                {NAV_LINKS.map(({ label, href, isAnchor }) =>
                  isAnchor ? (
                    <a
                      key={label}
                      href={href}
                      className="font-mono font-medium text-xs uppercase tracking-widest text-foreground/70 hover:text-foreground transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      {label}
                    </a>
                  ) : (
                    <Link
                      key={label}
                      href={href}
                      className="font-mono font-medium text-xs uppercase tracking-widest text-foreground/70 hover:text-foreground transition-colors"
                      onClick={() => setMenuOpen(false)}
                    >
                      {label}
                    </Link>
                  ),
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
