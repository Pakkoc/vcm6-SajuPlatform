import type { Hono } from "hono";
import { Webhook } from "svix";
import { getServerEnv } from "@/constants/env";
import { ClerkWebhookEventSchema } from "./schema";
import { handleUserCreated, handleUserDeleted, handleUserUpdated } from "./service";
import { respond, success, failure } from "@/backend/http/response";
import { getSupabase, getLogger, type AppEnv } from "@/backend/hono/context";

export const registerClerkWebhookRoute = (app: Hono<AppEnv>) => {
  app.post("/api/webhooks/clerk", async (c) => {
    const payload = await c.req.text();
    const logger = getLogger(c);
    const { CLERK_WEBHOOK_SECRET } = getServerEnv();
    const secret = CLERK_WEBHOOK_SECRET;

    if (!secret) {
      logger.warn("Clerk 웹훅 비밀 키가 설정되지 않아 요청을 처리할 수 없습니다.");
      return respond(
        c,
        failure(503, "WEBHOOK_SECRET_NOT_CONFIGURED", "Clerk 웹훅 비밀 키가 설정되지 않았습니다."),
      );
    }

    try {
      const wh = new Webhook(secret);
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
