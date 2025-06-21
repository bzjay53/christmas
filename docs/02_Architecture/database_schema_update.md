# 🗄️ Christmas Trading 데이터베이스 스키마 업데이트 가이드

## 📋 **업데이트 개요**
**날짜**: 2025-05-30  
**목적**: 프론트엔드에서 발생하는 데이터베이스 컬럼 누락 오류 해결  
**영향**: users 테이블에 17개 컬럼 추가  

## 🚨 **Critical Issue 해결**
```
오류: column "selected_strategy" does not exist
원인: 프론트엔드에서 요구하는 컬럼들이 데이터베이스에 없음
해결: 필수 컬럼들을 안전하게 추가
```

## 📝 **실행 방법**

### **1단계: Supabase SQL 편집기 접속**
1. https://supabase.com 로그인
2. Christmas Trading 프로젝트 선택
3. 좌측 메뉴에서 "SQL Editor" 클릭
4. "New query" 버튼 클릭

### **2단계: SQL 스크립트 실행**
아래 스크립트를 복사하여 실행:

```sql
-- ==========================================
-- Christmas Trading: Critical Database Schema Fix
-- 실행 날짜: 2025-05-30
-- 목적: 프론트엔드 오류 해결을 위한 누락된 컬럼 추가
-- ==========================================

-- 1. users 테이블에 누락된 컬럼들 추가
-- (IF NOT EXISTS 사용으로 안전한 실행)

-- 전략 관련 컬럼
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS selected_strategy TEXT DEFAULT 'traditional';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS strategy_auto_switch BOOLEAN DEFAULT FALSE;

-- KIS API 관련 컬럼 (실거래 및 모의거래)
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kis_real_app_key TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kis_real_app_secret TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kis_real_account TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kis_demo_app_key TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kis_demo_app_secret TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kis_demo_account TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS kis_mock_mode BOOLEAN DEFAULT TRUE;

-- AI 관련 컬럼
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS openai_api_key TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS openai_model TEXT DEFAULT 'gpt-4o-mini';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ai_learning_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ai_strategy_level TEXT DEFAULT 'basic';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ai_risk_tolerance NUMERIC DEFAULT 0.5;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ai_learning_data_consent BOOLEAN DEFAULT FALSE;

-- 알림 관련 컬럼
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS telegram_chat_id TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS telegram_username TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS notification_telegram BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS notification_email BOOLEAN DEFAULT TRUE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS notification_push BOOLEAN DEFAULT TRUE;

-- 2. 데이터 제약 조건 추가 (선택적)
-- selected_strategy 값 제한
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS check_selected_strategy;
ALTER TABLE public.users ADD CONSTRAINT check_selected_strategy 
    CHECK (selected_strategy IN ('traditional', 'ai_learning', 'hybrid'));

-- ai_strategy_level 값 제한  
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS check_ai_strategy_level;
ALTER TABLE public.users ADD CONSTRAINT check_ai_strategy_level 
    CHECK (ai_strategy_level IN ('basic', 'intermediate', 'advanced', 'expert'));

-- ai_risk_tolerance 범위 제한
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS check_ai_risk_tolerance;
ALTER TABLE public.users ADD CONSTRAINT check_ai_risk_tolerance 
    CHECK (ai_risk_tolerance BETWEEN 0.1 AND 1.0);

-- 3. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_selected_strategy ON public.users(selected_strategy);
CREATE INDEX IF NOT EXISTS idx_users_ai_learning_enabled ON public.users(ai_learning_enabled);
CREATE INDEX IF NOT EXISTS idx_users_kis_mock_mode ON public.users(kis_mock_mode);

-- 4. 기존 사용자 데이터 업데이트 (필요시)
-- 기존 사용자들에게 기본값 적용
UPDATE public.users SET 
    selected_strategy = 'traditional',
    strategy_auto_switch = FALSE,
    kis_mock_mode = TRUE,
    ai_learning_enabled = FALSE,
    ai_strategy_level = 'basic',
    ai_risk_tolerance = 0.5,
    notification_email = TRUE,
    notification_telegram = FALSE,
    notification_push = TRUE
WHERE selected_strategy IS NULL;

-- 완료 메시지
SELECT 'Christmas Trading 데이터베이스 스키마 수정 완료!' as message;
SELECT COUNT(*) as total_users FROM public.users;
```

### **3단계: 실행 결과 확인**
성공 시 다음과 같은 메시지가 표시됩니다:
```
Christmas Trading 데이터베이스 스키마 수정 완료!
total_users: [사용자 수]
```

### **4단계: 컬럼 추가 검증**
다음 쿼리로 컬럼이 정상 추가되었는지 확인:

```sql
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users' 
AND column_name IN (
    'selected_strategy', 'strategy_auto_switch', 
    'kis_real_app_key', 'kis_demo_app_key', 'kis_mock_mode',
    'openai_api_key', 'ai_learning_enabled', 
    'telegram_chat_id', 'notification_telegram'
)
ORDER BY column_name;
```

## ⚠️ **주의사항**

### **안전성**
- `IF NOT EXISTS` 사용으로 중복 실행 시 오류 없음
- 기존 데이터에 영향 없음
- 롤백 불필요 (컬럼 추가만 수행)

### **데이터 무결성**
- 모든 새 컬럼에 적절한 기본값 설정
- 제약 조건으로 데이터 품질 보장
- 인덱스 추가로 성능 최적화

### **테스트 계획**
1. **즉시 테스트**: 프론트엔드 설정 화면 로드
2. **기능 테스트**: KIS API 설정 저장/로드
3. **UI 테스트**: 전략 선택 드롭다운 정상 작동

## 📊 **기대 효과**

### **해결될 문제들**
- ✅ column "selected_strategy" does not exist 오류 해결
- ✅ KIS API 설정 저장/로드 기능 활성화  
- ✅ AI 거래 전략 설정 기능 활성화
- ✅ 알림 설정 기능 정상화

### **추가 기능 활성화**
- 🎯 전략 자동 전환 기능
- 🤖 AI 학습 데이터 수집 동의
- 📱 다중 알림 채널 설정
- ⚙️ 개인화된 AI 설정

---

## 🎯 **실행 체크리스트**

- [ ] **1단계**: Supabase SQL 편집기 접속
- [ ] **2단계**: SQL 스크립트 복사 및 실행
- [ ] **3단계**: 성공 메시지 확인
- [ ] **4단계**: 컬럼 추가 검증 쿼리 실행
- [ ] **5단계**: 프론트엔드 테스트 (설정 화면 로드)
- [ ] **6단계**: Git 커밋 및 문서 업데이트

**📝 실행자**: [실행자 이름]  
**⏰ 실행 시간**: [실행 시간]  
**✅ 완료 확인**: [확인자 이름] 