## Saju맛피아 MVP 최종 기술 연동 가이드

### 1. Clerk: 인증 및 사용자 관리

Clerk는 Next.js 15 앱 라우터와 완벽하게 통합되어 간편하고 안전한 인증 시스템을 제공합니다.

*   **연동 수단:** **SDK (`@clerk/nextjs`)** & **Webhook**
*   **사용 기능:**
    *   **SDK:** Google 소셜 로그인, 회원가입, 세션 관리, 페이지 접근 제어(미들웨어), 사용자 정보 UI 컴포넌트(`UserButton`) 제공
    *   **Webhook:** Clerk에서 사용자 생성/수정 이벤트 발생 시, 우리 서버로 알림을 보내 Supabase DB와 사용자 정보를 동기화

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
    *   로그인이 필요한 페이지와 필요 없는 페이지를 관리합니다.
    ```typescript
    import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

    // 인증이 필요 없는 공개 페이지 설정
    const isPublicRoute = createRouteMatcher(['/', '/sign-in(.*)', '/sign-up(.*)', '/api/webhooks/clerk']);

    export default clerkMiddleware((auth, request) => {
      if (!isPublicRoute(request)) {
        auth().protect(); // 공개 페이지가 아니면 로그인 페이지로 리디렉션
      }
    });

    export const config = {
      matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
    };
    ```

#### 인증 정보 관리

1.  **위치:** [Clerk Dashboard](https://dashboard.clerk.com/) > (해당 애플리케이션) > **API Keys**
2.  **필요한 키:**
    *   `Publishable key` (공개 가능)
    *   `Secret key` (서버 전용, 절대 노출 금지)
    *   Webhook `Signing secret` (Webhook 설정 후 획득)
3.  **설정 (`.env.local`):**
    ```env
    # Clerk
    NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxxxx
    CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    CLERK_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    ```

#### 호출 방법

1.  **SDK 호출 (UI 컴포넌트 사용)**
    *   회원가입 페이지 (`/app/sign-up/[[...sign-up]]/page.tsx`):
        ```tsx
        import { SignUp } from "@clerk/nextjs";
        export default function Page() { return <SignUp />; }
        ```
    *   로그인 페이지 (`/app/sign-in/[[...sign-in]]/page.tsx`):
        ```tsx
        import { SignIn } from "@clerk/nextjs";
        export default function Page() { return <SignIn />; }
        ```
    *   헤더에서 사용자 프로필 버튼 표시:
        ```tsx
        import { UserButton } from "@clerk/nextjs";
        // ... 컴포넌트 내부
        <UserButton afterSignOutUrl="/" />
        ```

2.  **Webhook 수신 및 검증 (`/app/api/webhooks/clerk/route.ts`)**
    *   Clerk Dashboard > **Webhooks** > `Add Endpoint` 클릭 후, 배포된 서버의 `https://<your-domain>/api/webhooks/clerk` 주소를 등록해야 합니다.
    ```typescript
    import { Webhook } from 'svix';
    import { headers } from 'next/headers';
    import { WebhookEvent } from '@clerk/nextjs/server';

    export async function POST(req: Request) {
      const WEBHOOK_SECRET = process.env.CLERK_WEBHOOK_SECRET;
      if (!WEBHOOK_SECRET) throw new Error('Please add CLERK_WEBHOOK_SECRET from Clerk Dashboard to .env');

      const headerPayload = headers();
      const svix_id = headerPayload.get("svix-id");
      // ... svix 헤더 검증 로직 ...

      const body = await req.json();
      const wh = new Webhook(WEBHOOK_SECRET);
      let evt: WebhookEvent;

      try {
        evt = wh.verify(JSON.stringify(body), { /* svix 헤더 */ }) as WebhookEvent;
      } catch (err) {
        return new Response('Error occured', { status: 400 });
      }

      const { id } = evt.data;
      const eventType = evt.type;

      if (eventType === 'user.created') {
        // Supabase DB에 사용자 프로필 생성 로직
        console.log(`User ${id} was ${eventType}`);
      }
      
      return new Response('', { status: 200 });
    }
    ```

---

### 2. Supabase: 데이터베이스 및 Cron Job

Supabase는 PostgreSQL 데이터베이스와 백엔드 기능을 제공하며, Next.js 15 SSR 환경에 최적화된 SDK를 지원합니다.

*   **연동 수단:** **SDK (`@supabase/ssr`)** & **플랫폼 기능 (Cron Job)**
*   **사용 기능:**
    *   **SDK:** 사용자 프로필, 구독 정보, 사주 분석 내역 등 모든 데이터의 CRUD(생성, 읽기, 수정, 삭제)
    *   **Cron Job:** 매일 특정 시간에 정기 결제를 처리하는 Next.js API를 호출하는 스케줄러

#### 설치 및 세팅

1.  **SDK 설치**
    ```bash
    npm install @supabase/supabase-js @supabase/ssr
    ```
2.  **클라이언트 유틸리티 생성**
    *   Supabase 공식 문서에 따라 서버 컴포넌트용, 클라이언트 컴포넌트용, 미들웨어용 클라이언트를 생성하는 파일을 만듭니다. (예: `/utils/supabase/`)

#### 인증 정보 관리

1.  **위치:** [Supabase Dashboard](https://app.supabase.com/) > (프로젝트 선택) > **Project Settings** > **API**
2.  **필요한 키:**
    *   `Project URL`
    *   `anon` `public` 키 (공개 가능)
3.  **설정 (`.env.local`):**
    ```env
    # Supabase
    NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
    ```

#### 호출 방법

1.  **SDK 호출 (서버 컴포넌트에서 데이터 조회)**
    ```tsx
    import { createClient } from '@/utils/supabase/server'; // 위에서 생성한 유틸리티
    import { cookies } from 'next/headers';

    export default async function DashboardPage() {
      const cookieStore = cookies();
      const supabase = createClient(cookieStore);

      const { data: analysisHistory } = await supabase
        .from('saju_analysis')
        .select('*');

      return (
        // ... JSX
      );
    }
    ```
2.  **Cron Job 설정 (Supabase 대시보드에서)**
    1.  [Supabase Dashboard](https://app.supabase.com/) > (프로젝트 선택) > **Database** > **Cron Jobs** 로 이동합니다.
    2.  `New Job`을 생성합니다.
    3.  **Schedule**에 `0 2 * * *` (매일 새벽 2시)를 입력합니다.
    4.  **Function to run** 탭에서 `http_request`를 선택하고, 우리가 만들 정기결제 API 엔드포인트(예: `https://<your-domain>/api/cron/process-subscriptions`)를 `POST` 방식으로 호출하도록 설정합니다. 보안을 위해 헤더에 `Authorization` 토큰을 추가합니다.

---

### 3. 토스페이먼츠: 구독 결제

토스페이먼츠는 결제 위젯 SDK로 사용자 경험을 높이고, 서버에서는 REST API로 안전하게 결제를 처리하는 구조를 사용합니다.

*   **연동 수단:** **SDK (`@tosspayments/payment-widget-sdk`)** & **REST API**
*   **사용 기능:**
    *   **SDK:** 프론트엔드에서 카드 정보 입력 등 결제 UI를 렌더링하고, 최초 인증을 위한 `authKey`를 발급받는 역할
    *   **API:** 서버에서 `authKey`로 빌링키(정기결제 키)를 발급받고, 이 빌링키를 사용해 매월 정기 결제를 실행

#### 설치 및 세팅

1.  **SDK 설치**
    ```bash
    npm install @tosspayments/payment-widget-sdk
    ```

#### 인증 정보 관리

1.  **위치:** [토스페이먼츠 개발자센터](https://developers.tosspayments.com/) > **API 키**
2.  **필요한 키:**
    *   `클라이언트 키` (공개 가능)
    *   `시크릿 키` (서버 전용, 절대 노출 금지)
3.  **설정 (`.env.local`):**
    ```env
    # Toss Payments
    NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_xxxxxxxxxxxxxxxxxx
    TOSS_SECRET_KEY=test_sk_xxxxxxxxxxxxxxxxxx
    ```

#### 호출 방법

1.  **SDK 호출 (프론트엔드 구독 페이지)**
    ```tsx
    import { loadPaymentWidget, PaymentWidgetInstance } from "@tosspayments/payment-widget-sdk";
    import { useEffect, useRef } from "react";

    export default function SubscribeComponent({ user }) {
      const paymentWidgetRef = useRef<PaymentWidgetInstance | null>(null);
      // ...
      useEffect(() => {
        const clientKey = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!;
        const customerKey = user.id; // Clerk 사용자 ID 등 고객 고유값
        
        loadPaymentWidget(clientKey, customerKey).then(widget => {
          paymentWidgetRef.current = widget;
          widget.renderPaymentMethods('#payment-methods', { value: 3900 });
        });
      }, []);

      const handlePayment = async () => {
        const paymentWidget = paymentWidgetRef.current;
        try {
          // 결제 요청 -> 성공 시 authKey가 담긴 페이지로 리디렉션됨
          await paymentWidget?.requestPayment({
            orderId: `order_${new Date().getTime()}`,
            orderName: 'Saju맛피아 Pro 요금제',
            successUrl: `${window.location.origin}/api/payments/success`,
            failUrl: `${window.location.origin}/subscribe/fail`,
          });
        } catch (error) { console.error(error); }
      };
      // ...
    }
    ```
2.  **API 호출 (서버 - 빌링키 발급)**
    *   위 `successUrl`로 지정된 API 라우트 (`/app/api/payments/success/route.ts`)에서 빌링키를 발급받습니다.
    ```typescript
    import { Buffer } from "buffer";

    export async function GET(request: Request) {
        const { searchParams } = new URL(request.url);
        const authKey = searchParams.get('authKey');
        const customerKey = searchParams.get('customerKey');

        const secretKey = process.env.TOSS_SECRET_KEY!;
        const encodedSecret = Buffer.from(secretKey + ':').toString('base64');

        // 토스페이먼츠 빌링키 발급 API 호출
        const response = await fetch("https://api.tosspayments.com/v1/billing/authorizations/issue", {
            method: 'POST',
            headers: {
                'Authorization': `Basic ${encodedSecret}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ authKey, customerKey }),
        });

        const billingData = await response.json();
        const billingKey = billingData.billingKey;

        // 획득한 billingKey를 Supabase DB에 저장
        // ...

        // 성공 페이지로 리디렉션
    }
    ```

---

### 4. Gemini API: AI 사주 분석

Google의 Gemini API는 SDK를 통해 간단하게 호출하여 강력한 AI 분석 기능을 서비스에 추가할 수 있습니다.

*   **연동 수단:** **SDK (`@google/generative-ai`)**
*   **사용 기능:**
    *   **SDK:** 사용자가 입력한 사주 정보를 바탕으로 AI 모델에 분석을 요청하고, 텍스트 결과를 받아오는 기능

#### 설치 및 세팅

1.  **SDK 설치**
    ```bash
    npm install @google/generative-ai
    ```

#### 인증 정보 관리

1.  **위치:** [Google AI Studio](https://aistudio.google.com/) > **Get API key**
2.  **필요한 키:**
    *   `API key` (서버 전용, 절대 노출 금지)
3.  **설정 (`.env.local`):**
    ```env
    # Gemini
    GEMINI_API_KEY=AIzaSyxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
    ```

#### 호출 방법

1.  **SDK 호출 (서버 - 사주 분석 API)**
    *   `'새 검사'` 페이지에서 fetch 요청을 보낼 API 라우트 (`/app/api/saju-analysis/route.ts`)를 생성합니다.
    ```typescript
    import { GoogleGenerativeAI } from "@google/generative-ai";

    export async function POST(req: Request) {
      const { name, birthDate, isProUser } = await req.json();

      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
        const modelName = isProUser ? "gemini-2.5-pro" : "gemini-2.5-flash";
        const model = genAI.getGenerativeModel({ model: modelName });
        
        const prompt = `
          # Instruction
          You are a saju (Korean fortune-telling) master. Analyze the provided information and give a detailed analysis.
          
          # User Information
          - Name: ${name}
          - Birth Date: ${birthDate}

          # Analysis Result
        `;

        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        return new Response(JSON.stringify({ analysis: text }), { status: 200 });
      } catch (error) {
        return new Response("Failed to analyze", { status: 500 });
      }
    }
    ```