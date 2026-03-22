"use client";

import { Suspense, useEffect, useState } from "react";
import ModeToggle from "@/components/theme-toggle/mode-toggle";
import { OnboardingFlow } from "./onboarding-flow";

const TARGET_COLS = 8;
const TARGET_ROWS = 8;

const cellStyle = {
  backgroundImage:
    "repeating-linear-gradient(315deg, currentColor 0, currentColor 1px, transparent 0, transparent 50%)",
  backgroundSize: "7px 7px",
  backgroundAttachment: "fixed" as const,
  color: "oklch(from var(--foreground) l c h / 0.08)",
};

export default function OnboardingPage() {
  const [grid, setGrid] = useState({ cols: 0, rows: 0, cellW: 0, cellH: 0 });

  useEffect(() => {
    function calc() {
      setGrid({
        cols: TARGET_COLS,
        rows: TARGET_ROWS,
        cellW: window.innerWidth / TARGET_COLS,
        cellH: window.innerHeight / TARGET_ROWS,
      });
    }
    calc();
    window.addEventListener("resize", calc);
    return () => window.removeEventListener("resize", calc);
  }, []);

  if (grid.cols === 0) return null;

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* Hatched border cells */}
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${grid.cols}, ${grid.cellW}px)`,
          gridTemplateRows: `repeat(${grid.rows}, ${grid.cellH}px)`,
        }}
      >
        {Array.from({ length: grid.rows * grid.cols }).map((_, i) => {
          const row = Math.floor(i / grid.cols);
          const col = i % grid.cols;
          const isBorder =
            row === 0 ||
            row === grid.rows - 1 ||
            col === 0 ||
            col === grid.cols - 1;

          if (!isBorder) return null;
          return (
            <div
              key={i}
              className="hidden border border-border md:block"
              style={{ ...cellStyle, gridColumn: col + 1, gridRow: row + 1 }}
            />
          );
        })}

        {/* Inner panel — full inner grid, single column, scrollable */}
        <div className="relative col-[1/9] row-[1/9] bg-background border-0 md:col-[2/8] md:row-[2/8] md:border md:border-border overflow-y-auto">
          <ModeToggle className="absolute top-2 right-2 dark:hover:bg-transparent w-auto h-auto" />
          <div className="flex min-h-full items-center justify-center p-8">
            <div className="w-full max-w-lg">
              <Suspense fallback={<div className="size-8 animate-pulse bg-muted" />}>
                <OnboardingFlow />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
