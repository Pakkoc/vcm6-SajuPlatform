"use client";

import { z } from "zod";
import {
  PLAN_LIMITS,
  SUBSCRIPTION_PLANS,
  SUBSCRIPTION_PLAN_VALUES,
  SUBSCRIPTION_STATUS,
  SUBSCRIPTION_STATUS_VALUES,
} from "@/constants/subscription";

export const SubscriptionInfoSchema = z.object({
  plan: z.enum([SUBSCRIPTION_PLANS.free, SUBSCRIPTION_PLANS.pro] as const),
  status: z.enum([SUBSCRIPTION_STATUS.active, SUBSCRIPTION_STATUS.pendingCancellation] as const),
  remainingCount: z.number().int().nonnegative(),
  nextBillingDate: z.string().nullable(),
  email: z.string().email(),
  customerId: z.string().min(1),
});

export type SubscriptionInfo = z.infer<typeof SubscriptionInfoSchema> & {
  limit: typeof PLAN_LIMITS[keyof typeof PLAN_LIMITS]["monthlyLimit"];
};

export const ExtendedSubscriptionInfoSchema = SubscriptionInfoSchema.extend({
  limit: z.union([
    z.literal(PLAN_LIMITS[SUBSCRIPTION_PLANS.free].monthlyLimit),
    z.literal(PLAN_LIMITS[SUBSCRIPTION_PLANS.pro].monthlyLimit),
  ]),
});
