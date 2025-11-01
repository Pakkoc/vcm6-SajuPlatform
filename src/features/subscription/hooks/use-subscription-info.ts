"use client";

import { useQuery } from "@tanstack/react-query";
import { apiClient, extractApiErrorMessage } from "@/lib/remote/api-client";
import { SubscriptionInfoSchema, type SubscriptionInfo } from "../lib/dto";
import { PLAN_LIMITS, SUBSCRIPTION_PLANS } from "@/constants/subscription";

const SUBSCRIPTION_QUERY_KEY = ["subscription", "current"];

type SubscriptionResponse = {
  data: Omit<SubscriptionInfo, "limit">;
};

const mapLimit = (plan: SubscriptionInfo["plan"]) =>
  plan === SUBSCRIPTION_PLANS.pro
    ? PLAN_LIMITS[SUBSCRIPTION_PLANS.pro].monthlyLimit
    : PLAN_LIMITS[SUBSCRIPTION_PLANS.free].monthlyLimit;

const fetchSubscriptionInfo = async (): Promise<SubscriptionInfo> => {
  const response = await apiClient.get<SubscriptionResponse>("/subscription");
  const parsed = SubscriptionInfoSchema.safeParse(response.data.data);

  if (!parsed.success) {
    throw new Error("구독 정보를 불러오지 못했습니다.");
  }

  const limit = mapLimit(parsed.data.plan) as SubscriptionInfo["limit"];

  return {
    ...parsed.data,
    limit,
  } satisfies SubscriptionInfo;
};

export const useSubscriptionInfo = () => {
  return useQuery<SubscriptionInfo, Error>({
    queryKey: SUBSCRIPTION_QUERY_KEY,
    queryFn: fetchSubscriptionInfo,
    staleTime: 60 * 1000,
    retry: 1,
    meta: {
      errorMessage: "구독 정보를 불러오는 중 문제가 발생했습니다.",
    },
    throwOnError: (error) => {
      if (!error) {
        return false;
      }
      const message = extractApiErrorMessage(error);
      return message.includes("Unauthorized");
    },
  });
};

export const subscriptionQueryKey = SUBSCRIPTION_QUERY_KEY;
