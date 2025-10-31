# 공통 모듈 작업 계획

## 목적

페이지 단위 개발을 병렬로 진행하기 위해 **모든 페이지에서 공통으로 사용될 모듈 및 로직을 사전에 구현**합니다.
코드 conflict를 방지하고 개발 속도를 높이기 위해 반드시 선행 작업이 필요합니다.

---

## 1. 환경 변수 설정

### 파일: `.env.local`

```env
# Clerk (인증)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxx
CLERK_SECRET_KEY=sk_test_xxx
CLERK_WEBHOOK_SECRET=whsec_xxx

# Supabase (데이터베이스)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJxxx
SUPABASE_SERVICE_ROLE_KEY=eyJxxx

# 토스페이먼츠 (결제)
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_xxx
TOSS_SECRET_KEY=test_sk_xxx

# Gemini API (AI 분석)
GEMINI_API_KEY=AIzaSyxxx

# Cron Job 보안
CRON_SECRET=your_secret_key_here

# API Base URL (선택)
NEXT_PUBLIC_API_BASE_URL=/api
```

### 작업 내용
- `.env.local.example` 파일 생성 (템플릿)
- `src/constants/env.ts`에 환경 변수 타입 정의 및 검증 추가

---

## 2. Clerk 인증 설정

### 2.1 Clerk Provider 설정

**파일**: `src/app/layout.tsx`

```typescript
import { ClerkProvider } from '@clerk/nextjs';
import { koKR } from "@clerk/localizations";
```

- ClerkProvider로 앱 전체 래핑
- 한글 로컬라이제이션 적용 (`koKR`)

### 2.2 Clerk 미들웨어 설정

**파일**: `src/middleware.ts`

- 현재 Supabase 기반 미들웨어를 **Clerk 미들웨어로 교체**
- 공개 페이지 정의: `/`, `/sign-in`, `/sign-up`, `/api/webhooks/clerk`
- 나머지 페이지는 인증 필요

```typescript
import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const isPublicRoute = createRouteMatcher([
  '/',
  '/sign-in(.*)',
  '/sign-up(.*)',
  '/api/webhooks/clerk',
]);

export default clerkMiddleware((auth, request) => {
  if (!isPublicRoute(request)) {
    auth().protect();
  }
});
```

### 2.3 Clerk 인증 페이지

**파일**: `src/app/sign-in/[[...sign-in]]/page.tsx`
**파일**: `src/app/sign-up/[[...sign-up]]/page.tsx`

- Clerk 제공 `<SignIn />`, `<SignUp />` 컴포넌트 사용
- Client Component로 구현

---

## 3. 공용 레이아웃 컴포넌트

### 3.1 AuthenticatedLayout

**파일**: `src/components/layouts/authenticated-layout.tsx`

**구성 요소**:
- Header (상단 고정)
  - 서비스명 로고 (클릭 시 `/dashboard`)
  - 네비게이션: 대시보드, 새 검사
  - Clerk `<UserButton />` (프로필)
- Sidebar (좌측 고정)
  - 메뉴: 대시보드, 새 검사 (아이콘 + 텍스트)
  - 하단: 구독 상태 카드 (클릭 시 `/subscription`)
    - 이메일
    - 잔여 횟수 (예: "3/10회 남음")
    - 요금제 배지 (Free/Pro)
- Main Content (중앙)

**의존성**:
- `useSubscriptionInfo` 훅 (구독 정보 조회)
- Clerk `<UserButton />` 컴포넌트

### 3.2 적용 방법

**파일**: `src/app/(authenticated)/layout.tsx`

- 인증 필요 페이지 그룹에 적용
- `/dashboard`, `/new-analysis`, `/analysis/[id]`, `/subscription`

---

## 4. 구독 정보 관리

### 4.1 구독 정보 조회 API

**파일**: `src/features/subscription/backend/route.ts`

```typescript
app.get('/api/subscription', async (c) => {
  // Clerk 세션에서 user.id 추출
  // Supabase에서 subscriptions 조회
  // plan, status, remaining_count, next_billing_date 반환
});
```

**파일**: `src/features/subscription/backend/service.ts`

- `getSubscriptionByUserId(userId: string)` 함수
- Supabase 쿼리 로직

**파일**: `src/features/subscription/backend/schema.ts`

```typescript
export const SubscriptionResponseSchema = z.object({
  plan: z.enum(['free', 'pro']),
  status: z.enum(['active', 'pending_cancellation']),
  remaining_count: z.number(),
  next_billing_date: z.string().nullable(),
});
```

### 4.2 구독 정보 조회 훅

**파일**: `src/features/subscription/hooks/useSubscriptionInfo.ts`

```typescript
export const useSubscriptionInfo = () => {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: async () => {
      const { data } = await apiClient.get('/api/subscription');
      return SubscriptionResponseSchema.parse(data);
    },
  });
};
```

**파일**: `src/features/subscription/lib/dto.ts`

- backend/schema를 재노출

---

## 5. 공통 UI 컴포넌트

### 5.1 필요한 shadcn-ui 컴포넌트 설치

```bash
npx shadcn@latest add dialog
npx shadcn@latest add alert
npx shadcn@latest add skeleton
npx shadcn@latest add calendar
npx shadcn@latest add popover
```

### 5.2 커스텀 공통 컴포넌트

**파일**: `src/components/common/loading-modal.tsx`
- 분석 중 모달 (로딩 스피너 + 메시지)
- 재사용 가능한 로딩 모달

**파일**: `src/components/common/plan-badge.tsx`
- Free/Pro 배지 컴포넌트
- 색상: Free (회색), Pro (파란색)

**파일**: `src/components/common/empty-state.tsx`
- 빈 상태 UI (메시지 + CTA 버튼)
- 대시보드 빈 상태에서 사용

**파일**: `src/components/common/error-message.tsx`
- 에러 메시지 표시 컴포넌트
- Alert 컴포넌트 래핑

---

## 6. 날짜/시간 유틸리티

**파일**: `src/lib/utils/date.ts`

```typescript
import { format, formatDistanceToNow } from 'date-fns';
import { ko } from 'date-fns/locale';

// 상대 시간 표시 (예: "3일 전")
export const formatRelativeTime = (date: Date | string) => {
  return formatDistanceToNow(new Date(date), { 
    addSuffix: true, 
    locale: ko 
  });
};

// 날짜 포맷 (예: "2025-10-31")
export const formatDate = (date: Date | string) => {
  return format(new Date(date), 'yyyy-MM-dd');
};

// 날짜 + 시간 포맷 (예: "2025-10-31 14:30")
export const formatDateTime = (date: Date | string) => {
  return format(new Date(date), 'yyyy-MM-dd HH:mm', { locale: ko });
};
```

---

## 7. API 에러 핸들링

### 7.1 공통 에러 타입

**파일**: `src/lib/remote/error-types.ts`

```typescript
export type ApiErrorCode = 
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'INSUFFICIENT_CREDITS'
  | 'PAYMENT_FAILED'
  | 'VALIDATION_ERROR'
  | 'INTERNAL_ERROR';

export type ApiError = {
  code: ApiErrorCode;
  message: string;
  details?: unknown;
};
```

### 7.2 에러 핸들러 훅

**파일**: `src/hooks/use-api-error-handler.ts`

```typescript
import { useToast } from '@/hooks/use-toast';
import { extractApiErrorMessage } from '@/lib/remote/api-client';

export const useApiErrorHandler = () => {
  const { toast } = useToast();

  return (error: unknown) => {
    const message = extractApiErrorMessage(error);
    toast({
      variant: 'destructive',
      title: '오류 발생',
      description: message,
    });
  };
};
```

---

## 8. 상수 정의

### 8.1 구독 관련 상수

**파일**: `src/features/subscription/constants/index.ts`

```typescript
export const PLAN = {
  FREE: 'free',
  PRO: 'pro',
} as const;

export const PLAN_CONFIG = {
  [PLAN.FREE]: {
    name: 'Free',
    price: 0,
    credits: 1,
    model: 'gemini-2.5-flash',
  },
  [PLAN.PRO]: {
    name: 'Pro',
    price: 3900,
    credits: 10,
    model: 'gemini-2.5-pro',
  },
} as const;

export const SUBSCRIPTION_STATUS = {
  ACTIVE: 'active',
  PENDING_CANCELLATION: 'pending_cancellation',
} as const;
```

### 8.2 라우트 상수

**파일**: `src/constants/routes.ts`

```typescript
export const ROUTES = {
  HOME: '/',
  SIGN_IN: '/sign-in',
  SIGN_UP: '/sign-up',
  DASHBOARD: '/dashboard',
  NEW_ANALYSIS: '/new-analysis',
  ANALYSIS_DETAIL: (id: string) => `/analysis/${id}`,
  SUBSCRIPTION: '/subscription',
} as const;
```

---

## 9. Hono 라우터 등록 통합

**파일**: `src/backend/hono/app.ts`

```typescript
import { registerSubscriptionRoutes } from '@/features/subscription/backend/route';
import { registerSajuAnalysisRoutes } from '@/features/saju-analysis/backend/route';
import { registerClerkWebhookRoutes } from '@/features/clerk-webhook/backend/route';
import { registerCronRoutes } from '@/features/cron/backend/route';

export const createHonoApp = () => {
  // ... 기존 코드 ...
  
  registerSubscriptionRoutes(app);
  registerSajuAnalysisRoutes(app);
  registerClerkWebhookRoutes(app);
  registerCronRoutes(app);
  
  // ... 기존 코드 ...
};
```

---

## 10. React Query 설정

**파일**: `src/app/providers.tsx`

```typescript
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1분
        retry: 1,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

---

## 11. TypeScript 타입 정의

### 11.1 데이터베이스 타입

**파일**: `src/lib/supabase/types.ts`

```typescript
export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          clerk_user_id: string;
          email: string;
          created_at: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan: 'free' | 'pro';
          status: 'active' | 'pending_cancellation';
          billing_key: string | null;
          remaining_count: number;
          next_billing_date: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      saju_analyses: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          birth_date: string;
          birth_time: string | null;
          gender: 'male' | 'female';
          model_used: 'gemini-2.5-flash' | 'gemini-2.5-pro';
          result: string;
          created_at: string;
        };
      };
    };
  };
};
```

---

## 12. Clerk 사용자 조회 유틸리티

**파일**: `src/lib/auth/get-current-clerk-user.ts`

```typescript
import { auth } from '@clerk/nextjs/server';

export const getCurrentClerkUser = async () => {
  const { userId } = await auth();
  
  if (!userId) {
    throw new Error('Unauthorized');
  }
  
  return { userId };
};
```

**사용 예시** (API 라우트에서):
```typescript
import { getCurrentClerkUser } from '@/lib/auth/get-current-clerk-user';

export async function GET(req: Request) {
  const { userId } = await getCurrentClerkUser(); // Clerk user.id
  // ...
}
```

---

## 13. Supabase 사용자 조회 헬퍼

**파일**: `src/lib/supabase/helpers.ts`

```typescript
import type { SupabaseClient } from '@supabase/supabase-js';
import type { Database } from './types';

export const getUserByClerkId = async (
  supabase: SupabaseClient<Database>,
  clerkUserId: string
) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('clerk_user_id', clerkUserId)
    .single();

  if (error) {
    throw new Error(`User not found: ${error.message}`);
  }

  return data;
};

export const getSubscriptionByUserId = async (
  supabase: SupabaseClient<Database>,
  userId: string
) => {
  const { data, error } = await supabase
    .from('subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    throw new Error(`Subscription not found: ${error.message}`);
  }

  return data;
};
```

---

## 14. 토스페이먼츠 API 클라이언트

**파일**: `src/lib/payment/toss-client.ts`

```typescript
import axios from 'axios';

const TOSS_API_BASE = 'https://api.tosspayments.com/v1';

export const tossClient = axios.create({
  baseURL: TOSS_API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  auth: {
    username: process.env.TOSS_SECRET_KEY!,
    password: '',
  },
});

// 빌링키 발급
export const issueBillingKey = async (authKey: string, customerKey: string) => {
  const { data } = await tossClient.post('/billing/authorizations/issue', {
    authKey,
    customerKey,
  });
  return data;
};

// 빌링키로 결제
export const chargeBillingKey = async (
  billingKey: string,
  customerKey: string,
  amount: number,
  orderName: string
) => {
  const { data } = await tossClient.post(`/billing/${billingKey}`, {
    customerKey,
    amount,
    orderName,
  });
  return data;
};
```

---

## 15. Gemini API 클라이언트

**파일**: `src/lib/ai/gemini-client.ts`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const generateSajuAnalysis = async (
  name: string,
  birthDate: string,
  birthTime: string | null,
  gender: 'male' | 'female',
  isPro: boolean
) => {
  const modelName = isPro ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
  const model = genAI.getGenerativeModel({ model: modelName });

  const birthTimeText = birthTime ? `출생 시간: ${birthTime}` : '출생 시간: 모름';

  const prompt = `당신은 명리학과 사주팔자에 정통한 역술가입니다. 주어진 정보를 바탕으로 내담자의 성격, 재물운, 애정운, 건강운에 대해 상세하고 구체적으로 분석해주세요.

# 내담자 정보
- 이름: ${name}
- 생년월일: ${birthDate}
- ${birthTimeText}
- 성별: ${gender === 'male' ? '남성' : '여성'}

---

# 분석 결과
(Markdown 형식으로 작성)`;

  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
};
```

---

## 16. Markdown 렌더링 유틸리티

**파일**: `src/lib/utils/markdown.ts`

```typescript
// 간단한 Markdown → HTML 변환
// 분석 결과 표시용
export const renderMarkdown = (markdown: string): string => {
  // 기본적인 Markdown 변환 로직
  // 또는 react-markdown 라이브러리 사용
  return markdown
    .replace(/^### (.*$)/gim, '<h3>$1</h3>')
    .replace(/^## (.*$)/gim, '<h2>$1</h2>')
    .replace(/^# (.*$)/gim, '<h1>$1</h1>')
    .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
    .replace(/\n/gim, '<br />');
};
```

**또는 라이브러리 사용**:
```bash
npm install react-markdown
```

---

## 작업 순서

### Phase 1: 기본 설정 (필수 선행)
1. ✅ 환경 변수 설정 (`.env.local`, `.env.local.example`)
2. ✅ Clerk Provider 설정 (`layout.tsx`)
3. ✅ Clerk 미들웨어 교체 (`middleware.ts`)
4. ✅ React Query Provider 설정 (`providers.tsx`)
5. ✅ 상수 정의 (`routes.ts`, `subscription/constants`)
6. ✅ TypeScript 타입 정의 (`lib/supabase/types.ts`)

### Phase 2: 공통 유틸리티 및 헬퍼
7. ✅ Clerk 사용자 조회 유틸리티 (`lib/auth/get-current-clerk-user.ts`)
8. ✅ Supabase 헬퍼 함수 (`lib/supabase/helpers.ts`)
9. ✅ 토스페이먼츠 클라이언트 (`lib/payment/toss-client.ts`)
10. ✅ Gemini API 클라이언트 (`lib/ai/gemini-client.ts`)
11. ✅ 날짜 유틸리티 (`lib/utils/date.ts`)
12. ✅ Markdown 렌더링 유틸리티 (`lib/utils/markdown.ts`)
13. ✅ API 에러 핸들링 (`use-api-error-handler`)

### Phase 3: 공통 인프라 (API)
14. ✅ 구독 정보 API 구현 (`subscription/backend/*`)
15. ✅ 구독 정보 훅 구현 (`useSubscriptionInfo`)

### Phase 4: UI 컴포넌트
16. ✅ shadcn-ui 컴포넌트 설치
17. ✅ 공통 컴포넌트 (`loading-modal`, `plan-badge`, `empty-state`, `error-message`)
18. ✅ 공용 레이아웃 (`authenticated-layout.tsx`)

### Phase 5: Hono 라우터 통합
19. ✅ 라우터 등록 함수 준비 (`createHonoApp` 업데이트)

---

## 검증 체크리스트

### ✅ 검증 1: 페이지 간 의존성 제거
- [x] 공용 레이아웃이 모든 인증 페이지에서 사용 가능한가? → **YES** (`AuthenticatedLayout`)
- [x] 구독 정보 조회 훅이 모든 페이지에서 독립적으로 사용 가능한가? → **YES** (`useSubscriptionInfo`)
- [x] 공통 UI 컴포넌트가 재사용 가능한가? → **YES** (`loading-modal`, `plan-badge`, `empty-state`, `error-message`)
- [x] 외부 API 클라이언트가 독립적으로 사용 가능한가? → **YES** (`toss-client`, `gemini-client`)
- [x] 인증 유틸리티가 모든 API에서 사용 가능한가? → **YES** (`getCurrentClerkUser`)

### ✅ 검증 2: 병렬 개발 가능성
- [x] 각 페이지가 독립적으로 개발 가능한가? → **YES** (feature 디렉토리 분리)
- [x] API 엔드포인트가 명확히 정의되어 있는가? → **YES** (각 feature별 `backend/route.ts`)
- [x] 타입 정의가 모든 페이지에서 공유 가능한가? → **YES** (`Database`, `SubscriptionResponseSchema` 등)
- [x] 공통 헬퍼 함수가 준비되어 있는가? → **YES** (`getUserByClerkId`, `getSubscriptionByUserId`)
- [x] 에러 핸들링이 통일되어 있는가? → **YES** (`useApiErrorHandler`, `extractApiErrorMessage`)

### ✅ 검증 3: 코드 Conflict 방지
- [x] 공통 파일이 명확히 정의되어 있는가? → **YES** (16개 공통 모듈 명시)
- [x] 페이지별 feature 디렉토리가 분리되어 있는가? → **YES** (`subscription`, `saju-analysis`, `clerk-webhook`, `cron`)
- [x] Hono 라우터 등록이 중앙 집중화되어 있는가? → **YES** (`createHonoApp`에서 일괄 등록)
- [x] 환경 변수가 중앙에서 관리되는가? → **YES** (`.env.local`, `src/constants/env.ts`)
- [x] 상수가 중앙 집중화되어 있는가? → **YES** (`ROUTES`, `PLAN_CONFIG`, `SUBSCRIPTION_STATUS`)

### 🎯 최종 검증 결과
**모든 검증 항목 통과 ✅**

이 문서에 정의된 공통 모듈을 모두 구현하면:
1. ✅ 페이지 간 의존성이 완전히 제거됨
2. ✅ 모든 페이지를 병렬로 개발 가능
3. ✅ 코드 conflict 발생 가능성 최소화

---

## 제외 사항 (오버엔지니어링 방지)

다음 항목은 **MVP에 불필요하므로 구현하지 않습니다**:

- ❌ 복잡한 상태 관리 (Zustand는 필요 시에만)
- ❌ 고급 캐싱 전략
- ❌ 성능 최적화 (React.memo, useMemo 등)
- ❌ 국제화 (i18n) - 한국어만 지원
- ❌ 테마 전환 (다크모드) - 라이트모드만
- ❌ 복잡한 폼 검증 라이브러리 (기본 HTML5 검증으로 충분)
- ❌ 애니메이션 라이브러리 (framer-motion은 이미 설치되어 있으나 최소한으로 사용)

---

## 의존성 설치 명령어

```bash
# Clerk
npm install @clerk/nextjs

# Gemini API
npm install @google/generative-ai

# 토스페이먼츠
npm install @tosspayments/payment-widget-sdk

# date-fns 한글 로케일 (이미 설치됨)
# npm install date-fns

# react-markdown (선택)
npm install react-markdown
```

---

## 최종 확인

이 문서에 포함된 모든 공통 모듈은 **페이지 단위 개발 전에 완료**되어야 하며, 각 페이지 개발은 이 모듈들을 기반으로 **병렬로 진행** 가능합니다.

