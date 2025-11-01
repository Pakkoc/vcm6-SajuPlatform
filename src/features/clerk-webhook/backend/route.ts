import type { Hono } from "hono";
import { Webhook } from "svix";
import { serverEnv } from "@/constants/env";
import { ClerkWebhookEventSchema } from "./schema";
import { handleUserCreated, handleUserDeleted, handleUserUpdated } from "./service";
import { respond, success, failure } from "@/backend/http/response";
import { getSupabase, getLogger, type AppEnv } from "@/backend/hono/context";

const wh = new Webhook(serverEnv.CLERK_WEBHOOK_SECRET);

export const registerClerkWebhookRoute = (app: Hono<AppEnv>) => {
  app.post("/api/webhooks/clerk", async (c) => {
    const payload = await c.req.text();
    const logger = getLogger(c);

    try {
      const evt = wh.verify(payload, {
        "svix-id": c.req.header("svix-id") ?? "",
        "svix-timestamp": c.req.header("svix-timestamp") ?? "",
        "svix-signature": c.req.header("svix-signature") ?? "",
      });

      const parsed = ClerkWebhookEventSchema.safeParse(evt);

      if (!parsed.success) {
        return respond(
          c,
          failure(400, "INVALID_WEBHOOK", "웹훅 페이로드가 올바르지 않습니다.", parsed.error.flatten()),
        );
      }

      const supabase = getSupabase(c);
      const event = parsed.data;

      switch (event.type) {
        case "user.created":
          await handleUserCreated(supabase, event);
          break;
        case "user.updated":
          await handleUserUpdated(supabase, event);
          break;
        case "user.deleted":
          await handleUserDeleted(supabase, event);
          break;
        default:
          break;
      }

      return respond(c, success({ data: true }));
    } catch (error) {
      logger.error("Clerk webhook 처리 중 오류", error);
      return respond(
        c,
        failure(400, "WEBHOOK_VERIFICATION_FAILED", "웹훅 검증에 실패했습니다."),
      );
    }
  });
};
