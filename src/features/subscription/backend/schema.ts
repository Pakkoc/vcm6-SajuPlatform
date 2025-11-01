import { z } from "zod";
import { SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUS } from "@/constants/subscription";

export const SubscriptionResponseSchema = z.object({
  data: z.object({
    plan: z.enum([SUBSCRIPTION_PLANS.free, SUBSCRIPTION_PLANS.pro] as const),
    status: z.enum([SUBSCRIPTION_STATUS.active, SUBSCRIPTION_STATUS.pendingCancellation] as const),
    remainingCount: z.number().int().nonnegative(),
    nextBillingDate: z.string().nullable(),
    email: z.string().email(),
    customerId: z.string().min(1),
  }),
});

export type SubscriptionResponse = z.infer<typeof SubscriptionResponseSchema>;

export const UpgradeSuccessQuerySchema = z.object({
  authKey: z.string().min(1),
  customerKey: z.string().min(1),
  orderId: z.string().min(1),
});
