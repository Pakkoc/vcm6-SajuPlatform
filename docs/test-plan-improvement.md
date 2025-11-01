# 테스트 계획 개선안

## 📊 Executive Summary (상급자 보고용)

### 현재 계획의 문제점
기존 test-plan.md는 **이론적으로는 완벽하지만 MVP 철학에 부합하지 않음**. 3-4시간 투자로 환경만 구축하고 실제 테스트는 예시 2개만 작성하는 것은 **투자 대비 효과가 낮음**.

### 핵심 개선 방향
1. **테스트 환경 구축을 더 간소화** (1-2시간으로 단축)
2. **즉시 가치를 제공하는 테스트 우선 작성** (비즈니스 로직)
3. **TDD 프로세스 가이드 추가** (실제 개발 워크플로우 반영)
4. **Hono API 테스트 전략 명확화** (현재 누락됨)

### 예상 소요 시간
- 기존: 환경 구축 3-4시간 + 예시 2개
- 개선: 환경 구축 1-2시간 + 핵심 테스트 5개 작성

---

## ✅ 개선안의 장점

### 1. 즉각적인 가치 제공
- 환경 구축과 동시에 **실제 비즈니스 로직 테스트** 작성
- 날짜 유틸리티 대신 **구독 횟수 차감 로직** 테스트 (더 중요)

### 2. MVP 철학 완벽 부합
- 복잡한 MSW 설정 제거 → **Vitest의 vi.mock() 활용**
- E2E는 환경 구축만, 실제 작성은 페이지 개발 시
- 통합 테스트 제외 유지

### 3. TDD 워크플로우 통합
- Red-Green-Refactor 사이클 가이드 추가
- 실제 개발 시나리오 기반 예시
- 테스트 우선 작성 문화 정착

### 4. Hono API 테스트 전략 명확화
- Hono Context 모킹 방법
- Supabase 클라이언트 모킹
- API 라우트 단위 테스트 예시

---

## ⚠️ 예상되는 한계점

### 1. MSW 제거로 인한 제약
- **문제**: 네트워크 레벨 모킹 불가
- **해결**: Vitest의 vi.mock()으로 모듈 레벨 모킹 (더 간단)
- **영향**: 단위 테스트에는 충분, E2E는 별도 전략

### 2. E2E 테스트 예시 부족
- **문제**: 환경만 구축하고 예시 없음
- **해결**: 페이지 개발 시 함께 작성 (더 실용적)
- **영향**: 초기 투자 시간 단축, 실제 개발과 연계

### 3. 커버리지 도구 미설정
- **문제**: 커버리지 측정 도구 설정 누락
- **해결**: `@vitest/coverage-v8` 추가 및 설정
- **영향**: 초기 설정 시간 약간 증가 (10분)

### 4. Clerk 인증 모킹 복잡도
- **문제**: Clerk SDK 모킹이 여전히 복잡
- **해결**: 테스트에서는 userId만 주입하는 헬퍼 함수
- **영향**: 실제 OAuth 플로우는 E2E로만 테스트

---

## 📚 상세 개선 내용

### 1. 환경 구축 간소화 (1-2시간)

#### 제거할 항목
1. ❌ **MSW 전체 설정** (handlers.ts, server.ts, browser.ts)
   - 이유: MVP 단계에서 과도한 설정
   - 대안: Vitest의 vi.mock() 사용

2. ❌ **복잡한 Playwright 설정**
   - 이유: 환경만 구축하고 실제 테스트는 나중에
   - 대안: 기본 설정만 유지

3. ❌ **날짜 유틸리티 테스트 예시**
   - 이유: 비즈니스 가치 낮음
   - 대안: 구독 횟수 차감 로직 테스트

#### 간소화된 의존성 설치

```bash
# 단위 테스트 (필수)
npm install -D vitest @vitest/ui @vitest/coverage-v8
npm install -D @testing-library/react @testing-library/jest-dom jsdom

# E2E 테스트 (선택적)
npm install -D @playwright/test
```

**MSW 제거**: 단위 테스트에서는 vi.mock()으로 충분

#### 간소화된 vitest.config.ts

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
        'src/mocks/',
        '**/*.test.{ts,tsx}',
        '**/*.spec.{ts,tsx}',
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

#### 간소화된 vitest.setup.ts

```typescript
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// 환경 변수 모킹
vi.mock('@/constants/env', () => ({
  env: {
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-key',
    SUPABASE_SERVICE_ROLE_KEY: 'test-service-key',
  },
}));
```

---

### 2. 핵심 비즈니스 로직 테스트 우선 작성

#### 2.1 구독 횟수 차감 로직 테스트

**파일**: `src/features/subscription/backend/service.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { decrementRemainingCount } from './service';
import type { SupabaseClient } from '@supabase/supabase-js';

describe('구독 횟수 차감', () => {
  let mockSupabase: SupabaseClient;

  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(() => ({
        update: vi.fn(() => ({
          eq: vi.fn(() => ({
            select: vi.fn(() => ({
              single: vi.fn(),
            })),
          })),
        })),
      })),
    } as any;
  });

  it('Free 플랜 사용자의 횟수를 1 차감한다', async () => {
    // Arrange
    const userId = 'user-123';
    const mockSelect = vi.fn().mockResolvedValue({
      data: { remaining_count: 0 },
      error: null,
    });

    mockSupabase.from = vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: mockSelect,
          })),
        })),
      })),
    })) as any;

    // Act
    const result = await decrementRemainingCount(mockSupabase, userId);

    // Assert
    expect(result.remaining_count).toBe(0);
    expect(mockSupabase.from).toHaveBeenCalledWith('subscriptions');
  });

  it('횟수가 0이면 에러를 반환한다', async () => {
    // Arrange
    const userId = 'user-123';
    const mockSelect = vi.fn().mockResolvedValue({
      data: null,
      error: { message: 'No remaining count' },
    });

    mockSupabase.from = vi.fn(() => ({
      update: vi.fn(() => ({
        eq: vi.fn(() => ({
          select: vi.fn(() => ({
            single: mockSelect,
          })),
        })),
      })),
    })) as any;

    // Act & Assert
    await expect(
      decrementRemainingCount(mockSupabase, userId)
    ).rejects.toThrow('No remaining count');
  });
});
```

#### 2.2 Pro/Free 플랜 구분 로직 테스트

**파일**: `src/features/subscription/lib/plan-utils.test.ts`

```typescript
import { describe, it, expect } from 'vitest';
import { canAnalyze, getModelForPlan } from './plan-utils';

describe('플랜 유틸리티', () => {
  describe('canAnalyze', () => {
    it('Free 플랜에서 횟수가 남아있으면 true', () => {
      const result = canAnalyze('free', 1);
      expect(result).toBe(true);
    });

    it('Free 플랜에서 횟수가 0이면 false', () => {
      const result = canAnalyze('free', 0);
      expect(result).toBe(false);
    });

    it('Pro 플랜에서 횟수가 남아있으면 true', () => {
      const result = canAnalyze('pro', 5);
      expect(result).toBe(true);
    });

    it('Pro 플랜에서 횟수가 0이면 false', () => {
      const result = canAnalyze('pro', 0);
      expect(result).toBe(false);
    });
  });

  describe('getModelForPlan', () => {
    it('Free 플랜은 gemini-2.5-flash 모델을 사용한다', () => {
      const result = getModelForPlan('free');
      expect(result).toBe('gemini-2.5-flash');
    });

    it('Pro 플랜은 gemini-2.5-pro 모델을 사용한다', () => {
      const result = getModelForPlan('pro');
      expect(result).toBe('gemini-2.5-pro');
    });
  });
});
```

#### 2.3 Hono API 라우트 테스트

**파일**: `src/features/subscription/backend/route.test.ts`

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createHonoApp } from '@/backend/hono/app';
import type { SupabaseClient } from '@supabase/supabase-js';

// Supabase 모킹
vi.mock('@/backend/supabase/client', () => ({
  createSupabaseServerClient: vi.fn(() => mockSupabase),
}));

// Clerk 모킹
vi.mock('@clerk/nextjs/server', () => ({
  auth: vi.fn(() => ({ userId: 'user-123' })),
}));

let mockSupabase: SupabaseClient;

describe('GET /api/subscription', () => {
  beforeEach(() => {
    mockSupabase = {
      from: vi.fn(() => ({
        select: vi.fn(() => ({
          eq: vi.fn(() => ({
            single: vi.fn(),
          })),
        })),
      })),
    } as any;
  });

  it('인증된 사용자의 구독 정보를 반환한다', async () => {
    // Arrange
    const mockSingle = vi.fn().mockResolvedValue({
      data: {
        plan: 'free',
        status: 'active',
        remaining_count: 1,
        next_billing_date: null,
      },
      error: null,
    });

    mockSupabase.from = vi.fn(() => ({
      select: vi.fn(() => ({
        eq: vi.fn(() => ({
          single: mockSingle,
        })),
      })),
    })) as any;

    const app = createHonoApp();

    // Act
    const res = await app.request('/api/subscription', {
      method: 'GET',
    });

    // Assert
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.plan).toBe('free');
    expect(data.remaining_count).toBe(1);
  });

  it('인증되지 않은 요청은 401을 반환한다', async () => {
    // Arrange
    vi.mocked(auth).mockReturnValue({ userId: null } as any);
    const app = createHonoApp();

    // Act
    const res = await app.request('/api/subscription', {
      method: 'GET',
    });

    // Assert
    expect(res.status).toBe(401);
  });
});
```

#### 2.4 API 에러 핸들링 테스트

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

    const result = extractApiErrorMessage(error);

    expect(result).toBe('Insufficient credits');
  });

  it('일반 Error 객체에서 message를 추출한다', () => {
    const error = new Error('Something went wrong');

    const result = extractApiErrorMessage(error);

    expect(result).toBe('Something went wrong');
  });

  it('알 수 없는 에러는 fallback 메시지를 반환한다', () => {
    const error = { unknown: 'error' };

    const result = extractApiErrorMessage(error);

    expect(result).toBe('API request failed.');
  });
});
```

#### 2.5 날짜 유틸리티 테스트 (간소화)

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

---

### 3. TDD 워크플로우 가이드 추가

#### 3.1 Red-Green-Refactor 사이클

**실제 개발 시나리오: 구독 횟수 차감 기능**

**Step 1: RED (실패하는 테스트 작성)**

```typescript
// src/features/subscription/backend/service.test.ts
it('구독 횟수를 1 차감한다', async () => {
  const userId = 'user-123';
  const result = await decrementRemainingCount(mockSupabase, userId);
  expect(result.remaining_count).toBe(0);
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
  const { data, error } = await supabase
    .from('subscriptions')
    .update({ 
      remaining_count: supabase.raw('remaining_count - 1') // 실제 로직
    })
    .eq('user_id', userId)
    .gte('remaining_count', 1) // 0 이하로 내려가지 않도록
    .select()
    .single();

  if (error) throw new Error(error.message);
  return data;
}
```

```bash
$ npm run test
# ✅ PASS: 1 test passed (리팩토링 후에도 통과)
```

#### 3.2 TDD 체크리스트

**매 기능 개발 시 확인**:
- [ ] 테스트를 먼저 작성했는가?
- [ ] 테스트가 실패하는 것을 확인했는가?
- [ ] 최소한의 코드로 통과시켰는가?
- [ ] 리팩토링 후에도 테스트가 통과하는가?
- [ ] 커밋 메시지에 테스트 추가 여부를 명시했는가?

---

### 4. E2E 테스트 전략 명확화

#### 4.1 환경 구축만 수행

**playwright.config.ts** (기본 설정만)

```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
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

#### 4.2 E2E 테스트는 페이지 개발 시 작성

**이유**:
1. 페이지가 없는 상태에서 E2E 테스트 작성은 무의미
2. 페이지 개발과 동시에 E2E 테스트 작성이 더 효율적
3. 실제 UI 구현을 보면서 테스트 시나리오 조정 가능

**작성 시점**:
- 랜딩 페이지 개발 완료 → `e2e/landing.spec.ts` 작성
- 사주 분석 페이지 개발 완료 → `e2e/saju-analysis.spec.ts` 작성
- 구독 관리 페이지 개발 완료 → `e2e/subscription.spec.ts` 작성

---

### 5. 테스트 커버리지 설정 추가

#### 5.1 커버리지 도구 설정

```bash
npm install -D @vitest/coverage-v8
```

#### 5.2 package.json 스크립트

```json
{
  "scripts": {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:watch": "vitest --watch"
  }
}
```

#### 5.3 커버리지 목표 (현실적으로 조정)

**MVP 단계**:
- 전체: 40% 이상 (기존 50% → 40%)
- 비즈니스 로직: 80% 이상 (유지)
- 유틸리티: 70% 이상 (기존 90% → 70%)
- 컴포넌트: 20% 이상 (기존 30% → 20%)

**이유**: MVP 단계에서 너무 높은 목표는 개발 속도 저하

---

### 6. 디렉토리 구조 간소화

```
project-root/
├── src/
│   ├── lib/
│   │   └── utils/
│   │       ├── date.ts
│   │       └── date.test.ts
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

### 7. 작업 순서 재정의

#### Phase 1: 환경 설정 (1시간)
1. Vitest 설치 및 설정 (30분)
2. Playwright 기본 설정 (10분)
3. 커버리지 도구 설정 (10분)
4. package.json 스크립트 추가 (10분)

#### Phase 2: 핵심 테스트 작성 (1-2시간)
1. 구독 횟수 차감 로직 테스트 (30분)
2. Pro/Free 플랜 구분 로직 테스트 (20분)
3. Hono API 라우트 테스트 (30분)
4. API 에러 핸들링 테스트 (20분)
5. 날짜 유틸리티 테스트 (10분)

#### Phase 3: TDD 워크플로우 정착 (지속적)
- 모든 신규 기능 개발 시 TDD 적용
- 코드 리뷰 시 테스트 포함 여부 확인

---

## 🔍 AI 피드백 프롬프트 (개선안 평가용)

### 프롬프트 1: MVP 철학 부합성 평가

```
당신은 YC 스타트업의 CTO입니다.
"신속한 개발 iteration", "오버엔지니어링 절대 금지", "간결하면서도 확장 가능한 구조"를 추구합니다.

## 당신의 임무
기존 테스트 계획과 개선안을 비교하여, 어느 것이 MVP 철학에 더 부합하는지 평가하세요.

## 평가 기준
1. **즉시 가치 제공**: 환경 구축 후 바로 사용 가능한가?
2. **복잡도**: 설정이 간단한가?
3. **시간 투자 대비 효과**: 투자한 시간만큼 가치를 제공하는가?
4. **확장성**: 추후 확장이 용이한가?
5. **실용성**: 실제 개발 워크플로우에 통합 가능한가?

## 비교 대상
**기존 계획**:
- 환경 구축 3-4시간
- MSW 전체 설정
- 예시 테스트 2개 (날짜 유틸리티, 랜딩 페이지)

**개선안**:
- 환경 구축 1-2시간
- MSW 제거, vi.mock() 사용
- 핵심 테스트 5개 (비즈니스 로직 중심)
- TDD 워크플로우 가이드 추가

## 요청 사항
1. 각 평가 기준별로 기존 vs 개선안 비교 (1-10점)
2. 어느 것을 선택해야 하는가? (근거 포함)
3. 개선안의 추가 개선 사항 3가지
4. 최종 결론 (200자 이내)
```

---

### 프롬프트 2: 기술적 타당성 검증

```
당신은 10년 경력의 시니어 테스트 엔지니어입니다.
Vitest, Playwright, MSW에 대한 깊은 이해를 바탕으로 개선안의 기술적 타당성을 검증하세요.

## 당신의 임무
개선안에서 제안한 기술적 변경사항이 실제로 작동하는지, 문제는 없는지 평가하세요.

## 검증 항목
1. **MSW 제거**: vi.mock()으로 대체 가능한가?
   - 장점과 단점은?
   - 어떤 경우에 문제가 될 수 있는가?

2. **Hono API 테스트**: 제안된 방법이 실제로 작동하는가?
   - Hono Context 모킹이 올바른가?
   - 더 나은 방법이 있는가?

3. **커버리지 목표**: 40%가 현실적인가?
   - 너무 낮은가, 적절한가?
   - MVP 단계에서 권장하는 목표는?

4. **TDD 워크플로우**: 제안된 Red-Green-Refactor 사이클이 실용적인가?
   - 실제 개발에 적용 가능한가?
   - 개선할 점은?

## 요청 사항
1. 각 검증 항목별로 평가 (작동함/문제있음/개선필요)
2. 치명적인 기술적 오류 식별 (있다면)
3. 대안 제시 (더 나은 방법이 있다면)
4. 전체 기술적 타당성 점수 (1-10점)
```

---

### 프롬프트 3: 실무 적용 가능성 평가

```
당신은 실제로 이 테스트 계획을 실행해야 하는 시니어 개발자입니다.
개선안이 실제 개발 환경에서 작동할지, 팀원들이 따라할 수 있을지 평가하세요.

## 당신의 임무
개선안을 실제로 적용했을 때 발생할 수 있는 문제를 예측하고, 해결 방안을 제시하세요.

## 평가 관점
1. **학습 곡선**: 팀원들이 쉽게 따라할 수 있는가?
2. **문서 명확성**: 가이드가 충분히 상세한가?
3. **예시 코드 품질**: 예시 코드가 실제로 작동하는가?
4. **유지보수성**: 장기적으로 유지 가능한가?
5. **확장성**: 프로젝트 성장에 따라 확장 가능한가?

## 시나리오
- 팀원 A: 테스트 경험 없음
- 팀원 B: Jest 경험 있음
- 팀원 C: TDD 경험 있음

## 요청 사항
1. 각 팀원이 개선안을 따라할 때 예상되는 어려움
2. 추가로 필요한 문서나 가이드
3. 실무에서 발생할 수 있는 문제 3가지
4. 전체 실무 적용 가능성 점수 (1-10점)
```

---

### 프롬프트 4: 비용 대비 효과 분석

```
당신은 스타트업의 CFO입니다.
개발 시간을 비용으로 환산하여, 개선안이 투자 대비 가치를 제공하는지 분석하세요.

## 당신의 임무
기존 계획과 개선안의 비용 대비 효과를 정량적으로 비교하세요.

## 비용 산출 기준
- 시니어 개발자 시급: $100/hour
- 환경 구축 시간: 기존 3-4시간 vs 개선 1-2시간
- 테스트 작성 시간: 기존 1시간 vs 개선 1-2시간
- 유지보수 시간: 월 평균 2시간 (예상)

## 효과 산출 기준
- 버그 발견 시간 단축: 30% (추정)
- 리팩토링 안정성: 50% 향상 (추정)
- 코드 리뷰 시간 단축: 20% (추정)

## 요청 사항
1. 기존 계획의 총 비용 및 예상 효과
2. 개선안의 총 비용 및 예상 효과
3. ROI (Return on Investment) 비교
4. 어느 것이 더 경제적인가? (근거 포함)
5. 6개월 후 예상 누적 효과
```

---

## 📝 최종 권장사항

### 즉시 적용할 사항
1. ✅ MSW 제거, vi.mock() 사용
2. ✅ 환경 구축 시간 1-2시간으로 단축
3. ✅ 핵심 비즈니스 로직 테스트 우선 작성
4. ✅ TDD 워크플로우 가이드 추가
5. ✅ 커버리지 목표 현실적으로 조정 (40%)

### 선택적 적용 사항
1. 🔶 E2E 테스트는 페이지 개발 시 작성
2. 🔶 통합 테스트는 MVP 이후 검토
3. 🔶 CI/CD 통합은 필요 시 추가

### 절대 하지 말아야 할 것
1. ❌ 복잡한 MSW 설정
2. ❌ 가치 낮은 테스트 우선 작성 (날짜 유틸리티)
3. ❌ 페이지 없이 E2E 테스트 작성
4. ❌ 100% 커버리지 목표

---

## 🎯 결론

이 개선안은 **MVP 철학에 완벽히 부합**하며, **즉시 가치를 제공**합니다:

1. ✅ **시간 단축**: 3-4시간 → 1-2시간 (50% 감소)
2. ✅ **즉시 가치**: 환경 구축 후 바로 비즈니스 로직 테스트
3. ✅ **실용성**: TDD 워크플로우 가이드로 실제 개발 연계
4. ✅ **간결성**: MSW 제거로 설정 복잡도 대폭 감소

**다음 단계**: 이 개선안을 기반으로 test-plan.md를 수정하고, 팀원들과 함께 테스트 문화를 만들어가세요.

