import type { Hono } from "hono";
import { respond, failure } from "@/backend/http/response";
import { type AppEnv, type AppContext, getLogger, getSupabase } from "@/backend/hono/context";
import { getAuthenticatedUserId } from "@/lib/auth/get-clerk-user";
import { CreateAnalysisBodySchema } from "./schema";
import { createAnalysis, getAnalysisDetail, listAnalyses } from "./service";

export const registerSajuAnalysisRoutes = (app: Hono<AppEnv>) => {
  app.get("/api/saju-analyses", async (c) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    try {
      const userId = await getAuthenticatedUserId(c.req.raw);
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
      const userId = await getAuthenticatedUserId(c.req.raw);
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

  const createAnalysisHandler = async (c: AppContext) => {
    const supabase = getSupabase(c);
    const logger = getLogger(c);

    try {
      // Body를 먼저 읽어서 저장
      const body = await c.req.json();
      
      // 인증 확인 (body 읽기 후에 수행)
      const userId = await getAuthenticatedUserId(c.req.raw);
      
      // Body 검증
      const parsedBody = CreateAnalysisBodySchema.safeParse(body);

      if (!parsedBody.success) {
        return respond(
          c,
          failure(400, "INVALID_BODY", "요청 본문 형식이 올바르지 않습니다.", parsedBody.error.flatten()),
        );
      }

      const result = await createAnalysis(supabase, logger, userId, parsedBody.data);
      return respond(c, result);
    } catch (error) {
      logger.error("Failed to create analysis", error);
      return respond(
        c,
        failure(401, "UNAUTHORIZED", "인증 정보가 필요합니다."),
      );
    }
  };

  app.post("/api/saju-analysis", createAnalysisHandler);
  app.post("/api/saju-analyses", createAnalysisHandler);
};
