"use client";

import { ArrowRightIcon, Check, Copy } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { LogoMark } from "@/components/logo-mark";
import ModeToggle from "@/components/theme-toggle/mode-toggle";
import { Button } from "@/components/ui/button";
import { UserDropdown } from "@/components/user-dropdown";

function CodeBlock({
  code,
  ref,
}: {
  code: string;
  ref?: React.Ref<HTMLDivElement>;
}) {
  const [flash, setFlash] = useState(false);

  return (
    <div
      ref={ref}
      className={`flex items-center justify-between gap-2 bg-muted border border-dashed px-3 py-2 font-mono text-xs hover:border-foreground/30 transition-colors ${
        flash ? "border-foreground/50" : "border-border"
      }`}
    >
      <code className="text-foreground truncate">{code}</code>
      <button
        type="button"
        onClick={() => {
          navigator.clipboard.writeText(code);
          setFlash(true);
          setTimeout(() => setFlash(false), 300);
        }}
        className="text-muted-foreground hover:text-foreground transition-all hover:scale-110 active:scale-95 cursor-pointer"
      >
        {flash ? <Check size={12} /> : <Copy size={12} />}
      </button>
    </div>
  );
}

function CornerBrackets() {
  return (
    <>
      <span className="absolute h-2.5 w-2.5 border-foreground/30 group-hover:border-foreground border-b border-r bottom-0 right-0 transition-colors duration-300" />
      <span className="absolute h-2.5 w-2.5 border-foreground/30 group-hover:border-foreground border-b border-l bottom-0 left-0 transition-colors duration-300" />
      <span className="absolute h-2.5 w-2.5 border-foreground/30 group-hover:border-foreground border-t border-r top-0 right-0 transition-colors duration-300" />
      <span className="absolute h-2.5 w-2.5 border-foreground/30 group-hover:border-foreground border-t border-l top-0 left-0 transition-colors duration-300" />
    </>
  );
}

function _ShineSweep() {
  return (
    <span className="shine absolute -top-1/2 -left-full h-[200%] w-3/4 skew-x-[-20deg] bg-linear-to-r from-transparent via-white/40 to-transparent pointer-events-none z-20" />
  );
}

function StepCard({
  index,
  label,
  title,
  children,
  centered,
  topExtra,
  bottomExtra,
}: {
  index: number;
  label: string;
  title: string;
  children: React.ReactNode;
  centered?: boolean;
  topExtra?: React.ReactNode;
  bottomExtra?: React.ReactNode;
}) {
  return (
    <div className="bg-background relative group overflow-hidden flex flex-col transition-all duration-300 group-hover:-translate-y-0.5 group-hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)] dark:group-hover:shadow-[0_2px_8px_rgba(255,255,255,0.02)]">
      {/* Step number indicator */}
      <div className="absolute top-2 right-2 size-5 rounded-full border border-border bg-background text-[8px] flex items-center justify-center font-mono z-10">
        {index + 1}
      </div>
      {/* Header — absolute so it doesn't push centered content */}
      <div className="absolute top-0 left-0 right-0 px-4 pt-0.5 pointer-events-none z-[1]">
        <span className="text-[8px] font-mono text-muted-foreground">
          Step {index + 1} — {label}
        </span>
        <h2 className="text-sm font-semibold tracking-tight text-foreground -mt-0.5 mb-0">
          {title}
        </h2>
      </div>
      {centered ? (
        <div className="p-4 pt-10 flex-1 grid grid-rows-[1fr_auto_1fr]">
          <div className="flex flex-col justify-end">{topExtra}</div>
          <div className="flex flex-col gap-2">{children}</div>
          {bottomExtra && <div className="self-start mt-2">{bottomExtra}</div>}
        </div>
      ) : (
        <div className="p-4 pt-10 flex flex-col flex-1">
          <div className="flex-1 flex flex-col justify-center gap-2">
            {children}
          </div>
        </div>
      )}
      <CornerBrackets />
    </div>
  );
}

function InstallCard({
  codeBlockRef,
}: {
  codeBlockRef?: React.Ref<HTMLDivElement>;
}) {
  const [pm, setPm] = useState<"bun" | "npm" | "pnpm" | "yarn">("bun");
  const commands = {
    bun: "bun install",
    npm: "npm install",
    pnpm: "pnpm install",
    yarn: "yarn install",
  };

  return (
    <StepCard
      index={1}
      label="Install"
      title="Install dependencies"
      centered
      topExtra={
        <div className="flex gap-3 mb-1">
          {(["bun", "npm", "pnpm", "yarn"] as const).map((p) => (
            <button
              type="button"
              key={p}
              onClick={() => setPm(p)}
              className={`text-[10px] font-mono pb-0.5 cursor-pointer transition-all duration-200 ${
                pm === p
                  ? "text-foreground border-b-2 border-foreground"
                  : "text-muted-foreground hover:text-foreground border-b-2 border-transparent"
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      }
    >
      <CodeBlock ref={codeBlockRef} code={commands[pm]} />
    </StepCard>
  );
}

function ConfigureCard({
  codeBlockRef,
}: {
  codeBlockRef?: React.Ref<HTMLDivElement>;
}) {
  const vars = ["NEXT_PUBLIC_API_URL", "NEXT_PUBLIC_APP_URL"];

  return (
    <StepCard index={2} label="Configure" title="Set up environment">
      <div className="border border-border divide-y divide-border mt-1 mb-0.5">
        {vars.map((v, i) => (
          <div
            key={v}
            className="px-2 py-1 font-mono text-[9px] text-muted-foreground border-l-2 border-l-transparent group-hover:border-l-foreground/20 opacity-60 translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300"
            style={{ transitionDelay: `${80 + i * 60}ms` }}
          >
            {v}
          </div>
        ))}
      </div>
      <CodeBlock ref={codeBlockRef} code="cp .env.example .env.local" />
    </StepCard>
  );
}

function LaunchCard({
  codeBlockRef,
}: {
  codeBlockRef?: React.Ref<HTMLDivElement>;
}) {
  return (
    <StepCard
      index={3}
      label="Launch"
      title="You're ready"
      centered
      bottomExtra={
        <a href="/" className="relative w-fit group/cta inline-block">
          <Button
            variant="outline"
            className="rounded-none cursor-pointer relative overflow-hidden focus-visible:ring-0 h-8 px-3 py-1 border-dashed"
          >
            <span className="shine absolute -top-1/2 -left-full h-[200%] w-3/4 skew-x-[-20deg] bg-linear-to-r from-transparent via-white/40 to-transparent pointer-events-none z-20" />
            <span className="text-[9px] font-medium text-foreground flex items-center gap-1.5 group-hover/cta:gap-2.5 transition-all duration-300">
              Start building
              <ArrowRightIcon className="size-3 w-0 opacity-0 group-hover/cta:w-3 group-hover/cta:opacity-100 transition-all duration-200" />
            </span>
          </Button>
          <span className="absolute h-2.5 w-2.5 border-foreground/30 group-hover/cta:border-foreground border-b border-r bottom-0 right-0 transition-colors duration-300" />
          <span className="absolute h-2.5 w-2.5 border-foreground/30 group-hover/cta:border-foreground border-b border-l bottom-0 left-0 transition-colors duration-300" />
          <span className="absolute h-2.5 w-2.5 border-foreground/30 group-hover/cta:border-foreground border-t border-r top-0 right-0 transition-colors duration-300" />
          <span className="absolute h-2.5 w-2.5 border-foreground/30 group-hover/cta:border-foreground border-t border-l top-0 left-0 transition-colors duration-300" />
        </a>
      }
    >
      <CodeBlock ref={codeBlockRef} code="bun dev" />
    </StepCard>
  );
}

type Rect = {
  left: number;
  top: number;
  right: number;
  bottom: number;
  cx: number;
  cy: number;
};

function getRect(el: HTMLElement, container: HTMLElement): Rect {
  const er = el.getBoundingClientRect();
  const cr = container.getBoundingClientRect();
  const left = er.left - cr.left;
  const top = er.top - cr.top;
  const right = left + er.width;
  const bottom = top + er.height;
  return {
    left,
    top,
    right,
    bottom,
    cx: (left + right) / 2,
    cy: (top + bottom) / 2,
  };
}

function GridConnectors({
  containerRef,
  refs,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  refs: readonly [
    React.RefObject<HTMLDivElement | null>,
    React.RefObject<HTMLDivElement | null>,
    React.RefObject<HTMLDivElement | null>,
    React.RefObject<HTMLDivElement | null>,
  ];
}) {
  const [lines, setLines] = useState<
    { x1: number; y1: number; x2: number; y2: number }[]
  >([]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const update = () => {
      const els = refs.map((r) => r.current);
      if (els.some((el) => !el)) return;
      const rects = els.map((el) => getRect(el as HTMLElement, container));

      // Connections: 0→1 and 2→3 only
      setLines([
        {
          x1: rects[0].right,
          y1: rects[0].cy,
          x2: rects[1].left,
          y2: rects[1].cy,
        },
        {
          x1: rects[2].right,
          y1: rects[2].cy,
          x2: rects[3].left,
          y2: rects[3].cy,
        },
      ]);
    };

    requestAnimationFrame(update);

    const ro = new ResizeObserver(update);
    ro.observe(container);
    refs.forEach((ref) => {
      if (ref.current) ro.observe(ref.current);
    });
    window.addEventListener("resize", update);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [containerRef, refs]);

  if (lines.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 z-10 pointer-events-none overflow-visible hidden md:block"
      width="100%"
      height="100%"
    >
      {lines.map((l, i) => (
        <g key={i}>
          <line
            x1={l.x1}
            y1={l.y1}
            x2={l.x2}
            y2={l.y2}
            stroke="var(--border)"
            strokeWidth={1}
            strokeDasharray="4 3"
          />
          <circle
            cx={l.x1}
            cy={l.y1}
            r={4}
            fill="var(--background)"
            stroke="var(--border)"
            strokeWidth={1}
          />
          <circle
            cx={l.x2}
            cy={l.y2}
            r={4}
            fill="var(--background)"
            stroke="var(--border)"
            strokeWidth={1}
          />
        </g>
      ))}
    </svg>
  );
}

export default function DocsPage() {
  const gridRef = useRef<HTMLDivElement>(null);
  const ref0 = useRef<HTMLDivElement>(null);
  const ref1 = useRef<HTMLDivElement>(null);
  const ref2 = useRef<HTMLDivElement>(null);
  const ref3 = useRef<HTMLDivElement>(null);
  const nodeRefs = [ref0, ref1, ref2, ref3] as const;

  return (
    <div className="w-full h-screen overflow-hidden flex flex-col mx-auto max-w-7xl border-x">
      {/* Nav */}
      <nav className="relative px-4 py-4 flex items-center justify-between">
        <Link
          href="/"
          className="flex items-center gap-2 font-pixel-square text-[18px] font-semibold hover:opacity-80 transition-opacity"
        >
          <LogoMark />
          <span>ZenithPay</span>
        </Link>
        <div className="flex items-center gap-3">
          <UserDropdown />
        </div>
        <div className="z-10 absolute bottom-0 left-0 -translate-x-1/2 translate-y-1/2 size-2.5 rounded-full border border-border bg-background" />
        <div className="z-10 absolute bottom-0 right-0 translate-x-1/2 translate-y-1/2 size-2.5 rounded-full border border-border bg-background" />
        <div className="border-b absolute bottom-0 left-1/2 -translate-x-1/2 w-screen" />
      </nav>

      {/* Main */}
      <main className="flex-1 flex items-center justify-center px-6 overflow-hidden">
        <div className="w-full max-w-5xl">
          <div className="text-center mb-8">
            <span className="text-[8px] uppercase tracking-[0.2em] text-muted-foreground">
              Getting Started
            </span>
            <h1 className="text-2xl font-bold mt-1">Set up in 4 steps</h1>
          </div>

          {/* 2x2 Grid with connectors */}
          <div
            ref={gridRef}
            className="grid grid-cols-1 md:grid-cols-2 grid-rows-[1fr_1fr] gap-px bg-border border border-border relative"
          >
            <StepCard index={0} label="Clone" title="Clone the repo" centered>
              <CodeBlock
                ref={ref0}
                code="git clone https://github.com/samueldanso/zenithpay"
              />
            </StepCard>

            <InstallCard codeBlockRef={ref1} />

            <ConfigureCard codeBlockRef={ref2} />

            <LaunchCard codeBlockRef={ref3} />

            <GridConnectors containerRef={gridRef} refs={nodeRefs} />
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative px-4 py-4">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">
            built by{" "}
            <a
              href="https://github.com/samueldanso"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Samuel
            </a>
          </span>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <a
              href="https://github.com/samueldanso/zenithpay"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-foreground hover:underline underline-offset-4 transition-colors"
            >
              github
            </a>
          </div>
          <ModeToggle />
        </div>
        <div className="z-10 absolute top-0 left-0 -translate-x-1/2 -translate-y-1/2 size-2.5 rounded-full border border-border bg-background" />
        <div className="z-10 absolute top-0 right-0 translate-x-1/2 -translate-y-1/2 size-2.5 rounded-full border border-border bg-background" />
        <div className="border-t absolute top-0 left-1/2 -translate-x-1/2 w-screen" />
      </footer>
    </div>
  );
}
