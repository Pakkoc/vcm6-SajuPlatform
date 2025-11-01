"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useSubscriptionManagement } from "@/features/subscription/context/subscription-management-context";

export function SubscriptionModals() {
  const {
    modalState,
    closeModal,
    handleCancel,
    handleTerminate,
    actionState,
  } = useSubscriptionManagement();

  if (modalState.type === "none") {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
        {modalState.type === "confirm_cancel" ? (
          <ConfirmView
            title="구독을 취소하시겠습니까?"
            description="취소 시 다음 결제일까지 Pro 혜택이 유지되며, 이후 자동으로 Free 요금제로 전환됩니다."
            confirmLabel="취소 진행"
            onConfirm={handleCancel}
            onClose={closeModal}
            isLoading={actionState === "canceling"}
          />
        ) : null}
        {modalState.type === "confirm_terminate" ? (
          <ConfirmView
            title="구독을 즉시 해지하시겠습니까?"
            description="즉시 해지 시 Pro 혜택이 바로 종료되며, 다시 구독하려면 결제 정보를 재등록해야 합니다."
            confirmLabel="즉시 해지"
            confirmVariant="destructive"
            onConfirm={handleTerminate}
            onClose={closeModal}
            isLoading={actionState === "terminating"}
          />
        ) : null}
        {modalState.type === "success" ? (
          <ResultView
            title="처리가 완료되었습니다"
            message={modalState.message}
            onClose={closeModal}
          />
        ) : null}
        {modalState.type === "error" ? (
          <ResultView
            title="처리 중 문제가 발생했습니다"
            message={modalState.message}
            onClose={closeModal}
            isError
          />
        ) : null}
      </div>
    </div>
  );
}

function ConfirmView({
  title,
  description,
  confirmLabel,
  onConfirm,
  onClose,
  isLoading,
  confirmVariant = "default",
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  isLoading: boolean;
  confirmVariant?: "default" | "destructive";
}) {
  return (
    <div className="space-y-6 text-center">
      <div className="space-y-3">
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        <p className="text-sm text-slate-600">{description}</p>
      </div>
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button
          className={cn(
            confirmVariant === "destructive"
              ? "bg-rose-600 text-white hover:bg-rose-700"
              : "bg-slate-900 text-white hover:bg-slate-800",
          )}
          onClick={() => {
            void onConfirm();
          }}
          disabled={isLoading}
        >
          {isLoading ? "처리 중..." : confirmLabel}
        </Button>
        <Button variant="outline" onClick={onClose}>
          취소
        </Button>
      </div>
    </div>
  );
}

function ResultView({
  title,
  message,
  onClose,
  isError = false,
}: {
  title: string;
  message: string;
  onClose: () => void;
  isError?: boolean;
}) {
  return (
    <div className="space-y-6 text-center">
      <div className="space-y-3">
        <h2 className={cn("text-xl font-semibold", isError ? "text-rose-600" : "text-slate-900")}>
          {title}
        </h2>
        <p className={cn("text-sm", isError ? "text-rose-500" : "text-slate-600")}>{message}</p>
      </div>
      <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={onClose}>
        확인
      </Button>
    </div>
  );
}
