"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { SubscriptionManagementProvider } from "@/features/subscription/context/subscription-management-context";
import { SubscriptionOverview } from "@/features/subscription/components/subscription-overview";
import { SubscriptionActions } from "@/features/subscription/components/subscription-actions";
import { SubscriptionModals } from "@/features/subscription/components/subscription-modals";
import { SubscriptionUpgradeModal } from "@/features/subscription/components/subscription-upgrade-modal";
import { cn } from "@/lib/utils";

type SubscriptionPageProps = {
  params: Promise<Record<string, never>>;
};

export default function SubscriptionPage({ params }: SubscriptionPageProps) {
  void params;

  return (
    <SubscriptionManagementProvider>
      <Suspense fallback={null}>
        <SubscriptionContent />
      </Suspense>
      <SubscriptionModals />
      <SubscriptionUpgradeModal />
    </SubscriptionManagementProvider>
  );
}

function SubscriptionContent() {
  const searchParams = useSearchParams();
  const upgradeStatus = searchParams.get("upgrade");

  return (
    <section className="space-y-8">
      <header className="space-y-2">
        <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
          구독 관리
        </span>
        <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">
          요금제 상태를 확인하고 결제 정보를 관리하세요
        </h1>
        <p className="text-sm leading-6 text-slate-600 md:text-base">
          Saju맛피아 Pro 요금제 구독 상태와 결제 정보를 한눈에 확인하고, 필요에 따라 취소하거나 다시 활성화할 수 있습니다.
        </p>
      </header>
      {upgradeStatus ? <UpgradeStatusMessage status={upgradeStatus} /> : null}
      <SubscriptionOverview />
      <SubscriptionActions />
    </section>
  );
}

function UpgradeStatusMessage({ status }: { status: string }) {
  const isSuccess = status === "success";
  return (
    <div
      className={cn(
        "rounded-3xl border p-4 text-sm",
        isSuccess
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : "border-rose-200 bg-rose-50 text-rose-700",
      )}
    >
      {isSuccess
        ? "Pro 요금제로 업그레이드가 완료되었습니다. 결제가 정상 처리되었습니다."
        : "결제가 완료되지 않았습니다. 잠시 후 다시 시도해 주세요."}
    </div>
  );
}
