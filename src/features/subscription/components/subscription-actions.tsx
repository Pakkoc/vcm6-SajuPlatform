"use client";

import { Button } from "@/components/ui/button";
import { useSubscriptionManagement } from "@/features/subscription/context/subscription-management-context";
import { PLAN_LIMITS, SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUS } from "@/constants/subscription";

export function SubscriptionActions() {
  const {
    subscription,
    actionState,
    openCancelModal,
    handleReactivate,
    openTerminateModal,
    startUpgrade,
  } = useSubscriptionManagement();

  if (!subscription) {
    return null;
  }

  const isPro = subscription.plan === SUBSCRIPTION_PLANS.pro;
  const isPendingCancellation = subscription.status === SUBSCRIPTION_STATUS.pendingCancellation;

  if (!isPro) {
    return (
      <div className="rounded-3xl border border-slate-200 bg-white/80 p-8">
        <h2 className="text-xl font-semibold text-slate-900">Pro 요금제 업그레이드</h2>
        <p className="mt-2 text-sm text-slate-600">
          월 {PLAN_LIMITS[SUBSCRIPTION_PLANS.pro].monthlyLimit}회의 심층 분석과 Gemini Pro 모델을 이용해 보세요.
        </p>
        <Button
          className="mt-4 bg-slate-900 text-white hover:bg-slate-800"
          onClick={startUpgrade}
          disabled={actionState === "upgrading"}
        >
          Pro 요금제 업그레이드
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-3xl border border-slate-200 bg-white/80 p-8">
      <h2 className="text-xl font-semibold text-slate-900">구독 관리</h2>
      <p className="mt-2 text-sm text-slate-600">
        프로 요금제는 다음 결제일에 자동으로 갱신됩니다. 결제 전 취소하거나 즉시 해지할 수 있습니다.
      </p>
      <div className="mt-6 flex flex-wrap gap-3">
        {isPendingCancellation ? (
          <Button
            className="bg-slate-900 text-white hover:bg-slate-800"
            disabled={actionState === "reactivating"}
            onClick={handleReactivate}
          >
            취소 철회
          </Button>
        ) : (
          <Button
            variant="outline"
            className="border-slate-200"
            disabled={actionState === "canceling"}
            onClick={openCancelModal}
          >
            결제 주기 종료 시 취소
          </Button>
        )}
        <Button
          variant="destructive"
          disabled={actionState === "terminating"}
          onClick={openTerminateModal}
        >
          즉시 해지
        </Button>
      </div>
    </div>
  );
}
