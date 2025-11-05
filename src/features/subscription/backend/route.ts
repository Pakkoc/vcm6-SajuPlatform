import type { Hono } from "hono";
import { respond, failure } from "@/backend/http/response";
import { type AppEnv, getLogger, getSupabase } from "@/backend/hono/context";
import { getAuthenticatedUserId } from "@/lib/auth/get-clerk-user";
import {
  cancelSubscription,
  getSubscription,
  reactivateSubscription,
  terminateSubscription,
  upgradeSubscription,
} from "./service";
import { UpgradeSuccessQuerySchema } from "./schema";

export const registerSubscriptionRoutes = (app: Hono<AppEnv>) => {
  app.get("/api/subscription", async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    try {
      const userId = await getAuthenticatedUserId(c.req.raw);
      const result = await getSubscription(supabase, userId);
      return respond(c, result);
    } catch (error) {
      logger.error("Failed to fetch subscription", error);
      return respond(
        c,
        failure(401, "UNAUTHORIZED", "인증 정보가 필요합니다."),
      );
    }
  });

  app.post("/api/subscription/cancel", async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    try {
      const userId = await getAuthenticatedUserId(c.req.raw);
      const result = await cancelSubscription(supabase, userId);
      return respond(c, result);
    } catch (error) {
      logger.error("Failed to cancel subscription", error);
      return respond(
        c,
        failure(401, "UNAUTHORIZED", "인증 정보가 필요합니다."),
      );
    }
  });

  app.post("/api/subscription/reactivate", async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    try {
      const userId = await getAuthenticatedUserId(c.req.raw);
      const result = await reactivateSubscription(supabase, userId);
      return respond(c, result);
    } catch (error) {
      logger.error("Failed to reactivate subscription", error);
      return respond(
        c,
        failure(401, "UNAUTHORIZED", "인증 정보가 필요합니다."),
      );
    }
  });

  app.post("/api/subscription/terminate", async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    try {
      const userId = await getAuthenticatedUserId(c.req.raw);
      const result = await terminateSubscription(supabase, userId);
      return respond(c, result);
    } catch (error) {
      logger.error("Failed to terminate subscription", error);
      return respond(
        c,
        failure(401, "UNAUTHORIZED", "인증 정보가 필요합니다."),
      );
    }
  });

  app.get("/api/subscription/upgrade/success", async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const query = UpgradeSuccessQuerySchema.safeParse(c.req.query());

    if (!query.success) {
      return c.redirect("/subscription?upgrade=fail", 302);
    }

    try {
      const userId = await getAuthenticatedUserId(c.req.raw);
      const payload = query.data as { authKey: string; customerKey: string; orderId: string };
      const result = await upgradeSubscription(supabase, userId, payload);

      if (!result.ok) {
        logger.error("Upgrade failed", result);
        return c.redirect("/subscription?upgrade=fail", 302);
      }

      return c.redirect("/subscription?upgrade=success", 302);
    } catch (error) {
      logger.error("Upgrade error", error);
      return c.redirect("/subscription?upgrade=fail", 302);
    }
  });

  app.get("/api/subscription/upgrade/fail", (c) => {
    return c.redirect("/subscription?upgrade=fail", 302);
  });
};
