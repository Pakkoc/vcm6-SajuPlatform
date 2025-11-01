"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { useDashboardContext } from "../context/dashboard-context";
import { AnalysisCard } from "./analysis-card";

export function AnalysisGrid() {
  const {
    filteredAnalyses,
    isLoading,
    error,
    hasNoSearchResults,
    isEmpty,
    refetch,
  } = useDashboardContext();

  if (isLoading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-40 w-full rounded-2xl" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-rose-200 bg-rose-50 p-10 text-center">
        <p className="text-sm font-semibold text-rose-600">
          분석 목록을 불러오는 중 문제가 발생했습니다.
        </p>
        <p className="text-xs text-rose-500">
          {error}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="rounded-full bg-rose-600 px-4 py-2 text-xs font-semibold text-white hover:bg-rose-700"
        >
          다시 시도
        </button>
      </div>
    );
  }

  if (hasNoSearchResults) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white/80 p-10 text-center">
        <p className="text-sm font-semibold text-slate-700">
          검색 결과가 없습니다.
        </p>
        <p className="text-xs text-slate-500">
          다른 이름으로 검색해 보거나 검색어를 지워 다시 시도하세요.
        </p>
      </div>
    );
  }

  if (isEmpty) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-3xl border border-slate-200 bg-white/80 p-10 text-center">
        <p className="text-sm font-semibold text-slate-700">
          아직 분석 내역이 없습니다.
        </p>
        <p className="text-xs text-slate-500">
          첫 분석을 시작하면 결과가 여기에 표시됩니다.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
      {filteredAnalyses.map((analysis) => (
        <AnalysisCard key={analysis.id} analysis={analysis} />
      ))}
    </div>
  );
}
