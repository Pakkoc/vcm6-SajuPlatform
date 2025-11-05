# ⚡ 빠른 배포 가이드

## 🎯 배포 후 필수 작업 2가지

### 1️⃣ CLERK_WEBHOOK_SECRET 설정

**Clerk Dashboard에서:**
1. https://dashboard.clerk.com → Webhooks → Add Endpoint
2. URL: `https://your-app.vercel.app/api/webhooks/clerk`
3. Events: `user.created`, `user.updated`, `user.deleted` 선택
4. Signing Secret 복사 (예: `whsec_xxx...`)

**배포 플랫폼에 추가:**
```
CLERK_WEBHOOK_SECRET=whsec_xxx...
```

**재배포 후 테스트:**
- Clerk Dashboard에서 "Send Test Event" → 200 OK 확인

---

### 2️⃣ CRON_SECRET 설정

**랜덤 시크릿 생성:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
# 또는
openssl rand -hex 32
```

**배포 플랫폼에 추가:**
```
CRON_SECRET=생성한랜덤문자열
```

**Supabase Cron Job 생성:**
```sql
SELECT cron.schedule(
  'process-recurring-payments',
  '0 17 * * *',  -- 매일 오전 2시(KST)
  $$
  SELECT net.http_post(
    url := 'https://your-app.vercel.app/api/cron/process-subscriptions',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer 위에서생성한CRON_SECRET'
    ),
    body := '{}'::jsonb
  ) AS request_id;
  $$
);
```

**수동 테스트:**
```bash
curl -X POST https://your-app.vercel.app/api/cron/process-subscriptions \
  -H "Authorization: Bearer your-cron-secret"
```

---

## ✅ 완료 확인

- [ ] 회원가입 시 Supabase에 자동으로 사용자 생성됨
- [ ] Cron API 호출 시 200 OK 응답

---

자세한 내용은 `DEPLOYMENT_GUIDE.md` 참고

