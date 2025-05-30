-- 🎄 Christmas Trading: Users 테이블 인증 시스템 수정 (수정된 버전)
-- 실행일: 2025-05-30
-- 목적: 백엔드 인증 시스템과 호환되는 users 테이블 구조 완성

-- =====================================================
-- 0. CRITICAL: id 컬럼 기본값 설정 (먼저 수정)
-- =====================================================

-- UUID 확장 활성화 (없으면 생성)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- id 컬럼에 기본값 설정 (UUID 자동 생성)
DO $$
BEGIN
    -- id 컬럼이 이미 기본값을 가지고 있는지 확인
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'id' 
        AND column_default IS NOT NULL
    ) THEN
        ALTER TABLE users ALTER COLUMN id SET DEFAULT uuid_generate_v4();
    END IF;
END $$;

-- =====================================================
-- 1. CRITICAL: 인증에 필요한 핵심 컬럼 추가
-- =====================================================

-- 비밀번호 컬럼 (가장 중요!)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS password VARCHAR(255);

-- 사용자 기본 정보
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);

-- 멤버십 타입 (Christmas Trading 계층)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS membership_type VARCHAR(50) DEFAULT 'basic';

-- 타임스탬프 (updated_at)
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =====================================================
-- 2. AI 및 고급 기능 컬럼 추가
-- =====================================================

-- OpenAI 관련 설정
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS openai_api_key TEXT;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS openai_model VARCHAR(50) DEFAULT 'gpt-4o-mini';

-- AI 학습 및 전략 설정
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ai_learning_enabled BOOLEAN DEFAULT false;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ai_strategy_level VARCHAR(20) DEFAULT 'basic';

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ai_risk_tolerance DECIMAL(3,2) DEFAULT 0.5;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS ai_learning_data_consent BOOLEAN DEFAULT false;

-- 전략 선택 및 자동 전환
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS selected_strategy VARCHAR(50) DEFAULT 'traditional';

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS strategy_auto_switch BOOLEAN DEFAULT false;

-- =====================================================
-- 3. KIS API 및 거래 관련 컬럼 추가
-- =====================================================

-- 한국투자증권 API 설정
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS kis_app_key VARCHAR(255);

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS kis_app_secret VARCHAR(255);

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS kis_account_number VARCHAR(50);

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS kis_production_mode BOOLEAN DEFAULT false;

-- 거래 설정
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS trading_enabled BOOLEAN DEFAULT false;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS max_daily_loss_limit DECIMAL(15,2);

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS max_position_size DECIMAL(5,4) DEFAULT 0.1;

-- =====================================================
-- 4. 알림 및 텔레그램 설정
-- =====================================================

-- 텔레그램 봇 설정
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(100);

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS telegram_notifications BOOLEAN DEFAULT false;

-- 이메일 알림 설정
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS email_notifications BOOLEAN DEFAULT true;

ALTER TABLE users 
ADD COLUMN IF NOT EXISTS trading_alerts BOOLEAN DEFAULT true;

-- =====================================================
-- 5. 기본값 및 제약 조건 설정
-- =====================================================

-- membership_type 제약 조건
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_users_membership_type' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT chk_users_membership_type 
        CHECK (membership_type IN ('basic', 'premium', 'vip', 'admin'));
    END IF;

    -- ai_strategy_level 제약 조건
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_users_ai_strategy_level' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT chk_users_ai_strategy_level 
        CHECK (ai_strategy_level IN ('basic', 'intermediate', 'advanced', 'expert'));
    END IF;

    -- selected_strategy 제약 조건
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_users_selected_strategy' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT chk_users_selected_strategy 
        CHECK (selected_strategy IN ('traditional', 'ai_learning', 'hybrid'));
    END IF;

    -- ai_risk_tolerance 범위 제약
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_users_ai_risk_tolerance' 
        AND table_name = 'users'
    ) THEN
        ALTER TABLE users 
        ADD CONSTRAINT chk_users_ai_risk_tolerance 
        CHECK (ai_risk_tolerance BETWEEN 0.1 AND 1.0);
    END IF;
END $$;

-- =====================================================
-- 6. 기존 사용자 데이터 업데이트 (안전한 기본값 설정)
-- =====================================================

-- 기존 사용자들에게 기본 멤버십 설정
UPDATE users 
SET membership_type = 'basic' 
WHERE membership_type IS NULL;

-- 기존 사용자들에게 기본 AI 설정
UPDATE users 
SET ai_learning_enabled = false,
    ai_strategy_level = 'basic',
    ai_risk_tolerance = 0.5,
    selected_strategy = 'traditional',
    strategy_auto_switch = false
WHERE ai_learning_enabled IS NULL;

-- updated_at 트리거 생성 (자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용 (있으면 스킵)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at') THEN
        CREATE TRIGGER update_users_updated_at 
        BEFORE UPDATE ON users 
        FOR EACH ROW 
        EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

-- =====================================================
-- 7. 인덱스 추가 (성능 최적화)
-- =====================================================

-- 이메일 고유 인덱스 (있으면 스킵)
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email_unique ON users(email);

-- 멤버십 타입별 조회 최적화
CREATE INDEX IF NOT EXISTS idx_users_membership_type ON users(membership_type);

-- AI 활성화 사용자 조회 최적화
CREATE INDEX IF NOT EXISTS idx_users_ai_enabled ON users(ai_learning_enabled) WHERE ai_learning_enabled = true;

-- 거래 활성화 사용자 조회 최적화
CREATE INDEX IF NOT EXISTS idx_users_trading_enabled ON users(trading_enabled) WHERE trading_enabled = true;

-- 생성일 기준 조회 최적화
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

-- =====================================================
-- 8. 테스트 계정 생성 (수정된 버전 - ID 자동 생성)
-- =====================================================

-- 기존 테스트 계정 정리 (중복 방지)
DELETE FROM users WHERE email IN ('admin@christmas.com', 'user@christmas.com');

-- 관리자 계정 생성 (ID 자동 생성)
INSERT INTO users (
    email, 
    password, 
    first_name, 
    last_name, 
    membership_type,
    ai_learning_enabled,
    trading_enabled
) VALUES (
    'admin@christmas.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- 'password'
    'Christmas',
    'Admin',
    'admin',
    true,
    true
);

-- 테스트 사용자 계정 생성 (ID 자동 생성)
INSERT INTO users (
    email, 
    password, 
    first_name, 
    last_name, 
    membership_type
) VALUES (
    'user@christmas.com',
    '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- 'password'
    'Christmas',
    'User',
    'basic'
);

-- =====================================================
-- 9. 최종 검증 및 구조 확인
-- =====================================================

-- id 컬럼 기본값 확인
SELECT 
    'id_column_check' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
AND column_name = 'id';

-- 수정된 테이블 구조 확인 (중요 컬럼만)
SELECT 
    'updated_users_structure' as info,
    column_name,
    data_type,
    is_nullable,
    CASE 
        WHEN column_default IS NOT NULL THEN 'HAS_DEFAULT'
        ELSE 'NO_DEFAULT'
    END as default_status
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
AND column_name IN ('id', 'email', 'password', 'first_name', 'last_name', 'membership_type')
ORDER BY ordinal_position;

-- 인증 시스템 호환성 최종 확인
WITH auth_requirements AS (
    SELECT column_name FROM (
        VALUES ('id'), ('email'), ('password'), ('first_name'), 
               ('last_name'), ('membership_type'), ('created_at'), ('updated_at')
    ) AS t(column_name)
),
existing_auth_columns AS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users' 
    AND column_name IN ('id', 'email', 'password', 'first_name', 'last_name', 'membership_type', 'created_at', 'updated_at')
)
SELECT 
    'auth_compatibility_check' as info,
    COUNT(*) as required_columns,
    (SELECT COUNT(*) FROM existing_auth_columns) as existing_columns,
    CASE 
        WHEN COUNT(*) = (SELECT COUNT(*) FROM existing_auth_columns) 
        THEN '🎉 완전 호환! 인증 시스템 준비 완료!'
        ELSE '⚠️ 일부 컬럼 누락'
    END as status
FROM auth_requirements;

-- 사용자 데이터 요약
SELECT 
    'users_summary' as info,
    COUNT(*) as total_users,
    COUNT(CASE WHEN password IS NOT NULL THEN 1 END) as users_with_password,
    COUNT(CASE WHEN membership_type = 'admin' THEN 1 END) as admin_users,
    COUNT(CASE WHEN ai_learning_enabled = true THEN 1 END) as ai_enabled_users
FROM users;

-- 생성된 테스트 계정 확인
SELECT 
    'test_accounts' as info,
    email,
    first_name,
    last_name,
    membership_type,
    CASE WHEN password IS NOT NULL THEN 'password_set' ELSE 'no_password' END as password_status
FROM users 
WHERE email IN ('admin@christmas.com', 'user@christmas.com');

-- =====================================================
-- 🎄 Christmas Trading Users 테이블 수정 완료! 🎄
-- =====================================================

SELECT '🎉 Users 테이블 인증 시스템 수정이 완료되었습니다!' as success_message,
       '✅ 이제 백엔드 인증 API가 정상 작동합니다!' as next_step,
       '🔑 테스트 계정: admin@christmas.com / user@christmas.com (비밀번호: password)' as test_info; 