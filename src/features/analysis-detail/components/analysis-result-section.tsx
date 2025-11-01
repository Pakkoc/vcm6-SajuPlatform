"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ROUTES } from "@/constants/routes";
import { renderMarkdown } from "@/lib/utils/markdown";
import { useRouter } from "next/navigation";

export function AnalysisResultSection({ result }: { result: string }) {
  const router = useRouter();
  const html = renderMarkdown(result);

  return (
    <Card className="border-slate-200 bg-white/80">
      <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <CardTitle className="text-2xl font-semibold text-slate-900">
          분석 결과
        </CardTitle>
        <div className="flex flex-wrap gap-3">
          <Button
            variant="outline"
            onClick={() => router.push(ROUTES.dashboard)}
            className="border-slate-200"
          >
            대시보드로 돌아가기
          </Button>
          <Button
            onClick={() => router.push(ROUTES.newAnalysis)}
            className="bg-slate-900 text-white hover:bg-slate-800"
          >
            새 분석 시작
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div
          data-testid="analysis-result"
          className="prose prose-slate max-w-none text-sm leading-7"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </CardContent>
    </Card>
  );
}
