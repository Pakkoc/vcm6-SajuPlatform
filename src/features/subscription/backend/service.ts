import { addMonths } from "date-fns";
import { PLAN_LIMITS, SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUS, TOSS_PRODUCT } from "@/constants/subscription";
import {
  findUserByClerkId,
  getSubscriptionByUserId,
  type SupabaseDb,
} from "@/lib/supabase/helpers";
import { issueBillingKey, payWithBillingKey } from "@/lib/payment/toss-client";
import { failure, success, type HandlerResult } from "@/backend/http/response";
import { subscriptionErrorCodes } from "./error";

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

export const getSubscription = async (
  supabase: SupabaseDb,
  clerkUserId: string,
): Promise<HandlerResult<{ data: {
  plan: "free" | "pro";
  status: "active" | "pending_cancellation";
  remainingCount: number;
  nextBillingDate: string | null;
  email: string;
  customerId: string;
} }, string>> => {
  const userResult = await findUserByClerkId(supabase, clerkUserId);

  if (userResult.error || !userResult.data) {
    return failure(404, subscriptionErrorCodes.subscriptionNotFound, "사용자를 찾을 수 없습니다.");
  }

  const userData = userResult.data as unknown as {
    id: string;
    email: string;
    clerk_user_id: string;
  };

  const subscriptionResult = await getSubscriptionByUserId(supabase, userData.id);

  if (subscriptionResult.error || !subscriptionResult.data) {
    return failure(404, subscriptionErrorCodes.subscriptionNotFound, "구독 정보를 찾을 수 없습니다.");
  }

  const subscriptionData = subscriptionResult.data as unknown as {
    plan: "free" | "pro";
    status: "active" | "pending_cancellation";
    remaining_count: number;
    next_billing_date: string | null;
    billing_key: string | null;
  };

  return success({
    data: {
      plan: subscriptionData.plan,
      status: subscriptionData.status,
      remainingCount: subscriptionData.remaining_count,
      nextBillingDate: subscriptionData.next_billing_date,
      email: userData.email,
      customerId: userData.clerk_user_id,
    },
  });
};

const updateSubscription = async (
  supabase: SupabaseDb,
  userId: string,
  payload: Record<string, unknown>,
) =>
  (supabase as unknown as any)
    .from("subscriptions")
    .update(payload)
    .eq("user_id", userId);

export const cancelSubscription = async (supabase: SupabaseDb, clerkUserId: string) => {
  const userResult = await findUserByClerkId(supabase, clerkUserId);

  if (userResult.error || !userResult.data) {
    return failure(404, subscriptionErrorCodes.subscriptionNotFound, "사용자를 찾을 수 없습니다.");
  }

  const userData = userResult.data as unknown as { id: string };

  const updateResult = await updateSubscription(supabase, userData.id, {
    status: SUBSCRIPTION_STATUS.pendingCancellation,
  });

  if (updateResult.error) {
    return failure(500, subscriptionErrorCodes.subscriptionUpdateFailed, "구독 취소에 실패했습니다.");
  }

  return success({ data: true });
};

export const reactivateSubscription = async (supabase: SupabaseDb, clerkUserId: string) => {
  const userResult = await findUserByClerkId(supabase, clerkUserId);

  if (userResult.error || !userResult.data) {
    return failure(404, subscriptionErrorCodes.subscriptionNotFound, "사용자를 찾을 수 없습니다.");
  }

  const userData = userResult.data as unknown as { id: string };

  const updateResult = await updateSubscription(supabase, userData.id, {
    status: SUBSCRIPTION_STATUS.active,
  });

  if (updateResult.error) {
    return failure(500, subscriptionErrorCodes.subscriptionUpdateFailed, "취소 철회에 실패했습니다.");
  }

  return success({ data: true });
};

export const terminateSubscription = async (supabase: SupabaseDb, clerkUserId: string) => {
  const userResult = await findUserByClerkId(supabase, clerkUserId);

  if (userResult.error || !userResult.data) {
    return failure(404, subscriptionErrorCodes.subscriptionNotFound, "사용자를 찾을 수 없습니다.");
  }

  const userData = userResult.data as unknown as { id: string };

  const updateResult = await updateSubscription(supabase, userData.id, {
    plan: SUBSCRIPTION_PLANS.free,
    status: SUBSCRIPTION_STATUS.active,
    remaining_count: 0,
    billing_key: null,
    next_billing_date: null,
  });

  if (updateResult.error) {
    return failure(500, subscriptionErrorCodes.subscriptionUpdateFailed, "구독 해지에 실패했습니다.");
  }

  return success({ data: true });
};

export const upgradeSubscription = async (
  supabase: SupabaseDb,
  clerkUserId: string,
  params: { authKey: string; customerKey: string; orderId: string },
) => {
  const userResult = await findUserByClerkId(supabase, clerkUserId);

  if (userResult.error || !userResult.data) {
    return failure(404, subscriptionErrorCodes.subscriptionNotFound, "사용자를 찾을 수 없습니다.");
  }

  const userData = userResult.data as unknown as { id: string; email: string };
  try {
    const billingKeyResponse = await issueBillingKey(params.authKey, params.customerKey);
    const amount = PLAN_LIMITS[SUBSCRIPTION_PLANS.pro].price;

    await payWithBillingKey(billingKeyResponse.billingKey, {
      amount,
      orderId: params.orderId,
      orderName: TOSS_PRODUCT.orderName,
      customerEmail: userData.email,
    });

    const updateResult = await updateSubscription(supabase, userData.id, {
      plan: SUBSCRIPTION_PLANS.pro,
      status: SUBSCRIPTION_STATUS.active,
      remaining_count: PLAN_LIMITS[SUBSCRIPTION_PLANS.pro].monthlyLimit,
      billing_key: billingKeyResponse.billingKey,
      next_billing_date: formatDate(addMonths(new Date(), 1)),
    });

    if (updateResult.error) {
      return failure(500, subscriptionErrorCodes.subscriptionUpdateFailed, "구독 업데이트에 실패했습니다.");
    }

    return success({ data: true });
  } catch (error) {
    return failure(500, subscriptionErrorCodes.paymentConfirmationFailed, (error as Error).message);
  }
};
