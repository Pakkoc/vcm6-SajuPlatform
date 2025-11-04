"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PLAN_LIMITS,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_STATUS,
} from "@/constants/subscription";
import { ROUTES } from "@/constants/routes";
import { cn } from "@/lib/utils";
import { formatDate } from "@/lib/utils/date";
import { useSubscriptionInfo } from "../hooks/use-subscription-info";

const STATUS_LABELS: Record<string, string> = {
  [SUBSCRIPTION_STATUS.active]: "구독 중",
  [SUBSCRIPTION_STATUS.pendingCancellation]: "다음 결제일까지 이용 가능",
};

export function SubscriptionStatusCard() {
  const router = useRouter();
  const { data, isLoading, isError } = useSubscriptionInfo();

  const remainingLabel = useMemo(() => {
    if (!data) return "";

    const limit = PLAN_LIMITS[data.plan].monthlyLimit;
    return `${data.remainingCount} / ${limit}회 남음`;
  }, [data]);

  if (isLoading) {
    return (
      <Card className="cursor-default border-slate-200 bg-white/80">
        <CardHeader>
          <CardTitle className="text-sm text-slate-500">구독 상태</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-2/5" />
          <Skeleton className="h-3 w-1/2" />
        </CardContent>
      </Card>
    );
  }

  if (isError || !data) {
    return (
      <Card className="cursor-pointer border-rose-200 bg-rose-50 transition hover:border-rose-300">
        <CardHeader>
          <CardTitle className="text-sm text-rose-600">구독 정보 확인 불가</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-xs text-rose-500">
            구독 정보를 불러오지 못했습니다. 구독 관리 페이지에서 다시 시도해 주세요.
          </p>
        </CardContent>
      </Card>
    );
  }

  const statusLabel = STATUS_LABELS[data.status] ?? "구독 정보";
  const isProPlan = data.plan === SUBSCRIPTION_PLANS.pro;

  return (
    <Card
      role="button"
      tabIndex={0}
      onClick={() => router.push(ROUTES.subscription)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          router.push(ROUTES.subscription);
        }
      }}
      className={cn(
        "cursor-pointer border-slate-200 bg-white/80 transition hover:border-slate-300 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-400"
      )}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-sm font-semibold text-slate-700">
          <span>구독 상태</span>
          <Badge
            className={cn(
              "capitalize",
              data.status === SUBSCRIPTION_STATUS.pendingCancellation
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
            )}
          >
            {statusLabel}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 text-sm text-slate-600">
        <p className="font-medium text-slate-900">{data.email}</p>
        <p>
          요금제:{" "}
          <span className="font-semibold text-slate-900">
            {isProPlan ? "Pro" : "Free"}
          </span>
        </p>
        <p>{remainingLabel}</p>
        {data.nextBillingDate ? (
          <p className="text-xs text-slate-500">
            다음 결제 예정일:{" "}
            <time dateTime={data.nextBillingDate}>{formatDate(data.nextBillingDate)}</time>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
