"use client";

import Image from "next/image";
import { useTheme } from "next-themes";
import { cn } from "@/lib/utils";

type LogoMarkProps = {
  className?: string;
};

export function LogoMark({ className }: LogoMarkProps) {
  const { resolvedTheme } = useTheme();

  const size = 24;
  const src = resolvedTheme === "dark" ? "/icon-light.svg" : "/icon-dark.svg";

  return (
    <Image
      src={src}
      alt="ZenithPay icon"
      width={size}
      height={size}
      className={cn("size-5 shrink-0", className)}
      priority
    />
  );
}
