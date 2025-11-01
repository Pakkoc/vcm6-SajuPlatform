"use client";

export const SUBSCRIPTION_PLANS = {
  free: "free",
  pro: "pro",
} as const;

export type SubscriptionPlan = (typeof SUBSCRIPTION_PLANS)[keyof typeof SUBSCRIPTION_PLANS];

export const SUBSCRIPTION_PLAN_VALUES = Object.values(
  SUBSCRIPTION_PLANS,
) as SubscriptionPlan[];

export const SUBSCRIPTION_STATUS = {
  active: "active",
  pendingCancellation: "pending_cancellation",
} as const;

export type SubscriptionStatus =
  (typeof SUBSCRIPTION_STATUS)[keyof typeof SUBSCRIPTION_STATUS];

export const SUBSCRIPTION_STATUS_VALUES = Object.values(
  SUBSCRIPTION_STATUS,
) as SubscriptionStatus[];

export const PLAN_LIMITS = {
  [SUBSCRIPTION_PLANS.free]: {
    monthlyLimit: 1,
    model: "gemini-2.5-flash",
  },
  [SUBSCRIPTION_PLANS.pro]: {
    monthlyLimit: 10,
    model: "gemini-2.5-pro",
    price: 3900,
  },
} as const;

export const TOSS_PRODUCT = {
  orderName: "Saju맛피아 Pro 요금제",
} as const;
