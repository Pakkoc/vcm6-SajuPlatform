-- =============================================
-- Migration: 0006_fix_analysis_function_type_casting.sql
-- Description: ENUM 타입 생성 및 함수 타입 캐스팅 수정
-- =============================================

-- gender ENUM 타입 생성
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'gender_type') THEN
    CREATE TYPE gender_type AS ENUM ('male', 'female');
  END IF;
END $$;

-- model_used ENUM 타입 생성
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'model_type') THEN
    CREATE TYPE model_type AS ENUM ('gemini-2.5-flash', 'gemini-2.5-pro');
  END IF;
END $$;

-- 1. 기존 CHECK 제약조건 제거
ALTER TABLE public.saju_analyses 
  DROP CONSTRAINT IF EXISTS saju_analyses_gender_check,
  DROP CONSTRAINT IF EXISTS saju_analyses_model_used_check;

-- 2. 컬럼 타입을 ENUM으로 변경
ALTER TABLE public.saju_analyses 
  ALTER COLUMN gender TYPE gender_type USING gender::text::gender_type,
  ALTER COLUMN model_used TYPE model_type USING model_used::text::model_type;

-- 함수 재생성 (올바른 타입 캐스팅 사용)
CREATE OR REPLACE FUNCTION public.create_analysis_with_usage(
  p_user_id uuid,
  p_name text,
  p_birth_date date,
  p_birth_time time without time zone,
  p_gender text,
  p_model_used text,
  p_result text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_subscription RECORD;
  v_analysis_id uuid;
BEGIN
  -- 구독 정보 조회 및 잠금
  SELECT id,
         remaining_count
    INTO v_subscription
    FROM public.subscriptions
   WHERE user_id = p_user_id
   FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'SUBSCRIPTION_NOT_FOUND';
  END IF;

  IF v_subscription.remaining_count <= 0 THEN
    RAISE EXCEPTION 'NO_REMAINING_COUNT';
  END IF;

  -- 분석 결과 삽입 (ENUM 타입으로 캐스팅)
  INSERT INTO public.saju_analyses (
    user_id,
    name,
    birth_date,
    birth_time,
    gender,
    model_used,
    result
  )
  VALUES (
    p_user_id,
    p_name,
    p_birth_date,
    p_birth_time,
    p_gender::gender_type,
    p_model_used::model_type,
    p_result
  )
  RETURNING id INTO v_analysis_id;

  -- 잔여 횟수 차감
  UPDATE public.subscriptions
     SET remaining_count = remaining_count - 1,
         updated_at = NOW()
   WHERE id = v_subscription.id;

  RETURN v_analysis_id;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;

