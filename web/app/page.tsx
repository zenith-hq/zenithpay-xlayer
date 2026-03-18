"use client";

import { CTASection } from "../components/marketing/cta-section";
import { FAQsSection } from "../components/marketing/faqs-section";
import { FeaturesSection } from "../components/marketing/features-section";
import { HeroSection } from "../components/marketing/hero-section";
import { HowItWorksSection } from "../components/marketing/how-it-works-section";
import { IntegrationsSection } from "../components/marketing/integrations-section";
import { Ladder } from "../components/marketing/ladder";
import { LandingFooter } from "../components/marketing/landing-footer";
import { LandingNav } from "../components/marketing/landing-nav";

export default function Home() {
  return (
    <div className="flex min-h-screen w-full flex-col">
      <LandingNav />

      <div className="flex-1 w-full xl:grid xl:grid-cols-[minmax(0,1fr)_minmax(0,80rem)_minmax(0,1fr)]">
        <aside className="pointer-events-none hidden xl:block">
          <Ladder side="left" />
        </aside>

        <div className="flex flex-col min-w-0">
          <HeroSection />
          <FeaturesSection />
          <HowItWorksSection />
          <IntegrationsSection />
          <FAQsSection />
          <CTASection />
        </div>

        <aside className="pointer-events-none hidden xl:block">
          <Ladder side="right" />
        </aside>
      </div>

      <LandingFooter />
    </div>
  );
}
