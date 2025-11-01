# 구현 계획: 랜딩 페이지 (/)

## 개요

### 목표
서비스 소개 및 가입 유도를 위한 정적 랜딩 페이지 구현

### 참고 문서
- **상태관리 설계**: `docs/pages/01-landing/state.md`
- **PRD**: `docs/prd.md`
- **요구사항**: `docs/requirment.md`

### 범위
- **포함**: Hero, Features, Pricing 섹션, 스크롤 네비게이션
- **제외**: 상태 관리, API 호출, 폼 처리

---

## 모듈 목록

| 모듈명 | 위치 | 설명 |
|--------|------|------|
| LandingPage | `src/app/page.tsx` | 메인 페이지 컴포넌트 |
| HeroSection | `src/features/landing/components/hero-section.tsx` | Hero 섹션 |
| FeaturesSection | `src/features/landing/components/features-section.tsx` | Features 섹션 |
| PricingSection | `src/features/landing/components/pricing-section.tsx` | Pricing 섹션 |
| FeatureCard | `src/features/landing/components/feature-card.tsx` | Feature 카드 컴포넌트 |
| PricingCard | `src/features/landing/components/pricing-card.tsx` | Pricing 카드 컴포넌트 |

---

## 모듈 관계 다이어그램

```mermaid
graph TD
    A[LandingPage] --> B[HeroSection]
    A --> C[FeaturesSection]
    A --> D[PricingSection]
    
    B --> B1[Button: 무료로 시작하기]
    B --> B2[Button: 자세히 알아보기]
    
    C --> E[FeatureCard x3]
    E --> E1[AI 기반 분석]
    E --> E2[합리적 가격]
    E --> E3[영구 보관]
    
    D --> F[PricingCard x2]
    F --> F1[Free 플랜]
    F --> F2[Pro 플랜]
    
    B1 -.router.-> G[/sign-up]
    B2 -.scroll.-> C
    F1 -.router.-> G
    F2 -.router.-> G
```

---

## Implementation Plan

### Phase 1: 기본 구조 및 Hero 섹션

**작업 항목**:

1. **LandingPage 컴포넌트 생성**
   - 파일: `src/app/page.tsx`
   - 설명: 메인 페이지 컴포넌트, 3개 섹션 조합
   - 의존성: 없음

2. **HeroSection 컴포넌트 생성**
   - 파일: `src/features/landing/components/hero-section.tsx`
   - 설명: 서비스명, 캐치프레이즈, CTA 버튼
   - 의존성: shadcn-ui Button

**QA Sheet**:
- [ ] 서비스명 "Saju맛피아" 표시
- [ ] 캐치프레이즈 "AI가 분석하는 당신의 사주팔자" 표시
- [ ] "무료로 시작하기" 버튼 클릭 시 `/sign-up` 이동
- [ ] "자세히 알아보기" 버튼 클릭 시 `#features`로 스크롤
- [ ] 반응형 레이아웃 (모바일/데스크톱)

---

### Phase 2: Features 섹션

**작업 항목**:

1. **FeatureCard 컴포넌트 생성**
   - 파일: `src/features/landing/components/feature-card.tsx`
   - 설명: 재사용 가능한 Feature 카드
   - Props: `{ icon: string, title: string, description: string }`

2. **FeaturesSection 컴포넌트 생성**
   - 파일: `src/features/landing/components/features-section.tsx`
   - 설명: 3개의 FeatureCard를 1×3 그리드로 배치
   - 의존성: FeatureCard

**QA Sheet**:
- [ ] 3개 카드가 1×3 그리드로 표시
- [ ] 카드 1: 🤖 아이콘, "AI 기반 정확한 분석" 제목
- [ ] 카드 2: 💰 아이콘, "합리적인 가격" 제목
- [ ] 카드 3: 📁 아이콘, "검사 내역 영구 보관" 제목
- [ ] 반응형 그리드 (모바일: 1열, 태블릿: 2열, 데스크톱: 3열)

---

### Phase 3: Pricing 섹션

**작업 항목**:

1. **PricingCard 컴포넌트 생성**
   - 파일: `src/features/landing/components/pricing-card.tsx`
   - 설명: 재사용 가능한 Pricing 카드
   - Props: `{ plan: 'free' | 'pro', price: string, features: string[], ctaLabel: string }`

2. **PricingSection 컴포넌트 생성**
   - 파일: `src/features/landing/components/pricing-section.tsx`
   - 설명: 2개의 PricingCard를 1×2 그리드로 배치
   - 의존성: PricingCard

**QA Sheet**:
- [ ] 2개 카드가 1×2 그리드로 표시
- [ ] Free 카드: ₩0, 1회 무료 분석, gemini-2.5-flash
- [ ] Pro 카드: ₩3,900/월, 월 10회 분석, gemini-2.5-pro
- [ ] "시작하기" 버튼 클릭 시 `/sign-up` 이동
- [ ] "Pro 시작하기" 버튼 클릭 시 `/sign-up` 이동
- [ ] 반응형 그리드 (모바일: 1열, 데스크톱: 2열)

---

### Phase 4: 스타일링 및 최적화

**작업 항목**:

1. **Tailwind CSS 스타일 적용**
   - 파일: 모든 컴포넌트
   - 설명: 일관된 디자인 시스템 적용

2. **스크롤 애니메이션 추가**
   - 파일: `src/features/landing/components/hero-section.tsx`
   - 설명: "자세히 알아보기" 버튼 클릭 시 smooth scroll

**QA Sheet**:
- [ ] 전체 페이지 일관된 색상 팔레트
- [ ] 스크롤 애니메이션 부드럽게 작동
- [ ] 모든 섹션 적절한 여백 및 패딩
- [ ] 버튼 hover 효과 적용

---

## 구현 상세

### 1. LandingPage (`src/app/page.tsx`)

```typescript
export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <HeroSection />
      <FeaturesSection />
      <PricingSection />
    </main>
  );
}
```

**특징**:
- Client Component 불필요 (정적 콘텐츠)
- 상태 관리 없음
- 순수 프레젠테이션 컴포넌트

---

### 2. HeroSection

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

export function HeroSection() {
  const router = useRouter();

  const handleScrollToFeatures = () => {
    document.getElementById('features')?.scrollIntoView({ 
      behavior: 'smooth' 
    });
  };

  return (
    <section id="home" className="...">
      <h1>Saju맛피아</h1>
      <p>AI가 분석하는 당신의 사주팔자</p>
      <div className="flex gap-4">
        <Button onClick={() => router.push('/sign-up')}>
          무료로 시작하기
        </Button>
        <Button variant="outline" onClick={handleScrollToFeatures}>
          자세히 알아보기
        </Button>
      </div>
    </section>
  );
}
```

**특징**:
- Client Component (router, scroll 사용)
- Next.js `useRouter` 사용
- Smooth scroll 구현

---

### 3. FeatureCard

```typescript
interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

export function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <div className="...">
      <div className="text-4xl">{icon}</div>
      <h3 className="text-xl font-semibold">{title}</h3>
      <p className="text-sm">{description}</p>
    </div>
  );
}
```

**특징**:
- 재사용 가능한 컴포넌트
- Props로 데이터 주입
- 상태 없음

---

### 4. FeaturesSection

```typescript
import { FeatureCard } from './feature-card';

const features = [
  {
    icon: '🤖',
    title: 'AI 기반 정확한 분석',
    description: 'Google Gemini AI가 명리학 원리를 기반으로 정확하게 분석합니다',
  },
  {
    icon: '💰',
    title: '합리적인 가격',
    description: '무료 체험 1회 제공, Pro 요금제 월 3,900원으로 10회 분석 가능',
  },
  {
    icon: '📁',
    title: '검사 내역 영구 보관',
    description: '모든 분석 결과를 대시보드에 저장하여 언제든지 다시 확인 가능',
  },
];

export function FeaturesSection() {
  return (
    <section id="features" className="...">
      <h2>Saju맛피아가 특별한 이유</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {features.map((feature, index) => (
          <FeatureCard key={index} {...feature} />
        ))}
      </div>
    </section>
  );
}
```

**특징**:
- 상수 데이터 사용
- 반응형 그리드
- map으로 카드 렌더링

---

### 5. PricingCard

```typescript
interface PricingCardProps {
  plan: 'free' | 'pro';
  price: string;
  features: string[];
  ctaLabel: string;
  onCtaClick: () => void;
}

export function PricingCard({ 
  plan, 
  price, 
  features, 
  ctaLabel, 
  onCtaClick 
}: PricingCardProps) {
  return (
    <div className="...">
      <h3 className="text-2xl font-bold">{plan === 'free' ? 'Free' : 'Pro'}</h3>
      <p className="text-3xl font-bold">{price}</p>
      <ul className="space-y-2">
        {features.map((feature, index) => (
          <li key={index}>• {feature}</li>
        ))}
      </ul>
      <Button onClick={onCtaClick}>{ctaLabel}</Button>
    </div>
  );
}
```

**특징**:
- 재사용 가능한 컴포넌트
- Props로 데이터 및 핸들러 주입
- 조건부 렌더링 (plan)

---

### 6. PricingSection

```typescript
'use client';

import { useRouter } from 'next/navigation';
import { PricingCard } from './pricing-card';

export function PricingSection() {
  const router = useRouter();

  const plans = [
    {
      plan: 'free' as const,
      price: '₩0',
      features: [
        '최초 1회 무료 분석',
        'gemini-2.5-flash 사용',
        '분석 내역 영구 보관',
        '기본 분석 결과',
      ],
      ctaLabel: '시작하기',
    },
    {
      plan: 'pro' as const,
      price: '₩3,900/월',
      features: [
        '월 10회 분석',
        'gemini-2.5-pro 사용',
        '분석 내역 영구 보관',
        '상세 분석 결과',
      ],
      ctaLabel: 'Pro 시작하기',
    },
  ];

  return (
    <section id="pricing" className="...">
      <h2>요금제</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {plans.map((plan) => (
          <PricingCard
            key={plan.plan}
            {...plan}
            onCtaClick={() => router.push('/sign-up')}
          />
        ))}
      </div>
    </section>
  );
}
```

**특징**:
- Client Component (router 사용)
- 상수 데이터 사용
- 반응형 그리드

---

## 테스트 계획

### E2E 테스트 (`tests/e2e/landing.spec.ts`)

```typescript
import { test, expect } from '@playwright/test';

test.describe('랜딩 페이지', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('Hero 섹션 렌더링', async ({ page }) => {
    await expect(page.locator('h1')).toContainText('Saju맛피아');
    await expect(page.locator('text=AI가 분석하는 당신의 사주팔자')).toBeVisible();
  });

  test('"무료로 시작하기" 버튼 클릭 시 /sign-up 이동', async ({ page }) => {
    await page.click('text=무료로 시작하기');
    await expect(page).toHaveURL('/sign-up');
  });

  test('"자세히 알아보기" 버튼 클릭 시 스크롤', async ({ page }) => {
    await page.click('text=자세히 알아보기');
    await expect(page.locator('#features')).toBeInViewport();
  });

  test('Features 섹션 3개 카드 표시', async ({ page }) => {
    const cards = page.locator('[data-testid="feature-card"]');
    await expect(cards).toHaveCount(3);
  });

  test('Pricing 섹션 2개 카드 표시', async ({ page }) => {
    const cards = page.locator('[data-testid="pricing-card"]');
    await expect(cards).toHaveCount(2);
  });

  test('"시작하기" 버튼 클릭 시 /sign-up 이동', async ({ page }) => {
    await page.click('text=시작하기').first();
    await expect(page).toHaveURL('/sign-up');
  });
});
```

---

## 체크리스트

### 구현 전
- [ ] PRD 및 요구사항 문서 검토 완료
- [ ] shadcn-ui Button, Card 컴포넌트 설치 확인
- [ ] 디자인 시스템 색상 팔레트 확정

### 구현 중
- [ ] 모든 컴포넌트 Client/Server 구분 명확
- [ ] 반응형 레이아웃 적용
- [ ] 접근성 고려 (시맨틱 HTML, ARIA)

### 구현 후
- [ ] E2E 테스트 통과
- [ ] 모바일/태블릿/데스크톱 반응형 확인
- [ ] 크로스 브라우저 테스트 (Chrome, Safari, Firefox)
- [ ] Lighthouse 성능 점수 90 이상

---

## 의존성

### 필수 패키지
- `next`: 16.x
- `react`: 19.x
- `@/components/ui/button`: shadcn-ui
- `@/components/ui/card`: shadcn-ui

### 설치 필요 컴포넌트
```bash
npx shadcn@latest add button
npx shadcn@latest add card
```

---

## 예상 소요 시간
- Phase 1: 1시간
- Phase 2: 1시간
- Phase 3: 1시간
- Phase 4: 30분
- **총 3.5시간**

