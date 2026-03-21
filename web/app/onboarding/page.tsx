"use client";

import { Suspense } from "react";
import { OnboardingFlow } from "./onboarding-flow";

export default function OnboardingPage() {
  return (
    <Suspense
      fallback={
        <div className="size-8 animate-pulse rounded-none bg-muted" />
      }
    >
      <OnboardingFlow />
    </Suspense>
  );
}
