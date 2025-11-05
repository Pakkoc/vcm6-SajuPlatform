-- ============================================
-- 로컬 테스트용 샘플 데이터 삽입 스크립트
-- ============================================
-- 
-- 사용 방법:
-- 1. Supabase Dashboard → SQL Editor 접속
-- 2. 이 파일 내용을 복사하여 붙여넣기
-- 3. "Run" 버튼 클릭
--
-- 주의: 이미 동일한 ID의 데이터가 있으면 에러가 발생합니다.
-- 필요시 아래 DELETE 문을 먼저 실행하세요.
-- ============================================

-- 기존 테스트 데이터 삭제 (선택사항)
-- DELETE FROM saju_analyses WHERE user_id = 'test-user-id-123';
-- DELETE FROM subscriptions WHERE user_id = 'test-user-id-123';
-- DELETE FROM users WHERE id = 'test-user-id-123';

-- ============================================
-- 1. 테스트 사용자 생성
-- ============================================
INSERT INTO users (id, clerk_user_id, email, created_at)
VALUES (
  'test-user-id-123',
  'test_clerk_user_id',
  'test@example.com',
  NOW()
)
ON CONFLICT (clerk_user_id) DO NOTHING;

-- ============================================
-- 2. Free 플랜 구독 생성 (잔여 1회)
-- ============================================
INSERT INTO subscriptions (
  user_id, 
  plan, 
  status, 
  remaining_count, 
  billing_key,
  next_billing_date,
  created_at, 
  updated_at
)
VALUES (
  'test-user-id-123',
  'free',
  'active',
  1,
  NULL,
  NULL,
  NOW(),
  NOW()
)
ON CONFLICT (user_id) DO UPDATE SET
  plan = EXCLUDED.plan,
  status = EXCLUDED.status,
  remaining_count = EXCLUDED.remaining_count,
  updated_at = NOW();

-- ============================================
-- 3. 샘플 사주 분석 데이터 생성 (3개)
-- ============================================

-- 분석 1: 홍길동
INSERT INTO saju_analyses (
  user_id, 
  name, 
  birth_date, 
  birth_time, 
  gender, 
  model_used, 
  result, 
  created_at
)
VALUES (
  'test-user-id-123',
  '홍길동',
  '1990-01-01',
  '12:00:00',
  'male',
  'gemini-2.5-flash',
  E'# 홍길동님의 사주 분석 결과\n\n## 전반적인 성향\n\n1990년 1월 1일 정오에 태어난 홍길동님은 강한 의지력과 추진력을 가진 분입니다. 목표를 향해 꾸준히 나아가는 성향이 있으며, 주변 사람들에게 신뢰를 주는 리더십을 발휘합니다. 다만 때로는 고집이 세어 타인의 의견을 수용하는 데 어려움을 겪을 수 있습니다.\n\n## 올해의 흐름\n\n올해는 새로운 기회가 많이 찾아오는 해입니다. 특히 상반기에는 직장이나 사업에서 중요한 결정을 내려야 할 시기가 올 수 있습니다. 하반기에는 인간관계에서 긍정적인 변화가 예상되며, 새로운 인연을 만날 가능성이 높습니다.\n\n## 인간관계와 커리어\n\n직장에서는 동료들과의 협력이 중요한 시기입니다. 혼자서 모든 것을 해결하려 하기보다는 팀워크를 발휘하는 것이 좋습니다. 커리어 측면에서는 전문성을 키우는 데 집중하면 좋은 결과를 얻을 수 있습니다. 상사나 선배의 조언에 귀 기울이는 것이 도움이 됩니다.\n\n## 주의할 점과 개선 방향\n\n건강 관리에 신경을 써야 합니다. 특히 과로로 인한 스트레스가 누적되지 않도록 주의하세요. 규칙적인 운동과 충분한 휴식이 필요합니다. 재물운은 안정적이나 충동적인 소비는 자제하는 것이 좋습니다.\n\n**한 줄 요약**: 강한 의지력으로 목표를 달성하되, 건강 관리와 타인과의 협력을 잊지 마세요.',
  NOW() - INTERVAL '3 days'
);

-- 분석 2: 김영희
INSERT INTO saju_analyses (
  user_id, 
  name, 
  birth_date, 
  birth_time, 
  gender, 
  model_used, 
  result, 
  created_at
)
VALUES (
  'test-user-id-123',
  '김영희',
  '1985-05-15',
  NULL,
  'female',
  'gemini-2.5-flash',
  E'# 김영희님의 사주 분석 결과\n\n## 전반적인 성향\n\n1985년 5월 15일에 태어난 김영희님은 섬세하고 감수성이 풍부한 분입니다. 예술적 감각이 뛰어나며, 타인의 감정을 잘 이해하는 공감 능력이 있습니다. 창의적인 일에 재능이 있으며, 조화로운 환경을 추구하는 성향이 있습니다.\n\n## 올해의 흐름\n\n올해는 내면의 성장에 집중하기 좋은 해입니다. 자기 계발이나 새로운 학습에 투자하면 좋은 결과를 얻을 수 있습니다. 하반기에는 재물운이 상승하며, 부수입의 기회가 생길 수 있습니다.\n\n## 인간관계와 커리어\n\n인간관계에서는 진정성 있는 소통이 중요합니다. 표면적인 관계보다는 깊이 있는 유대감을 형성하는 데 집중하세요. 커리어 측면에서는 창의성을 발휘할 수 있는 프로젝트에 참여하면 좋습니다. 예술, 디자인, 교육 분야에서 두각을 나타낼 수 있습니다.\n\n## 주의할 점과 개선 방향\n\n감정 기복이 클 수 있으니 정서적 안정을 유지하는 것이 중요합니다. 명상이나 요가 같은 활동이 도움이 될 수 있습니다. 재정 관리에도 신경 써서 불필요한 지출을 줄이고 저축 습관을 들이세요.\n\n**한 줄 요약**: 창의성과 감수성을 살리되, 정서적 안정과 재정 관리에 신경 쓰세요.',
  NOW() - INTERVAL '1 week'
);

-- 분석 3: 박철수
INSERT INTO saju_analyses (
  user_id, 
  name, 
  birth_date, 
  birth_time, 
  gender, 
  model_used, 
  result, 
  created_at
)
VALUES (
  'test-user-id-123',
  '박철수',
  '1995-12-25',
  '08:30:00',
  'male',
  'gemini-2.5-flash',
  E'# 박철수님의 사주 분석 결과\n\n## 전반적인 성향\n\n1995년 12월 25일 아침에 태어난 박철수님은 활발하고 사교적인 성격을 가진 분입니다. 새로운 사람들과 쉽게 친해지며, 긍정적인 에너지로 주변을 밝게 만듭니다. 도전을 두려워하지 않는 용기가 있으며, 변화를 즐기는 성향이 있습니다.\n\n## 올해의 흐름\n\n올해는 활동적인 한 해가 될 것입니다. 여행이나 이동이 많을 수 있으며, 새로운 환경에 적응하는 경험을 하게 됩니다. 상반기에는 인맥 확장의 기회가 많고, 하반기에는 그동안의 노력이 결실을 맺는 시기입니다.\n\n## 인간관계와 커리어\n\n폭넓은 인맥이 큰 자산이 됩니다. 다양한 분야의 사람들과 교류하면서 새로운 기회를 발견할 수 있습니다. 커리어 측면에서는 영업, 마케팅, 대외 업무에서 강점을 발휘할 수 있습니다. 적극적인 태도가 좋은 결과로 이어질 것입니다.\n\n## 주의할 점과 개선 방향\n\n너무 많은 일을 동시에 진행하려다 보면 집중력이 분산될 수 있습니다. 우선순위를 정하고 한 가지씩 완성해 나가는 것이 좋습니다. 건강 관리를 위해 규칙적인 생활 패턴을 유지하세요.\n\n**한 줄 요약**: 활발한 활동과 인맥을 활용하되, 집중력과 건강 관리를 잊지 마세요.',
  NOW() - INTERVAL '2 weeks'
);

-- ============================================
-- 확인 쿼리
-- ============================================
-- 데이터가 제대로 삽입되었는지 확인

SELECT 'Users' as table_name, COUNT(*) as count FROM users WHERE clerk_user_id = 'test_clerk_user_id'
UNION ALL
SELECT 'Subscriptions', COUNT(*) FROM subscriptions WHERE user_id = 'test-user-id-123'
UNION ALL
SELECT 'Analyses', COUNT(*) FROM saju_analyses WHERE user_id = 'test-user-id-123';

-- 상세 데이터 확인
SELECT 
  u.email,
  s.plan,
  s.status,
  s.remaining_count,
  COUNT(a.id) as analysis_count
FROM users u
LEFT JOIN subscriptions s ON u.id = s.user_id
LEFT JOIN saju_analyses a ON u.id = a.user_id
WHERE u.clerk_user_id = 'test_clerk_user_id'
GROUP BY u.email, s.plan, s.status, s.remaining_count;

