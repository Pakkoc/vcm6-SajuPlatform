# Database Design: Saju맛피아

## 데이터플로우 개요

### 1. 회원가입
```
Clerk Webhook → users INSERT → subscriptions INSERT (free, count=1)
```

### 2. 사주 분석
```
입력 → subscriptions SELECT (횟수 확인) → Gemini API → saju_analyses INSERT + subscriptions UPDATE (count-1)
```

### 3. 대시보드 조회
```
인증 → saju_analyses SELECT (user_id, created_at DESC)
```

### 4. 분석 상세
```
인증 → saju_analyses SELECT (id, user_id)
```

### 5. Pro 업그레이드
```
결제 성공 → subscriptions UPDATE (plan=pro, billing_key, count=10, next_date)
```

### 6. 구독 취소
```
요청 → subscriptions UPDATE (status=pending_cancellation)
```

### 7. 구독 철회
```
요청 → subscriptions UPDATE (status=active)
```

### 8. 구독 해지
```
요청 → subscriptions UPDATE (plan=free, billing_key=NULL, count=0, next_date=NULL)
```

### 9. 정기결제 (Cron)
```
Cron → subscriptions SELECT (next_date=TODAY) → 결제 API → UPDATE (성공: count=10, next_date+1M / 실패: free)
```

### 10. 사용자 삭제
```
Clerk Webhook → users DELETE (CASCADE → subscriptions, saju_analyses)
```

---

## 테이블 관계도

```
users (1) ──── (1) subscriptions
  │
  └──── (N) saju_analyses
```

---

## 테이블 스키마

### users
```sql
id              UUID PRIMARY KEY DEFAULT gen_random_uuid()
clerk_user_id   TEXT NOT NULL UNIQUE
email           TEXT NOT NULL
created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### subscriptions
```sql
id                UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id           UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE
plan              TEXT NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro'))
status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'pending_cancellation'))
billing_key       TEXT
remaining_count   INTEGER NOT NULL DEFAULT 0 CHECK (remaining_count >= 0)
next_billing_date DATE
created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

### saju_analyses
```sql
id          UUID PRIMARY KEY DEFAULT gen_random_uuid()
user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE
name        TEXT NOT NULL
birth_date  DATE NOT NULL
birth_time  TIME
gender      TEXT NOT NULL CHECK (gender IN ('male', 'female'))
model_used  TEXT NOT NULL CHECK (model_used IN ('gemini-2.5-flash', 'gemini-2.5-pro'))
result      TEXT NOT NULL
created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
```

---

## 인덱스

| 테이블 | 인덱스 | 목적 |
|--------|--------|------|
| users | clerk_user_id (UNIQUE) | Webhook 조회 |
| subscriptions | user_id (UNIQUE) | 구독 정보 조회 |
| subscriptions | next_billing_date (partial) | Cron 조회 |
| saju_analyses | (user_id, created_at DESC) | 대시보드 조회 |

---

## 주요 쿼리

### 구독 정보 조회
```sql
SELECT plan, status, remaining_count, next_billing_date
FROM subscriptions
WHERE user_id = (SELECT id FROM users WHERE clerk_user_id = $1);
```

### 대시보드 분석 목록
```sql
SELECT id, name, birth_date, created_at, LEFT(result, 200) AS summary
FROM saju_analyses
WHERE user_id = $1
ORDER BY created_at DESC;
```

### 분석 저장 + 횟수 차감 (트랜잭션)
```sql
BEGIN;
INSERT INTO saju_analyses (user_id, name, birth_date, birth_time, gender, model_used, result)
VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING id;
UPDATE subscriptions SET remaining_count = remaining_count - 1, updated_at = NOW()
WHERE user_id = $1 AND remaining_count > 0;
COMMIT;
```

### Cron 결제 대상 조회
```sql
SELECT id, user_id, billing_key, status
FROM subscriptions
WHERE plan = 'pro' AND next_billing_date = CURRENT_DATE;
```

---

## Migration 파일

Migration 파일은 `/supabase/migrations/` 디렉토리에 순서대로 생성됩니다:

1. `0002_create_users_table.sql`
2. `0003_create_subscriptions_table.sql`
3. `0004_create_saju_analyses_table.sql`

각 파일은 다음을 포함합니다:
- 테이블 생성
- 제약 조건 (FK, CHECK, UNIQUE)
- 필수 인덱스
- RLS 비활성화
- updated_at 트리거 (subscriptions만)

---

## 설계 원칙

1. **최소 스펙**: 유저플로우에 명시된 데이터만 포함
2. **간결성**: 불필요한 인덱스, 코멘트 제거
3. **확장성**: 1:1, 1:N 관계로 향후 확장 가능
4. **성능**: 자주 사용되는 쿼리에만 인덱스 적용

