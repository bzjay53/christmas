-- 🚨 긴급 수정: Christmas Trading Supabase Users 테이블 스키마 업데이트
-- 실행 방법: Supabase Dashboard > SQL Editor에서 실행
-- 날짜: 2025-05-30 21:45 KST

-- 1. 기존 테이블 구조 확인
SELECT 'Current users table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. 누락된 컬럼들 추가 (존재하지 않는 경우에만)
-- KIS API 설정 컬럼들
DO $$
BEGIN
    -- KIS API 설정 컬럼들
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='kis_real_app_key') THEN
        ALTER TABLE users ADD COLUMN kis_real_app_key TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='kis_real_app_secret') THEN
        ALTER TABLE users ADD COLUMN kis_real_app_secret TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='kis_real_account') THEN
        ALTER TABLE users ADD COLUMN kis_real_account TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='kis_demo_app_key') THEN
        ALTER TABLE users ADD COLUMN kis_demo_app_key TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='kis_demo_app_secret') THEN
        ALTER TABLE users ADD COLUMN kis_demo_app_secret TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='kis_demo_account') THEN
        ALTER TABLE users ADD COLUMN kis_demo_account TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='kis_mock_mode') THEN
        ALTER TABLE users ADD COLUMN kis_mock_mode BOOLEAN DEFAULT true;
    END IF;
    
    -- 텔레그램 설정 컬럼들
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='telegram_chat_id') THEN
        ALTER TABLE users ADD COLUMN telegram_chat_id TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='telegram_username') THEN
        ALTER TABLE users ADD COLUMN telegram_username TEXT;
    END IF;
    
    -- 알림 설정 컬럼들
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='notification_telegram') THEN
        ALTER TABLE users ADD COLUMN notification_telegram BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='notification_email') THEN
        ALTER TABLE users ADD COLUMN notification_email BOOLEAN DEFAULT true;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='notification_push') THEN
        ALTER TABLE users ADD COLUMN notification_push BOOLEAN DEFAULT true;
    END IF;
    
    -- OpenAI 설정 컬럼들
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='openai_api_key') THEN
        ALTER TABLE users ADD COLUMN openai_api_key TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='openai_model') THEN
        ALTER TABLE users ADD COLUMN openai_model TEXT DEFAULT 'gpt-4o-mini';
    END IF;
    
    -- AI 학습 설정 컬럼들
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='ai_learning_enabled') THEN
        ALTER TABLE users ADD COLUMN ai_learning_enabled BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='ai_strategy_level') THEN
        ALTER TABLE users ADD COLUMN ai_strategy_level TEXT DEFAULT 'basic';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='ai_risk_tolerance') THEN
        ALTER TABLE users ADD COLUMN ai_risk_tolerance DECIMAL(3,2) DEFAULT 0.5;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='ai_learning_data_consent') THEN
        ALTER TABLE users ADD COLUMN ai_learning_data_consent BOOLEAN DEFAULT false;
    END IF;
    
    -- 전략 설정 컬럼들
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='selected_strategy') THEN
        ALTER TABLE users ADD COLUMN selected_strategy TEXT DEFAULT 'traditional';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='strategy_auto_switch') THEN
        ALTER TABLE users ADD COLUMN strategy_auto_switch BOOLEAN DEFAULT false;
    END IF;
    
    -- 기본 사용자 정보 컬럼들 (없는 경우에만)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='membership_type') THEN
        ALTER TABLE users ADD COLUMN membership_type TEXT DEFAULT 'free';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='created_at') THEN
        ALTER TABLE users ADD COLUMN created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='updated_at') THEN
        ALTER TABLE users ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;
    
    -- first_name, last_name이 없는 경우 추가
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='first_name') THEN
        ALTER TABLE users ADD COLUMN first_name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='users' AND column_name='last_name') THEN
        ALTER TABLE users ADD COLUMN last_name TEXT;
    END IF;

    RAISE NOTICE '✅ 모든 필수 컬럼이 성공적으로 추가되었습니다.';
END
$$;

-- 3. 업데이트된 테이블 구조 확인
SELECT 'Updated users table structure:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 4. 현재 사용자 수 확인
SELECT 
    'users_statistics' as info,
    COUNT(*) as total_users,
    COUNT(CASE WHEN membership_type = 'free' THEN 1 END) as free_users,
    COUNT(CASE WHEN membership_type = 'premium' THEN 1 END) as premium_users
FROM users;

-- 5. 성공 메시지
SELECT '🎉 긴급 수정 완료! Christmas Trading 시스템이 정상적으로 작동할 것입니다.' as success_message; 