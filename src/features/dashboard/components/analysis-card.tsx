"use client";

import { useCallback } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { SUBSCRIPTION_PLANS } from "@/constants/subscription";
import { formatDate, formatRelativeToNow } from "@/lib/utils/date";
import type { SajuAnalysisSummary } from "@/features/saju-analysis/lib/dto";

type AnalysisCardProps = {
  analysis: SajuAnalysisSummary;
};

const MODEL_LABEL: Record<SajuAnalysisSummary["modelUsed"], string> = {
  "gemini-2.5-flash": "Flash",
  "gemini-2.5-pro": "Pro",
};

export function AnalysisCard({ analysis }: AnalysisCardProps) {
  const router = useRouter();

  const handleClick = useCallback(() => {
    router.push(ROUTES.analysisDetail(analysis.id));
  }, [analysis.id, router]);

  const planLabel =
    analysis.modelUsed === "gemini-2.5-pro"
      ? SUBSCRIPTION_PLANS.pro
      : SUBSCRIPTION_PLANS.free;

  return (
    <Card
      data-testid="analysis-card"
      role="button"
      tabIndex={0}
      onClick={handleClick}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          handleClick();
        }
      }}
      className="flex h-full flex-col border-slate-200 bg-white transition hover:-translate-y-1 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
    >
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <CardTitle className="truncate text-lg font-semibold text-slate-900">
            {analysis.name}
          </CardTitle>
          <Badge className="capitalize bg-slate-900 text-white">
            {planLabel}
          </Badge>
        </div>
        <div className="flex flex-col gap-1 text-xs text-slate-500">
          <span>생년월일: {formatDate(analysis.birthDate)}</span>
          <span>분석일: {formatRelativeToNow(analysis.createdAt)}</span>
        </div>
      </CardHeader>
      <CardContent className="mt-auto space-y-3 text-sm text-slate-600">
        <p className="line-clamp-3 leading-6">{analysis.summary}</p>
        <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-1 text-xs text-slate-500">
          사용 모델: Gemini {MODEL_LABEL[analysis.modelUsed]}
        </span>
      </CardContent>
    </Card>
  );
}
