import type { SupabaseDb } from "@/lib/supabase/helpers";
import {
  findUserByClerkId,
  getAnalysisById,
  getSubscriptionByUserId,
  listAnalysesByUserId,
} from "@/lib/supabase/helpers";
import { failure, success, type HandlerResult } from "@/backend/http/response";
import { analysisErrorCodes } from "./error";
import type { CreateAnalysisBody } from "./schema";
import { PLAN_LIMITS, SUBSCRIPTION_PLANS } from "@/constants/subscription";
import type { AppLogger } from "@/backend/hono/context";
import { getGeminiClient } from "@/lib/ai/gemini-client";
import type { SajuAnalysisDetail, SajuAnalysisSummary } from "@/features/saju-analysis/lib/dto";

const summarizeResult = (result: string) => {
  const lines = result.split("\n").filter(Boolean).slice(0, 3);
  const summary = lines.join(" ");
  return summary.length > 200 ? `${summary.slice(0, 197)}...` : summary;
};

const mapSummary = (row: {
  id: string;
  name: string;
  birth_date: string;
  created_at: string;
  result: string;
  gender: "male" | "female";
  model_used: "gemini-2.5-flash" | "gemini-2.5-pro";
}): SajuAnalysisSummary => ({
  id: row.id,
  name: row.name,
  birthDate: row.birth_date,
  createdAt: row.created_at,
  summary: summarizeResult(row.result),
  gender: row.gender,
  modelUsed: row.model_used,
});

const mapDetail = (row: {
  id: string;
  name: string;
  birth_date: string;
  birth_time: string | null;
  gender: "male" | "female";
  model_used: "gemini-2.5-flash" | "gemini-2.5-pro";
  result: string;
  created_at: string;
}): SajuAnalysisDetail => ({
  id: row.id,
  name: row.name,
  birthDate: row.birth_date,
  birthTime: row.birth_time,
  gender: row.gender,
  modelUsed: row.model_used,
  result: row.result,
  createdAt: row.created_at,
  summary: summarizeResult(row.result),
});

const buildPrompt = (body: CreateAnalysisBody) => {
  const birthTime = body.birthTime ?? "모름";
  
  // 한국 시간대(Asia/Seoul) 기준으로 현재 연도 가져오기
  const currentYear = new Date().toLocaleString('ko-KR', { 
    timeZone: 'Asia/Seoul',
    year: 'numeric' 
  });
  
  return `다음 정보를 바탕으로 한국어로 사주팔자를 해석해 주세요.
- 이름: ${body.name}
- 생년월일: ${body.birthDate}
- 출생시간: ${birthTime}
- 성별: ${body.gender === "male" ? "남성" : "여성"}
- 현재 연도: ${currentYear}년

1. 전반적인 성향
2. ${currentYear}년의 흐름과 운세
3. 인간관계와 커리어
4. 주의할 점과 개선 방향

각 항목은 3~4문장으로 답변하고 마지막에 한 줄 요약을 제공하세요.`;
};

export const listAnalyses = async (
  supabase: SupabaseDb,
  clerkUserId: string,
): Promise<HandlerResult<{ data: SajuAnalysisSummary[] }, string>> => {
  const userResult = await findUserByClerkId(supabase, clerkUserId);

  if (userResult.error || !userResult.data) {
    return failure(404, analysisErrorCodes.analysisFetchFailed, "사용자 정보를 찾을 수 없습니다.");
  }

  const userData = userResult.data as unknown as {
    id: string;
    email: string;
    clerk_user_id: string;
  };

  const analysesResult = (await listAnalysesByUserId(
    supabase,
    userData.id,
  )) as unknown as {
    data: Array<{
      id: string;
      name: string;
      birth_date: string;
      created_at: string;
      result: string;
      gender: "male" | "female";
      model_used: "gemini-2.5-flash" | "gemini-2.5-pro";
    }> | null;
    error: unknown;
  };

  if (analysesResult.error || !analysesResult.data) {
    return failure(500, analysisErrorCodes.analysisFetchFailed, "분석 내역을 불러오지 못했습니다.");
  }

  const summaries = analysesResult.data.map(mapSummary);

  return success({ data: summaries });
};

export const getAnalysisDetail = async (
  supabase: SupabaseDb,
  clerkUserId: string,
  analysisId: string,
): Promise<HandlerResult<{ data: SajuAnalysisDetail }, string>> => {
  const userResult = await findUserByClerkId(supabase, clerkUserId);

  if (userResult.error || !userResult.data) {
    return failure(404, analysisErrorCodes.analysisFetchFailed, "사용자 정보를 찾을 수 없습니다.");
  }

  const userData = userResult.data as unknown as {
    id: string;
    email: string;
    clerk_user_id: string;
  };

  const analysisResult = await getAnalysisById(supabase, userData.id, analysisId);

  if (analysisResult.error || !analysisResult.data) {
    return failure(404, analysisErrorCodes.analysisFetchFailed, "분석 결과를 찾을 수 없습니다.");
  }

  const analysisData = analysisResult.data as unknown as {
    id: string;
    name: string;
    birth_date: string;
    birth_time: string | null;
    gender: "male" | "female";
    model_used: "gemini-2.5-flash" | "gemini-2.5-pro";
    result: string;
    created_at: string;
  };

  return success({ data: mapDetail(analysisData) });
};

export const createAnalysis = async (
  supabase: SupabaseDb,
  logger: AppLogger,
  clerkUserId: string,
  body: CreateAnalysisBody,
): Promise<HandlerResult<{ data: { id: string; summary: string } }, string>> => {
  const userResult = await findUserByClerkId(supabase, clerkUserId);

  if (userResult.error || !userResult.data) {
    return failure(404, analysisErrorCodes.analysisCreationFailed, "사용자 정보를 찾을 수 없습니다.");
  }

  const userData = userResult.data as unknown as {
    id: string;
    email: string;
    clerk_user_id: string;
  };

  let subscriptionResult = await getSubscriptionByUserId(supabase, userData.id);

  // 구독 정보가 없으면 Free 플랜 자동 생성
  const subscriptionNotFound =
    subscriptionResult.error?.code === "PGRST116" || !subscriptionResult.data;

  if (subscriptionNotFound) {
    logger.info("구독 정보가 없어 Free 플랜을 생성합니다.", { userId: userData.id });
    
    const createResult = await (supabase as unknown as any)
      .from("subscriptions")
      .upsert(
        {
          user_id: userData.id,
          plan: SUBSCRIPTION_PLANS.free,
          status: "active",
          remaining_count: PLAN_LIMITS[SUBSCRIPTION_PLANS.free].monthlyLimit,
        },
        { onConflict: "user_id" },
      )
      .select("plan, remaining_count")
      .single();

    if (createResult.error || !createResult.data) {
      logger.error("Free 플랜 생성 실패", createResult.error);
      return failure(500, analysisErrorCodes.subscriptionNotFound, "구독 정보를 생성하지 못했습니다.");
    }

    subscriptionResult = createResult;
  }

  if (subscriptionResult.error || !subscriptionResult.data) {
    return failure(500, analysisErrorCodes.subscriptionNotFound, "구독 정보를 조회하지 못했습니다.");
  }

  const subscriptionData = subscriptionResult.data as unknown as {
    remaining_count: number;
    plan: "free" | "pro";
  };

  if (subscriptionData.remaining_count <= 0) {
    return failure(403, analysisErrorCodes.noRemainingCount, "잔여 검사 횟수가 없습니다.");
  }

  const plan = subscriptionData.plan as keyof typeof PLAN_LIMITS;
  const modelName = plan === SUBSCRIPTION_PLANS.pro ? "gemini-2.5-pro" : "gemini-2.5-flash";

  try {
    const gemini = getGeminiClient();
    const model = gemini.getGenerativeModel({ model: modelName });
    const prompt = buildPrompt(body);
    const response = await model.generateContent(prompt);
    const text = response.response.text();

    if (!text) {
      throw new Error("Gemini 응답이 비어 있습니다.");
    }

    const summary = summarizeResult(text);

    const rpcResult = await supabase.rpc("create_analysis_with_usage", {
      p_user_id: userData.id,
      p_name: body.name,
      p_birth_date: body.birthDate,
      p_birth_time: body.birthTime ?? null,
      p_gender: body.gender,
      p_model_used: modelName,
      p_result: text,
    });

    if (rpcResult.error || !rpcResult.data) {
      const errorMessage = rpcResult.error?.message ?? "사주 분석 생성에 실패했습니다.";
      logger.error("Failed to create analysis via RPC", rpcResult.error);

      if (errorMessage.includes("NO_REMAINING_COUNT")) {
        return failure(403, analysisErrorCodes.noRemainingCount, "잔여 검사 횟수가 없습니다.");
      }

      return failure(500, analysisErrorCodes.analysisCreationFailed, "사주 분석 생성에 실패했습니다.");
    }

    return success(
      {
        data: {
          id: rpcResult.data as string,
          summary,
        },
      },
      201,
    );
  } catch (error) {
    logger.error("Gemini analysis failed", error);
    return failure(500, analysisErrorCodes.analysisCreationFailed, "사주 분석 생성에 실패했습니다.");
  }
};
