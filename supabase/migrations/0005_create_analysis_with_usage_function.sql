-- Migration: create function to insert saju analysis and decrement remaining count atomically
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
    p_gender::public.saju_analyses.gender%TYPE,
    p_model_used::public.saju_analyses.model_used%TYPE,
    p_result
  )
  RETURNING id INTO v_analysis_id;

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
