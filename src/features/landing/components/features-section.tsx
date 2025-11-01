"use client";

import { FEATURE_ITEMS, LANDING_SECTIONS } from "../constants";
import { FeatureCard } from "./feature-card";

export function FeaturesSection() {
  return (
    <section
      id={LANDING_SECTIONS.features}
      className="space-y-6 rounded-3xl border border-slate-200 bg-white/70 p-10 backdrop-blur"
    >
      <header className="space-y-3 text-center">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          Saju맛피아가 특별한 이유
        </span>
        <h2 className="text-3xl font-bold text-slate-900 md:text-4xl">
          AI가 안내하는 맞춤형 사주 인사이트
        </h2>
        <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
          단순한 운세를 넘어, Gemini가 제공하는 데이터 기반 분석과 직관적인
          대시보드가 당신의 하루와 장기 계획까지 책임집니다.
        </p>
      </header>
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {FEATURE_ITEMS.map((item) => (
          <FeatureCard
            key={item.title}
            emoji={item.emoji}
            title={item.title}
            description={item.description}
          />
        ))}
      </div>
    </section>
  );
}
