export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          clerk_user_id: string;
          email: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          clerk_user_id: string;
          email: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          clerk_user_id?: string;
          email?: string;
          created_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: "free" | "pro";
          status: "active" | "pending_cancellation";
          billing_key: string | null;
          remaining_count: number;
          next_billing_date: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan?: "free" | "pro";
          status?: "active" | "pending_cancellation";
          billing_key?: string | null;
          remaining_count?: number;
          next_billing_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan?: "free" | "pro";
          status?: "active" | "pending_cancellation";
          billing_key?: string | null;
          remaining_count?: number;
          next_billing_date?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      saju_analyses: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          birth_date: string;
          birth_time: string | null;
          gender: "male" | "female";
          model_used: "gemini-2.5-flash" | "gemini-2.5-pro";
          result: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          birth_date: string;
          birth_time?: string | null;
          gender: "male" | "female";
          model_used: "gemini-2.5-flash" | "gemini-2.5-pro";
          result: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          name?: string;
          birth_date?: string;
          birth_time?: string | null;
          gender?: "male" | "female";
          model_used?: "gemini-2.5-flash" | "gemini-2.5-pro";
          result?: string;
          created_at?: string;
        };
      };
    };
  };
};

export type SupabaseUserMetadata = Record<string, unknown>;
