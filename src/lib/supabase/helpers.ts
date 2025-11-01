import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

export type SupabaseDb = SupabaseClient<Database>;

type UserRecord = { id: string; email: string; clerk_user_id: string };
type SubscriptionRecord = {
  id: string;
  plan: "free" | "pro";
  status: "active" | "pending_cancellation";
  billing_key: string | null;
  remaining_count: number;
  next_billing_date: string | null;
};
type AnalysisRecord = {
  id: string;
  name: string;
  birth_date: string;
  created_at: string;
  result: string;
  gender: "male" | "female";
  model_used: "gemini-2.5-flash" | "gemini-2.5-pro";
};

type AnalysisDetailRecord = AnalysisRecord & {
  birth_time: string | null;
};

export const findUserByClerkId = async (supabase: SupabaseDb, clerkUserId: string) => {
  return (supabase as unknown as any)
    .from("users")
    .select("id, email, clerk_user_id")
    .eq("clerk_user_id", clerkUserId)
    .single();
};

export const getSubscriptionByUserId = async (supabase: SupabaseDb, userId: string) => {
  return (supabase as unknown as any)
    .from("subscriptions")
    .select("id, plan, status, remaining_count, next_billing_date, billing_key")
    .eq("user_id", userId)
    .single();
};

export const listAnalysesByUserId = async (supabase: SupabaseDb, userId: string) => {
  return (supabase as unknown as any)
    .from("saju_analyses")
    .select("id, name, birth_date, created_at, result, gender, model_used")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
};

export const getAnalysisById = async (
  supabase: SupabaseDb,
  userId: string,
  analysisId: string,
) => {
  return (supabase as unknown as any)
    .from("saju_analyses")
    .select("id, name, birth_date, birth_time, gender, model_used, result, created_at")
    .eq("user_id", userId)
    .eq("id", analysisId)
    .single();
};
