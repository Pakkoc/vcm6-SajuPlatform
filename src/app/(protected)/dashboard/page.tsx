"use client";

import { DashboardProvider } from "@/features/dashboard/context/dashboard-context";
import { DashboardSearchBar } from "@/features/dashboard/components/search-bar";
import { AnalysisGrid } from "@/features/dashboard/components/analysis-grid";

type DashboardPageProps = {
  params: Promise<Record<string, never>>;
};

export default function DashboardPage({ params }: DashboardPageProps) {
  void params;

  return (
    <DashboardProvider>
      <section className="flex flex-col gap-10">
        <header className="space-y-4">
          <div className="space-y-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
              내 분석 요약
            </span>
            <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
              분석 기록을 확인하고 새로운 인사이트를 얻어보세요
            </h1>
            <p className="text-sm leading-6 text-slate-600 md:text-base">
              최근에 실행한 사주 분석이 최신순으로 정리되어 있습니다. 이름으로 검색하여 원하는 결과를 빠르게 찾아보세요.
            </p>
          </div>
          <DashboardSearchBar />
        </header>
        <AnalysisGrid />
      </section>
    </DashboardProvider>
  );
}
