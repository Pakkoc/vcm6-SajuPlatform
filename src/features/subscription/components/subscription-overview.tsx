"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils/date";
import { PLAN_LIMITS, SUBSCRIPTION_PLANS } from "@/constants/subscription";
import { useSubscriptionManagement } from "@/features/subscription/context/subscription-management-context";
import type { SubscriptionInfo } from "@/features/subscription/lib/dto";

export function SubscriptionOverview() {
  const { subscription, isLoading, error } = useSubscriptionManagement();

  if (isLoading) {
    return <Skeleton className="h-48 w-full rounded-3xl" />;
  }

  if (error || !subscription) {
    return (
      <Card className="border-rose-200 bg-rose-50">
        <CardHeader>
          <CardTitle className="text-sm font-semibold text-rose-600">
            구독 정보를 불러오지 못했습니다.
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-rose-500">
            {error?.message ?? "잠시 후 다시 시도해 주세요."}
          </p>
        </CardContent>
      </Card>
    );
  }

  const isPro = subscription.plan === SUBSCRIPTION_PLANS.pro;
  const limit = PLAN_LIMITS[subscription.plan].monthlyLimit;

  return (
    <Card className="border-slate-200 bg-white/80">
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <CardTitle className="text-2xl font-semibold text-slate-900">
          현재 구독 요약
        </CardTitle>
        <Badge className={isPro ? "bg-slate-900 text-white" : "bg-slate-200 text-slate-700"}>
          {isPro ? "Pro" : "Free"}
        </Badge>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <InfoItem label="이메일" value={subscription.email} />
        <InfoItem
          label="잔여 검사 횟수"
          value={`${subscription.remainingCount} / ${limit}`}
        />
        <InfoItem label="구독 상태" value={statusLabel(subscription.status)} />
        <InfoItem
          label="다음 결제 예정일"
          value={subscription.nextBillingDate ? formatDate(subscription.nextBillingDate) : "-"}
        />
      </CardContent>
    </Card>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-sm font-medium text-slate-900">{value}</span>
    </div>
  );
}

function statusLabel(status: SubscriptionInfo["status"]) {
  switch (status) {
    case "active":
      return "구독 중";
    case "pending_cancellation":
      return "다음 결제일까지 이용 가능";
    default:
      return status;
  }
}
