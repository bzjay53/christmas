-- Christmas Trading: Critical Database Schema Fix
-- 실행 날짜: 2025-05-30
-- 목적: 프론트엔드 오류 해결을 위한 누락된 컬럼 추가

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

-- 4. 스키마 확인 쿼리 (실행 후 검증용)
-- 다음 쿼리로 컬럼이 정상 추가되었는지 확인 가능:

/*
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
*/

-- 5. 기존 사용자 데이터 업데이트 (필요시)
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