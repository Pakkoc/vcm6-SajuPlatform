import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/supabase/types';

type ServiceSupabaseClient = ReturnType<typeof createClient<Database>>;

export type ServiceClientConfig = {
  url: string;
  serviceRoleKey: string;
};

export const createServiceClient = ({
  url,
  serviceRoleKey,
}: ServiceClientConfig): ServiceSupabaseClient =>
  createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
    },
  });
