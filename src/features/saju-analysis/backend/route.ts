import type { Hono } from "hono";
import { respond, failure } from "@/backend/http/response";
import { type AppEnv, getLogger, getSupabase } from "@/backend/hono/context";
import { getAuthenticatedUserId } from "@/lib/auth/get-clerk-user";
import { CreateAnalysisBodySchema } from "./schema";
import { createAnalysis, getAnalysisDetail, listAnalyses } from "./service";

export const registerSajuAnalysisRoutes = (app: Hono<AppEnv>) => {
  app.get("/api/saju-analyses", async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    try {
      const userId = getAuthenticatedUserId();
      const result = await listAnalyses(supabase, userId);
      return respond(c, result);
    } catch (error) {
      logger.error("Failed to list analyses", error);
      return respond(
        c,
        failure(401, "UNAUTHORIZED", "인증 정보가 필요합니다."),
      );
    }
  });

  app.get("/api/saju-analyses/:id", async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const analysisId = c.req.param("id");

    try {
      const userId = getAuthenticatedUserId();
      const result = await getAnalysisDetail(supabase, userId, analysisId);
      return respond(c, result);
    } catch (error) {
      logger.error("Failed to fetch analysis detail", error);
      return respond(
        c,
        failure(401, "UNAUTHORIZED", "인증 정보가 필요합니다."),
      );
    }
  });

  app.post("/api/saju-analyses", async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);
    const parsedBody = CreateAnalysisBodySchema.safeParse(await c.req.json());

    if (!parsedBody.success) {
      return respond(
        c,
        failure(400, "INVALID_BODY", "요청 본문 형식이 올바르지 않습니다.", parsedBody.error.flatten()),
      );
    }

    try {
      const userId = getAuthenticatedUserId();
      const result = await createAnalysis(supabase, logger, userId, parsedBody.data);
      return respond(c, result);
    } catch (error) {
      logger.error("Failed to create analysis", error);
      return respond(
        c,
        failure(401, "UNAUTHORIZED", "인증 정보가 필요합니다."),
      );
    }
  });
};
