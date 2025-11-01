"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils/date";
import type { SajuAnalysisDetail } from "@/features/saju-analysis/lib/dto";

const GENDER_LABEL: Record<SajuAnalysisDetail["gender"], string> = {
  male: "남성",
  female: "여성",
};

export function AnalysisInfoCard({ analysis }: { analysis: SajuAnalysisDetail }) {
  return (
    <Card className="border-slate-200 bg-white/80">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-2xl font-semibold text-slate-900">
            {analysis.name}
          </CardTitle>
          <Badge className="bg-slate-900 text-white">{analysis.modelUsed}</Badge>
        </div>
        <p className="text-xs text-slate-500">
          분석일 {formatDate(analysis.createdAt)}
        </p>
      </CardHeader>
      <CardContent className="grid gap-3 text-sm text-slate-600 md:grid-cols-2">
        <InfoRow label="생년월일" value={formatDate(analysis.birthDate)} />
        <InfoRow
          label="출생 시간"
          value={analysis.birthTime ? analysis.birthTime : "모름"}
        />
        <InfoRow label="성별" value={GENDER_LABEL[analysis.gender]} />
        <InfoRow label="AI 모델" value={analysis.modelUsed} />
      </CardContent>
    </Card>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="font-medium text-slate-900">{value}</span>
    </div>
  );
}
