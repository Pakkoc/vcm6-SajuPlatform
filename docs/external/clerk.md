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