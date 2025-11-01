"use client";

import { NewAnalysisProvider } from "@/features/new-analysis/context/new-analysis-context";
import { AnalysisForm } from "@/features/new-analysis/components/analysis-form";
import { AnalysisModal } from "@/features/new-analysis/components/analysis-modal";

type NewAnalysisPageProps = {
  params: Promise<Record<string, never>>;
};

export default function NewAnalysisPage({ params }: NewAnalysisPageProps) {
  void params;

  return (
    <NewAnalysisProvider>
      <section className="space-y-8">
        <header className="space-y-2">
          <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            새 검사
          </span>
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
            기본 정보를 입력하고 AI 사주 분석을 시작하세요
          </h1>
          <p className="text-sm leading-6 text-slate-600 md:text-base">
            Free 요금제는 최초 1회, Pro 요금제는 월 10회까지 분석이 가능합니다. 입력하신 정보는 분석 후 대시보드에 저장됩니다.
          </p>
        </header>
        <AnalysisForm />
      </section>
      <AnalysisModal />
    </NewAnalysisProvider>
  );
}
