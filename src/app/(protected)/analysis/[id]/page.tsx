"use client";

import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { AnalysisDetailProvider, useAnalysisDetail } from "@/features/analysis-detail/context/analysis-detail-context";
import { AnalysisInfoCard } from "@/features/analysis-detail/components/analysis-info-card";
import { AnalysisResultSection } from "@/features/analysis-detail/components/analysis-result-section";

type AnalysisDetailPageProps = {
  params: Promise<Record<string, string>>;
};

export default function AnalysisDetailPage({ params }: AnalysisDetailPageProps) {
  void params;
  const routeParams = useParams<{ id?: string }>();
  const analysisId = routeParams?.id ?? "";

  if (!analysisId) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center text-sm text-rose-600">
        잘못된 접근입니다. 대시보드에서 다시 시도해 주세요.
      </div>
    );
  }

  return (
    <AnalysisDetailProvider analysisId={analysisId}>
      <AnalysisDetailView />
    </AnalysisDetailProvider>
  );
}

function AnalysisDetailView() {
  const { analysis, isLoading, error, refetch } = useAnalysisDetail();

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-32 w-full rounded-3xl" />
        <Skeleton className="h-80 w-full rounded-3xl" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center">
        <p className="text-sm font-semibold text-rose-600">분석 결과를 불러오지 못했습니다.</p>
        <p className="text-xs text-rose-500">{error}</p>
        <Button
          onClick={() => refetch()}
          className="bg-slate-900 text-white hover:bg-slate-800"
        >
          다시 시도
        </Button>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center text-sm text-rose-600">
        분석 결과를 찾을 수 없습니다.
      </div>
    );
  }

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          분석 상세
        </span>
        <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
          {analysis.name}님의 사주 분석 결과
        </h1>
        <p className="text-sm leading-6 text-slate-600 md:text-base">
          입력하신 정보를 바탕으로 Gemini 모델이 도출한 심층 분석 내용을 확인하세요.
        </p>
      </header>
      <AnalysisInfoCard analysis={analysis} />
      <AnalysisResultSection result={analysis.result} />
    </section>
  );
}
