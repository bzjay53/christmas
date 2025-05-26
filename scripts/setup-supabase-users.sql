-- Christmas Trading Supabase 사용자 테이블 설정
-- 실행 방법: Supabase Dashboard > SQL Editor에서 실행

-- 1. 사용자 테이블 생성
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    
    -- 회원 등급 시스템
    membership_type VARCHAR(20) DEFAULT 'free' CHECK (membership_type IN ('guest', 'free', 'premium', 'lifetime')),
    membership_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    membership_end_date TIMESTAMP WITH TIME ZONE,
    free_trial_end_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
    
    -- 거래 제한 관리
    daily_trade_count INTEGER DEFAULT 0,
    daily_trade_reset_date DATE DEFAULT CURRENT_DATE,
    
    -- 초대 시스템
    personal_referral_code VARCHAR(20) UNIQUE,
    referred_by VARCHAR(20),
    total_extension_days INTEGER DEFAULT 0 CHECK (total_extension_days <= 90),
    
    -- 알림 설정 (JSONB)
    notification_settings JSONB DEFAULT '{
        "email": true,
        "telegram": false,
        "push": true,
        "tradingAlerts": true,
        "portfolioUpdates": true
    }',
    
    -- 텔레그램 정보
    telegram_chat_id VARCHAR(50),
    telegram_username VARCHAR(100),
    
    -- 계정 상태
    is_email_verified BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    is_admin BOOLEAN DEFAULT false,
    last_login_at TIMESTAMP WITH TIME ZONE,
    
    -- 보안 관련
    email_verification_token VARCHAR(255),
    email_verification_expires TIMESTAMP WITH TIME ZONE,
    password_reset_token VARCHAR(255),
    password_reset_expires TIMESTAMP WITH TIME ZONE,
    login_attempts INTEGER DEFAULT 0 CHECK (login_attempts <= 5),
    lock_until TIMESTAMP WITH TIME ZONE,
    
    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_personal_referral_code ON users(personal_referral_code);
CREATE INDEX IF NOT EXISTS idx_users_membership_type ON users(membership_type);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);

-- 3. RLS (Row Level Security) 설정
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 조회/수정 가능
CREATE POLICY "Users can view own data" ON users
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 서비스 역할은 모든 작업 가능 (백엔드용)
CREATE POLICY "Service role can do everything" ON users
    FOR ALL USING (auth.role() = 'service_role');

-- 4. 업데이트 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 5. 업데이트 트리거 적용
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 6. 테스트 계정 생성 (비밀번호는 bcrypt로 해시됨)
-- 비밀번호: admin123 -> $2a$12$hash...
INSERT INTO users (
    email,
    password,
    first_name,
    last_name,
    membership_type,
    is_email_verified,
    is_admin,
    personal_referral_code
) VALUES 
(
    'lvninety9@gmail.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq5S/kS', -- admin123
    'Christmas',
    'Admin',
    'lifetime',
    true,
    true,
    'ADMIN2024'
),
(
    'admin@christmas.com',
    '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq5S/kS', -- admin123
    'Christmas',
    'Administrator',
    'lifetime',
    true,
    true,
    'CHRISTMAS'
),
(
    'user@christmas.com',
    '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', -- password
    'Test',
    'User',
    'premium',
    true,
    false,
    'TESTUSER'
)
ON CONFLICT (email) DO NOTHING;

-- 7. 로그인 실패 횟수 증가 함수
CREATE OR REPLACE FUNCTION increment_login_attempts(user_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE users 
    SET 
        login_attempts = login_attempts + 1,
        lock_until = CASE 
            WHEN login_attempts >= 4 THEN NOW() + INTERVAL '15 minutes'
            ELSE lock_until
        END,
        updated_at = NOW()
    WHERE id = user_id;
END;
$$ LANGUAGE plpgsql;

-- 8. 사용자 통계 뷰 생성
CREATE OR REPLACE VIEW user_stats AS
SELECT 
    membership_type,
    COUNT(*) as total_users,
    COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
    COUNT(CASE WHEN is_email_verified = true THEN 1 END) as verified_users,
    COUNT(CASE WHEN last_login_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_active_users
FROM users
GROUP BY membership_type;

-- 완료 메시지
SELECT 'Christmas Trading 사용자 테이블 설정 완료!' as message; 