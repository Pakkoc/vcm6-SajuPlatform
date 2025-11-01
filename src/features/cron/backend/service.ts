import { addMonths } from "date-fns";
import { PLAN_LIMITS, SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUS, TOSS_PRODUCT } from "@/constants/subscription";
import { payWithBillingKey } from "@/lib/payment/toss-client";
import type { SupabaseDb } from "@/lib/supabase/helpers";

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

export const processRecurringPayments = async (supabase: SupabaseDb) => {
  const today = formatDate(new Date());
  const dueResult = await supabase
    .from("subscriptions")
    .select("id, user_id, status, billing_key")
    .eq("plan", SUBSCRIPTION_PLANS.pro)
    .eq("next_billing_date", today);

  if (dueResult.error || !dueResult.data) {
    throw new Error("결제 대상 조회에 실패했습니다.");
  }

  const subscriptions = dueResult.data as Array<{
    id: string;
    user_id: string;
    status: string;
    billing_key: string | null;
  }>;

  let processed = 0;
  let succeeded = 0;
  let failed = 0;
  let cancelled = 0;

  for (const sub of subscriptions) {
    processed += 1;
    const userResult = await (supabase as unknown as any)
      .from("users")
      .select("email")
      .eq("id", sub.user_id)
      .single();

    const email = userResult.data?.email ?? "";

    if (sub.status === SUBSCRIPTION_STATUS.pendingCancellation) {
      await (supabase as unknown as any)
        .from("subscriptions")
        .update({
          plan: SUBSCRIPTION_PLANS.free,
          status: SUBSCRIPTION_STATUS.active,
          remaining_count: 0,
          billing_key: null,
          next_billing_date: null,
        })
        .eq("id", sub.id);
      cancelled += 1;
      continue;
    }

    if (!sub.billing_key) {
      await (supabase as unknown as any)
        .from("subscriptions")
        .update({
          plan: SUBSCRIPTION_PLANS.free,
          status: SUBSCRIPTION_STATUS.active,
          remaining_count: 0,
          billing_key: null,
          next_billing_date: null,
        })
        .eq("id", sub.id);
      failed += 1;
      continue;
    }

    try {
      const amount = PLAN_LIMITS[SUBSCRIPTION_PLANS.pro].price;
      await payWithBillingKey(sub.billing_key, {
        amount,
        orderId: `recurring_${sub.id}_${Date.now()}`,
        orderName: TOSS_PRODUCT.orderName,
        customerEmail: email,
      });

      await (supabase as unknown as any)
        .from("subscriptions")
        .update({
          remaining_count: PLAN_LIMITS[SUBSCRIPTION_PLANS.pro].monthlyLimit,
          next_billing_date: formatDate(addMonths(new Date(), 1)),
        })
        .eq("id", sub.id);

      succeeded += 1;
    } catch {
      await (supabase as unknown as any)
        .from("subscriptions")
        .update({
          plan: SUBSCRIPTION_PLANS.free,
          status: SUBSCRIPTION_STATUS.active,
          remaining_count: 0,
          billing_key: null,
          next_billing_date: null,
        })
        .eq("id", sub.id);
      failed += 1;
    }
  }

  return { processed, succeeded, failed, cancelled };
};
