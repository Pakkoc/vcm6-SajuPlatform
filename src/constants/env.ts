import { z } from "zod";

const clientEnvSchema = z.object({
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY: z.string().min(1),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
  NEXT_PUBLIC_TOSS_CLIENT_KEY: z.string().min(1),
  NEXT_PUBLIC_API_BASE_URL: z.string().min(1),
});

const serverEnvSchema = z.object({
  CLERK_SECRET_KEY: z.string().min(1),
  CLERK_WEBHOOK_SECRET: z.string().min(1).optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1),
  SUPABASE_URL: z.string().url(),
  TOSS_SECRET_KEY: z.string().min(1),
  GEMINI_API_KEY: z.string().min(1),
  CRON_SECRET: z.string().min(1).optional(),
});

const parseEnv = <Schema extends z.ZodTypeAny>(
  schema: Schema,
  value: unknown
) => {
  const result = schema.safeParse(value);

  if (!result.success) {
    console.error("환경 변수 검증 실패:", result.error.flatten().fieldErrors);
    throw new Error("환경 변수를 확인하세요.");
  }

  return result.data;
};

export type ClientEnv = z.infer<typeof clientEnvSchema>;
export type ServerEnv = z.infer<typeof serverEnvSchema>;

export const clientEnv = parseEnv(clientEnvSchema, {
  NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY:
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_TOSS_CLIENT_KEY: process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY,
  NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL,
});

const ensureProductionSecrets = (env: ServerEnv) => {
  if (process.env.NODE_ENV === "production") {
    if (!env.CLERK_WEBHOOK_SECRET) {
      throw new Error("production 환경에서는 CLERK_WEBHOOK_SECRET이 필요합니다.");
    }

    if (!env.CRON_SECRET) {
      throw new Error("production 환경에서는 CRON_SECRET이 필요합니다.");
    }
  }

  return env;
};

export const serverEnv = ensureProductionSecrets(
  parseEnv(serverEnvSchema, {
    CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
    CLERK_WEBHOOK_SECRET: process.env.CLERK_WEBHOOK_SECRET,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    SUPABASE_URL: process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL,
    TOSS_SECRET_KEY: process.env.TOSS_SECRET_KEY,
    GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    CRON_SECRET: process.env.CRON_SECRET,
  }),
);
