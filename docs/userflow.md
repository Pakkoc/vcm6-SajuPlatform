# User Flow: Saju맛피아

## 목차
1. [회원가입 플로우](#1-회원가입-플로우)
2. [로그인 플로우](#2-로그인-플로우)
3. [사주 분석 요청 플로우](#3-사주-분석-요청-플로우)
4. [대시보드 조회 플로우](#4-대시보드-조회-플로우)
5. [분석 상세보기 플로우](#5-분석-상세보기-플로우)
6. [Pro 구독 업그레이드 플로우](#6-pro-구독-업그레이드-플로우)
7. [구독 취소 플로우](#7-구독-취소-플로우)
8. [구독 취소 철회 플로우](#8-구독-취소-철회-플로우)
9. [구독 즉시 해지 플로우](#9-구독-즉시-해지-플로우)
10. [정기결제 자동 실행 플로우](#10-정기결제-자동-실행-플로우)
11. [Clerk Webhook 사용자 동기화 플로우](#11-clerk-webhook-사용자-동기화-플로우)

---

## 1. 회원가입 플로우

### 입력
1. 사용자가 랜딩 페이지에서 회원가입 버튼 클릭
2. `/sign-up` 페이지로 이동
3. Clerk 회원가입 UI에서 Google 계정 선택 버튼 클릭
4. Google OAuth 동의 화면에서 계정 선택 및 권한 승인

### 처리
1. **Clerk 인증 처리**
   - Google OAuth 토큰 검증
   - Clerk 시스템에 사용자 계정 생성
   - `user.created` Webhook 이벤트 발생
   - 세션 토큰 생성 및 쿠키 저장

2. **Webhook 수신 및 검증** (`POST /api/webhooks/clerk`)
   - Svix 서명 헤더 추출 (`svix-id`, `svix-timestamp`, `svix-signature`)
   - 환경변수 `CLERK_WEBHOOK_SECRET` 로드
   - Webhook 페이로드 서명 검증
   - 검증 실패 시 400 에러 반환 및 처리 중단

3. **사용자 프로필 생성** (검증 성공 시)
   - Webhook 페이로드에서 사용자 정보 추출:
     - `clerk_user_id`: Clerk의 user.id
     - `email`: 사용자 이메일
     - `first_name`, `last_name`: 사용자 이름 (선택)
   - Supabase `users` 테이블에 신규 레코드 삽입
   - 생성 시각 `created_at`, `updated_at` 자동 설정

4. **초기 구독 설정**
   - Supabase `subscriptions` 테이블에 신규 레코드 삽입:
     - `user_id`: 생성된 users.id (FK)
     - `plan`: 'free'
     - `status`: 'active'
     - `remaining_count`: 1
     - `billing_key`: null
     - `next_billing_date`: null
   - 트랜잭션으로 users와 subscriptions 동시 생성 보장

5. **리다이렉션 처리**
   - Clerk 미들웨어가 인증 상태 확인
   - 기본 리다이렉트 경로 `/dashboard` 또는 `/new-analysis`로 이동

### 출력
1. **성공 시**:
   - 사용자가 로그인 상태로 전환
   - 대시보드 또는 새 검사 페이지로 자동 이동
   - Sidebar에 구독 정보 표시:
     - 이메일 주소
     - 잔여 횟수: 1회
     - 요금제: Free 배지

2. **실패 시 (엣지케이스)**:
   - **Google OAuth 거부**: Clerk 에러 메시지 표시, 회원가입 페이지 유지
   - **Webhook 검증 실패**: 서버 로그에 에러 기록, 사용자에게는 영향 없음 (Clerk 계정은 생성됨)
   - **DB 삽입 실패**: 서버 로그에 에러 기록, 다음 로그인 시 재시도 로직 필요
   - **네트워크 오류**: Clerk 자체 에러 핸들링으로 재시도 유도

### 사이드 이펙트
- Clerk 시스템에 사용자 계정 영구 생성
- Supabase `users` 테이블에 레코드 추가
- Supabase `subscriptions` 테이블에 Free 플랜 레코드 추가
- 세션 쿠키 브라우저에 저장

---

## 2. 로그인 플로우

### 입력
1. 사용자가 랜딩 페이지 또는 로그인 버튼 클릭
2. `/sign-in` 페이지로 이동
3. Clerk 로그인 UI에서 Google 계정 선택 버튼 클릭
4. Google OAuth 동의 화면에서 계정 선택

### 처리
1. **Clerk 인증 처리**
   - Google OAuth 토큰 검증
   - Clerk 시스템에서 기존 사용자 계정 조회
   - 계정 존재 확인
   - 세션 토큰 생성 및 쿠키 저장

2. **세션 검증**
   - Clerk 미들웨어가 세션 토큰 검증
   - 유효한 세션인지 확인
   - 만료된 경우 자동 갱신 시도

3. **리다이렉션 처리**
   - 인증 성공 시 `/dashboard`로 이동
   - 이전에 방문하려던 보호된 페이지가 있으면 해당 페이지로 이동

### 출력
1. **성공 시**:
   - 사용자가 로그인 상태로 전환
   - 대시보드 페이지로 이동
   - Header에 프로필 버튼 (`<UserButton />`) 표시
   - Sidebar에 현재 구독 정보 표시

2. **실패 시 (엣지케이스)**:
   - **계정 없음**: Clerk 에러 메시지 표시, 회원가입 페이지 링크 제공
   - **Google OAuth 거부**: 로그인 페이지 유지, 에러 메시지 표시
   - **세션 만료**: 자동 재로그인 유도 또는 로그인 페이지로 리다이렉트
   - **네트워크 오류**: Clerk 에러 핸들링으로 재시도 유도

### 사이드 이펙트
- 세션 쿠키 브라우저에 저장 또는 갱신
- Clerk 시스템에 로그인 이벤트 기록

---

## 3. 사주 분석 요청 플로우

### 입력
1. 사용자가 `/new-analysis` 페이지 접근
2. 입력 폼에 정보 입력:
   - 이름 (필수, text input)
   - 생년월일 (필수, date picker)
   - 출생 시간 (선택, time picker - 시/분/초)
   - "출생 시간 모름" 체크박스 (선택)
   - 성별 (필수, radio button: 남성/여성)
3. 검사 시작 버튼 클릭

### 처리
1. **클라이언트 측 유효성 검증**
   - 필수 필드 입력 여부 확인 (이름, 생년월일, 성별)
   - 생년월일 형식 검증 (유효한 날짜인지)
   - 출생 시간 형식 검증 (입력된 경우)
   - 검증 실패 시 에러 메시지 표시 및 처리 중단

2. **사용자 인증 확인**
   - Clerk 세션에서 `user.id` 추출
   - 세션 없으면 로그인 페이지로 리다이렉트

3. **구독 정보 조회** (`GET /api/subscription`)
   - Supabase에서 현재 사용자의 구독 정보 조회
   - `user_id`로 `subscriptions` 테이블 쿼리
   - `plan`, `status`, `remaining_count` 추출

4. **잔여 횟수 검증**
   - **Case 1: Free 플랜 & 잔여 0회**
     - Alert 모달 표시
     - 구독 페이지 이동 버튼 제공
     - 처리 중단
   - **Case 2: Pro 플랜 & 잔여 0회**
     - Alert 모달 표시
     - 처리 중단
   - **Case 3: 잔여 횟수 있음**
     - 다음 단계 진행

5. **분석 중 모달 표시**
   - 로딩 스피너 렌더링
   - 예상 소요 시간 안내 메시지 표시
   - 사용자 입력 비활성화

6. **사주 분석 API 호출** (`POST /api/saju-analysis`)
   - 요청 바디 구성:
     ```json
     {
       "name": "입력된 이름",
       "birthDate": "YYYY-MM-DD",
       "birthTime": "HH:MM:SS" | null,
       "gender": "male" | "female"
     }
     ```
   - 서버에서 Clerk 세션 검증
   - 구독 정보 재조회 (동시성 이슈 방지)
   - 잔여 횟수 재검증

7. **AI 모델 선택**
   - `plan === 'free'` → `gemini-2.5-flash`
   - `plan === 'pro'` → `gemini-2.5-pro`

8. **Gemini API 호출**
   - 환경변수 `GEMINI_API_KEY` 로드
   - GoogleGenerativeAI 인스턴스 생성
   - 프롬프트 구성:
     - 역술가 페르소나 설정
     - 사용자 입력 정보 포함 (이름, 생년월일, 출생시간, 성별)
     - 분석 요청 항목: 성격, 재물운, 애정운, 건강운
   - `model.generateContent(prompt)` 호출
   - 응답 텍스트 추출

9. **분석 결과 저장**
   - Supabase `saju_analyses` 테이블에 삽입:
     - `user_id`: 현재 사용자 ID
     - `name`: 입력된 이름
     - `birth_date`: 생년월일
     - `birth_time`: 출생 시간 (nullable)
     - `gender`: 성별
     - `model_used`: 사용된 AI 모델명
     - `result`: Gemini API 응답 텍스트 (Markdown)
     - `created_at`: 현재 시각
   - 생성된 레코드 ID 반환

10. **잔여 횟수 차감**
    - Supabase `subscriptions` 테이블 업데이트:
      - `remaining_count = remaining_count - 1`
      - `updated_at = NOW()`
    - 트랜잭션으로 분석 저장과 횟수 차감 원자성 보장

11. **API 응답 반환**
    - 성공 응답:
      ```json
      {
        "success": true,
        "data": {
          "analysisId": "uuid",
          "summary": "분석 결과 첫 3-4줄",
          "remainingCount": 0
        }
      }
      ```

### 출력
1. **성공 시**:
   - 분석 중 모달이 분석 완료 모달로 전환
   - 분석 결과 요약 텍스트 표시 (첫 3-4줄)
   - 액션 버튼 2개 표시:
     - "전체 결과 보기" → `/analysis/[id]`로 이동
     - "닫기" → `/dashboard`로 이동
   - Sidebar의 잔여 횟수 실시간 업데이트

2. **실패 시 (엣지케이스)**:
   - **필수 필드 누락**: 해당 필드에 에러 메시지 표시, 폼 제출 방지
   - **잔여 횟수 0회**: Alert 모달 표시, 구독 페이지 이동 유도
   - **Gemini API 오류** (429 Rate Limit, 500 Server Error):
     - 에러 모달 표시
     - 잠시 후 재시도 안내
     - 잔여 횟수 차감 롤백
   - **Gemini API 타임아웃** (30초 초과):
     - 타임아웃 에러 모달 표시
     - 재시도 버튼 제공
     - 잔여 횟수 차감 롤백
   - **DB 저장 실패**:
     - 에러 모달 표시
     - 서버 로그에 상세 에러 기록
     - 잔여 횟수 차감 롤백
   - **네트워크 오류**:
     - 네트워크 에러 모달 표시
     - 재시도 버튼 제공
   - **동시성 이슈** (여러 탭에서 동시 요청):
     - 서버에서 잔여 횟수 재검증으로 방지
     - 먼저 처리된 요청만 성공, 나머지는 잔여 횟수 부족 에러

### 사이드 이펙트
- Supabase `saju_analyses` 테이블에 분석 결과 레코드 추가
- Supabase `subscriptions` 테이블의 `remaining_count` 1 감소
- Gemini API 사용량 증가 (비용 발생)
- 서버 로그에 분석 요청 기록

---

## 4. 대시보드 조회 플로우

### 입력
1. 사용자가 Header 또는 Sidebar에서 대시보드 메뉴 클릭
2. `/dashboard` 페이지로 이동
3. (선택) 검색바에 이름 입력

### 처리
1. **사용자 인증 확인**
   - Clerk 미들웨어가 세션 검증
   - 세션 없으면 로그인 페이지로 리다이렉트

2. **분석 내역 조회** (서버 컴포넌트)
   - Clerk 세션에서 `user.id` 추출
   - Supabase `saju_analyses` 테이블 쿼리:
     - `WHERE user_id = current_user_id`
     - `ORDER BY created_at DESC`
   - 모든 분석 레코드 조회 (페이지네이션 없음, MVP)

3. **빈 상태 확인**
   - 조회 결과가 0건인지 확인
   - 빈 상태일 경우 별도 UI 렌더링

4. **검색 필터링** (클라이언트 사이드)
   - 사용자가 검색어 입력 시
   - 조회된 분석 목록에서 `name` 필드 필터링
   - 대소문자 구분 없이 부분 일치 검색
   - 실시간 필터링 (debounce 없음)

5. **카드 그리드 렌더링**
   - 1×3 반응형 그리드 레이아웃
   - 각 카드에 표시할 정보:
     - 분석 대상자 이름
     - 생년월일 (YYYY-MM-DD 형식)
     - 분석 일시 (상대 시간: "3일 전")
     - 결과 요약 (첫 2줄, 말줄임표)

### 출력
1. **분석 내역 있음**:
   - 페이지 제목 표시
   - 검색바 렌더링
   - 분석 카드 그리드 표시
   - 각 카드 클릭 가능 (hover 효과)

2. **분석 내역 없음 (빈 상태)**:
   - 빈 상태 메시지 표시
   - CTA 버튼 표시 → `/new-analysis`

3. **검색 결과 없음**:
   - 검색 결과 없음 메시지 표시
   - 검색어 초기화 버튼 제공

4. **실패 시 (엣지케이스)**:
   - **DB 조회 오류**: 에러 메시지 표시, 새로고침 버튼 제공
   - **네트워크 오류**: 네트워크 에러 메시지 표시, 재시도 버튼
   - **세션 만료**: 자동으로 로그인 페이지로 리다이렉트

### 사이드 이펙트
- 없음 (읽기 전용 작업)

---

## 5. 분석 상세보기 플로우

### 입력
1. 사용자가 대시보드에서 분석 카드 클릭
2. `/analysis/[id]` 페이지로 이동 (동적 라우팅)

### 처리
1. **사용자 인증 확인**
   - Clerk 미들웨어가 세션 검증
   - 세션 없으면 로그인 페이지로 리다이렉트

2. **분석 ID 추출**
   - URL 파라미터에서 `id` 추출
   - UUID 형식 검증

3. **분석 데이터 조회** (서버 컴포넌트)
   - Clerk 세션에서 `user.id` 추출
   - Supabase `saju_analyses` 테이블 쿼리:
     - `WHERE id = analysis_id AND user_id = current_user_id`
   - 단일 레코드 조회

4. **권한 검증**
   - 조회 결과가 없으면 404 처리
   - 다른 사용자의 분석은 접근 불가

5. **Markdown 렌더링 준비**
   - 분석 결과 텍스트를 Markdown 파서로 변환
   - 섹션별 구분 (성격, 재물운, 애정운, 건강운 등)

6. **UI 렌더링**
   - 대상자 정보 카드 렌더링
   - 분석 결과 본문 렌더링 (Markdown → HTML)
   - 하단 액션 버튼 렌더링

### 출력
1. **성공 시**:
   - 대상자 정보 카드 표시:
     - 이름
     - 생년월일
     - 출생 시간 (입력된 경우만)
     - 성별
     - 분석 일시
     - 사용된 AI 모델 배지
   - 분석 결과 본문 표시 (Markdown 스타일링)
   - 하단 액션 버튼 2개:
     - "대시보드로 돌아가기" → `/dashboard`
     - "새 분석 시작" → `/new-analysis`

2. **실패 시 (엣지케이스)**:
   - **잘못된 ID 형식**: 400 에러 페이지 표시
   - **분석 없음 또는 권한 없음**: 404 에러 페이지 표시
   - **DB 조회 오류**: 에러 메시지 표시, 대시보드로 돌아가기 버튼
   - **세션 만료**: 자동으로 로그인 페이지로 리다이렉트

### 사이드 이펙트
- 없음 (읽기 전용 작업)

---

## 6. Pro 구독 업그레이드 플로우

### 입력
1. 사용자가 `/subscription` 페이지 접근 (Free 플랜 상태)
2. "Pro 요금제 업그레이드" 버튼 클릭

### 처리
1. **사용자 인증 확인**
   - Clerk 세션 검증
   - 세션 없으면 로그인 페이지로 리다이렉트

2. **현재 구독 상태 확인**
   - Supabase에서 현재 사용자의 구독 정보 조회
   - `plan`이 'free'인지 확인
   - 이미 'pro'면 업그레이드 버튼 숨김 처리

3. **토스페이먼츠 결제 위젯 초기화**
   - 환경변수 `NEXT_PUBLIC_TOSS_CLIENT_KEY` 로드
   - `@tosspayments/payment-widget-sdk` 로드
   - 결제 위젯 인스턴스 생성:
     - `clientKey`: 클라이언트 키
     - `customerKey`: Clerk `user.id`
     - `amount`: 3900 (원)

4. **결제 위젯 렌더링**
   - 결제 수단 선택 UI 표시 (카드)
   - 결제 금액 표시: ₩3,900
   - 결제 주기 안내: 매월 자동 결제
   - 결제하기 버튼 활성화

5. **결제 요청**
   - 사용자가 결제하기 버튼 클릭
   - `requestPayment` 메서드 호출:
     - `method`: 'BILLING'
     - `amount`: 3900
     - `orderId`: 고유 주문 ID 생성 (timestamp 기반)
     - `orderName`: 구독 상품명
     - `successUrl`: `/api/subscription/success`
     - `failUrl`: `/subscription?error=payment_failed`

6. **토스페이먼츠 인증 페이지**
   - 사용자가 카드 정보 입력 (카드번호, 유효기간, CVC)
   - 3DS 인증 (필요 시)
   - 인증 완료 시 `authKey` 발급

7. **성공 콜백 처리** (`GET /api/subscription/success`)
   - 쿼리 파라미터에서 `authKey`, `orderId` 추출
   - Clerk 세션에서 `user.id` 추출

8. **빌링키 발급** (서버)
   - 토스페이먼츠 API 호출:
     - `POST https://api.tosspayments.com/v1/billing/authorizations/issue`
     - Authorization 헤더: `Basic {Base64(TOSS_SECRET_KEY:)}`
     - Body:
       ```json
       {
         "authKey": "받은 authKey",
         "customerKey": "user.id"
       }
       ```
   - 응답에서 `billingKey` 추출

9. **첫 결제 실행**
   - 토스페이먼츠 API 호출:
     - `POST https://api.tosspayments.com/v1/billing/{billingKey}/payments`
     - Body:
       ```json
       {
         "amount": 3900,
         "orderId": "주문ID",
         "orderName": "Saju맛피아 Pro 요금제",
         "customerEmail": "사용자 이메일"
       }
       ```
   - 결제 성공 여부 확인

10. **구독 정보 업데이트** (결제 성공 시)
    - Supabase `subscriptions` 테이블 업데이트:
      - `plan = 'pro'`
      - `status = 'active'`
      - `billing_key = 발급받은 빌링키`
      - `remaining_count = 10`
      - `next_billing_date = 현재일 + 1개월`
      - `updated_at = NOW()`
    - 트랜잭션으로 원자성 보장

11. **리다이렉션**
    - 성공 시 `/subscription?success=true`로 이동

### 출력
1. **성공 시**:
   - 구독 관리 페이지로 리다이렉트
   - 성공 토스트 메시지 표시
   - 구독 정보 카드 업데이트:
     - 요금제: Pro 배지 (파란색)
     - 잔여 횟수: 10회
     - 다음 결제일: 1개월 후 날짜
     - 결제 금액: ₩3,900
   - Sidebar 구독 상태 실시간 업데이트

2. **실패 시 (엣지케이스)**:
   - **결제 위젯 로드 실패**: 에러 메시지 표시, 새로고침 유도
   - **사용자가 결제 취소**: `failUrl`로 리다이렉트, 취소 메시지 표시
   - **카드 인증 실패**: 토스페이먼츠 에러 메시지 표시, 재시도 유도
   - **빌링키 발급 실패**: 에러 모달 표시, 고객센터 안내
   - **첫 결제 실패** (잔액 부족, 한도 초과):
     - 결제 실패 메시지 표시
     - 다른 카드로 재시도 유도
     - 빌링키 삭제 (발급되었으나 결제 실패한 경우)
   - **DB 업데이트 실패**:
     - 에러 로그 기록
     - 결제는 성공했으나 구독 상태 미반영
     - 관리자 수동 처리 필요 (알림 발송)
   - **네트워크 오류**: 네트워크 에러 메시지 표시, 재시도 버튼

### 사이드 이펙트
- 토스페이먼츠에 빌링키 등록
- 토스페이먼츠에서 첫 결제 실행 (₩3,900 청구)
- Supabase `subscriptions` 테이블 업데이트 (Pro 전환)
- 사용자 이메일로 결제 영수증 발송 (토스페이먼츠 자동)

---

## 7. 구독 취소 플로우

### 입력
1. 사용자가 `/subscription` 페이지 접근 (Pro 플랜, 활성 상태)
2. "구독 취소" 버튼 클릭
3. 확인 모달에서 "확인" 버튼 클릭

### 처리
1. **사용자 인증 확인**
   - Clerk 세션 검증
   - 세션 없으면 로그인 페이지로 리다이렉트

2. **현재 구독 상태 확인**
   - Supabase에서 현재 사용자의 구독 정보 조회
   - `plan === 'pro'` 및 `status === 'active'` 확인
   - 조건 불일치 시 에러 처리

3. **확인 모달 표시**
   - 취소 안내 메시지 표시
   - 다음 결제일까지 Pro 혜택 유지 안내
   - 확인/취소 버튼 제공

4. **구독 취소 API 호출** (`POST /api/subscription/cancel`)
   - Clerk 세션에서 `user.id` 추출
   - Supabase `subscriptions` 테이블 업데이트:
     - `status = 'pending_cancellation'`
     - `updated_at = NOW()`
   - `next_billing_date`는 유지 (해당 날짜까지 Pro 혜택 유지)

5. **응답 반환**
   - 성공 응답:
     ```json
     {
       "success": true,
       "message": "구독이 취소 예정 상태로 변경되었습니다",
       "nextBillingDate": "YYYY-MM-DD"
     }
     ```

### 출력
1. **성공 시**:
   - 모달 닫힘
   - 성공 토스트 메시지 표시
   - 구독 정보 카드 업데이트:
     - 구독 상태 배지: "다음 결제일까지 이용 가능" (주황색)
     - 다음 결제일 표시 유지
     - "구독 취소" 버튼 숨김
     - "취소 철회" 버튼 표시
   - Pro 혜택은 다음 결제일까지 유지:
     - 잔여 횟수 그대로
     - gemini-2.5-pro 모델 사용 가능

2. **실패 시 (엣지케이스)**:
   - **이미 취소 상태**: 에러 메시지 표시, 페이지 새로고침
   - **Free 플랜 사용자**: 에러 메시지 표시 (취소할 구독 없음)
   - **DB 업데이트 실패**: 에러 모달 표시, 재시도 버튼
   - **네트워크 오류**: 네트워크 에러 메시지 표시, 재시도 버튼

### 사이드 이펙트
- Supabase `subscriptions` 테이블의 `status` 필드 업데이트
- 다음 결제일에 Cron Job이 구독을 Free로 전환 (자동 결제 스킵)

---

## 8. 구독 취소 철회 플로우

### 입력
1. 사용자가 `/subscription` 페이지 접근 (Pro 플랜, 취소 예정 상태)
2. "취소 철회" 버튼 클릭

### 처리
1. **사용자 인증 확인**
   - Clerk 세션 검증
   - 세션 없으면 로그인 페이지로 리다이렉트

2. **현재 구독 상태 확인**
   - Supabase에서 현재 사용자의 구독 정보 조회
   - `plan === 'pro'` 및 `status === 'pending_cancellation'` 확인
   - 조건 불일치 시 에러 처리

3. **다음 결제일 검증**
   - `next_billing_date`가 현재 날짜보다 미래인지 확인
   - 이미 지난 경우 철회 불가 (Free로 전환됨)

4. **구독 재활성화 API 호출** (`POST /api/subscription/reactivate`)
   - Clerk 세션에서 `user.id` 추출
   - Supabase `subscriptions` 테이블 업데이트:
     - `status = 'active'`
     - `updated_at = NOW()`
   - `next_billing_date`는 유지

5. **응답 반환**
   - 성공 응답:
     ```json
     {
       "success": true,
       "message": "구독이 다시 활성화되었습니다"
     }
     ```

### 출력
1. **성공 시**:
   - 성공 토스트 메시지 표시
   - 구독 정보 카드 업데이트:
     - 구독 상태 배지: "구독 중" (초록색)
     - 다음 결제일 표시 유지
     - "취소 철회" 버튼 숨김
     - "구독 취소" 버튼 표시
   - 다음 결제일에 정상적으로 자동 결제 진행

2. **실패 시 (엣지케이스)**:
   - **이미 활성 상태**: 에러 메시지 표시, 페이지 새로고침
   - **다음 결제일 지남**: 에러 메시지 표시 (철회 불가, 재구독 필요)
   - **DB 업데이트 실패**: 에러 모달 표시, 재시도 버튼
   - **네트워크 오류**: 네트워크 에러 메시지 표시, 재시도 버튼

### 사이드 이펙트
- Supabase `subscriptions` 테이블의 `status` 필드 업데이트
- 다음 결제일에 Cron Job이 정상적으로 자동 결제 실행

---

## 9. 구독 즉시 해지 플로우

### 입력
1. 사용자가 `/subscription` 페이지 접근 (Pro 플랜)
2. "구독 해지" 버튼 클릭
3. 확인 모달에서 "확인" 버튼 클릭

### 처리
1. **사용자 인증 확인**
   - Clerk 세션 검증
   - 세션 없으면 로그인 페이지로 리다이렉트

2. **현재 구독 상태 확인**
   - Supabase에서 현재 사용자의 구독 정보 조회
   - `plan === 'pro'` 확인
   - `billing_key` 존재 여부 확인

3. **확인 모달 표시**
   - 즉시 해지 경고 메시지 표시
   - 빌링키 삭제 안내
   - 재구독 시 새로운 카드 등록 필요 안내
   - 확인/취소 버튼 제공

4. **빌링키 삭제** (`DELETE /api/subscription/billing-key`)
   - 토스페이먼츠 API 호출 (빌링키 삭제 API 있다면):
     - `DELETE https://api.tosspayments.com/v1/billing/authorizations/{billingKey}`
     - Authorization 헤더: `Basic {Base64(TOSS_SECRET_KEY:)}`
   - 토스페이먼츠에서 빌링키 삭제 확인

5. **구독 해지 처리** (`POST /api/subscription/terminate`)
   - Clerk 세션에서 `user.id` 추출
   - Supabase `subscriptions` 테이블 업데이트:
     - `plan = 'free'`
     - `status = 'active'`
     - `billing_key = null`
     - `remaining_count = 0`
     - `next_billing_date = null`
     - `updated_at = NOW()`
   - 트랜잭션으로 원자성 보장

6. **응답 반환**
   - 성공 응답:
     ```json
     {
       "success": true,
       "message": "구독이 즉시 해지되었습니다"
     }
     ```

### 출력
1. **성공 시**:
   - 모달 닫힘
   - 성공 토스트 메시지 표시
   - 구독 정보 카드 업데이트:
     - 요금제: Free 배지
     - 잔여 횟수: 0회
     - 다음 결제일: 표시 안 함
     - "Pro 요금제 업그레이드" 버튼 표시
   - Sidebar 구독 상태 실시간 업데이트
   - 즉시 Pro 혜택 상실:
     - 새 분석 시 gemini-2.5-flash 모델 사용
     - 잔여 횟수 0회로 새 분석 불가

2. **실패 시 (엣지케이스)**:
   - **이미 Free 플랜**: 에러 메시지 표시 (해지할 구독 없음)
   - **빌링키 삭제 실패**: 에러 로그 기록, DB는 업데이트 진행 (수동 처리 필요)
   - **DB 업데이트 실패**: 에러 모달 표시, 재시도 버튼
   - **네트워크 오류**: 네트워크 에러 메시지 표시, 재시도 버튼

### 사이드 이펙트
- 토스페이먼츠에서 빌링키 삭제
- Supabase `subscriptions` 테이블 업데이트 (Free 전환)
- 즉시 Pro 혜택 상실

---

## 10. 정기결제 자동 실행 플로우

### 입력
1. Supabase Cron Job이 매일 02:00 (KST)에 트리거
2. Cron Job이 Next.js API 호출: `POST /api/cron/process-subscriptions`
3. 요청 헤더에 `Authorization: Bearer {CRON_SECRET}` 포함

### 처리
1. **Cron 호출 검증**
   - 요청 헤더에서 `Authorization` 추출
   - 환경변수 `CRON_SECRET` 로드
   - Bearer 토큰 검증
   - 불일치 시 401 Unauthorized 반환 및 처리 중단

2. **오늘 결제일인 구독 조회**
   - Supabase `subscriptions` 테이블 쿼리:
     - `WHERE plan = 'pro'`
     - `AND status IN ('active', 'pending_cancellation')`
     - `AND next_billing_date = CURRENT_DATE`
   - 결제 대상 구독 목록 추출

3. **각 구독별 처리 (순차 또는 병렬)**
   - 조회된 각 구독에 대해 반복:

   **3-1. 사용자 정보 조회**
   - `user_id`로 `users` 테이블에서 이메일 조회

   **3-2. 빌링키 확인**
   - `billing_key` 존재 여부 확인
   - 없으면 해당 구독 스킵 및 에러 로그 기록

   **3-3. 주문 ID 생성**
   - 고유 주문 ID 생성: `sub_{user_id}_{timestamp}`

   **3-4. 토스페이먼츠 결제 API 호출**
   - `POST https://api.tosspayments.com/v1/billing/authorizations/{billingKey}/payments`
   - Authorization 헤더: `Basic {Base64(TOSS_SECRET_KEY:)}`
   - Body:
     ```json
     {
       "amount": 3900,
       "orderId": "생성된 주문ID",
       "orderName": "Saju맛피아 Pro 요금제 정기결제",
       "customerEmail": "사용자 이메일"
     }
     ```

   **3-5. 결제 성공 처리**
   - 응답 상태 코드 200 확인
   - Supabase `subscriptions` 테이블 업데이트:
     - `remaining_count = 10` (리셋)
     - `next_billing_date = next_billing_date + INTERVAL '1 month'`
     - `updated_at = NOW()`
   - 성공 로그 기록

   **3-6. 결제 실패 처리**
   - 응답 상태 코드 400/500 등 에러 확인
   - 실패 사유 로그 기록 (잔액 부족, 카드 정지 등)
   - Supabase `subscriptions` 테이블 업데이트:
     - `plan = 'free'`
     - `status = 'active'`
     - `billing_key = null` (삭제)
     - `remaining_count = 0`
     - `next_billing_date = null`
     - `updated_at = NOW()`
   - 구독 해지 처리

   **3-7. 취소 예정 상태 처리**
   - `status === 'pending_cancellation'`인 경우
   - 결제 API 호출 스킵
   - Supabase `subscriptions` 테이블 업데이트:
     - `plan = 'free'`
     - `status = 'active'`
     - `billing_key = null`
     - `remaining_count = 0`
     - `next_billing_date = null`
   - Free 플랜으로 전환

4. **처리 결과 집계**
   - 성공 건수, 실패 건수, 취소 건수 집계
   - 전체 처리 결과 로그 기록

5. **응답 반환**
   - 성공 응답:
     ```json
     {
       "success": true,
       "processed": 50,
       "succeeded": 45,
       "failed": 3,
       "cancelled": 2
     }
     ```

### 출력
1. **성공 시**:
   - Cron Job에 200 OK 응답 반환
   - 서버 로그에 처리 결과 기록
   - 결제 성공한 사용자:
     - 잔여 횟수 10회로 리셋
     - 다음 결제일 1개월 연장
     - 이메일로 결제 영수증 수신 (토스페이먼츠 자동)
   - 결제 실패한 사용자:
     - Free 플랜으로 자동 전환
     - 잔여 횟수 0회
     - (선택) 결제 실패 안내 이메일 발송
   - 취소 예정 사용자:
     - Free 플랜으로 전환
     - 빌링키 삭제

2. **실패 시 (엣지케이스)**:
   - **Cron Secret 불일치**: 401 에러 반환, 처리 중단
   - **DB 조회 오류**: 에러 로그 기록, 다음 날 재시도
   - **토스페이먼츠 API 오류** (500 Server Error):
     - 해당 구독 스킵
     - 에러 로그 기록
     - 다음 날 재시도 (결제일 업데이트 안 함)
   - **네트워크 타임아웃**:
     - 해당 구독 스킵
     - 에러 로그 기록
     - 다음 날 재시도
   - **DB 업데이트 실패**:
     - 에러 로그 기록
     - 결제는 성공했으나 구독 상태 미반영
     - 관리자 수동 처리 필요 (알림 발송)

### 사이드 이펙트
- 토스페이먼츠에서 여러 건의 결제 실행 (각 ₩3,900 청구)
- Supabase `subscriptions` 테이블 대량 업데이트
- 결제 성공 시 사용자 이메일로 영수증 발송
- 결제 실패 시 빌링키 삭제 및 구독 해지
- 취소 예정 구독 Free 전환

---

## 11. Clerk Webhook 사용자 동기화 플로우

### 입력
1. Clerk 시스템에서 사용자 이벤트 발생:
   - `user.created`: 신규 회원가입
   - `user.updated`: 사용자 정보 수정
   - `user.deleted`: 사용자 계정 삭제
2. Clerk가 등록된 Webhook URL로 POST 요청: `/api/webhooks/clerk`
3. 요청 헤더에 Svix 서명 포함:
   - `svix-id`
   - `svix-timestamp`
   - `svix-signature`

### 처리
1. **Webhook 서명 검증**
   - 요청 헤더에서 Svix 헤더 추출
   - 환경변수 `CLERK_WEBHOOK_SECRET` 로드
   - Svix Webhook 인스턴스 생성
   - 페이로드와 헤더로 서명 검증
   - 검증 실패 시 400 에러 반환 및 처리 중단

2. **이벤트 타입 확인**
   - 페이로드에서 `type` 필드 추출
   - 이벤트 타입별 분기 처리

3. **user.created 이벤트 처리**
   - 페이로드에서 사용자 정보 추출:
     - `id`: Clerk user ID
     - `email_addresses[0].email_address`: 이메일
     - `first_name`, `last_name`: 이름 (선택)
   - Supabase `users` 테이블에 신규 레코드 삽입:
     - `clerk_user_id = id`
     - `email = email`
     - `created_at = NOW()`
     - `updated_at = NOW()`
   - 생성된 `user.id` 추출

4. **초기 구독 생성**
   - Supabase `subscriptions` 테이블에 신규 레코드 삽입:
     - `user_id = 생성된 user.id`
     - `plan = 'free'`
     - `status = 'active'`
     - `remaining_count = 1`
     - `billing_key = null`
     - `next_billing_date = null`
     - `created_at = NOW()`
     - `updated_at = NOW()`
   - 트랜잭션으로 users와 subscriptions 동시 생성 보장

5. **user.updated 이벤트 처리**
   - 페이로드에서 사용자 정보 추출
   - Supabase `users` 테이블 업데이트:
     - `WHERE clerk_user_id = id`
     - `email = 새 이메일` (변경된 경우)
     - `updated_at = NOW()`

6. **user.deleted 이벤트 처리**
   - 페이로드에서 `id` 추출
   - Supabase에서 사용자 관련 데이터 삭제:
     - `saju_analyses` 테이블: `WHERE user_id IN (SELECT id FROM users WHERE clerk_user_id = id)`
     - `subscriptions` 테이블: `WHERE user_id IN (SELECT id FROM users WHERE clerk_user_id = id)`
     - `users` 테이블: `WHERE clerk_user_id = id`
   - CASCADE 삭제 또는 순차 삭제

7. **응답 반환**
   - 성공 응답:
     ```json
     {
       "message": "Webhook received",
       "eventType": "user.created"
     }
     ```

### 출력
1. **성공 시**:
   - Clerk에 200 OK 응답 반환
   - 서버 로그에 이벤트 처리 기록
   - **user.created**:
     - Supabase에 사용자 프로필 생성
     - Free 플랜 구독 자동 생성
   - **user.updated**:
     - Supabase 사용자 정보 업데이트
   - **user.deleted**:
     - Supabase 사용자 관련 모든 데이터 삭제

2. **실패 시 (엣지케이스)**:
   - **서명 검증 실패**: 400 에러 반환, 처리 중단, 에러 로그 기록
   - **환경변수 누락**: 500 에러 반환, 에러 로그 기록
   - **DB 삽입 실패** (중복 clerk_user_id):
     - 에러 로그 기록
     - 이미 존재하는 사용자면 업데이트로 전환
   - **DB 업데이트 실패**:
     - 에러 로그 기록
     - Clerk에는 200 반환 (재시도 방지)
     - 관리자 수동 처리 필요
   - **트랜잭션 실패**:
     - 롤백 처리
     - 에러 로그 기록
     - Clerk에 500 반환 (재시도 유도)
   - **네트워크 오류**: Clerk가 자동 재시도 (exponential backoff)

### 사이드 이펙트
- Supabase `users` 테이블에 레코드 추가/수정/삭제
- Supabase `subscriptions` 테이블에 레코드 추가/삭제
- Supabase `saju_analyses` 테이블에 레코드 삭제 (user.deleted 시)
- 서버 로그에 Webhook 이벤트 기록

---

## 공통 엣지케이스 및 에러 처리

### 인증 관련
- **세션 만료**: 자동으로 로그인 페이지로 리다이렉트, 원래 URL 저장 후 로그인 성공 시 복귀
- **세션 없음**: Clerk 미들웨어가 자동으로 로그인 페이지로 리다이렉트
- **권한 없음**: 403 에러 페이지 표시, 대시보드로 돌아가기 버튼 제공

### 네트워크 관련
- **네트워크 오류**: 에러 메시지 표시, 재시도 버튼 제공
- **타임아웃**: 타임아웃 메시지 표시, 재시도 버튼 제공
- **API 응답 지연**: 로딩 스피너 표시, 30초 후 타임아웃 처리

### 데이터 관련
- **DB 조회 실패**: 에러 메시지 표시, 새로고침 버튼 제공
- **DB 업데이트 실패**: 에러 메시지 표시, 재시도 버튼 제공, 서버 로그 기록
- **데이터 없음**: 빈 상태 UI 표시, 적절한 CTA 제공

### 외부 API 관련
- **Gemini API 오류**: 에러 메시지 표시, 재시도 버튼, 잔여 횟수 차감 롤백
- **토스페이먼츠 API 오류**: 에러 메시지 표시, 고객센터 안내
- **Clerk API 오류**: Clerk 자체 에러 핸들링 활용

### 동시성 관련
- **동시 요청**: 서버에서 낙관적 잠금 또는 트랜잭션으로 처리
- **중복 결제**: 주문 ID 중복 검사로 방지
- **Race Condition**: 데이터베이스 제약 조건 및 트랜잭션으로 방지

---

## 변경 이력

| 버전 | 날짜 | 작성자 | 변경 내용 |
|------|------|--------|-----------|
| 1.0 | 2025-10-31 | CTO | 초안 작성 - 11개 기능 플로우 정의 |

