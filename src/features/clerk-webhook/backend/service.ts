import { PLAN_LIMITS, SUBSCRIPTION_PLANS, SUBSCRIPTION_STATUS } from "@/constants/subscription";
import type { SupabaseDb } from "@/lib/supabase/helpers";
import type { Database } from "@/lib/supabase/types";
import type { ClerkWebhookEvent } from "./schema";
import { extractPrimaryEmail } from "./schema";

export const handleUserCreated = async (supabase: SupabaseDb, event: ClerkWebhookEvent) => {
  const email = extractPrimaryEmail(event);

  if (!email) {
    throw new Error("이메일 정보를 확인할 수 없습니다.");
  }

  const userPayload: Database["public"]["Tables"]["users"]["Insert"] = {
    clerk_user_id: event.data.id,
    email,
  };

  const userResult = await (supabase as unknown as any)
    .from("users")
    .upsert(userPayload, { onConflict: "clerk_user_id" })
    .select("id")
    .single();

  if (userResult.error || !userResult.data) {
    throw new Error("사용자 정보를 생성하지 못했습니다.");
  }

  const subscriptionPayload: Database["public"]["Tables"]["subscriptions"]["Insert"] = {
    user_id: userResult.data.id,
    plan: SUBSCRIPTION_PLANS.free,
    status: SUBSCRIPTION_STATUS.active,
    remaining_count: PLAN_LIMITS[SUBSCRIPTION_PLANS.free].monthlyLimit,
  };

  const subscriptionResult = await (supabase as unknown as any)
    .from("subscriptions")
    .upsert(subscriptionPayload, { onConflict: "user_id" });

  if (subscriptionResult.error) {
    throw new Error("구독 정보를 생성하지 못했습니다.");
  }
};

export const handleUserUpdated = async (supabase: SupabaseDb, event: ClerkWebhookEvent) => {
  const email = extractPrimaryEmail(event);

  if (!email) {
    return;
  }

  await (supabase as unknown as any)
    .from("users")
    .update({ email })
    .eq("clerk_user_id", event.data.id);
};

export const handleUserDeleted = async (supabase: SupabaseDb, event: ClerkWebhookEvent) => {
  await (supabase as unknown as any)
    .from("users")
    .delete()
    .eq("clerk_user_id", event.data.id);
};
