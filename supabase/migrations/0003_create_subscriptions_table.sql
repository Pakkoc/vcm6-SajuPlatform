-- =============================================
-- Migration: 0003_create_subscriptions_table.sql
-- Description: 구독 정보 및 결제 상태 관리
-- =============================================

-- subscriptions 테이블 생성
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro')),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_cancellation')),
  billing_key TEXT,
  remaining_count INTEGER NOT NULL DEFAULT 0 CHECK (remaining_count >= 0),
  next_billing_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 인덱스: Cron Job 조회 최적화
CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing_date 
  ON public.subscriptions(next_billing_date) 
  WHERE next_billing_date IS NOT NULL;

-- updated_at 자동 갱신 트리거 함수
CREATE OR REPLACE FUNCTION public.update_subscriptions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 적용
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_subscriptions_updated_at();

-- RLS 비활성화
ALTER TABLE public.subscriptions DISABLE ROW LEVEL SECURITY;

