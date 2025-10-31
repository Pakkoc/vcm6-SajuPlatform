# PRD: Saju맛피아 (AI 기반 사주 분석 서비스)

## 제품 개요

### 서비스 소개
**Saju맛피아**는 Google Gemini AI를 활용한 온라인 사주 분석 서비스입니다. 사용자는 간단한 정보 입력만으로 AI 기반의 정확한 사주 분석을 받을 수 있으며, 모든 분석 내역은 영구 보관되어 언제든지 다시 확인할 수 있습니다.

### 핵심 가치 제안
- **AI 기반 정확한 분석**: Google Gemini API를 활용한 명리학 기반 사주팔자 분석
- **합리적인 가격**: 무료 체험 1회 제공, Pro 요금제 월 3,900원
- **검사 내역 영구 보관**: 모든 분석 결과를 대시보드에서 언제든지 확인 가능

### 비즈니스 모델
- **Freemium 구독 모델**
  - Free 플랜: 최초 1회 무료 분석 (gemini-2.5-flash 사용)
  - Pro 플랜: 월 3,900원, 월 10회 분석 가능 (gemini-2.5-pro 사용)
- **결제 방식**: 토스페이먼츠 정기결제 (빌링키 기반)

### 기술 스택
- **Frontend**: Next.js 16 (App Router), React, TypeScript, Tailwind CSS, shadcn-ui
- **Backend**: Next.js API Routes, Hono
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Clerk (Google OAuth)
- **Payment**: 토스페이먼츠 (정기결제)
- **AI**: Google Gemini API (2.5-flash, 2.5-pro)
- **Cron Job**: Supabase Cron

---

## Stakeholders

### Primary Stakeholders
1. **최종 사용자 (End Users)**
   - 사주 분석에 관심 있는 일반 사용자
   - 자신의 운세와 성격 분석을 원하는 20-40대 성인

2. **제품 오너 (Product Owner)**
   - MVP 빠른 출시를 목표로 하는 스타트업 CTO
   - 신속한 개발 iteration과 확장 가능한 구조 추구

### Secondary Stakeholders
3. **개발팀**
   - Full-stack 개발자
   - 간결하면서도 유지보수 가능한 코드 작성 담당

4. **외부 서비스 제공자**
   - Clerk (인증)
   - Supabase (데이터베이스)
   - 토스페이먼츠 (결제)
   - Google Gemini (AI 분석)

---

## 포함 페이지

### 1. 공개 페이지 (인증 불필요)

#### 1.1 메인 홈 페이지 (`/`)
**랜딩 페이지 - 3개 섹션으로 구성**

##### Section 1: Hero (`/#home`)
- **목적**: 첫 방문자에게 서비스 핵심 가치 전달
- **구성 요소**:
  - 서비스명 "Saju맛피아" 로고
  - 캐치프레이즈: "AI가 분석하는 당신의 사주팔자"
  - 간략한 서비스 소개 (1-2줄)
  - CTA 버튼 2개:
    - **"무료로 시작하기"** (Primary) → `/sign-up` 페이지로 이동
    - **"자세히 알아보기"** (Secondary) → `/#features`로 스크롤 이동

##### Section 2: Features (`/#features`)
- **목적**: Saju맛피아의 차별화 포인트 설명
- **구성 요소**: 1×3 카드 그리드
  1. **AI 기반 정확한 분석**
     - 아이콘: 🤖
     - 설명: Google Gemini AI가 명리학 원리를 기반으로 정확하게 분석합니다
  2. **합리적인 가격**
     - 아이콘: 💰
     - 설명: 무료 체험 1회 제공, Pro 요금제 월 3,900원으로 10회 분석 가능
  3. **검사 내역 영구 보관**
     - 아이콘: 📁
     - 설명: 모든 분석 결과를 대시보드에 저장하여 언제든지 다시 확인 가능

##### Section 3: Pricing (`/#pricing`)
- **목적**: 요금제 비교 및 가입 유도
- **구성 요소**: 1×2 카드 그리드

| Free 플랜 | Pro 플랜 |
|-----------|----------|
| **₩0** | **₩3,900/월** |
| • 최초 1회 무료 분석 | • 월 10회 분석 |
| • gemini-2.5-flash 사용 | • gemini-2.5-pro 사용 |
| • 분석 내역 영구 보관 | • 분석 내역 영구 보관 |
| • 기본 분석 결과 | • 상세 분석 결과 |
| **[시작하기]** 버튼 → `/sign-up` | **[Pro 시작하기]** 버튼 → `/sign-up` |

#### 1.2 회원가입 페이지 (`/sign-up`)
- **목적**: 신규 사용자 가입
- **구성**: Clerk 제공 `<SignUp />` 컴포넌트
- **기능**:
  - Google 소셜 로그인
  - 회원가입 완료 시 자동으로 Supabase DB에 사용자 프로필 생성 (Clerk Webhook)
  - Free 플랜으로 시작 (잔여 횟수 1회)

#### 1.3 로그인 페이지 (`/sign-in`)
- **목적**: 기존 사용자 로그인
- **구성**: Clerk 제공 `<SignIn />` 컴포넌트
- **기능**: Google 소셜 로그인

---

### 2. 인증 필요 페이지 (로그인 후 접근 가능)

**공용 레이아웃 구성**:
- **Header**:
  - 좌측: 서비스명 "Saju맛피아" (클릭 시 대시보드로 이동)
  - 우측: 대시보드, 새 검사, 프로필 버튼 (`<UserButton />`)
- **Sidebar**:
  - 메뉴:
    - 대시보드 (아이콘 + 텍스트)
    - 새 검사 (아이콘 + 텍스트)
  - 하단: 구독 상태 표시 카드
    - 이메일
    - 잔여 검사 횟수 (예: "3/10회 남음")
    - 요금제 배지 (Free / Pro)
    - 클릭 시 → `/subscription` 페이지로 이동

#### 2.1 대시보드 페이지 (`/dashboard`)
- **목적**: 사용자의 모든 사주 분석 내역 조회
- **구성 요소**:
  - 페이지 제목: "내 분석 내역"
  - 검색바: 이름으로 검색 가능 (실시간 필터링)
  - 분석 내역 카드 그리드 (1×3 반응형)
    - 각 카드 내용:
      - 분석 대상자 이름
      - 생년월일
      - 분석 일시
      - 요약 텍스트 (첫 2줄)
      - 클릭 시 → `/analysis/[id]` 상세 페이지로 이동
- **빈 상태**: 분석 내역이 없을 경우
  - 메시지: "아직 분석 내역이 없습니다"
  - CTA 버튼: "첫 분석 시작하기" → `/new-analysis`

#### 2.2 새 검사 페이지 (`/new-analysis`)
- **목적**: 새로운 사주 분석 요청
- **구성 요소**:
  - 페이지 제목: "새 사주 분석"
  - 입력 폼:
    - 이름 (필수, text input)
    - 생년월일 (필수, date picker)
    - 출생 시간 (선택, time picker - 시/분/초)
      - "출생 시간 모름" 체크박스 제공
    - 성별 (필수, radio button: 남성/여성)
  - **"검사 시작"** 버튼 (Primary)
- **동작 흐름**:
  1. 버튼 클릭 시 잔여 횟수 검증
     - Free 플랜 & 잔여 0회 → Alert: "무료 체험이 종료되었습니다. Pro 요금제를 구독하시겠어요?" + [구독하기] 버튼 → `/subscription`
     - Pro 플랜 & 잔여 0회 → Alert: "이번 달 분석 한도를 모두 사용했습니다. 다음 달에 다시 이용해주세요."
     - 잔여 횟수 있음 → 다음 단계 진행
  2. 분석 중 모달 표시
     - 로딩 스피너
     - 메시지: "AI가 사주를 분석하고 있습니다... (약 10-30초 소요)"
  3. API 호출 (`POST /api/saju-analysis`)
     - Gemini API로 분석 요청
     - DB에 분석 결과 저장
     - 잔여 횟수 차감
  4. 분석 완료 모달 표시
     - 분석 결과 요약 (첫 3-4줄)
     - **"전체 결과 보기"** 버튼 → `/analysis/[id]`
     - **"닫기"** 버튼 → `/dashboard`

#### 2.3 분석 상세보기 페이지 (`/analysis/[id]`)
- **목적**: 특정 분석 결과의 전체 내용 확인
- **구성 요소**:
  - 분석 대상자 정보 카드:
    - 이름
    - 생년월일
    - 출생 시간 (입력된 경우)
    - 성별
    - 분석 일시
    - 사용된 AI 모델 (gemini-2.5-flash / gemini-2.5-pro)
  - 분석 결과 본문:
    - Markdown 형식으로 렌더링
    - 섹션별 구분 (성격, 재물운, 애정운, 건강운 등)
  - 하단 액션 버튼:
    - **"대시보드로 돌아가기"** → `/dashboard`
    - **"새 분석 시작"** → `/new-analysis`

#### 2.4 구독 관리 페이지 (`/subscription`)
- **목적**: 현재 구독 상태 확인 및 요금제 변경
- **구성 요소**:
  - 페이지 제목: "구독 관리"
  - **현재 구독 정보 카드**:
    - 요금제: Free / Pro
    - 이메일
    - 잔여 분석 횟수
    - (Pro 플랜인 경우) 다음 결제일
    - (Pro 플랜인 경우) 결제 금액: ₩3,900
  - **요금제별 액션**:
    - **Free 플랜 사용자**:
      - **"Pro 요금제 업그레이드"** 버튼 (Primary)
        - 클릭 시 토스페이먼츠 결제 위젯 표시
        - 결제 완료 시:
          - 빌링키 발급 및 DB 저장
          - 구독 상태 Pro로 변경
          - 잔여 횟수 10회로 설정
          - 다음 결제일 설정 (1개월 후)
    - **Pro 플랜 사용자**:
      - 구독 상태 표시:
        - 활성 상태: "구독 중" 배지 (초록색)
        - 취소 예정 상태: "다음 결제일까지 이용 가능" 배지 (주황색)
      - **"구독 취소"** 버튼 (Destructive)
        - 클릭 시 확인 모달: "구독을 취소하시겠어요? 다음 결제일까지는 계속 이용 가능합니다."
        - 확인 시:
          - 구독 상태를 "취소 예정"으로 변경
          - 다음 결제일까지는 Pro 혜택 유지
      - **"취소 철회"** 버튼 (취소 예정 상태일 때만 표시)
        - 클릭 시 구독 상태를 다시 "활성"으로 변경
      - **"구독 해지"** 버튼 (Destructive)
        - 클릭 시 확인 모달: "즉시 해지하시겠어요? 빌링키가 삭제되며 재구독 시 새로 등록해야 합니다."
        - 확인 시:
          - 빌링키 삭제
          - 구독 상태 Free로 변경
          - 잔여 횟수 0회로 설정

---

## 사용자 여정 (User Journey)

### 타겟 유저 Segment

#### Segment 1: 무료 체험 사용자 (Free User)
**특징**: 사주에 관심은 있지만 유료 결제는 망설이는 사용자

**여정**:
1. **발견 단계** (`/`)
   - 검색 또는 SNS를 통해 랜딩 페이지 방문
   - Hero 섹션에서 "무료로 시작하기" 버튼 확인
   - Features 섹션 스크롤하며 서비스 이해
   - Pricing 섹션에서 무료 1회 체험 확인

2. **가입 단계** (`/sign-up`)
   - "무료로 시작하기" 버튼 클릭
   - Google 계정으로 간편 회원가입
   - 자동으로 Free 플랜 활성화 (잔여 1회)

3. **첫 분석 단계** (`/new-analysis`)
   - 자동으로 새 검사 페이지로 리다이렉트
   - 본인 또는 가족의 사주 정보 입력
   - "검사 시작" 버튼 클릭
   - 분석 중 모달에서 대기 (10-30초)
   - 분석 완료 모달에서 결과 요약 확인

4. **결과 확인 단계** (`/analysis/[id]`)
   - "전체 결과 보기" 클릭
   - 상세한 사주 분석 내용 읽기
   - 만족도에 따라 다음 행동 분기:
     - **만족 시**: 추가 분석을 위해 Pro 구독 고려
     - **불만족 시**: 서비스 이탈

5. **전환 단계** (`/subscription`)
   - 대시보드 또는 새 검사 페이지에서 "잔여 0회" 확인
   - "Pro 요금제 업그레이드" 버튼 클릭
   - 토스페이먼츠로 결제 (₩3,900)
   - Pro 사용자로 전환

#### Segment 2: Pro 구독 사용자 (Pro User)
**특징**: 정기적으로 사주 분석을 이용하고자 하는 충성 고객

**여정**:
1. **구독 시작** (`/subscription`)
   - Free 플랜에서 업그레이드 또는 처음부터 Pro 선택
   - 토스페이먼츠 결제 위젯으로 카드 등록
   - 빌링키 발급 및 첫 결제 완료
   - 잔여 10회 부여

2. **정기 사용** (`/dashboard`, `/new-analysis`)
   - 월 평균 3-5회 분석 수행
   - 본인, 가족, 친구 등 다양한 대상 분석
   - 대시보드에서 과거 분석 내역 재확인
   - gemini-2.5-pro 모델로 더 상세한 결과 획득

3. **매월 자동 결제**
   - Supabase Cron Job이 매일 02:00에 실행
   - 결제일이 도래한 사용자 자동 결제
   - 성공 시: 잔여 횟수 10회로 리셋, 다음 결제일 1개월 연장
   - 실패 시: 구독 자동 해지, Free 플랜으로 전환

4. **구독 관리** (`/subscription`)
   - 필요 시 구독 취소 (다음 결제일까지 유지)
   - 취소 철회 가능
   - 즉시 해지 시 빌링키 삭제

#### Segment 3: 이탈 사용자 (Churned User)
**특징**: Free 체험 후 Pro 전환하지 않거나, Pro 구독 해지한 사용자

**재활성화 여정**:
1. **재방문** (`/dashboard`)
   - 과거 분석 내역은 여전히 확인 가능
   - 새 분석 시도 시 잔여 0회 확인

2. **재전환 유도** (`/subscription`)
   - "Pro 요금제 업그레이드" 버튼 노출
   - 재구독 시 새로운 빌링키 등록 필요

---

## Information Architecture (IA)

### IA Tree 시각화

```
Saju맛피아
│
├── 🌐 공개 영역 (인증 불필요)
│   │
│   ├── / (메인 홈 - 랜딩 페이지)
│   │   ├── #home (Hero 섹션)
│   │   ├── #features (특징 섹션)
│   │   └── #pricing (요금제 섹션)
│   │
│   ├── /sign-up (회원가입)
│   │   └── [[...sign-up]] (Clerk 동적 라우트)
│   │
│   └── /sign-in (로그인)
│       └── [[...sign-in]] (Clerk 동적 라우트)
│
└── 🔒 인증 영역 (로그인 필요)
    │
    ├── 📊 /dashboard (대시보드)
    │   ├── 검색 기능 (이름 검색)
    │   └── 분석 내역 카드 그리드
    │       └── → /analysis/[id] (클릭 시 이동)
    │
    ├── ✏️ /new-analysis (새 검사)
    │   ├── 입력 폼 (이름, 생년월일, 출생시간, 성별)
    │   ├── 검사 시작 버튼
    │   ├── 분석 중 모달
    │   └── 분석 완료 모달
    │       └── → /analysis/[id] (전체 결과 보기)
    │
    ├── 📄 /analysis/[id] (분석 상세보기)
    │   ├── 대상자 정보 카드
    │   ├── 분석 결과 본문 (Markdown)
    │   └── 액션 버튼
    │       ├── → /dashboard (돌아가기)
    │       └── → /new-analysis (새 분석)
    │
    └── 💳 /subscription (구독 관리)
        ├── 현재 구독 정보 카드
        ├── Free 플랜 → Pro 업그레이드 버튼
        └── Pro 플랜 → 구독 취소/철회/해지 버튼

🔧 API 엔드포인트 (내부)
│
├── /api/[[...hono]] (Hono 통합 엔드포인트)
│   ├── POST /api/saju-analysis (사주 분석 요청)
│   ├── GET /api/subscription (구독 정보 조회)
│   ├── POST /api/subscription/upgrade (Pro 업그레이드)
│   ├── POST /api/subscription/cancel (구독 취소)
│   ├── POST /api/subscription/reactivate (취소 철회)
│   └── POST /api/subscription/terminate (구독 해지)
│
├── /api/webhooks/clerk (Clerk Webhook)
│   └── POST (user.created 이벤트 처리)
│
├── /api/webhooks/toss (토스페이먼츠 Webhook)
│   └── POST (결제 상태 변경 알림)
│
└── /api/cron/process-subscriptions (정기결제 Cron)
    └── POST (Supabase Cron에서 호출)
```

### 페이지별 접근 권한

| 페이지 | 경로 | 인증 필요 | 구독 필요 |
|--------|------|-----------|-----------|
| 메인 홈 | `/` | ❌ | ❌ |
| 회원가입 | `/sign-up` | ❌ | ❌ |
| 로그인 | `/sign-in` | ❌ | ❌ |
| 대시보드 | `/dashboard` | ✅ | ❌ |
| 새 검사 | `/new-analysis` | ✅ | ❌ (잔여 횟수 필요) |
| 분석 상세 | `/analysis/[id]` | ✅ | ❌ |
| 구독 관리 | `/subscription` | ✅ | ❌ |

### 네비게이션 흐름

#### Primary Navigation (Header)
- **서비스명 로고** → `/dashboard`
- **대시보드** → `/dashboard`
- **새 검사** → `/new-analysis`
- **프로필 버튼** → Clerk UserButton (로그아웃, 프로필 설정)

#### Secondary Navigation (Sidebar)
- **대시보드** → `/dashboard`
- **새 검사** → `/new-analysis`
- **구독 상태 카드** (하단 고정) → `/subscription`

#### Contextual Navigation
- **분석 카드 클릭** → `/analysis/[id]`
- **업그레이드 버튼** → `/subscription`
- **무료로 시작하기** → `/sign-up`
- **Pro 시작하기** → `/sign-up`

---

## 핵심 기능 명세

### 1. 인증 시스템 (Clerk)
- **Google OAuth 로그인**: 간편한 소셜 로그인
- **세션 관리**: 자동 세션 유지 및 갱신
- **Webhook 동기화**: 
  - `user.created` 이벤트 발생 시 Supabase DB에 사용자 프로필 생성
  - 초기 Free 플랜 설정 (잔여 1회)

### 2. 사주 분석 시스템 (Gemini API)
- **입력 정보**:
  - 이름 (필수)
  - 생년월일 (필수)
  - 출생 시간 (선택, 모름 체크 가능)
  - 성별 (필수)
- **분석 로직**:
  - Free 플랜: `gemini-2.5-flash` 모델 사용
  - Pro 플랜: `gemini-2.5-pro` 모델 사용
  - 프롬프트: 명리학 기반 성격, 재물운, 애정운, 건강운 분석
- **결과 저장**:
  - Supabase DB에 분석 결과 저장
  - 사용자별 분석 내역 관리
  - 잔여 횟수 자동 차감

### 3. 구독 결제 시스템 (토스페이먼츠)
- **최초 구독**:
  - 토스페이먼츠 결제 위젯 SDK 사용
  - `customerKey`에 Clerk `user.id` 사용
  - 결제 성공 시 빌링키 발급 및 DB 저장
  - Pro 플랜 활성화 (잔여 10회, 다음 결제일 1개월 후)
- **정기 결제** (Supabase Cron):
  - 매일 02:00에 실행
  - 오늘이 결제일인 구독 조회
  - 빌링키로 결제 API 호출
  - **성공 시**: 잔여 횟수 10회 리셋, 다음 결제일 1개월 연장
  - **실패 시**: 구독 즉시 해지, Free 플랜 전환
- **구독 관리**:
  - **취소**: 다음 결제일까지 Pro 혜택 유지, 이후 자동 Free 전환
  - **취소 철회**: 다음 결제일 전까지 취소 상태 해제 가능
  - **즉시 해지**: 빌링키 삭제, 즉시 Free 전환

### 4. 데이터베이스 스키마 (Supabase)

#### 테이블 구조

##### `users` 테이블
```sql
- id (uuid, PK)
- clerk_user_id (text, unique) -- Clerk의 user.id
- email (text)
- created_at (timestamp)
- updated_at (timestamp)
```

##### `subscriptions` 테이블
```sql
- id (uuid, PK)
- user_id (uuid, FK → users.id)
- plan (text) -- 'free' | 'pro'
- status (text) -- 'active' | 'cancelled' | 'pending_cancellation'
- billing_key (text, nullable) -- 토스페이먼츠 빌링키
- remaining_count (int) -- 잔여 분석 횟수
- next_billing_date (date, nullable) -- 다음 결제일
- created_at (timestamp)
- updated_at (timestamp)
```

##### `saju_analyses` 테이블
```sql
- id (uuid, PK)
- user_id (uuid, FK → users.id)
- name (text) -- 분석 대상자 이름
- birth_date (date)
- birth_time (time, nullable)
- gender (text) -- 'male' | 'female'
- model_used (text) -- 'gemini-2.5-flash' | 'gemini-2.5-pro'
- result (text) -- 분석 결과 (Markdown)
- created_at (timestamp)
```

### 5. 보안 및 검증
- **Clerk Webhook 검증**: Svix 헤더를 통한 서명 검증
- **Cron Job 보안**: `Authorization` 헤더에 `CRON_SECRET` 사용
- **결제 API 보안**: 토스페이먼츠 시크릿 키를 Base64 인코딩하여 Basic Auth 사용
- **미들웨어 보호**: Clerk 미들웨어로 인증 필요 페이지 접근 제어

---

## 비기능 요구사항

### 성능
- **분석 응답 시간**: Gemini API 호출 10-30초 이내
- **페이지 로딩**: 초기 로딩 3초 이내 (Next.js SSR 활용)
- **검색 기능**: 클라이언트 사이드 실시간 필터링 (지연 없음)

### 확장성
- **MVP 우선**: 초기에는 단순한 구조로 빠르게 출시
- **모듈화**: Feature 기반 디렉토리 구조로 기능 추가 용이
- **API 분리**: Hono 라우터로 백엔드 로직 분리하여 확장 가능

### 사용성
- **반응형 디자인**: 모바일/태블릿/데스크톱 모두 지원
- **한글 UI**: Clerk 한글 로컬라이제이션 적용
- **직관적 네비게이션**: 3클릭 이내 모든 기능 접근 가능

### 유지보수성
- **TypeScript**: 타입 안정성 확보
- **Zod 스키마**: API 요청/응답 검증
- **에러 핸들링**: 공통 에러 바운더리 및 로깅

---

## 출시 계획

### Phase 1: MVP (4주)
- ✅ 인증 시스템 (Clerk)
- ✅ 기본 페이지 구조 (랜딩, 대시보드, 새 검사, 상세보기)
- ✅ Gemini API 연동 및 사주 분석
- ✅ Free 플랜 (1회 무료)
- ✅ Supabase DB 스키마 및 CRUD

### Phase 2: 결제 시스템 (2주)
- ✅ 토스페이먼츠 SDK 연동
- ✅ Pro 구독 결제 및 빌링키 발급
- ✅ 구독 관리 페이지
- ✅ Supabase Cron Job 정기결제

### Phase 3: 폴리싱 (1주)
- ✅ UI/UX 개선 (shadcn-ui 컴포넌트 활용)
- ✅ 에러 핸들링 강화
- ✅ 로딩 상태 최적화
- ✅ 내부 베타 테스트

### Phase 4: 런칭 (1주)
- ✅ 배포 (Vercel)
- ✅ Clerk Webhook 활성화 (배포 후)
- ✅ 모니터링 설정
- ✅ 공개 출시

---

## 성공 지표 (KPI)

### 사용자 지표
- **회원가입 수**: 월 100명 목표
- **Free → Pro 전환율**: 10% 목표
- **Pro 구독 유지율**: 70% 목표 (3개월 기준)

### 비즈니스 지표
- **월 매출**: ₩390,000 목표 (Pro 구독자 100명 기준)
- **평균 분석 횟수**: Pro 사용자 월 평균 5회 이상

### 기술 지표
- **API 성공률**: 99% 이상
- **페이지 로딩 속도**: 평균 2초 이내
- **에러 발생률**: 1% 이하

---

## 리스크 및 대응 방안

### 리스크 1: Gemini API 비용 초과
- **대응**: Free 플랜은 저렴한 flash 모델 사용, Pro 플랜 가격에 API 비용 반영

### 리스크 2: 정기결제 실패율 증가
- **대응**: 결제 실패 시 이메일 알림, 재시도 로직 추가 (Phase 2+)

### 리스크 3: 사용자 이탈 (Free 체험 후)
- **대응**: 분석 결과 품질 향상, Pro 플랜 혜택 강화, 리텐션 이메일 캠페인

### 리스크 4: Clerk Webhook 미작동 (로컬 환경)
- **대응**: 배포 후 Webhook 활성화, 로컬 테스트는 수동 DB 생성으로 우회

---

## 참고 문서

### 외부 서비스 연동 가이드
- [Clerk 연동 가이드](./external/clerk.md)
- [Supabase 연동 가이드](./external/supabase.md)
- [토스페이먼츠 연동 가이드](./external/tosspayments.md)
- [Gemini API 연동 가이드](./external/gemini_api.md)

### 개발 규칙
- [TDD 가이드](./rules/tdd.md)
- [페르소나](./persona.md)

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0 | 2025-10-31 | CTO | 초안 작성 |

