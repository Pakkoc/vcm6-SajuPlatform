import type { Hono } from "hono";
import { serverEnv } from "@/constants/env";
import { respond, failure, success } from "@/backend/http/response";
import { getSupabase, getLogger, type AppEnv } from "@/backend/hono/context";
import { processRecurringPayments } from "./service";

export const registerCronRoutes = (app: Hono<AppEnv>) => {
  app.post("/api/cron/process-subscriptions", async (c) => {
    const authHeader = c.req.header("authorization") || c.req.header("Authorization");

    if (!authHeader || authHeader !== `Bearer ${serverEnv.CRON_SECRET}`) {
      return respond(c, failure(401, "UNAUTHORIZED", "잘못된 호출입니다."));
    }

    const supabase = getSupabase(c);
    const logger = getLogger(c);

    try {
      const result = await processRecurringPayments(supabase);
      return respond(c, success({ data: result }));
    } catch (error) {
      logger.error("Cron job failed", error);
      return respond(c, failure(500, "CRON_FAILED", "정기 결제 처리 중 오류가 발생했습니다."));
    }
  });
};
