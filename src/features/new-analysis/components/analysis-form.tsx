"use client";

import { FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ROUTES } from "@/constants/routes";
import { useNewAnalysis } from "../context/new-analysis-context";
import { useSubscriptionInfo } from "@/features/subscription/hooks/use-subscription-info";

export function AnalysisForm() {
  const router = useRouter();
  const {
    formData,
    validationErrors,
    modalState,
    setField,
    submit,
    analysisResult,
    resetForm,
  } = useNewAnalysis();
  const { data: subscription } = useSubscriptionInfo();

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (subscription && subscription.remainingCount === 0) {
      return;
    }
    await submit();
  };

  const isAnalyzing = modalState === "analyzing";
  const isSuccess = modalState === "success" && analysisResult !== null;
  const isLimitExceeded = subscription ? subscription.remainingCount === 0 : false;

  return (
    <div className="grid gap-10 lg:grid-cols-[2fr_1fr]">
      <Card className="border-slate-200 bg-white/80">
        <CardHeader>
          <CardTitle className="text-xl font-semibold text-slate-900">
            새로운 사주 분석 요청
          </CardTitle>
          <p className="text-sm text-slate-500">
            이름, 생년월일, 출생 시간 정보를 입력하고 AI 분석을 시작하세요. 정보는 Supabase에 안전하게 저장됩니다.
          </p>
        </CardHeader>
        <CardContent>
          <form className="flex flex-col gap-6" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="name">이름</Label>
              <Input
                id="name"
                data-testid="name-input"
                value={formData.name}
                onChange={(event) => setField("name", event.target.value)}
                placeholder="홍길동"
              />
              {validationErrors.name ? (
                <p className="text-xs text-rose-500">{validationErrors.name}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthDate">생년월일</Label>
              <Input
                id="birthDate"
                type="date"
                data-testid="birth-date"
                value={formData.birthDate}
                onChange={(event) => setField("birthDate", event.target.value)}
              />
              {validationErrors.birthDate ? (
                <p className="text-xs text-rose-500">{validationErrors.birthDate}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label htmlFor="birthTime">출생 시간</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="birthTime"
                  type="time"
                  step={60}
                  value={formData.birthTime}
                  onChange={(event) => setField("birthTime", event.target.value)}
                  disabled={formData.isBirthTimeUnknown}
                  className="max-w-[160px]"
                />
                <label className="flex items-center gap-2 text-xs text-slate-600">
                  <Checkbox
                    checked={formData.isBirthTimeUnknown}
                    onCheckedChange={(checked) =>
                      setField("isBirthTimeUnknown", Boolean(checked))
                    }
                  />
                  출생 시간을 모릅니다
                </label>
              </div>
              {validationErrors.birthTime ? (
                <p className="text-xs text-rose-500">{validationErrors.birthTime}</p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>성별</Label>
              <div className="flex gap-2">
                {[
                  { value: "male", label: "남성" },
                  { value: "female", label: "여성" },
                ].map((option) => {
                  const isActive = formData.gender === option.value;
                  return (
                    <Button
                      key={option.value}
                      type="button"
                      variant={isActive ? "default" : "outline"}
                      className={isActive ? "bg-slate-900 text-white" : "border-slate-200"}
                      onClick={() => setField("gender", option.value as "male" | "female")}
                    >
                      {option.label}
                    </Button>
                  );
                })}
              </div>
              {validationErrors.gender ? (
                <p className="text-xs text-rose-500">{validationErrors.gender}</p>
              ) : null}
            </div>
            <div className="flex items-center gap-3">
              <Button
                data-testid="submit-button"
                type="submit"
                disabled={isAnalyzing || isLimitExceeded}
                className="bg-slate-900 text-white hover:bg-slate-800"
              >
                {isAnalyzing
                  ? "분석 중..."
                  : isLimitExceeded
                    ? "잔여 횟수 없음"
                    : "검사 시작"}
              </Button>
              {isSuccess ? (
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => {
                    if (!analysisResult) return;
                    router.push(ROUTES.analysisDetail(analysisResult.id));
                    resetForm();
                  }}
                >
                  상세 결과 보기
                </Button>
              ) : null}
            </div>
            {isLimitExceeded && subscription ? (
              <div className="rounded-2xl bg-amber-50 p-4 text-xs text-amber-700">
                <p className="font-semibold">
                  {subscription.plan === "free"
                    ? "무료 체험 기회를 모두 사용했습니다. Pro 요금제로 업그레이드하고 더 많은 분석을 이용해 보세요."
                    : "이번 달 분석 한도를 모두 사용했습니다. 다음 결제일까지 기다리거나 구독 관리에서 자세한 내용을 확인하세요."}
                </p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    size="sm"
                    className="bg-slate-900 text-white hover:bg-slate-800"
                    onClick={() => router.push(ROUTES.subscription)}
                  >
                    구독 관리로 이동
                  </Button>
                  {subscription.plan === "free" ? (
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => router.push(ROUTES.signUp)}
                    >
                      Pro 업그레이드 안내
                    </Button>
                  ) : null}
                </div>
              </div>
            ) : null}
          </form>
        </CardContent>
      </Card>
      <AnalysisHelpPanel />
    </div>
  );
}

function AnalysisHelpPanel() {
  return (
    <Card className="border-slate-200 bg-white/70">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">
          분석 가이드
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-slate-600">
        <p>
          정확한 분석을 위해 생년월일과 출생 시간을 가능한 한 정확하게 입력해주세요. 출생 시간을 모를 경우에도 분석은 진행되지만, 결과 정밀도가 다소 낮아질 수 있습니다.
        </p>
        <p>
          Free 요금제 사용자는 1회의 분석 기회가 제공되며, Pro 요금제는 매월 10회의 분석이 가능합니다.
        </p>
      </CardContent>
    </Card>
  );
}
