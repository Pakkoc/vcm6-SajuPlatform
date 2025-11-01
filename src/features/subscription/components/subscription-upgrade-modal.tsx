"use client";

import { useEffect, useRef, useState } from "react";
import { loadPaymentWidget, type PaymentWidgetInstance } from "@tosspayments/payment-widget-sdk";
import { Button } from "@/components/ui/button";
import { clientEnv } from "@/constants/env";
import { PLAN_LIMITS, SUBSCRIPTION_PLANS, TOSS_PRODUCT } from "@/constants/subscription";
import { useSubscriptionManagement } from "@/features/subscription/context/subscription-management-context";

const WIDGET_CONTAINER_ID = "payment-widget-container";

export function SubscriptionUpgradeModal() {
  const {
    subscription,
    actionState,
    finishUpgrade,
  } = useSubscriptionManagement();
  const widgetRef = useRef<PaymentWidgetInstance | null>(null);
  const [isRendering, setIsRendering] = useState(false);

  const isOpen = actionState === "upgrading";

  useEffect(() => {
    const renderWidget = async () => {
      if (!isOpen || !subscription) {
        return;
      }

      setIsRendering(true);
      const widget = await loadPaymentWidget(
        clientEnv.NEXT_PUBLIC_TOSS_CLIENT_KEY,
        subscription.customerId,
      );
      widgetRef.current = widget;
      await widget.renderPaymentMethods(`#${WIDGET_CONTAINER_ID}`, {
        value: PLAN_LIMITS[SUBSCRIPTION_PLANS.pro].price,
      });
      setIsRendering(false);
    };

    void renderWidget();
  }, [isOpen, subscription]);

  const handleRequestPayment = async () => {
    if (!widgetRef.current) {
      return;
    }

    const origin = window.location.origin;
    await widgetRef.current.requestPayment({
      orderId: `saju_${crypto.randomUUID()}`,
      orderName: TOSS_PRODUCT.orderName,
      successUrl: `${origin}/api/subscription/upgrade/success`,
      failUrl: `${origin}/api/subscription/upgrade/fail`,
    });
  };

  if (!isOpen || !subscription) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 px-4">
      <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl">
        <header className="space-y-2 text-center">
          <h2 className="text-xl font-semibold text-slate-900">Pro 요금제 결제</h2>
          <p className="text-sm text-slate-600">
            토스페이먼츠를 통해 매월 {PLAN_LIMITS[SUBSCRIPTION_PLANS.pro].price.toLocaleString()}원 결제가 진행됩니다.
          </p>
        </header>
        <div id={WIDGET_CONTAINER_ID} className="mt-6 min-h-48" />
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-center">
          <Button
            className="bg-slate-900 text-white hover:bg-slate-800"
            disabled={isRendering}
            onClick={handleRequestPayment}
          >
            {isRendering ? "결제 모듈 준비 중" : "결제 진행"}
          </Button>
          <Button variant="outline" onClick={finishUpgrade}>
            취소
          </Button>
        </div>
      </div>
    </div>
  );
}
