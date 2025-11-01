"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ROUTES } from "@/constants/routes";
import { useNewAnalysis } from "../context/new-analysis-context";

export function AnalysisModal() {
  const router = useRouter();
  const { modalState, analysisResult, errorMessage, closeModal, resetForm } = useNewAnalysis();

  const isOpen = modalState !== "idle";

  if (!isOpen) {
    return null;
  }

  const handleClose = () => {
    closeModal();
  };

  const handleViewDetail = () => {
    if (!analysisResult) return;
    router.push(ROUTES.analysisDetail(analysisResult.id));
    resetForm();
    closeModal();
  };

  const handleGoToSubscription = () => {
    router.push(ROUTES.subscription);
    closeModal();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
        {modalState === "analyzing" ? (
          <AnalyzingView onCancel={handleClose} />
        ) : null}
        {modalState === "success" && analysisResult ? (
          <SuccessView
            summary={analysisResult.summary}
            onViewDetail={handleViewDetail}
            onClose={handleClose}
          />
        ) : null}
        {modalState === "error" ? (
          <ErrorView
            message={errorMessage ?? "알 수 없는 오류가 발생했습니다."}
            onClose={handleClose}
            onManageSubscription={handleGoToSubscription}
          />
        ) : null}
      </div>
    </div>
  );
}

function AnalyzingView({ onCancel }: { onCancel: () => void }) {
  return (
    <div className="flex flex-col items-center gap-6 text-center">
      <div className="flex flex-col items-center gap-4">
        <span
          className={cn(
            "flex h-16 w-16 items-center justify-center rounded-full border-4 border-slate-200",
            "border-t-slate-900 animate-spin",
          )}
        />
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-slate-900">AI가 분석 중입니다</h2>
          <p className="text-sm text-slate-600">
            Google Gemini가 입력하신 정보를 해석하고 있습니다. 보통 10~30초가 소요됩니다.
          </p>
        </div>
      </div>
      <Button variant="ghost" onClick={onCancel}>
        취소
      </Button>
    </div>
  );
}

function SuccessView({
  summary,
  onViewDetail,
  onClose,
}: {
  summary: string;
  onViewDetail: () => void;
  onClose: () => void;
}) {
  return (
    <div className="space-y-6 text-center">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">분석이 완료되었습니다</h2>
        <p className="rounded-2xl bg-slate-100 p-4 text-sm leading-6 text-slate-700">
          {summary}
        </p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={onViewDetail}>
          전체 결과 보기
        </Button>
        <Button variant="outline" onClick={onClose}>
          닫기
        </Button>
      </div>
    </div>
  );
}

function ErrorView({
  message,
  onClose,
  onManageSubscription,
}: {
  message: string;
  onClose: () => void;
  onManageSubscription: () => void;
}) {
  return (
    <div className="space-y-6 text-center">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-rose-600">분석을 진행할 수 없습니다</h2>
        <p className="text-sm text-rose-500">{message}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={onClose}>
          다시 시도
        </Button>
        <Button variant="outline" onClick={onManageSubscription}>
          구독 관리로 이동
        </Button>
      </div>
    </div>
  );
}
