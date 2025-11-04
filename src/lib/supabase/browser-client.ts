"use client";

import { createBrowserClient } from "@supabase/ssr";
import { clientEnv } from "@/constants/env";
import type { Database } from "./types";

type BrowserSupabaseClient = ReturnType<typeof createBrowserClient<Database>>;

let client: BrowserSupabaseClient | null = null;

export const getSupabaseBrowserClient = () => {
  if (!client) {
    client = createBrowserClient<Database>(
      clientEnv.NEXT_PUBLIC_SUPABASE_URL,
      clientEnv.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );
  }

  return client;
};
