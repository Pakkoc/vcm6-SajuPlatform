# 🚀 배포 환경 설정 가이드

## 📋 필수 환경 변수 체크리스트

배포 플랫폼(Vercel, Netlify 등)에서 다음 환경 변수를 **모두** 설정해야 합니다:

### ✅ 필수 (Production)

```bash
# Clerk 인증
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_live_...
CLERK_SECRET_KEY=sk_live_...
CLERK_WEBHOOK_SECRET=whsec_...  # ⭐ 배포 후 설정

# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
SUPABASE_URL=https://your-project.supabase.co

# API
NEXT_PUBLIC_API_BASE_URL=/api

# 토스페이먼츠
NEXT_PUBLIC_TOSS_CLIENT_KEY=live_ck_...
TOSS_SECRET_KEY=live_sk_...

# Gemini AI
GEMINI_API_KEY=AIza...

# Cron Job
CRON_SECRET=your-random-secret-here  # ⭐ 직접 생성
```

---

## 🔐 1. CLERK_WEBHOOK_SECRET 설정

### 목적
- Clerk에서 보내는 Webhook 요청을 검증
- 사용자 생성/수정/삭제 이벤트를 Supabase DB와 자동 동기화

### 설정 순서

#### Step 1: 배포 URL 확인
```
예: https://your-app.vercel.app
```

#### Step 2: Clerk Dashboard에서 Webhook 생성

1. **Clerk Dashboard 접속**: https://dashboard.clerk.com
2. **프로젝트 선택**
3. 좌측 메뉴에서 **"Webhooks"** 클릭
4. **"+ Add Endpoint"** 버튼 클릭

#### Step 3: Webhook 설정

```
Endpoint URL: https://your-app.vercel.app/api/webhooks/clerk
```

**Subscribe to events** (다음 3개 선택):
- ✅ `user.created`
- ✅ `user.updated`
- ✅ `user.deleted`

**"Create"** 버튼 클릭

#### Step 4: Signing Secret 복사

생성 후 표시되는 **"Signing Secret"** 복사:
```
whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

#### Step 5: 배포 플랫폼에 환경 변수 추가

**Vercel 예시:**
```
Settings → Environment Variables → Add New

Name: CLERK_WEBHOOK_SECRET
Value: whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Environment: Production (and Preview if needed)
```

**Netlify 예시:**
```
Site settings → Environment variables → Add a variable

Key: CLERK_WEBHOOK_SECRET
Value: whsec_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Scope: Production (and Deploy previews if needed)
```

#### Step 6: 재배포

환경 변수 추가 후 **재배포** 필요:
```bash
# Vercel
vercel --prod

# 또는 Git push로 자동 배포
git push origin main
```

#### Step 7: Webhook 테스트

Clerk Dashboard → Webhooks → 생성한 Endpoint 클릭 → **"Send Test Event"**

**성공 응답 (200 OK):**
```json
{
  "ok": true,
  "data": true
}
```

---

## ⏰ 2. CRON_SECRET 설정

### 목적
- Supabase Cron Job에서 정기 결제 API를 호출할 때 인증
- 외부에서 무단으로 Cron API를 호출하는 것을 방지

### 설정 순서

#### Step 1: 랜덤 시크릿 생성

**방법 1: 온라인 생성기 사용**
```
https://randomkeygen.com/
→ "Fort Knox Passwords" 섹션에서 하나 복사
```

**방법 2: 터미널에서 생성 (Node.js)**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**방법 3: 터미널에서 생성 (OpenSSL)**
```bash
openssl rand -hex 32
```

**생성 예시:**
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

#### Step 2: 배포 플랫폼에 환경 변수 추가

**Vercel:**
```
Settings → Environment Variables → Add New

Name: CRON_SECRET
Value: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
Environment: Production
```

**Netlify:**
```
Site settings → Environment variables → Add a variable

Key: CRON_SECRET
Value: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
Scope: Production
```

#### Step 3: 재배포

```bash
git push origin main
```

#### Step 4: Supabase Cron Job 설정

1. **Supabase Dashboard** 접속
2. **Database → Cron Jobs** (또는 **Extensions → pg_cron**)
3. **"Create a new cron job"** 클릭

**Cron Job 설정:**

```sql
-- 매일 오전 2시(KST)에 실행 (UTC 기준 17:00)
SELECT cron.schedule(
  'process-recurring-payments',
  '0 17 * * *',
  $$
  SELECT
    net.http_post(
      url := 'https://your-app.vercel.app/api/cron/process-subscriptions',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6'
      ),
      body := '{}'::jsonb
    ) AS request_id;
  $$
);
```

**주의사항:**
- `url`을 실제 배포 URL로 변경
- `Authorization` 헤더의 Bearer 토큰을 실제 `CRON_SECRET` 값으로 변경
- 시간대 확인 (UTC 기준)

#### Step 5: Cron Job 테스트

**수동 실행 (Supabase SQL Editor):**
```sql
SELECT
  net.http_post(
    url := 'https://your-app.vercel.app/api/cron/process-subscriptions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6'
    ),
    body := '{}'::jsonb
  ) AS request_id;
```

**성공 응답 확인:**
```json
{
  "ok": true,
  "data": {
    "processed": 0,
    "succeeded": 0,
    "failed": 0,
    "cancelled": 0
  }
}
```

---

## 🔍 3. 환경 변수 검증

### 배포 후 확인 방법

#### 방법 1: 브라우저에서 직접 테스트

**Clerk Webhook 테스트:**
1. 실제로 회원가입 시도
2. Supabase `users` 테이블에 데이터 자동 생성 확인
3. `subscriptions` 테이블에 Free 플랜 자동 생성 확인

**Cron Job 테스트:**
1. Supabase에서 수동 실행 (위 SQL)
2. 배포 플랫폼 로그 확인 (Vercel Functions 로그)

#### 방법 2: API 직접 호출

**Webhook 테스트 (Clerk Dashboard에서):**
```
Webhooks → Your Endpoint → Send Test Event
```

**Cron 테스트 (curl):**
```bash
curl -X POST https://your-app.vercel.app/api/cron/process-subscriptions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-cron-secret-here"
```

---

## ❌ 일반적인 오류 및 해결

### 오류 1: "CLERK_WEBHOOK_SECRET이 필요합니다"

**원인**: 환경 변수가 설정되지 않음

**해결:**
1. 배포 플랫폼에서 `CLERK_WEBHOOK_SECRET` 추가
2. 재배포
3. Clerk Dashboard에서 Webhook 재테스트

### 오류 2: "CRON_SECRET 환경 변수가 설정되지 않았습니다"

**원인**: 환경 변수가 설정되지 않음

**해결:**
1. 배포 플랫폼에서 `CRON_SECRET` 추가
2. 재배포
3. Supabase Cron Job에서 수동 실행 테스트

### 오류 3: Webhook 검증 실패 (400 Bad Request)

**원인**: Signing Secret이 잘못됨

**해결:**
1. Clerk Dashboard에서 정확한 Signing Secret 재확인
2. 환경 변수 값 다시 복사/붙여넣기
3. 재배포

### 오류 4: Cron Job 401 Unauthorized

**원인**: Authorization 헤더가 잘못됨

**해결:**
1. Supabase Cron Job SQL에서 Bearer 토큰 확인
2. 배포 플랫폼의 `CRON_SECRET` 값과 일치하는지 확인
3. 공백이나 특수문자 오타 확인

---

## 📋 최종 체크리스트

배포 완료 후 다음을 모두 확인하세요:

### Clerk Webhook
- [ ] Clerk Dashboard에서 Webhook Endpoint 생성
- [ ] `CLERK_WEBHOOK_SECRET` 환경 변수 추가
- [ ] 재배포 완료
- [ ] Test Event 전송 → 200 OK 응답 확인
- [ ] 실제 회원가입 → Supabase에 데이터 자동 생성 확인

### Cron Job
- [ ] `CRON_SECRET` 랜덤 생성
- [ ] 배포 플랫폼에 환경 변수 추가
- [ ] 재배포 완료
- [ ] Supabase Cron Job 생성 (매일 오전 2시)
- [ ] 수동 실행 테스트 → 200 OK 응답 확인

### 전체 시스템
- [ ] 회원가입 → 로그인 → 대시보드 접근 가능
- [ ] 새 검사 → 분석 요청 → 결과 확인 가능
- [ ] 구독 관리 페이지 정상 작동
- [ ] 브라우저 Console에 에러 없음

---

## 🆘 도움이 필요하면

다음 정보를 공유해주세요:

1. **배포 플랫폼**: Vercel / Netlify / 기타
2. **에러 메시지**: 브라우저 Console 또는 배포 로그
3. **설정 스크린샷**: 환경 변수 설정 화면 (값은 가리고)
4. **테스트 결과**: Webhook Test Event 응답 또는 Cron 수동 실행 결과

---

## 📚 추가 참고 자료

- [Clerk Webhooks 문서](https://clerk.com/docs/integrations/webhooks/overview)
- [Supabase Cron Jobs 문서](https://supabase.com/docs/guides/database/extensions/pg_cron)
- [Vercel 환경 변수 문서](https://vercel.com/docs/concepts/projects/environment-variables)
- [토스페이먼츠 정기결제 문서](https://docs.tosspayments.com/guides/billing)

