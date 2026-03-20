"use client";

import Image from "next/image";
import { useTheme } from "next-themes";

type ZpDocsLogoMarkProps = {
  className?: string;
};

export function ZpDocsLogoMark({ className }: ZpDocsLogoMarkProps) {
  const { resolvedTheme } = useTheme();

  // Match the web implementation: swap which SVG variant is used based on theme.
  // - dark: use the "light" SVG so it contrasts on dark backgrounds
  // - light: use the "dark" SVG so it contrasts on light backgrounds
  const src = resolvedTheme === "dark" ? "/icon-light.svg" : "/icon-dark.svg";

  return (
    <Image
      src={src}
      alt="ZenithPay icon"
      width={26}
      height={26}
      priority
      className={className}
    />
  );
}

