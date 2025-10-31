-- =============================================
-- Migration: 0004_create_saju_analyses_table.sql
-- Description: 사주 분석 결과 영구 저장
-- =============================================

-- saju_analyses 테이블 생성
CREATE TABLE IF NOT EXISTS public.saju_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  birth_time TIME,
  gender TEXT NOT NULL CHECK (gender IN ('male', 'female')),
  model_used TEXT NOT NULL CHECK (model_used IN ('gemini-2.5-flash', 'gemini-2.5-pro')),
  result TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스: 대시보드 조회 최적화 (사용자별 최신순)
CREATE INDEX IF NOT EXISTS idx_saju_analyses_user_id_created_at 
  ON public.saju_analyses(user_id, created_at DESC);

-- RLS 비활성화
ALTER TABLE public.saju_analyses DISABLE ROW LEVEL SECURITY;

