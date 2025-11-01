# 테스트 환경 구축 계획

## 📊 Executive Summary (경영진 보고용 개요)

### 목표
MVP 프로젝트의 **품질 보증을 위한 최소한의 테스트 인프라** 구축. 환경 설정과 동시에 **즉시 가치를 제공하는 핵심 비즈니스 로직 테스트** 작성.

### 선택한 기술 스택
- **단위 테스트**: Vitest + React Testing Library
- **E2E 테스트**: Playwright (환경만 구축, 실제 테스트는 페이지 개발 시)
- **모킹 전략**: Vitest의 vi.mock() (MSW 제외)

### 핵심 결정 사항
1. Jest 대신 **Vitest** 선택 (Next.js 15 + Turbopack 최적 호환)
2. Cypress 대신 **Playwright** 선택 (빠른 실행 속도, 병렬 테스트 지원)
3. **MSW 제거** (MVP 단계에서 과도한 설정, vi.mock()으로 충분)
4. **통합 테스트는 제외** (MVP 단계에서 오버엔지니어링)
5. **TDD 워크플로우 가이드 추가** (실제 개발과 연계)

### 예상 소요 시간
- 환경 구축: 1-2시간 (MSW 제거로 단축)
- 핵심 테스트 작성: 1-2시간 (비즈니스 로직 중심)
- **총 2-4시간**

---

## ✅ 장점

### 1. 즉각적인 가치 제공
- 환경 구축과 동시에 **실제 비즈니스 로직 테스트** 작성
- 날짜 유틸리티 대신 **구독 횟수 차감, Pro/Free 플랜 구분** 등 핵심 로직 테스트
- MVP 개발에 즉시 활용 가능한 테스트 5개 제공

### 2. MVP 철학 완벽 부합
- MSW 제거로 **설정 시간 50% 단축** (3-4시간 → 1-2시간)
- vi.mock() 사용으로 **간결한 모킹 전략**
- 통합 테스트 제외로 **복잡도 최소화**

### 3. 개발 속도 최적화
- Vitest는 Vite 기반으로 **HMR 지원** → 테스트 재실행 속도 극대화
- Playwright는 **병렬 실행** 기본 지원 → E2E 테스트 시간 단축
- Next.js 15 + Turbopack과 **네이티브 호환**

### 4. TDD 워크플로우 통합
- Red-Green-Refactor 사이클 가이드 제공
- 실제 개발 시나리오 기반 예시
- 테스트 우선 작성 문화 정착 지원

### 5. Hono API 테스트 전략 명확화
- Hono Context 모킹 방법 제시
- Supabase 클라이언트 모킹 가이드
- API 라우트 단위 테스트 예시 포함

---

## ⚠️ 예상되는 한계점

### 1. MSW 제거로 인한 제약
- **문제**: 네트워크 레벨 모킹 불가
- **해결책**: Vitest의 vi.mock()으로 모듈 레벨 모킹 (단위 테스트에는 충분)
- **영향**: E2E 테스트는 Playwright의 page.route() 사용

### 2. E2E 테스트 예시 부족
- **문제**: 환경만 구축하고 실제 테스트는 나중에 작성
- **해결책**: 페이지 개발 시 함께 작성 (더 실용적)
- **영향**: 초기 투자 시간 단축, 실제 개발과 연계

### 3. 외부 서비스 의존성
- **Clerk, Supabase, 토스페이먼츠, Gemini API**는 실제 환경 필요
- **해결책**: 단위 테스트에서는 vi.mock()으로 모킹, E2E는 테스트 계정 사용

### 4. Clerk 인증 모킹 복잡도
- Clerk OAuth 플로우는 **실제 Google 로그인 필요**
- **해결책**: 테스트에서는 userId만 주입하는 헬퍼 함수, E2E는 수동 로그인 후 세션 재사용

### 5. 커버리지 목표 조정
- MVP 단계에서 **높은 커버리지는 비현실적**
- **목표**: 전체 40%, 비즈니스 로직 80%, 유틸리티 70%

---

## 📚 상세 내용

### 1. 기술 스택 선정 이유

#### 1.1 단위 테스트: Vitest

**선택 이유**:
1. **Next.js 15 + Turbopack 최적 호환**
   - Jest는 Turbopack과 호환성 이슈 존재
   - Vitest는 Vite 기반으로 ESM 네이티브 지원

2. **빠른 실행 속도**
   - HMR 지원으로 변경된 테스트만 재실행
   - Jest 대비 **5-10배 빠른 속도**

3. **Jest 호환 API**
   - Jest에서 마이그레이션 용이
   - `expect`, `describe`, `it` 등 동일한 API

4. **타입스크립트 네이티브 지원**
   - 별도 설정 없이 TS 파일 테스트 가능

**대안 검토**:
- **Jest**: 가장 널리 사용되지만 Next.js 15 호환성 이슈
- **Node Test Runner**: 너무 기본적, React 컴포넌트 테스트 어려움

#### 1.2 E2E 테스트: Playwright

**선택 이유**:
1. **빠른 실행 속도**
   - Chromium, Firefox, WebKit 병렬 실행
   - Cypress 대비 **2-3배 빠름**

2. **강력한 자동 대기 기능**
   - 요소가 준비될 때까지 자동 대기
   - 불안정한 테스트(flaky test) 최소화

3. **네트워크 모킹 내장**
   - `page.route()` API로 API 응답 모킹 가능
   - MSW와 함께 사용 가능

4. **CI/CD 최적화**
   - Docker 이미지 공식 제공
   - GitHub Actions 통합 간편

**대안 검토**:
- **Cypress**: 인기 있지만 느리고 병렬 실행 제한적
- **Puppeteer**: 낮은 수준의 API, 테스트 작성 복잡

#### 1.3 모킹 전략: Vitest vi.mock()

**선택 이유**:
1. **간결한 설정**
   - 별도 라이브러리 불필요
   - Vitest 내장 기능 활용
   - MVP 단계에 최적화

2. **모듈 레벨 모킹**
   - 함수, 클래스, 모듈 전체 모킹 가능
   - Supabase 클라이언트, Clerk 인증 등 모킹 용이

3. **타입 안전성**
   - TypeScript와 완벽 통합
   - 모킹된 함수도 타입 체크

**MSW를 제외한 이유**:
- MVP 단계에서 **과도한 설정** (handlers, server, browser 파일 필요)
- 단위 테스트에서는 **vi.mock()으로 충분**
- E2E 테스트는 **Playwright의 page.route()** 사용 가능

---

### 2. 테스트 전략

#### 2.1 테스트 피라미드

```
        /\
       /  \     E2E (10%)
      /____\    - 핵심 사용자 플로우만
     /      \   
    /        \  통합 테스트 (0%)
   /__________\ - MVP 단계에서 제외
  /            \
 /   단위 테스트  \ (90%)
/________________\ - 비즈니스 로직, 유틸리티
```

**MVP 전략**:
- **단위 테스트 90%**: 빠르고 저렴하게 버그 발견
- **E2E 테스트 10%**: 핵심 플로우만 (회원가입, 사주 분석)
- **통합 테스트 0%**: 오버엔지니어링 (추후 필요 시 추가)

#### 2.2 테스트 우선순위

**High Priority (반드시 테스트)**:
1. 비즈니스 로직
   - 구독 횟수 차감
   - Pro/Free 플랜 구분
   - 정기결제 로직

2. 유틸리티 함수
   - 날짜 포맷팅
   - API 에러 핸들링
   - Markdown 렌더링

3. 핵심 사용자 플로우 (E2E)
   - 회원가입 → 사주 분석 → 결과 확인
   - Pro 업그레이드 → 분석 → 구독 취소

**Medium Priority (선택적 테스트)**:
1. React 컴포넌트
   - 공통 컴포넌트 (`plan-badge`, `empty-state`)
   - 레이아웃 컴포넌트

2. API 라우트
   - 구독 정보 조회
   - 사주 분석 요청

**Low Priority (테스트 제외)**:
1. UI 스타일링
2. 정적 페이지 (랜딩 페이지)
3. 외부 서비스 통합 (Clerk, Supabase)

---

### 3. 구현 계획

#### Phase 1: 환경 설정 (1시간)

**1.1 의존성 설치**

```bash
# 단위 테스트 (필수)
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @testing-library/react @testing-library/jest-dom jsdom

# E2E 테스트 (선택적)
npm install -D @playwright/test
```

**MSW 제거**: vi.mock()으로 충분, 설정 복잡도 감소

**1.2 설정 파일 생성**

**파일**: `vitest.config.ts`
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
        'e2e/',
      ],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

**파일**: `vitest.setup.ts`
```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// 환경 변수 모킹 (필요 시)
vi.mock('@/constants/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  },
}));
```

**파일**: `playwright.config.ts`
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
  },
});
```

**1.3 package.json 스크립트 추가**

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch",
    "test:e2e": "playwright test",
    "test:e2e:ui": "playwright test --ui"
  }
}
```

---

#### Phase 2: 핵심 비즈니스 로직 테스트 작성 (1-2시간)

**목표**: 즉시 가치를 제공하는 핵심 테스트 5개 작성

**2.1 플랜 유틸리티 테스트** (20분)

**파일**: `src/features/subscription/lib/plan-utils.ts` (먼저 생성)
```typescript
export function canAnalyze(plan: 'free' | 'pro', remainingCount: number): boolean {
  return remainingCount > 0;
}

export function getModelForPlan(plan: 'free' | 'pro'): string {
  return plan === 'pro' ? 'gemini-2.5-pro' : 'gemini-2.5-flash';
}
```

**파일**: `src/features/subscription/lib/plan-utils.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { canAnalyze, getModelForPlan } from './plan-utils';

describe('플랜 유틸리티', () => {
  describe('canAnalyze', () => {
    it('Free 플랜에서 횟수가 남아있으면 true', () => {
      expect(canAnalyze('free', 1)).toBe(true);
    });

    it('Free 플랜에서 횟수가 0이면 false', () => {
      expect(canAnalyze('free', 0)).toBe(false);
    });

    it('Pro 플랜에서 횟수가 남아있으면 true', () => {
      expect(canAnalyze('pro', 5)).toBe(true);
    });
  });

  describe('getModelForPlan', () => {
    it('Free 플랜은 gemini-2.5-flash 모델을 사용한다', () => {
      expect(getModelForPlan('free')).toBe('gemini-2.5-flash');
    });

    it('Pro 플랜은 gemini-2.5-pro 모델을 사용한다', () => {
      expect(getModelForPlan('pro')).toBe('gemini-2.5-pro');
    });
  });
});
```

**실행**:
```bash
npm run test plan-utils
```

**2.2 API 에러 핸들링 테스트** (20분)

**파일**: `src/lib/remote/api-client.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { extractApiErrorMessage } from './api-client';
import { AxiosError } from 'axios';

describe('extractApiErrorMessage', () => {
  it('Axios 에러에서 error.message를 추출한다', () => {
    const error = new AxiosError('Request failed');
    error.response = {
      data: {
        error: {
          message: 'Insufficient credits',
        },
      },
    } as any;

    expect(extractApiErrorMessage(error)).toBe('Insufficient credits');
  });

  it('일반 Error 객체에서 message를 추출한다', () => {
    const error = new Error('Something went wrong');
    expect(extractApiErrorMessage(error)).toBe('Something went wrong');
  });

  it('알 수 없는 에러는 fallback 메시지를 반환한다', () => {
    const error = { unknown: 'error' };
    expect(extractApiErrorMessage(error)).toBe('API request failed.');
  });
});
```

**2.3 날짜 유틸리티 테스트** (10분)

**파일**: `src/lib/utils/date.test.ts`
```typescript
import { describe, it, expect } from 'vitest';
import { formatDate, formatDateTime } from './date';

describe('날짜 유틸리티', () => {
  it('날짜를 YYYY-MM-DD 형식으로 변환한다', () => {
    const date = new Date('2025-10-31T14:30:00');
    expect(formatDate(date)).toBe('2025-10-31');
  });

  it('날짜와 시간을 YYYY-MM-DD HH:mm 형식으로 변환한다', () => {
    const date = new Date('2025-10-31T14:30:00');
    expect(formatDateTime(date)).toBe('2025-10-31 14:30');
  });
});
```

**실행 방법**:
```bash
npm run test
```

**예상 결과**:
```
✓ src/features/subscription/lib/plan-utils.test.ts (5)
✓ src/lib/remote/api-client.test.ts (3)
✓ src/lib/utils/date.test.ts (2)

Test Files  3 passed (3)
Tests  10 passed (10)
Duration  156ms
```

---

#### Phase 3: TDD 워크플로우 정착 (지속적)

**목표**: 모든 신규 기능 개발 시 TDD 적용

**3.1 Red-Green-Refactor 사이클**

**실제 개발 시나리오: 구독 횟수 차감 기능**

**Step 1: RED (실패하는 테스트 작성)**

```typescript
// src/features/subscription/backend/service.test.ts
import { describe, it, expect, vi } from 'vitest';
import { decrementRemainingCount } from './service';

describe('구독 횟수 차감', () => {
  it('구독 횟수를 1 차감한다', async () => {
    const mockSupabase = createMockSupabase();
    const userId = 'user-123';
    
    const result = await decrementRemainingCount(mockSupabase, userId);
    
    expect(result.remaining_count).toBe(0);
  });
});
```

```bash
$ npm run test
# ❌ FAIL: decrementRemainingCount is not defined
```

**Step 2: GREEN (최소한의 코드로 통과)**

```typescript
// src/features/subscription/backend/service.ts
export async function decrementRemainingCount(
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase
    .from('subscriptions')
    .update({ remaining_count: 0 }) // 일단 하드코딩
    .eq('user_id', userId)
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
```

```bash
$ npm run test
# ✅ PASS: 1 test passed
```

**Step 3: REFACTOR (코드 개선)**

```typescript
// src/features/subscription/backend/service.ts
export async function decrementRemainingCount(
  supabase: SupabaseClient,
  userId: string
) {
  const { data, error } = await supabase.rpc('decrement_subscription_count', {
    p_user_id: userId,
  });

  if (error) throw new Error(error.message);
  return data;
}
```

```bash
$ npm run test
# ✅ PASS: 1 test passed (리팩토링 후에도 통과)
```

**3.2 TDD 체크리스트**

**매 기능 개발 시 확인**:
- [ ] 테스트를 먼저 작성했는가?
- [ ] 테스트가 실패하는 것을 확인했는가?
- [ ] 최소한의 코드로 통과시켰는가?
- [ ] 리팩토링 후에도 테스트가 통과하는가?
- [ ] 커밋 메시지에 테스트 추가 여부를 명시했는가?

**3.3 E2E 테스트는 페이지 개발 시 작성**

**이유**:
1. 페이지가 없는 상태에서 E2E 테스트 작성은 무의미
2. 페이지 개발과 동시에 E2E 테스트 작성이 더 효율적
3. 실제 UI 구현을 보면서 테스트 시나리오 조정 가능

**작성 시점**:
- 랜딩 페이지 개발 완료 → `e2e/landing.spec.ts` 작성
- 사주 분석 페이지 개발 완료 → `e2e/saju-analysis.spec.ts` 작성
- 구독 관리 페이지 개발 완료 → `e2e/subscription.spec.ts` 작성

**E2E 테스트 예시 템플릿**:

```typescript
// e2e/landing.spec.ts (페이지 개발 완료 후 작성)
import { test, expect } from '@playwright/test';

test.describe('랜딩 페이지', () => {
  test('메인 페이지가 정상적으로 로드된다', async ({ page }) => {
    // Given: 사용자가 메인 페이지에 접속
    await page.goto('/');

    // Then: 서비스명이 표시된다
    await expect(page.getByText('Saju맛피아')).toBeVisible();

    // And: CTA 버튼이 표시된다
    await expect(page.getByRole('button', { name: '무료로 시작하기' })).toBeVisible();
  });
});
```

---

### 4. 테스트 작성 가이드라인

#### 4.1 단위 테스트 작성 원칙

**AAA 패턴 준수**:
```typescript
it('테스트 설명', () => {
  // Arrange: 테스트 데이터 준비
  const input = 'test';
  
  // Act: 함수 실행
  const result = myFunction(input);
  
  // Assert: 결과 검증
  expect(result).toBe('expected');
});
```

**테스트 이름 규칙**:
- 한글로 명확하게 작성
- "~한다", "~을 반환한다" 형식
- 예: `'유효한 입력을 받으면 성공 응답을 반환한다'`

**테스트 격리**:
```typescript
describe('구독 정보 조회', () => {
  beforeEach(() => {
    // 각 테스트 전에 초기화
    vi.clearAllMocks();
  });

  it('Free 플랜 사용자의 정보를 조회한다', () => {
    // 독립적인 테스트
  });

  it('Pro 플랜 사용자의 정보를 조회한다', () => {
    // 다른 테스트에 영향 없음
  });
});
```

#### 4.2 E2E 테스트 작성 원칙

**Given-When-Then 패턴**:
```typescript
test('사용자 시나리오', async ({ page }) => {
  // Given: 초기 상태
  await page.goto('/dashboard');
  
  // When: 사용자 액션
  await page.getByRole('button', { name: '새 검사' }).click();
  
  // Then: 예상 결과
  await expect(page).toHaveURL('/new-analysis');
});
```

**안정적인 셀렉터 사용**:
```typescript
// ✅ Good: 역할 기반 셀렉터
await page.getByRole('button', { name: '시작하기' });
await page.getByLabel('이름');

// ❌ Bad: CSS 클래스 셀렉터
await page.locator('.btn-primary');
await page.locator('#name-input');
```

**자동 대기 활용**:
```typescript
// Playwright는 자동으로 대기
await page.getByText('분석 완료').click(); // 요소가 나타날 때까지 자동 대기

// 명시적 대기가 필요한 경우만
await page.waitForURL('/dashboard');
await page.waitForLoadState('networkidle');
```

---

### 5. CI/CD 통합 (선택 사항)

**파일**: `.github/workflows/test.yml`

```yaml
name: Tests

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npm run test

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

### 6. 디렉토리 구조

```
project-root/
├── src/
│   ├── lib/
│   │   ├── utils/
│   │   │   ├── date.ts
│   │   │   └── date.test.ts
│   │   └── remote/
│   │       ├── api-client.ts
│   │       └── api-client.test.ts
│   ├── features/
│   │   └── subscription/
│   │       ├── backend/
│   │       │   ├── service.ts
│   │       │   ├── service.test.ts      # 비즈니스 로직 테스트
│   │       │   ├── route.ts
│   │       │   └── route.test.ts        # API 라우트 테스트
│   │       └── lib/
│   │           ├── plan-utils.ts
│   │           └── plan-utils.test.ts   # 유틸리티 테스트
│   └── components/
│       └── common/
│           ├── plan-badge.tsx
│           └── plan-badge.test.tsx      # 컴포넌트 테스트 (선택적)
├── e2e/
│   └── (페이지 개발 시 추가)
├── vitest.config.ts
├── vitest.setup.ts
└── playwright.config.ts
```

**MSW 관련 파일 제거**:
- ❌ `src/mocks/handlers.ts`
- ❌ `src/mocks/server.ts`
- ❌ `src/mocks/browser.ts`

---

### 7. 테스트 커버리지 목표

**MVP 단계 목표** (현실적으로 조정):
- **전체 커버리지**: 40% 이상 (기존 50% → 40%)
- **비즈니스 로직**: 80% 이상 (유지)
- **유틸리티 함수**: 70% 이상 (기존 90% → 70%)
- **컴포넌트**: 20% 이상 (기존 30% → 20%, 선택적)

**이유**: MVP 단계에서 너무 높은 목표는 개발 속도 저하

**커버리지 확인**:
```bash
npm run test:coverage
```

**결과 예시**:
```
 % Coverage report from v8
--------------------------|---------|----------|---------|---------|
File                      | % Stmts | % Branch | % Funcs | % Lines |
--------------------------|---------|----------|---------|---------|
All files                 |   52.3  |   45.1   |   58.7  |   52.3  |
 src/lib/utils            |   92.5  |   87.3   |   95.2  |   92.5  |
  date.ts                 |   95.0  |   90.0   |  100.0  |   95.0  |
  markdown.ts             |   90.0  |   85.0   |   90.0  |   90.0  |
 src/features/subscription|   78.3  |   72.1   |   80.5  |   78.3  |
  service.ts              |   85.0  |   80.0   |   90.0  |   85.0  |
--------------------------|---------|----------|---------|---------|
```

---

### 8. 제외 사항 (오버엔지니어링 방지)

**MVP 단계에서 구현하지 않음**:
1. ❌ **통합 테스트** (API + DB 통합)
   - 이유: 설정 복잡도 높음, 실행 시간 김
   - 대안: 단위 테스트 + E2E 테스트로 충분

2. ❌ **비주얼 리그레션 테스트** (스크린샷 비교)
   - 이유: 유지보수 비용 높음
   - 대안: E2E 테스트로 기능 검증

3. ❌ **성능 테스트** (Lighthouse, k6)
   - 이유: MVP 단계에서 불필요
   - 대안: 필요 시 수동 측정

4. ❌ **보안 테스트** (OWASP ZAP)
   - 이유: 외부 서비스(Clerk, Supabase) 의존
   - 대안: 외부 서비스의 보안 기능 활용

5. ❌ **접근성 테스트** (axe-core)
   - 이유: 초기 MVP에서 우선순위 낮음
   - 대안: 추후 필요 시 추가

---

### 9. 트러블슈팅 가이드

#### 9.1 Vitest 관련

**문제**: `Cannot find module '@/...'`
```bash
# 해결: tsconfig.json의 paths와 vitest.config.ts의 alias 일치 확인
```

**문제**: `ReferenceError: global is not defined`
```typescript
// vitest.config.ts에 추가
export default defineConfig({
  test: {
    globals: true, // 이 옵션 추가
  },
});
```

#### 9.2 Playwright 관련

**문제**: `browserType.launch: Executable doesn't exist`
```bash
# 해결: 브라우저 재설치
npx playwright install
```

**문제**: `Test timeout of 30000ms exceeded`
```typescript
// 타임아웃 증가
test('느린 테스트', async ({ page }) => {
  test.setTimeout(60000); // 60초로 증가
  // ...
});
```

#### 9.3 MSW 관련

**문제**: `[MSW] Warning: captured a request without a matching request handler`
```typescript
// 해결: 핸들러 추가 또는 unhandled request 무시
server.listen({ onUnhandledRequest: 'bypass' });
```

---

## 🔍 AI 피드백 프롬프트

아래 프롬프트를 복사하여 AI에게 피드백을 요청하세요.

---

### 프롬프트 1: 테스트 전략 평가

```
당신은 10년 경력의 시니어 QA 엔지니어입니다. 
스타트업의 MVP 프로젝트를 위한 테스트 전략을 평가해야 합니다.

## 당신의 역할
- 테스트 전략의 적절성 평가
- 누락된 테스트 케이스 식별
- 테스트 커버리지 목표의 현실성 검토
- 비용 대비 효과 분석

## 평가 기준
1. **완전성**: 핵심 기능이 모두 커버되는가?
2. **효율성**: 최소 비용으로 최대 효과를 내는가?
3. **유지보수성**: 테스트 코드가 지속 가능한가?
4. **실행 속도**: CI/CD에서 빠르게 실행되는가?
5. **MVP 적합성**: 오버엔지니어링은 없는가?

## 검토할 문서
[위의 테스트 계획 전체 내용 붙여넣기]

## 요청 사항
1. 각 평가 기준별로 점수 (1-10점) 및 근거 제시
2. 치명적인 누락 사항 3가지 (있다면)
3. 개선 제안 3가지 (우선순위 순)
4. 전체 평가 요약 (200자 이내)
```

---

### 프롬프트 2: 기술 스택 검증

```
당신은 Next.js 15 + React 19 생태계 전문가입니다.
최신 기술 스택에 대한 깊은 이해를 바탕으로 테스트 도구 선택을 검증해야 합니다.

## 당신의 역할
- Vitest vs Jest 선택의 타당성 검증
- Playwright vs Cypress 선택의 타당성 검증
- MSW 사용의 적절성 평가
- Next.js 15 + Turbopack 호환성 확인

## 평가 기준
1. **호환성**: Next.js 15, React 19와 완벽히 호환되는가?
2. **성능**: 개발 경험과 실행 속도가 우수한가?
3. **생태계**: 커뮤니티 지원과 문서가 충분한가?
4. **미래 지향성**: 장기적으로 유지 가능한 선택인가?

## 검토할 내용
[위의 "1. 기술 스택 선정 이유" 섹션 붙여넣기]

## 요청 사항
1. 각 도구 선택에 대한 동의/반대 의견
2. 더 나은 대안이 있다면 구체적 제안
3. 호환성 이슈 가능성 경고
4. 2025년 기준 최신 정보 반영 여부 확인
```

---

### 프롬프트 3: 실무 적용 가능성 평가

```
당신은 YC 스타트업의 CTO입니다.
MVP를 빠르게 출시해야 하는 상황에서 이 테스트 계획의 실행 가능성을 평가해야 합니다.

## 당신의 가치관
- 신속한 개발 iteration
- 오버엔지니어링 절대 금지
- 간결하면서도 확장 가능한 구조
- 가장 쉬운 인프라

## 평가 관점
1. **시간 투자 대비 가치**: 3-4시간 투자가 합리적인가?
2. **복잡도**: 설정이 너무 복잡하지 않은가?
3. **실용성**: 실제로 팀이 사용할 것인가?
4. **확장성**: 추후 확장이 용이한가?
5. **MVP 철학 부합**: 당장 필요한 것만 구현했는가?

## 검토할 문서
[위의 테스트 계획 전체 내용 붙여넣기]

## 요청 사항
1. CTO 관점에서 승인/반려 결정 (근거 포함)
2. 만약 반려한다면, 수정 요구사항 3가지
3. 만약 승인한다면, 주의사항 3가지
4. 대안 제시 (더 간단한 방법이 있다면)
```

---

### 프롬프트 4: 보안 및 비용 분석

```
당신은 클라우드 보안 및 비용 최적화 전문가입니다.
테스트 환경 구축 시 발생할 수 있는 보안 이슈와 비용을 분석해야 합니다.

## 당신의 전문 분야
- 외부 서비스 통합 보안 (Clerk, Supabase, 토스페이먼츠, Gemini API)
- API 키 관리 및 테스트 환경 격리
- CI/CD 비용 최적화
- 테스트 데이터 관리

## 평가 기준
1. **보안 위험**: 테스트 중 실제 API 호출 시 위험성
2. **비용 예측**: 테스트 실행 시 발생 비용 (Gemini API, Supabase 등)
3. **데이터 격리**: 테스트 데이터와 프로덕션 데이터 분리
4. **API 키 관리**: 테스트 환경에서 안전한 키 관리

## 검토할 내용
[위의 "예상되는 한계점" 및 "외부 서비스 의존성" 섹션 붙여넣기]

## 요청 사항
1. 치명적 보안 위험 식별 (있다면)
2. 월간 예상 비용 산출 (테스트 실행 횟수 기준)
3. 비용 절감 방안 3가지
4. 안전한 API 키 관리 방법 제안
```

---

## 📝 체크리스트

### 환경 구축 완료 기준
- [ ] Vitest 설치 및 설정 완료
- [ ] Playwright 설치 및 설정 완료
- [ ] MSW 핸들러 설정 완료
- [ ] package.json 스크립트 추가
- [ ] 단위 테스트 예시 1개 작성 및 통과
- [ ] E2E 테스트 예시 1개 작성 및 통과
- [ ] 테스트 실행 명령어 동작 확인
- [ ] 팀원에게 테스트 작성 가이드 공유

### 다음 단계 (MVP 이후)
- [ ] 핵심 비즈니스 로직 단위 테스트 추가
- [ ] 사주 분석 E2E 테스트 작성
- [ ] CI/CD 파이프라인 통합
- [ ] 테스트 커버리지 70% 달성
- [ ] 테스트 문서화 (Wiki)

---

## 📚 참고 자료

### 공식 문서
- [Vitest 공식 문서](https://vitest.dev/)
- [Playwright 공식 문서](https://playwright.dev/)
- [MSW 공식 문서](https://mswjs.io/)
- [React Testing Library](https://testing-library.com/react)

### 학습 자료
- [Vitest + Next.js 15 통합 가이드](https://nextjs.org/docs/app/building-your-application/testing/vitest)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [MSW로 API 모킹하기](https://mswjs.io/docs/getting-started)

---

## 🎯 결론

이 테스트 계획은 **MVP 단계에 최적화**되어 있습니다:

1. ✅ **최소 투자**: 2-4시간으로 환경 구축 + 핵심 테스트 완료 (기존 3-4시간 대비 단축)
2. ✅ **즉시 가치**: 환경 구축과 동시에 비즈니스 로직 테스트 작성
3. ✅ **간결성**: MSW 제거로 설정 복잡도 50% 감소
4. ✅ **TDD 통합**: Red-Green-Refactor 사이클 가이드 제공
5. ✅ **확장 가능**: 추후 테스트 추가 용이
6. ✅ **팀 친화적**: 간단한 설정, 명확한 가이드, 실제 개발 시나리오

**다음 단계**: 
1. Phase 1 (1시간): 환경 구축
2. Phase 2 (1-2시간): 핵심 테스트 5개 작성
3. Phase 3 (지속적): TDD 워크플로우 정착
4. 페이지 개발 시: E2E 테스트 추가

**핵심 원칙**: 테스트 우선 작성 → 최소 코드 구현 → 리팩토링

