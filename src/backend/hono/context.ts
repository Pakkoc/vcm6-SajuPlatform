import type { Context } from 'hono';
import type { SupabaseDb } from '@/lib/supabase/helpers';

export type AppLogger = Pick<Console, 'info' | 'error' | 'warn' | 'debug'>;

export type AppConfig = {
  supabase: {
    url: string;
    serviceRoleKey: string;
  };
};

export type AppVariables = {
  supabase: SupabaseDb;
  logger: AppLogger;
  config: AppConfig;
};

export type AppEnv = {
  Variables: AppVariables;
};

export type AppContext = Context<AppEnv>;

export const contextKeys = {
  supabase: 'supabase',
  logger: 'logger',
  config: 'config',
} as const satisfies Record<keyof AppVariables, keyof AppVariables>;

export const getSupabase = (c: AppContext) =>
  c.get(contextKeys.supabase) as SupabaseDb;

export const getLogger = (c: AppContext) =>
  c.get(contextKeys.logger) as AppLogger;

export const getConfig = (c: AppContext) =>
  c.get(contextKeys.config) as AppConfig;
