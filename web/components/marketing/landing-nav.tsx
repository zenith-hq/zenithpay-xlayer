"use client";

import { ChevronDown, Menu, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useConnection } from "wagmi";
import { LogoMark } from "@/components/logo-mark";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/components/user-dropdown";
import { cn } from "@/lib/utils";

function LandingNavActions() {
  const { isConnected, status } = useConnection();
  const isReady = status !== "connecting" && status !== "reconnecting";

  if (!isReady) {
    return <div className="h-8 w-24 rounded-none bg-muted animate-pulse" />;
  }

  if (!isConnected) {
    return (
      <Button
        asChild
        style={{
          background: "var(--brand-accent)",
          color: "var(--background)",
        }}
        className="rounded-none cursor-pointer relative overflow-hidden focus-visible:ring-0 h-9 px-4 hover:opacity-90 transition-opacity"
      >
        <Link href="/signin">
          <span className="shine absolute -top-1/2 -left-full h-[200%] w-3/4 skew-x-[-20deg] bg-linear-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
          Sign In
        </Link>
      </Button>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        asChild
        style={{ background: "var(--brand-accent)", color: "var(--background)" }}
        className="rounded-none cursor-pointer relative overflow-hidden focus-visible:ring-0 h-9 px-4 hover:opacity-90 transition-opacity"
      >
        <Link href="/overview">
          <span className="shine absolute -top-1/2 -left-full h-[200%] w-3/4 skew-x-[-20deg] bg-linear-to-r from-transparent via-white/30 to-transparent pointer-events-none" />
          Dashboard
        </Link>
      </Button>
      <UserDropdown />
    </div>
  );
}

const PRODUCTS = [
  {
    label: "Agent Wallet",
    desc: "A real account for every agent",
    href: "/docs#agent-wallet",
    soon: false,
  },
  {
    label: "Agent Pay",
    desc: "Policy-gated x402 payments.",
    href: "/docs#agent-pay",
    soon: false,
  },
  {
    label: "Agent Policy",
    desc: "Hard limits, enforced onchain",
    href: "/docs#spend-policy",
    soon: false,
  },
  {
    label: "Agent Card",
    desc: "Virtual cards for agent purchases",
    href: "#",
    soon: true,
  },
  {
    label: "Agent Credit",
    desc: "Onchain credit lines for agents",
    href: "#",
    soon: true,
  },
];

const NAV_LINKS = [
  { label: "Features", href: "#features", isAnchor: true },
  { label: "How it works", href: "#how-it-works", isAnchor: true },
  { label: "Docs", href: "/docs", isAnchor: false },
];

function ProductsDropdown() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className={cn(
          "flex items-center gap-1 font-mono font-medium text-xs uppercase tracking-widest transition-colors",
          open ? "text-foreground" : "text-foreground/70 hover:text-foreground",
        )}
      >
        Products
        <ChevronDown
          className={cn(
            "size-3 transition-transform duration-200",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 6 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-64 border border-border bg-background z-50"
          >
            {PRODUCTS.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-start justify-between px-5 py-3.5 transition-colors border-b border-border last:border-0 group/item",
                  item.soon ? "pointer-events-none" : "hover:bg-muted/20",
                )}
              >
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span
                    className={cn(
                      "font-mono text-[11px] uppercase tracking-[0.12em]",
                      item.soon
                        ? "text-muted-foreground/40"
                        : "text-muted-foreground group-hover/item:text-foreground transition-colors",
                    )}
                  >
                    {item.label}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] leading-relaxed",
                      item.soon
                        ? "text-muted-foreground/25"
                        : "text-muted-foreground/50",
                    )}
                  >
                    {item.desc}
                  </span>
                </div>
                {item.soon && (
                  <span className="text-[9px] text-brand-accent tracking-wider shrink-0 mt-0.5">
                    SOON
                  </span>
                )}
              </Link>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function LandingNav() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-7xl min-w-0 flex-col border-x">
        <nav className="relative flex h-(--nav-height) items-center justify-between px-4 sm:px-6">
          <Link
            href="/"
            className="flex items-center gap-2 font-pixel-square text-[22px] font-semibold"
          >
            <LogoMark />
            <span>ZenithPay</span>
          </Link>

          <div className="hidden sm:flex items-center gap-6">
            <ProductsDropdown />
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
                <div>
                  <span className="font-mono font-medium text-xs uppercase tracking-widest text-foreground/70">
                    Products
                  </span>
                  <div className="mt-2 flex flex-col gap-2 pl-3">
                    {PRODUCTS.map((item) => (
                      <Link
                        key={item.label}
                        href={item.href}
                        onClick={() => setMenuOpen(false)}
                        className={cn(
                          "font-mono text-[11px] uppercase tracking-[0.12em] flex items-center gap-2",
                          item.soon
                            ? "text-muted-foreground/40 pointer-events-none"
                            : "text-muted-foreground hover:text-foreground transition-colors",
                        )}
                      >
                        {item.label}
                        {item.soon && (
                          <span className="text-[9px] text-brand-accent">
                            SOON
                          </span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
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
