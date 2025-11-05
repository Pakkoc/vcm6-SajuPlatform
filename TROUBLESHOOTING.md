# 🔧 대시보드 데이터 로딩 문제 해결 가이드

## 🐛 증상
- 대시보드 페이지에서 구독 정보를 불러오지 못함
- 분석 목록이 표시되지 않음
- API 호출이 401 Unauthorized 또는 404 Not Found 에러 반환

## 🔍 원인 진단

### 1단계: 브라우저 개발자 도구 확인

**F12를 눌러 개발자 도구를 열고 다음을 확인하세요:**

#### Network 탭
```
1. /api/subscription 요청 확인
   - Status Code가 401이면 → 인증 문제
   - Status Code가 404이면 → DB에 사용자 데이터 없음
   - Status Code가 500이면 → 서버 오류

2. /api/saju-analyses 요청 확인
   - 동일하게 Status Code 확인
```

#### Console 탭
```
- 에러 메시지 확인
- "환경 변수 검증 실패" 메시지가 있는지 확인
```

### 2단계: 환경 변수 확인

`.env.local` 파일이 존재하고 다음 변수들이 설정되어 있는지 확인:

```bash
# Clerk (필수)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase (필수)
NEXT_PUBLIC_SUPABASE_URL=https://...
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# API Base URL (필수)
NEXT_PUBLIC_API_BASE_URL=/api

# 기타 (선택)
CLERK_WEBHOOK_SECRET=whsec_...
TOSS_SECRET_KEY=test_sk_...
GEMINI_API_KEY=AIza...
CRON_SECRET=...
```

### 3단계: 로컬 환경 시나리오별 해결 방법

## 📋 시나리오 1: Mock 모드로 테스트 (Clerk 없이)

**상황**: Clerk 계정이 없거나 설정하기 싫은 경우

### 해결 방법

1. `.env.local` 파일에 Mock 모드 설정:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=test
CLERK_SECRET_KEY=test_secret
```

2. **수동으로 DB에 테스트 데이터 삽입** (Supabase SQL Editor):

```sql
-- 1. 테스트 사용자 생성
INSERT INTO users (id, clerk_user_id, email, created_at)
VALUES (
  'test-user-id-123',
  'test_clerk_user_id',
  'test@example.com',
  NOW()
);

-- 2. 테스트 구독 생성
INSERT INTO subscriptions (user_id, plan, status, remaining_count, created_at, updated_at)
VALUES (
  'test-user-id-123',
  'free',
  'active',
  1,
  NOW(),
  NOW()
);

-- 3. 테스트 분석 데이터 생성 (선택)
INSERT INTO saju_analyses (
  user_id, name, birth_date, birth_time, gender, model_used, result, created_at
)
VALUES (
  'test-user-id-123',
  '홍길동',
  '1990-01-01',
  '12:00:00',
  'male',
  'gemini-2.5-flash',
  '# 사주 분석 결과\n\n## 전반적인 성향\n테스트 결과입니다.',
  NOW()
);
```

3. **Mock 인증 우회를 위한 임시 수정**:

`src/lib/auth/get-clerk-user.ts` 파일을 다음과 같이 수정:

```typescript
import { NextRequest } from "next/server";
import { getAuth } from "@clerk/nextjs/server";

const MOCK_MODE = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY === "test";

export const getAuthenticatedUserId = async (request: Request) => {
  // Mock 모드: 테스트용 고정 사용자 ID 반환
  if (MOCK_MODE) {
    return "test_clerk_user_id";
  }

  const nextRequest = request instanceof NextRequest ? request : new NextRequest(request);
  const { userId } = await getAuth(nextRequest);

  if (!userId) {
    throw new Error("사용자 인증 정보가 없습니다.");
  }

  return userId;
};
```

4. 개발 서버 재시작:
```bash
npm run dev
```

---

## 📋 시나리오 2: 실제 Clerk로 테스트

**상황**: Clerk 계정이 있고 실제 인증을 사용하는 경우

### 해결 방법

1. **Clerk Dashboard 설정**:
   - https://dashboard.clerk.com 접속
   - 프로젝트 생성 또는 선택
   - API Keys 복사

2. `.env.local` 파일 설정:
```bash
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_실제키
CLERK_SECRET_KEY=sk_test_실제키
```

3. **Clerk Webhook 설정** (선택, 자동 DB 동기화용):
   - Clerk Dashboard → Webhooks
   - Endpoint URL: `https://your-domain.com/api/webhooks/clerk`
   - Events: `user.created` 선택
   - 로컬에서는 ngrok 등으로 터널링 필요

4. **수동 회원가입 후 DB 확인**:
   - 브라우저에서 `/sign-up` 접속
   - Google 계정으로 회원가입
   - Supabase에서 `users` 테이블 확인
   - 데이터가 없으면 수동으로 삽입 (위 SQL 참고, clerk_user_id는 Clerk에서 확인)

---

## 📋 시나리오 3: Supabase 연결 문제

**상황**: 환경 변수는 설정했지만 DB 연결이 안 되는 경우

### 해결 방법

1. **Supabase 프로젝트 확인**:
   - https://supabase.com/dashboard 접속
   - 프로젝트가 활성 상태인지 확인
   - Settings → API에서 URL과 Keys 확인

2. **마이그레이션 실행 여부 확인**:
```bash
# Supabase SQL Editor에서 테이블 존재 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public';

# 결과: users, subscriptions, saju_analyses 테이블이 있어야 함
```

3. **테이블이 없으면 마이그레이션 실행**:
   - `supabase/migrations/` 폴더의 SQL 파일들을 순서대로 실행
   - Supabase SQL Editor에 복사 붙여넣기

---

## 🚀 빠른 해결 (추천)

### 가장 빠른 방법: Mock 모드 + 수동 데이터 삽입

```bash
# 1. .env.local 파일 생성/수정
echo "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=test" >> .env.local
echo "CLERK_SECRET_KEY=test_secret" >> .env.local
echo "NEXT_PUBLIC_API_BASE_URL=/api" >> .env.local
# ... Supabase 키들 추가

# 2. 개발 서버 재시작
npm run dev
```

그 다음 위의 "시나리오 1"의 SQL을 Supabase에서 실행하세요.

---

## 🔍 추가 디버깅 방법

### API 응답 확인
브라우저 Console에서 직접 API 호출 테스트:

```javascript
// 구독 정보 조회
fetch('/api/subscription')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);

// 분석 목록 조회
fetch('/api/saju-analyses')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### 서버 로그 확인
터미널에서 Next.js 개발 서버 로그 확인:
- "Failed to fetch subscription" 메시지 확인
- "사용자 인증 정보가 없습니다" 메시지 확인

---

## ✅ 해결 확인

다음이 모두 표시되면 성공:
1. ✅ 대시보드에서 구독 정보 카드 표시 (이메일, 잔여 횟수)
2. ✅ Sidebar에 구독 상태 카드 표시
3. ✅ 분석 목록 또는 "아직 분석 내역이 없습니다" 메시지 표시
4. ✅ 브라우저 Console에 에러 없음

---

## 📞 추가 도움이 필요하면

다음 정보를 공유해주세요:
1. 브라우저 Console의 에러 메시지 (F12 → Console 탭)
2. Network 탭의 API 요청 Status Code
3. 터미널의 서버 로그
4. `.env.local` 파일 존재 여부 (키 값은 제외)

