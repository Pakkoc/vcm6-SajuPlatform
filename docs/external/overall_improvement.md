### 1. Clerk: 인증 및 사용자 관리

Clerk는 Next.js 최신 LTS 버전인 16과 완벽하게 호환되며, App Router 환경에서 가장 빠르고 간편하게 인증 시스템을 구축할 수 있는 솔루션입니다.

*   **검증 및 개선사항:** 기존 문서는 내용이 거의 정확했으나, 보안에 필수적인 **Webhook 검증 로직을 실제 운영 가능한 수준으로 강화**했습니다. Svix 헤더를 정확히 파싱하여 검증하는 코드를 추가하여 안정성을 높였습니다.

*   **연동 수단:** **SDK (`@clerk/nextjs`)** & **Webhook**
*   **사용 기능:**
    *   **SDK:** Google 소셜 로그인, 회원가입/로그인 UI, 세션 관리, 미들웨어를 통한 페이지 접근 제어, `UserButton` 같은 UI 컴포넌트 제공.
    *   **Webhook:** Clerk에서 사용자 생성/수정/삭제 이벤트가 발생했을 때, Supabase DB와 사용자 정보를 동기화하기 위한 서버 알림.

#### 설치 및 세팅

1.  **SDK 설치**
    ```bash
    npm install @clerk/nextjs
    ```
2.  **루트 레이아웃 설정 (`/app/layout.tsx`)**
    ```tsx
    import { ClerkProvider } from '@clerk/nextjs';
    import { koKR } from "@clerk/localizations"; // 한글 UI 지원

    export default function RootLayout({ children }: { children: React.ReactNode }) {
      return (
        <ClerkProvider localization={koKR}>
          <html lang="ko">
            <body>{children}</body>
          </html>
        </ClerkProvider>
      );
    }
    ```
3.  **미들웨어 설정 (`/middleware.ts`)**
    *   로그인이 필요한 페이지와 공개 페이지를 정의합니다.
    ```typescript
    import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

    // 인증이 필요 없는 공개 페이지 설정 (랜딩페이지, 로그인/가입, Clerk Webhook 수신 API)
    const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)', '/api/webhooks/clerk']);

    export default clerkMiddleware((auth, request) => {
      if (!isPublicRoute(request)) {
        auth().protect(); // 공개 페이지가 아니면 로그인 필요
      }
    });

    export const config = {
      matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
    };
    ```

#### 인증 정보 관리

1.  **위치:** Clerk Dashboard > 해당 애플리케이션 > API Keys
2.  **필요한 키:** `Publishable key`, `Secret key`, Webhook `Signing secret`
3.  **설정 (`.env.local`):**
    ```env
    # Clerk
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx
    CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    ```

#### 호출 방법

1.  **SDK 호출 (UI 컴포넌트)**
    *   회원가입 (`/app/sign-up/[[...sign-up]]/page.tsx`) 및 로그인 페이지는 기존 문서와 동일하게 `<SignUp />`, `<SignIn />` 컴포넌트를 사용하면 됩니다.
    *   헤더 프로필 버튼: `<UserButton afterSignOutUrl="/" />`

2.  **Webhook 수신 및 검증 (개선된 코드) (`/app/api/webhooks/clerk/route.ts`)**
    *   Clerk 대시보드에서 엔드포인트를 `https://<your-domain>/api/webhooks/clerk`로 등록해야 합니다.
    ```typescript
    import { Webhook } from 'svix';
    import { headers } from 'next/headers';
    import { WebhookEvent } from '@clerk/nextjs/server';
    import { NextResponse } from 'next/server';

    export async function POST(req: Request) {
      const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
      if (!WEBHOOK_SECRET) {
        throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env');
      }

      const headerPayload = headers();
      const svix_id = headerPayload.get("svix-id");
      const svix_timestamp = headerPayload.get("svix-timestamp");
      const svix_signature = headerPayload.get("svix-signature");

      if (!svix_id || !svix_timestamp || !svix_signature) {
        return new Response('Error occured -- no svix headers', { status: 400 });
      }

      const payload = await req.json();
      const body = JSON.stringify(payload);
      const wh = new Webhook(WEBHOOK_SECRET);
      let evt: WebhookEvent;

      try {
        evt = wh.verify(body, {
          "svix-id": svix_id,
          "svix-timestamp": svix_timestamp,
          "svix-signature": svix_signature,
        }) as WebhookEvent;
      } catch (err) {
        console.error('Error verifying webhook:', err);
        return new Response('Error occured', { status: 400 });
      }

      const { id } = evt.data;
      const eventType = evt.type;
      
      console.log(`Webhook with an ID of ${id} and type of ${eventType}`);
      
      if (eventType === 'user.created') {
        // TODO: Supabase DB에 사용자 프로필 생성 로직 구현
        // const { id, email_addresses, first_name, last_name, image_url } = evt.data;
      }

      return NextResponse.json({ message: 'Webhook received' }, { status: 200 });
    }
    ```

---

### 2. Supabase: 데이터베이스 및 Cron Job

Supabase는 PostgreSQL 기반 DB와 백엔드 기능을 제공하며, Next.js 16 SSR 환경을 위한 `@supabase/ssr` 라이브러리를 지원하여 쿠키 기반 인증을 손쉽게 처리합니다.

*   **검증 및 개선사항:** Cron Job 설정 방식은 유효합니다. 호출되는 Next.js API의 **보안을 위해 `Authorization` 헤더에 고정된 시크릿 키를 사용하는 것을 명확히** 하여, 예측 불가능한 호출을 방지하는 부분을 강조했습니다.

*   **연동 수단:** **SDK (`@supabase/ssr`)** & **플랫폼 기능 (Cron Job)**
*   **사용 기능:**
    *   **SDK:** 사용자 프로필, 구독 정보, 사주 분석 내역 등 모든 데이터 CRUD.
    *   **Cron Job:** 매일 특정 시간에 정기 결제 로직이 담긴 Next.js API를 호출하는 스케줄러.

#### 설치 및 세팅

1.  **SDK 설치**
    ```bash
    npm install @supabase/supabase-js @supabase/ssr
    ```
2.  **클라이언트 유틸리티 생성:** 공식 문서 가이드에 따라 `/utils/supabase/` 디렉토리에 서버/클라이언트/미들웨어용 클라이언트 생성 파일을 구성합니다.

#### 인증 정보 관리

1.  **위치:** Supabase Dashboard > 프로젝트 선택 > Project Settings > API
2.  **필요한 키:** `Project URL`, `anon public` 키
3.  **설정 (`.env.local`):**
    ```env
    # Supabase
    NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...

    # Cron Job Security
    CRON_SECRET=a_very_secret_and_long_string_for_cron_job
    ```

#### 호출 방법

1.  **SDK 호출 (서버 컴포넌트 데이터 조회):**
    ```tsx
    import { createClient } from '@/utils/supabase/server';
    import { cookies } from 'next/headers';

    export default async function DashboardPage() {
      const cookieStore = cookies();
      const supabase = createClient(cookieStore);

      const { data: analysisHistory } = await supabase.from('saju_analysis').select('*');
      
      return (/* ... JSX ... */);
    }
    ```
2.  **Cron Job 설정 (Supabase 대시보드):**
    1.  Supabase Dashboard > Database > Cron Jobs 로 이동합니다.
    2.  `New Job`을 생성하고 `Schedule`에 `0 2 * * *` (매일 새벽 2시)를 입력합니다.
    3.  `HTTP request`를 선택하고, 정기결제 API 엔드포인트(`https://<your-domain>/api/cron/process-subscriptions`)를 `POST` 방식으로 설정합니다.
    4.  **Headers** 항목에 `Authorization` 키를 추가하고 값으로 `Bearer ${CRON_SECRET}`를 입력하여 호출을 보호합니다.

---

### 3. 토스페이먼츠: 구독 결제

토스페이먼츠는 결제 위젯 SDK로 프론트엔드 경험을 간소화하고, 서버에서는 REST API로 안전하게 결제를 처리하는 구조를 사용합니다.

*   **검증 및 개선사항:**
    *   **MCP(Model Context Protocol) 의미 명확화:** 요구사항의 'tosspayments mcp'는 결제 API 종류가 아니라, AI 코딩 도우미(Claude, Cursor 등)가 토스페이먼츠 연동 코드를 더 정확하게 생성하도록 돕는 개발 도구입니다. 실제 코드 연동은 아래의 SDK와 API를 사용합니다.
    *   **정기결제 실행 로직 추가:** 기존 문서에는 최초 인증 후 `빌링키`를 발급받는 과정만 있었습니다. Cron Job에서 실제로 매월 결제를 실행하는 **`빌링키로 결제 승인 API` 호출 예제를 추가**하여 전체 흐름을 완성했습니다.

*   **연동 수단:** **SDK (`@tosspayments/payment-widget-sdk`)** & **REST API**
*   **사용 기능:**
    *   **SDK:** 프론트엔드에서 결제 UI를 렌더링하고, 첫 결제 인증을 위한 `authKey`를 발급받는 역할.
    *   **API (빌링키 발급):** 서버에서 `authKey`로 고객의 결제 정보를 암호화한 `빌링키`를 발급받아 DB에 저장.
    *   **API (빌링키 결제):** Cron Job에서 저장된 `빌링키`를 사용해 매월 정기 결제를 실행.

#### 설치 및 세팅

1.  **SDK 설치**
    ```bash
    npm install @tosspayments/payment-widget-sdk
    ```

#### 인증 정보 관리

1.  **위치:** 토스페이먼츠 개발자센터 > API 키
2.  **필요한 키:** `클라이언트 키`, `시크릿 키`
3.  **설정 (`.env.local`):**
    ```env
    # Toss Payments
    NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_xxxxxxxxxxxxxxxxxx
    TOSS_SECRET_KEY=test_sk_xxxxxxxxxxxxxxxxxx
    ```

#### 호출 방법

1.  **SDK 호출 (프론트엔드 - 최초 구독 시):**
    *   기존 문서의 코드는 유효합니다. `customerKey`에 Clerk의 `user.id`를 사용하여 고객을 식별하고 `requestPayment`를 호출합니다.

2.  **API 호출 (서버 - 빌링키 발급):**
    *   `requestPayment`의 `successUrl`로 지정된 API 라우트에서 `authKey`를 받아 빌링키를 발급받고 DB에 저장합니다. 이 코드 역시 유효합니다.

3.  **API 호출 (서버 - Cron Job에서 정기결제 실행 - 추가된 부분):**
    *   Supabase Cron Job이 호출하는 `/app/api/cron/process-subscriptions/route.ts`에서 사용합니다.
    ```typescript
    import { Buffer } from "buffer";

    // ... API 라우트 핸들러 내부, 결제가 필요한 구독 정보를 DB에서 조회한 후 ...

    const subscription = { /* DB에서 조회한 구독자 정보 */
      billingKey: 'some_billing_key_from_db',
      orderId: `sub_${userId}_${new Date().getTime()}`,
      amount: 3900,
      customerEmail: 'customer@example.com',
      // ... 기타 정보
    };
    
    const secretKey = process.env.TOSS_SECRET_KEY!;
    const encodedSecret = Buffer.from(secretKey + ':').toString('base64');

    // 토스페이먼츠 빌링키 결제 승인 API 호출
    const response = await fetch(`https://api.tosspayments.com/v1/billing/authorizations/${subscription.billingKey}/payments`, {
        method: 'POST',
        headers: {
            'Authorization': `Basic ${encodedSecret}`,
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({
            amount: subscription.amount,
            orderId: subscription.orderId,
            orderName: 'Saju맛피아 Pro 요금제 정기결제',
            customerEmail: subscription.customerEmail,
        }),
    });

    if (response.ok) {
        // 결제 성공: Supabase DB에 테스트 횟수 추가 및 구독 기간 연장
    } else {
        // 결제 실패: Supabase DB에서 구독 해지 처리
    }
    ```

---

### 4. Gemini API: AI 사주 분석

Google의 Gemini API는 `@google/generative-ai` SDK를 통해 간단하게 호출할 수 있습니다.

*   **검증 및 개선사항:** 현재 시점(2025년 11월)에서 **`gemini-2.5-pro`와 `gemini-2.5-flash` 모델이 최신이며 유효함을 확인**했습니다. SDK 사용법과 코드 예제는 정확하고 바로 사용할 수 있는 수준입니다.

*   **연동 수단:** **SDK (`@google/generative-ai`)**
*   **사용 기능:**
    *   **SDK:** 사용자가 입력한 사주 정보를 기반으로 프롬프트를 구성하여 AI 모델에 분석을 요청하고, 텍스트 결과를 수신.

#### 설치 및 세팅

1.  **SDK 설치**
    ```bash
    npm install @google/generative-ai
    ```

#### 인증 정보 관리

1.  **위치:** Google AI Studio > Get API key
2.  **필요한 키:** `API key`
3.  **설정 (`.env.local`):**
    ```env
    # Gemini
    GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    ```

#### 호출 방법

1.  **SDK 호출 (서버 - 사주 분석 API):**
    *   '새 검사' 페이지에서 fetch 요청을 보낼 API 라우트 (`/app/api/saju-analysis/route.ts`)를 생성합니다. 기존 문서의 코드는 최신 상태이며 유효합니다.
    ```typescript
    import { GoogleGenerativeAI } from "@google/generative-ai";
    import { NextResponse } from 'next/server';

    export async function POST(req: Request) {
      const { name, birthDate, isProUser } = await req.json();

      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const modelName = isProUser ? "gemini-2.5-pro" : "gemini-2.5-flash"; // 요금제에 따른 모델 분기
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const prompt = `당신은 명리학과 사주팔자에 정통한 역술가입니다. 주어진 정보를 바탕으로 내담자의 성격, 재물운, 애정운, 건강운에 대해 상세하고 구체적으로 분석해주세요.
          # 내담자 정보
          - 이름: ${name}
          - 생년월일: ${birthDate}
          ---
          # 분석 결과`;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        // TODO: Supabase DB에 분석 결과 저장
        
        return NextResponse.json({ analysis: text });
      } catch (error) {
        console.error("Gemini API error:", error);
        return NextResponse.json({ error: "Failed to analyze" }, { status: 500 });
      }
    }
    ```