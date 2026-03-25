"use client";

import dynamic from "next/dynamic";
import type React from "react";

const Dither = dynamic(() => import("./dither"), { ssr: false });

interface ZenithDitherProps {
  opacity?: number;
  className?: string;
}

export function ZenithDither({ opacity = 0.28, className }: ZenithDitherProps) {
  return (
    <div
      aria-hidden="true"
      className={`absolute inset-0 size-full pointer-events-none [&_canvas]:pointer-events-none ${className ?? ""}`}
      style={
        {
          "--dither-opacity": opacity,
          opacity,
          animation: "dither-breathe 6s ease-in-out infinite",
          maskImage:
            "radial-gradient(ellipse 110% 120% at 50% 50%, transparent 20%, rgba(0,0,0,0.4) 50%, black 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 110% 120% at 50% 50%, transparent 20%, rgba(0,0,0,0.4) 50%, black 80%)",
        } as React.CSSProperties
      }
    >
      <Dither
        waveSpeed={0.02}
        waveFrequency={2}
        waveAmplitude={0.25}
        waveColor={[1, 1, 1]}
        backgroundColor={[0, 0, 0]}
        colorNum={2}
        pixelSize={4}
        enableMouseInteraction={false}
        disableAnimation={false}
        mouseRadius={1}
      />
    </div>
  );
}
