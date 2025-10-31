-- =============================================
-- Migration: 0002_create_users_table.sql
-- Description: Clerk 사용자 동기화 테이블
-- =============================================

-- pgcrypto extension for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- users 테이블 생성
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL UNIQUE,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- RLS 비활성화
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;

