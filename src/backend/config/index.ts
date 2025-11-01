import type { AppConfig } from '@/backend/hono/context';
import { serverEnv } from '@/constants/env';

let cachedConfig: AppConfig | null = null;

export const getAppConfig = (): AppConfig => {
  if (cachedConfig) {
    return cachedConfig;
  }

  cachedConfig = {
    supabase: {
      url: serverEnv.SUPABASE_URL,
      serviceRoleKey: serverEnv.SUPABASE_SERVICE_ROLE_KEY,
    },
  } satisfies AppConfig;

  return cachedConfig;
};
