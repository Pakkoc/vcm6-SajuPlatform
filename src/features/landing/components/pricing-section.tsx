"use client";

import { useRouter } from "next/navigation";
import { LANDING_SECTIONS, PRICING_PLANS } from "../constants";
import { PricingCard } from "./pricing-card";

export function PricingSection() {
  const router = useRouter();

  return (
    <section
      id={LANDING_SECTIONS.pricing}
      className="space-y-6 rounded-3xl border border-slate-200 bg-white/70 p-10 backdrop-blur"
    >
      <header className="space-y-3 text-center">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          요금제
        </span>
        <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
          무료 체험부터 Pro 정기결제까지 한번에
        </h2>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
          Free 요금제로 간단한 분석을 체험하고, Pro 요금제로 월 10회의 상세
          분석과 맞춤형 인사이트를 받아보세요.
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-2">
        {PRICING_PLANS.map((plan) => (
          <PricingCard
            key={plan.plan}
            title={plan.title}
            priceLabel={plan.priceLabel}
            limitLabel={plan.limitLabel}
            modelLabel={plan.modelLabel}
            features={plan.features}
            ctaLabel={plan.ctaLabel}
            onCtaClick={() => router.push(plan.href)}
            highlighted={plan.plan === "pro"}
          />
        ))}
      </div>
    </section>
  );
}
