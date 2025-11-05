import { addMonths } from "date-fns";
import { PLAN_LIMITS, SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUS, TOSS_PRODUCT } from "@/constants/subscription";
import {
  findUserByClerkId,
  getSubscriptionByUserId,
  type SupabaseDb,
} from "@/lib/supabase/helpers";
import { deleteBillingKey, issueBillingKey, payWithBillingKey } from "@/lib/payment/toss-client";
import { failure, success, type HandlerResult } from "@/backend/http/response";
import { subscriptionErrorCodes } from "./error";

const formatDate = (date: Date) => date.toISOString().slice(0, 10);

const createFreeSubscription = async (supabase: SupabaseDb, userId: string) =>
  (supabase as unknown as any)
    .from("subscriptions")
    .upsert(
      {
        user_id: userId,
        plan: SUBSCRIPTION_PLANS.free,
        status: SUBSCRIPTION_STATUS.active,
        remaining_count: PLAN_LIMITS[SUBSCRIPTION_PLANS.free].monthlyLimit,
      },
      { onConflict: "user_id" },
    )
    .select("plan, status, remaining_count, next_billing_date, billing_key")
    .single();

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

  const subscriptionNotFound =
    subscriptionResult.error?.code === "PGRST116" || !subscriptionResult.data;

  if (subscriptionResult.error && !subscriptionNotFound) {
    return failure(500, subscriptionErrorCodes.subscriptionFetchFailed, "구독 정보를 조회하지 못했습니다.");
  }

  const subscriptionSource = subscriptionNotFound
    ? await createFreeSubscription(supabase, userData.id)
    : subscriptionResult;

  if (subscriptionSource.error || !subscriptionSource.data) {
    return failure(
      500,
      subscriptionErrorCodes.subscriptionCreationFailed,
      "기본 구독 정보를 생성하지 못했습니다.",
    );
  }

  const subscriptionData = subscriptionSource.data as unknown as {
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

  const subscriptionResult = await getSubscriptionByUserId(supabase, userData.id);

  if (subscriptionResult.error || !subscriptionResult.data) {
    return failure(404, subscriptionErrorCodes.subscriptionNotFound, "구독 정보를 찾을 수 없습니다.");
  }

  const subscriptionData = subscriptionResult.data as unknown as {
    plan: "free" | "pro";
    status: "active" | "pending_cancellation";
  };

  if (subscriptionData.plan !== SUBSCRIPTION_PLANS.pro) {
    return failure(400, subscriptionErrorCodes.invalidState, "Pro 요금제에서만 구독 취소를 요청할 수 있습니다.");
  }

  if (subscriptionData.status === SUBSCRIPTION_STATUS.pendingCancellation) {
    return failure(409, subscriptionErrorCodes.invalidState, "이미 취소가 예약된 상태입니다.");
  }

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

  const subscriptionResult = await getSubscriptionByUserId(supabase, userData.id);

  if (subscriptionResult.error || !subscriptionResult.data) {
    return failure(404, subscriptionErrorCodes.subscriptionNotFound, "구독 정보를 찾을 수 없습니다.");
  }

  const subscriptionData = subscriptionResult.data as unknown as {
    status: "active" | "pending_cancellation";
    next_billing_date: string | null;
  };

  if (subscriptionData.status !== SUBSCRIPTION_STATUS.pendingCancellation) {
    return failure(400, subscriptionErrorCodes.invalidState, "취소 예정 상태에서만 철회할 수 있습니다.");
  }

  if (!subscriptionData.next_billing_date) {
    return failure(400, subscriptionErrorCodes.invalidState, "다음 결제일 정보가 없어 취소를 철회할 수 없습니다.");
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const nextBillingDate = new Date(subscriptionData.next_billing_date);

  if (nextBillingDate < today) {
    return failure(400, subscriptionErrorCodes.invalidState, "다음 결제일이 지나 취소를 철회할 수 없습니다.");
  }

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

  const subscriptionResult = await getSubscriptionByUserId(supabase, userData.id);

  if (subscriptionResult.error || !subscriptionResult.data) {
    return failure(404, subscriptionErrorCodes.subscriptionNotFound, "구독 정보를 찾을 수 없습니다.");
  }

  const subscriptionData = subscriptionResult.data as unknown as {
    plan: "free" | "pro";
    billing_key: string | null;
  };

  if (subscriptionData.plan !== SUBSCRIPTION_PLANS.pro) {
    return failure(400, subscriptionErrorCodes.invalidState, "Pro 요금제에서만 즉시 해지가 가능합니다.");
  }

  if (!subscriptionData.billing_key) {
    return failure(400, subscriptionErrorCodes.invalidState, "빌링키 정보가 존재하지 않습니다.");
  }

  try {
    await deleteBillingKey(subscriptionData.billing_key);
  } catch (error) {
    return failure(
      502,
      subscriptionErrorCodes.billingKeyRemovalFailed,
      (error as Error).message ?? "빌링키 삭제 중 문제가 발생했습니다.",
    );
  }

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
