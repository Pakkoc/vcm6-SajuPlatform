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