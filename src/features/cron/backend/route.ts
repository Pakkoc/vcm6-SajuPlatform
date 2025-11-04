import type { Hono } from "hono";
import { serverEnv } from "@/constants/env";
import { respond, failure, success } from "@/backend/http/response";
import { getSupabase, getLogger, type AppEnv } from "@/backend/hono/context";
import { processRecurringPayments } from "./service";

export const registerCronRoutes = (app: Hono<AppEnv>) => {
  app.post("/api/cron/process-subscriptions", async (c) => {
    const authHeader = c.req.header("authorization") || c.req.header("Authorization");

    if (!serverEnv.CRON_SECRET) {
      return respond(
        c,
        failure(503, "CRON_SECRET_NOT_CONFIGURED", "CRON_SECRET 환경 변수가 설정되지 않았습니다."),
      );
    }

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
