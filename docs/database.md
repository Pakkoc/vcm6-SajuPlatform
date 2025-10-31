# Database Design: Saju맛피아

## 목차
1. [데이터플로우 개요](#데이터플로우-개요)
2. [테이블 관계도](#테이블-관계도)
3. [테이블 상세 스키마](#테이블-상세-스키마)
4. [인덱스 전략](#인덱스-전략)
5. [제약 조건](#제약-조건)
6. [Migration 파일](#migration-파일)

---

## 데이터플로우 개요

### 1. 회원가입 플로우
```
Clerk (user.created) 
  → users 테이블 INSERT (clerk_user_id, email)
  → subscriptions 테이블 INSERT (user_id, plan='free', remaining_count=1)
```

### 2. 사주 분석 요청 플로우
```
사용자 입력 (이름, 생년월일, 출생시간, 성별)
  → subscriptions 테이블 SELECT (잔여 횟수 확인)
  → Gemini API 호출
  → saju_analyses 테이블 INSERT (분석 결과 저장)
  → subscriptions 테이블 UPDATE (remaining_count - 1)
```

### 3. 대시보드 조회 플로우
```
사용자 인증
  → saju_analyses 테이블 SELECT (WHERE user_id = current_user)
  → 분석 내역 목록 반환
```

### 4. 분석 상세보기 플로우
```
사용자 인증 + 분석 ID
  → saju_analyses 테이블 SELECT (WHERE id = analysis_id AND user_id = current_user)
  → 단일 분석 결과 반환
```

### 5. Pro 구독 업그레이드 플로우
```
토스페이먼츠 결제 성공
  → 빌링키 발급
  → subscriptions 테이블 UPDATE (
      plan='pro', 
      billing_key=발급키, 
      remaining_count=10, 
      next_billing_date=현재+1개월
    )
```

### 6. 구독 취소 플로우
```
사용자 취소 요청
  → subscriptions 테이블 UPDATE (status='pending_cancellation')
  → 다음 결제일까지 Pro 혜택 유지
```

### 7. 구독 취소 철회 플로우
```
사용자 철회 요청
  → subscriptions 테이블 UPDATE (status='active')
```

### 8. 구독 즉시 해지 플로우
```
사용자 해지 요청
  → 토스페이먼츠 빌링키 삭제
  → subscriptions 테이블 UPDATE (
      plan='free', 
      status='active', 
      billing_key=NULL, 
      remaining_count=0, 
      next_billing_date=NULL
    )
```

### 9. 정기결제 자동 실행 플로우
```
Supabase Cron (매일 02:00)
  → subscriptions 테이블 SELECT (WHERE next_billing_date = TODAY)
  → 각 구독별 반복:
      - 토스페이먼츠 빌링키 결제 API 호출
      - 성공 시: UPDATE (remaining_count=10, next_billing_date=+1개월)
      - 실패 시: UPDATE (plan='free', billing_key=NULL, remaining_count=0)
      - 취소 예정 시: UPDATE (plan='free', billing_key=NULL, remaining_count=0)
```

### 10. 사용자 삭제 플로우
```
Clerk (user.deleted)
  → saju_analyses 테이블 DELETE (WHERE user_id = target_user)
  → subscriptions 테이블 DELETE (WHERE user_id = target_user)
  → users 테이블 DELETE (WHERE clerk_user_id = target_clerk_id)
```

---

## 테이블 관계도

```
┌─────────────────┐
│     users       │
│─────────────────│
│ id (PK)         │◄─────┐
│ clerk_user_id   │      │
│ email           │      │
│ created_at      │      │
│ updated_at      │      │
└─────────────────┘      │
                         │ (1:1)
                         │
        ┌────────────────┴────────────────┐
        │                                 │
        │ (1:N)                           │
        │                                 │
┌───────▼──────────┐           ┌──────────▼─────────┐
│ subscriptions    │           │  saju_analyses     │
│──────────────────│           │────────────────────│
│ id (PK)          │           │ id (PK)            │
│ user_id (FK)     │           │ user_id (FK)       │
│ plan             │           │ name               │
│ status           │           │ birth_date         │
│ billing_key      │           │ birth_time         │
│ remaining_count  │           │ gender             │
│ next_billing_date│           │ model_used         │
│ created_at       │           │ result             │
│ updated_at       │           │ created_at         │
└──────────────────┘           └────────────────────┘
```

**관계 설명**:
- `users` ↔ `subscriptions`: **1:1** (한 사용자는 하나의 구독 정보만 가짐)
- `users` ↔ `saju_analyses`: **1:N** (한 사용자는 여러 분석 내역을 가질 수 있음)

---

## 테이블 상세 스키마

### 1. users 테이블

**목적**: Clerk 사용자와 동기화된 사용자 프로필 저장

| 컬럼명 | 타입 | 제약 조건 | 설명 |
|--------|------|-----------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 내부 사용자 고유 ID |
| `clerk_user_id` | TEXT | NOT NULL, UNIQUE | Clerk의 user.id (외부 참조키) |
| `email` | TEXT | NOT NULL | 사용자 이메일 주소 |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 계정 생성 시각 |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 최종 수정 시각 |

**인덱스**:
- `idx_users_clerk_user_id` ON `clerk_user_id` (UNIQUE) - Clerk Webhook 조회 최적화
- `idx_users_email` ON `email` - 이메일 기반 검색 최적화

**트리거**:
- `update_users_updated_at`: `updated_at` 자동 갱신

---

### 2. subscriptions 테이블

**목적**: 사용자별 구독 정보 및 결제 상태 관리

| 컬럼명 | 타입 | 제약 조건 | 설명 |
|--------|------|-----------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 구독 고유 ID |
| `user_id` | UUID | NOT NULL, UNIQUE, REFERENCES users(id) ON DELETE CASCADE | 사용자 ID (FK) |
| `plan` | TEXT | NOT NULL, CHECK (plan IN ('free', 'pro')) | 요금제 ('free', 'pro') |
| `status` | TEXT | NOT NULL, CHECK (status IN ('active', 'pending_cancellation')) | 구독 상태 |
| `billing_key` | TEXT | NULL | 토스페이먼츠 빌링키 (Pro 플랜만) |
| `remaining_count` | INTEGER | NOT NULL, DEFAULT 0, CHECK (remaining_count >= 0) | 잔여 분석 횟수 |
| `next_billing_date` | DATE | NULL | 다음 결제일 (Pro 플랜만) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 구독 생성 시각 |
| `updated_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 최종 수정 시각 |

**인덱스**:
- `idx_subscriptions_user_id` ON `user_id` (UNIQUE) - 사용자별 구독 조회 최적화
- `idx_subscriptions_next_billing_date` ON `next_billing_date` WHERE `next_billing_date IS NOT NULL` - Cron Job 조회 최적화
- `idx_subscriptions_plan_status` ON `(plan, status)` - 구독 상태별 집계 최적화

**트리거**:
- `update_subscriptions_updated_at`: `updated_at` 자동 갱신

**비즈니스 로직 제약**:
- `plan='free'` → `billing_key=NULL`, `next_billing_date=NULL`
- `plan='pro'` → `billing_key NOT NULL` (최초 결제 성공 시), `next_billing_date NOT NULL`

---

### 3. saju_analyses 테이블

**목적**: 사주 분석 요청 및 결과 영구 저장

| 컬럼명 | 타입 | 제약 조건 | 설명 |
|--------|------|-----------|------|
| `id` | UUID | PRIMARY KEY, DEFAULT gen_random_uuid() | 분석 고유 ID |
| `user_id` | UUID | NOT NULL, REFERENCES users(id) ON DELETE CASCADE | 사용자 ID (FK) |
| `name` | TEXT | NOT NULL | 분석 대상자 이름 |
| `birth_date` | DATE | NOT NULL | 생년월일 |
| `birth_time` | TIME | NULL | 출생 시간 (선택) |
| `gender` | TEXT | NOT NULL, CHECK (gender IN ('male', 'female')) | 성별 |
| `model_used` | TEXT | NOT NULL, CHECK (model_used IN ('gemini-2.5-flash', 'gemini-2.5-pro')) | 사용된 AI 모델 |
| `result` | TEXT | NOT NULL | 분석 결과 (Markdown 형식) |
| `created_at` | TIMESTAMPTZ | NOT NULL, DEFAULT NOW() | 분석 생성 시각 |

**인덱스**:
- `idx_saju_analyses_user_id_created_at` ON `(user_id, created_at DESC)` - 사용자별 최신 분석 조회 최적화
- `idx_saju_analyses_name` ON `name` - 이름 검색 최적화 (대시보드 검색바)

**참고**:
- `updated_at` 컬럼 없음 (분석 결과는 수정되지 않음, 불변 데이터)

---

## 인덱스 전략

### 조회 패턴 기반 인덱스

1. **사용자별 구독 정보 조회** (빈번)
   - `idx_subscriptions_user_id` (UNIQUE)
   - 모든 인증된 페이지에서 구독 정보 표시 시 사용

2. **사용자별 분석 내역 조회** (빈번)
   - `idx_saju_analyses_user_id_created_at`
   - 대시보드 페이지에서 최신순 정렬 조회

3. **Cron Job 정기결제 대상 조회** (매일 1회)
   - `idx_subscriptions_next_billing_date`
   - `WHERE next_billing_date = CURRENT_DATE` 쿼리 최적화

4. **대시보드 이름 검색** (빈번)
   - `idx_saju_analyses_name`
   - 클라이언트 사이드 필터링이지만 초기 로드 최적화

5. **Clerk Webhook 사용자 조회** (회원가입/수정 시)
   - `idx_users_clerk_user_id` (UNIQUE)
   - Webhook 이벤트 처리 시 사용자 조회

### 복합 인덱스 선택 이유

- `(user_id, created_at DESC)`: 사용자별 필터링 + 시간순 정렬을 단일 인덱스로 처리
- `(plan, status)`: 구독 통계 및 관리자 대시보드용 (향후 확장)

---

## 제약 조건

### 1. 외래키 제약 (Foreign Key Constraints)

```sql
-- subscriptions.user_id → users.id
ALTER TABLE subscriptions 
  ADD CONSTRAINT fk_subscriptions_user_id 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- saju_analyses.user_id → users.id
ALTER TABLE saju_analyses 
  ADD CONSTRAINT fk_saju_analyses_user_id 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;
```

**CASCADE 정책**:
- 사용자 삭제 시 관련된 구독 정보와 분석 내역도 자동 삭제
- Clerk에서 `user.deleted` Webhook 발생 시 안전한 데이터 정리

### 2. 체크 제약 (Check Constraints)

```sql
-- subscriptions 테이블
ALTER TABLE subscriptions 
  ADD CONSTRAINT chk_subscriptions_plan 
  CHECK (plan IN ('free', 'pro'));

ALTER TABLE subscriptions 
  ADD CONSTRAINT chk_subscriptions_status 
  CHECK (status IN ('active', 'pending_cancellation'));

ALTER TABLE subscriptions 
  ADD CONSTRAINT chk_subscriptions_remaining_count 
  CHECK (remaining_count >= 0);

-- saju_analyses 테이블
ALTER TABLE saju_analyses 
  ADD CONSTRAINT chk_saju_analyses_gender 
  CHECK (gender IN ('male', 'female'));

ALTER TABLE saju_analyses 
  ADD CONSTRAINT chk_saju_analyses_model 
  CHECK (model_used IN ('gemini-2.5-flash', 'gemini-2.5-pro'));
```

### 3. 유니크 제약 (Unique Constraints)

```sql
-- users 테이블
ALTER TABLE users 
  ADD CONSTRAINT uq_users_clerk_user_id 
  UNIQUE (clerk_user_id);

-- subscriptions 테이블
ALTER TABLE subscriptions 
  ADD CONSTRAINT uq_subscriptions_user_id 
  UNIQUE (user_id);
```

**1:1 관계 보장**:
- `subscriptions.user_id`에 UNIQUE 제약으로 한 사용자당 하나의 구독만 존재

---

## Migration 파일

### 0001_create_users_table.sql

```sql
-- =============================================
-- Migration: 0001_create_users_table.sql
-- Description: Clerk 사용자와 동기화된 사용자 프로필 테이블 생성
-- =============================================

BEGIN;

-- users 테이블 생성
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clerk_user_id TEXT NOT NULL,
  email TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 유니크 제약 추가
ALTER TABLE users 
  ADD CONSTRAINT uq_users_clerk_user_id 
  UNIQUE (clerk_user_id);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_clerk_user_id 
  ON users(clerk_user_id);

CREATE INDEX IF NOT EXISTS idx_users_email 
  ON users(email);

-- updated_at 자동 갱신 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- updated_at 트리거 적용
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 코멘트 추가
COMMENT ON TABLE users IS 'Clerk 사용자와 동기화된 사용자 프로필';
COMMENT ON COLUMN users.id IS '내부 사용자 고유 ID';
COMMENT ON COLUMN users.clerk_user_id IS 'Clerk의 user.id (외부 참조키)';
COMMENT ON COLUMN users.email IS '사용자 이메일 주소';
COMMENT ON COLUMN users.created_at IS '계정 생성 시각';
COMMENT ON COLUMN users.updated_at IS '최종 수정 시각';

COMMIT;

EXCEPTION
  WHEN OTHERS THEN
    ROLLBACK;
    RAISE;
```

---

### 0002_create_subscriptions_table.sql

```sql
-- =============================================
-- Migration: 0002_create_subscriptions_table.sql
-- Description: 사용자별 구독 정보 및 결제 상태 관리 테이블 생성
-- =============================================

BEGIN;

-- subscriptions 테이블 생성
CREATE TABLE IF NOT EXISTS subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  plan TEXT NOT NULL DEFAULT 'free',
  status TEXT NOT NULL DEFAULT 'active',
  billing_key TEXT,
  remaining_count INTEGER NOT NULL DEFAULT 0,
  next_billing_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 외래키 제약 추가
ALTER TABLE subscriptions 
  ADD CONSTRAINT fk_subscriptions_user_id 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- 유니크 제약 추가 (1:1 관계)
ALTER TABLE subscriptions 
  ADD CONSTRAINT uq_subscriptions_user_id 
  UNIQUE (user_id);

-- 체크 제약 추가
ALTER TABLE subscriptions 
  ADD CONSTRAINT chk_subscriptions_plan 
  CHECK (plan IN ('free', 'pro'));

ALTER TABLE subscriptions 
  ADD CONSTRAINT chk_subscriptions_status 
  CHECK (status IN ('active', 'pending_cancellation'));

ALTER TABLE subscriptions 
  ADD CONSTRAINT chk_subscriptions_remaining_count 
  CHECK (remaining_count >= 0);

-- 인덱스 생성
CREATE UNIQUE INDEX IF NOT EXISTS idx_subscriptions_user_id 
  ON subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_next_billing_date 
  ON subscriptions(next_billing_date) 
  WHERE next_billing_date IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_status 
  ON subscriptions(plan, status);

-- updated_at 트리거 적용
CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 코멘트 추가
COMMENT ON TABLE subscriptions IS '사용자별 구독 정보 및 결제 상태 관리';
COMMENT ON COLUMN subscriptions.id IS '구독 고유 ID';
COMMENT ON COLUMN subscriptions.user_id IS '사용자 ID (FK)';
COMMENT ON COLUMN subscriptions.plan IS '요금제 (free, pro)';
COMMENT ON COLUMN subscriptions.status IS '구독 상태 (active, pending_cancellation)';
COMMENT ON COLUMN subscriptions.billing_key IS '토스페이먼츠 빌링키 (Pro 플랜만)';
COMMENT ON COLUMN subscriptions.remaining_count IS '잔여 분석 횟수';
COMMENT ON COLUMN subscriptions.next_billing_date IS '다음 결제일 (Pro 플랜만)';
COMMENT ON COLUMN subscriptions.created_at IS '구독 생성 시각';
COMMENT ON COLUMN subscriptions.updated_at IS '최종 수정 시각';

COMMIT;

EXCEPTION
  WHEN OTHERS THEN
    ROLLBACK;
    RAISE;
```

---

### 0003_create_saju_analyses_table.sql

```sql
-- =============================================
-- Migration: 0003_create_saju_analyses_table.sql
-- Description: 사주 분석 요청 및 결과 영구 저장 테이블 생성
-- =============================================

BEGIN;

-- saju_analyses 테이블 생성
CREATE TABLE IF NOT EXISTS saju_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  birth_date DATE NOT NULL,
  birth_time TIME,
  gender TEXT NOT NULL,
  model_used TEXT NOT NULL,
  result TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 외래키 제약 추가
ALTER TABLE saju_analyses 
  ADD CONSTRAINT fk_saju_analyses_user_id 
  FOREIGN KEY (user_id) 
  REFERENCES users(id) 
  ON DELETE CASCADE;

-- 체크 제약 추가
ALTER TABLE saju_analyses 
  ADD CONSTRAINT chk_saju_analyses_gender 
  CHECK (gender IN ('male', 'female'));

ALTER TABLE saju_analyses 
  ADD CONSTRAINT chk_saju_analyses_model 
  CHECK (model_used IN ('gemini-2.5-flash', 'gemini-2.5-pro'));

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_saju_analyses_user_id_created_at 
  ON saju_analyses(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_saju_analyses_name 
  ON saju_analyses(name);

-- 코멘트 추가
COMMENT ON TABLE saju_analyses IS '사주 분석 요청 및 결과 영구 저장';
COMMENT ON COLUMN saju_analyses.id IS '분석 고유 ID';
COMMENT ON COLUMN saju_analyses.user_id IS '사용자 ID (FK)';
COMMENT ON COLUMN saju_analyses.name IS '분석 대상자 이름';
COMMENT ON COLUMN saju_analyses.birth_date IS '생년월일';
COMMENT ON COLUMN saju_analyses.birth_time IS '출생 시간 (선택)';
COMMENT ON COLUMN saju_analyses.gender IS '성별 (male, female)';
COMMENT ON COLUMN saju_analyses.model_used IS '사용된 AI 모델 (gemini-2.5-flash, gemini-2.5-pro)';
COMMENT ON COLUMN saju_analyses.result IS '분석 결과 (Markdown 형식)';
COMMENT ON COLUMN saju_analyses.created_at IS '분석 생성 시각';

COMMIT;

EXCEPTION
  WHEN OTHERS THEN
    ROLLBACK;
    RAISE;
```

---

## 데이터 타입 선택 근거

### UUID vs SERIAL
- **선택**: UUID
- **이유**:
  - 분산 환경에서 충돌 없는 고유 ID 생성
  - 외부 노출 시 순차적 ID보다 보안상 유리
  - Supabase 기본 권장 타입

### TEXT vs VARCHAR
- **선택**: TEXT
- **이유**:
  - PostgreSQL에서 TEXT와 VARCHAR 성능 차이 없음
  - 길이 제한 불필요 (이메일, 이름 등 가변 길이)
  - 유연성 확보 (MVP 단계에서 길이 제약 회피)

### TIMESTAMPTZ vs TIMESTAMP
- **선택**: TIMESTAMPTZ
- **이유**:
  - 타임존 정보 포함으로 글로벌 서비스 대비
  - 한국 시간(KST)과 UTC 자동 변환
  - Supabase 권장 타입

### DATE vs TIMESTAMPTZ (birth_date, next_billing_date)
- **선택**: DATE
- **이유**:
  - 생년월일과 결제일은 시간 정보 불필요
  - 날짜만 비교하는 쿼리 최적화
  - 저장 공간 절약 (4 bytes vs 8 bytes)

### TIME vs INTERVAL (birth_time)
- **선택**: TIME
- **이유**:
  - 출생 시간은 특정 시각 표현 (예: 14:30:00)
  - INTERVAL은 기간 표현용으로 부적합

---

## 쿼리 예시

### 1. 사용자별 구독 정보 조회
```sql
SELECT 
  s.plan,
  s.status,
  s.remaining_count,
  s.next_billing_date,
  u.email
FROM subscriptions s
JOIN users u ON s.user_id = u.id
WHERE u.clerk_user_id = $1;
```

### 2. 대시보드 분석 내역 조회 (최신순)
```sql
SELECT 
  id,
  name,
  birth_date,
  gender,
  model_used,
  created_at,
  LEFT(result, 200) AS summary
FROM saju_analyses
WHERE user_id = $1
ORDER BY created_at DESC;
```

### 3. 대시보드 이름 검색
```sql
SELECT 
  id,
  name,
  birth_date,
  created_at
FROM saju_analyses
WHERE user_id = $1
  AND name ILIKE '%' || $2 || '%'
ORDER BY created_at DESC;
```

### 4. Cron Job 오늘 결제 대상 조회
```sql
SELECT 
  s.id,
  s.user_id,
  s.billing_key,
  s.plan,
  s.status,
  u.email
FROM subscriptions s
JOIN users u ON s.user_id = u.id
WHERE s.plan = 'pro'
  AND s.status IN ('active', 'pending_cancellation')
  AND s.next_billing_date = CURRENT_DATE;
```

### 5. 분석 결과 저장 및 횟수 차감 (트랜잭션)
```sql
BEGIN;

-- 분석 결과 저장
INSERT INTO saju_analyses (
  user_id, 
  name, 
  birth_date, 
  birth_time, 
  gender, 
  model_used, 
  result
) VALUES (
  $1, $2, $3, $4, $5, $6, $7
) RETURNING id;

-- 잔여 횟수 차감
UPDATE subscriptions
SET 
  remaining_count = remaining_count - 1,
  updated_at = NOW()
WHERE user_id = $1
  AND remaining_count > 0;

COMMIT;
```

### 6. Pro 구독 업그레이드
```sql
UPDATE subscriptions
SET 
  plan = 'pro',
  status = 'active',
  billing_key = $2,
  remaining_count = 10,
  next_billing_date = CURRENT_DATE + INTERVAL '1 month',
  updated_at = NOW()
WHERE user_id = $1;
```

### 7. 정기결제 성공 처리
```sql
UPDATE subscriptions
SET 
  remaining_count = 10,
  next_billing_date = next_billing_date + INTERVAL '1 month',
  updated_at = NOW()
WHERE id = $1;
```

### 8. 정기결제 실패 처리 (구독 해지)
```sql
UPDATE subscriptions
SET 
  plan = 'free',
  status = 'active',
  billing_key = NULL,
  remaining_count = 0,
  next_billing_date = NULL,
  updated_at = NOW()
WHERE id = $1;
```

---

## 데이터 무결성 보장

### 1. 트랜잭션 사용 필수 케이스

- **회원가입**: `users` + `subscriptions` 동시 생성
- **사주 분석**: `saju_analyses` 삽입 + `subscriptions.remaining_count` 차감
- **구독 업그레이드**: 결제 성공 후 `subscriptions` 업데이트
- **사용자 삭제**: `saju_analyses` + `subscriptions` + `users` 순차 삭제 (CASCADE로 자동화)

### 2. 낙관적 잠금 (Optimistic Locking)

```sql
-- 잔여 횟수 차감 시 동시성 제어
UPDATE subscriptions
SET 
  remaining_count = remaining_count - 1,
  updated_at = NOW()
WHERE user_id = $1
  AND remaining_count > 0  -- 조건부 업데이트
RETURNING remaining_count;

-- 업데이트된 행이 없으면 잔여 횟수 부족 에러 처리
```

### 3. 제약 조건 활용

- **CHECK 제약**: 잘못된 값 삽입 방지 (plan, status, gender, model_used)
- **FOREIGN KEY 제약**: 참조 무결성 보장 (user_id)
- **UNIQUE 제약**: 중복 방지 (clerk_user_id, subscriptions.user_id)
- **NOT NULL 제약**: 필수 필드 보장

---

## 성능 최적화 고려사항

### 1. 인덱스 전략
- 자주 조회되는 컬럼에만 인덱스 생성 (과도한 인덱스는 INSERT/UPDATE 성능 저하)
- 복합 인덱스 활용으로 단일 쿼리 최적화
- Partial Index 활용 (`WHERE next_billing_date IS NOT NULL`)

### 2. 쿼리 최적화
- `LEFT(result, 200)`: 대시보드에서 전체 분석 결과 대신 요약만 조회
- `ORDER BY created_at DESC`: 인덱스 활용으로 정렬 최적화
- `ILIKE` 대신 Full-Text Search 고려 (향후 확장)

### 3. 데이터 파티셔닝 (향후 확장)
- `saju_analyses` 테이블이 수백만 건 이상 증가 시 `created_at` 기준 파티셔닝 고려
- 현재 MVP 단계에서는 불필요

---

## 보안 고려사항

### 1. RLS (Row Level Security) 비활성화
- 요구사항에 따라 RLS 사용하지 않음
- 애플리케이션 레이어에서 권한 제어 (Clerk 세션 기반)

### 2. 민감 정보 보호
- `billing_key`: 토스페이먼츠 빌링키 (암호화된 상태로 저장)
- `email`: 개인정보이지만 Clerk에서 이미 관리하므로 추가 암호화 불필요

### 3. SQL Injection 방지
- Prepared Statement 사용 (Supabase 클라이언트 기본 지원)
- 사용자 입력 값은 항상 파라미터 바인딩 ($1, $2, ...)

---

## 백업 및 복구 전략

### 1. Supabase 자동 백업
- Supabase Pro 플랜 이상에서 자동 백업 제공
- Point-in-Time Recovery (PITR) 지원

### 2. 수동 백업
```bash
# PostgreSQL dump
pg_dump -h <supabase-host> -U postgres -d postgres > backup.sql

# 복구
psql -h <supabase-host> -U postgres -d postgres < backup.sql
```

### 3. 중요 데이터 우선순위
1. `users`: 사용자 프로필 (최우선)
2. `subscriptions`: 구독 정보 (결제 관련)
3. `saju_analyses`: 분석 내역 (대용량, 우선순위 낮음)

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0 | 2025-10-31 | CTO | 초안 작성 - 3개 테이블 스키마 정의 |

