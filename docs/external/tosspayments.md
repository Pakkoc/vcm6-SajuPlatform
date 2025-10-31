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