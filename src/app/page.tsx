"use client";

import { LANDING_SECTIONS } from "@/features/landing/constants";
import { FeaturesSection } from "@/features/landing/components/features-section";
import { HeroSection } from "@/features/landing/components/hero-section";
import { PricingSection } from "@/features/landing/components/pricing-section";

type LandingPageProps = {
  params: Promise<Record<string, never>>;
};

export default function LandingPage({ params }: LandingPageProps) {
  void params;

  return (
    <main className="mx-auto flex min-h-screen max-w-6xl flex-col gap-16 px-6 py-16 md:gap-20 md:py-24">
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
      <FooterSection />
    </main>
  );
}

function FooterSection() {
  return (
    <footer className="rounded-3xl border border-slate-200 bg-white/70 p-10 text-center backdrop-blur">
      <p className="text-sm font-medium text-slate-700">
        Saju맛피아와 함께 AI 기반 명리학 분석을 시작해 보세요.
      </p>
      <p className="mt-2 text-xs text-slate-500">
        Hero, Features, Pricing 섹션은 각각{" "}
        <code className="rounded bg-slate-100 px-1 py-0.5 text-slate-700">
          #{LANDING_SECTIONS.hero}
        </code>
        ,{" "}
        <code className="rounded bg-slate-100 px-1 py-0.5 text-slate-700">
          #{LANDING_SECTIONS.features}
        </code>
        ,{" "}
        <code className="rounded bg-slate-100 px-1 py-0.5 text-slate-700">
          #{LANDING_SECTIONS.pricing}
        </code>{" "}
        앵커를 통해 빠르게 이동할 수 있습니다.
      </p>
    </footer>
  );
}
