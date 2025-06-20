-- ==========================================
-- Christmas Trading: Complete Database Schema
-- 실행 환경: Supabase PostgreSQL
-- 생성일: 2025-06-20
-- ==========================================

-- 1. users 테이블 (사용자 정보)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    username VARCHAR(50) UNIQUE,
    tier VARCHAR(20) DEFAULT 'basic',
    phone VARCHAR(20),
    is_verified BOOLEAN DEFAULT false,
    referral_code VARCHAR(10) UNIQUE,
    referred_by UUID REFERENCES users(id),
    
    -- 추가된 컬럼들 (프론트엔드 요구사항)
    selected_strategy TEXT DEFAULT 'traditional' CHECK (selected_strategy IN ('traditional', 'ai_learning', 'hybrid')),
    strategy_auto_switch BOOLEAN DEFAULT FALSE,
    
    -- KIS API 관련 컬럼
    kis_real_app_key TEXT,
    kis_real_app_secret TEXT,
    kis_real_account TEXT,
    kis_demo_app_key TEXT,
    kis_demo_app_secret TEXT,
    kis_demo_account TEXT,
    kis_mock_mode BOOLEAN DEFAULT TRUE,
    
    -- AI 관련 컬럼
    openai_api_key TEXT,
    openai_model TEXT DEFAULT 'gpt-4o-mini',
    ai_learning_enabled BOOLEAN DEFAULT FALSE,
    ai_strategy_level TEXT DEFAULT 'basic' CHECK (ai_strategy_level IN ('basic', 'intermediate', 'advanced', 'expert')),
    ai_risk_tolerance NUMERIC DEFAULT 0.5 CHECK (ai_risk_tolerance BETWEEN 0.1 AND 1.0),
    ai_learning_data_consent BOOLEAN DEFAULT FALSE,
    
    -- 알림 관련 컬럼
    telegram_chat_id TEXT,
    telegram_username TEXT,
    notification_telegram BOOLEAN DEFAULT FALSE,
    notification_email BOOLEAN DEFAULT TRUE,
    notification_push BOOLEAN DEFAULT TRUE,
    
    -- 타임스탬프
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);

-- 2. trading_orders 테이블 (거래 주문)
CREATE TABLE IF NOT EXISTS trading_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    order_id VARCHAR(100) UNIQUE NOT NULL,
    stock_code VARCHAR(20) NOT NULL,
    stock_name VARCHAR(100),
    order_type VARCHAR(10) NOT NULL CHECK (order_type IN ('buy', 'sell')),
    quantity INTEGER NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'cancelled')),
    kis_order_id VARCHAR(100),
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. coupons 테이블 (쿠폰 관리)
CREATE TABLE IF NOT EXISTS coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(10,2) DEFAULT 0,
    max_discount_amount DECIMAL(10,2),
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. referral_codes 테이블 (리퍼럴 코드)
CREATE TABLE IF NOT EXISTS referral_codes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(10) UNIQUE NOT NULL,
    owner_id UUID NOT NULL REFERENCES users(id),
    usage_count INTEGER DEFAULT 0,
    max_usage INTEGER DEFAULT 100,
    reward_amount DECIMAL(10,2) DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- 5. ai_learning_data 테이블 (AI 학습 데이터)
CREATE TABLE IF NOT EXISTS ai_learning_data (
    id SERIAL PRIMARY KEY,
    trade_id VARCHAR(50) UNIQUE,
    user_id UUID REFERENCES users(id),
    timestamp TIMESTAMP WITH TIME ZONE,
    
    -- 매매 정보
    stock_code VARCHAR(10),
    action VARCHAR(10) CHECK (action IN ('buy', 'sell')),
    price DECIMAL(10,2),
    quantity INTEGER,
    
    -- 시장 상황 (JSON으로 저장)
    market_conditions JSONB,
    
    -- 결과 데이터
    actual_profit DECIMAL(8,4),
    success BOOLEAN,
    exit_reason VARCHAR(50),
    
    -- AI 분석 결과
    ai_confidence DECIMAL(3,2),
    learned_patterns JSONB,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- 6. ai_strategy_performance 테이블 (AI 전략 성능)
CREATE TABLE IF NOT EXISTS ai_strategy_performance (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    strategy_type VARCHAR(50) CHECK (strategy_type IN ('traditional', 'ai_learning', 'hybrid')),
    date_period DATE,
    success_rate DECIMAL(5,2),
    total_trades INTEGER,
    avg_profit DECIMAL(8,4),
    max_profit DECIMAL(8,4),
    max_loss DECIMAL(8,4),
    sharpe_ratio DECIMAL(6,3),
    risk_adjusted_return DECIMAL(6,3),
    max_drawdown DECIMAL(6,3),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 7. coupon_usage 테이블 (쿠폰 사용 내역)
CREATE TABLE IF NOT EXISTS coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id),
    user_id UUID NOT NULL REFERENCES users(id),
    order_id VARCHAR(100),
    discount_amount DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(coupon_id, user_id, order_id)
);

-- 8. referral_rewards 테이블 (리퍼럴 보상)
CREATE TABLE IF NOT EXISTS referral_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES users(id),
    referred_id UUID NOT NULL REFERENCES users(id),
    referral_code_id UUID NOT NULL REFERENCES referral_codes(id),
    reward_type VARCHAR(20) NOT NULL CHECK (reward_type IN ('signup', 'first_order', 'milestone')),
    reward_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);

-- 9. user_sessions 테이블 (사용자 세션)
CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    session_token VARCHAR(500) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. ai_patterns 테이블 (패턴 학습 결과)
CREATE TABLE IF NOT EXISTS ai_patterns (
    id SERIAL PRIMARY KEY,
    pattern_type VARCHAR(50) CHECK (pattern_type IN ('success', 'failure', 'neutral')),
    conditions JSONB,
    success_rate DECIMAL(5,2),
    sample_count INTEGER,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- 11. user_ai_models 테이블 (사용자별 AI 모델)
CREATE TABLE IF NOT EXISTS user_ai_models (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    model_version VARCHAR(20),
    model_data JSONB,
    performance_metrics JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- 인덱스 생성 (성능 최적화)
-- ==========================================

-- 사용자 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);
CREATE INDEX IF NOT EXISTS idx_users_tier ON users(tier);
CREATE INDEX IF NOT EXISTS idx_users_selected_strategy ON users(selected_strategy);
CREATE INDEX IF NOT EXISTS idx_users_ai_learning_enabled ON users(ai_learning_enabled);
CREATE INDEX IF NOT EXISTS idx_users_kis_mock_mode ON users(kis_mock_mode);

-- 거래 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_trading_orders_user_id ON trading_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_orders_stock_code ON trading_orders(stock_code);
CREATE INDEX IF NOT EXISTS idx_trading_orders_status ON trading_orders(status);
CREATE INDEX IF NOT EXISTS idx_trading_orders_created_at ON trading_orders(created_at);

-- AI 학습 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_user_id ON ai_learning_data(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_stock_code ON ai_learning_data(stock_code);
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_success ON ai_learning_data(success);
CREATE INDEX IF NOT EXISTS idx_ai_strategy_performance_user_id ON ai_strategy_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_strategy_performance_strategy_type ON ai_strategy_performance(strategy_type);

-- 쿠폰 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_period ON coupons(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);

-- 리퍼럴 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);
CREATE INDEX IF NOT EXISTS idx_referral_codes_owner ON referral_codes(owner_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards(referrer_id);

-- 세션 관련 인덱스
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- ==========================================
-- 트리거 및 함수
-- ==========================================

-- updated_at 자동 업데이트 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용
CREATE TRIGGER update_users_updated_at 
    BEFORE UPDATE ON users 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_coupons_updated_at 
    BEFORE UPDATE ON coupons 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trading_orders_updated_at 
    BEFORE UPDATE ON trading_orders 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 리퍼럴 코드 생성 함수
CREATE OR REPLACE FUNCTION generate_referral_code()
RETURNS TEXT AS $$
DECLARE
    chars TEXT := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    result TEXT := '';
    i INTEGER;
BEGIN
    FOR i IN 1..8 LOOP
        result := result || substr(chars, floor(random() * length(chars) + 1)::integer, 1);
    END LOOP;
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- Row Level Security (RLS) 정책
-- ==========================================

-- 사용자 테이블 RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid() = id);

-- 거래 주문 RLS
ALTER TABLE trading_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON trading_orders
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own orders" ON trading_orders
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- AI 학습 데이터 RLS
ALTER TABLE ai_learning_data ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own AI data" ON ai_learning_data
    FOR SELECT USING (auth.uid() = user_id);

-- AI 전략 성능 RLS
ALTER TABLE ai_strategy_performance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own AI performance" ON ai_strategy_performance
    FOR SELECT USING (auth.uid() = user_id);

-- 쿠폰 사용 내역 RLS
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own coupon usage" ON coupon_usage
    FOR SELECT USING (auth.uid() = user_id);

-- ==========================================
-- 초기 데이터 삽입
-- ==========================================

-- 기본 쿠폰 데이터
INSERT INTO coupons (code, name, description, discount_type, discount_value, valid_from, valid_until) VALUES
('WELCOME10', '신규 가입 10% 할인', '신규 회원 가입 시 10% 할인 쿠폰', 'percentage', 10.00, NOW(), NOW() + INTERVAL '1 year'),
('FIRST5000', '첫 거래 5000원 할인', '첫 거래 시 5000원 할인', 'fixed', 5000.00, NOW(), NOW() + INTERVAL '6 months'),
('VIP20', 'VIP 회원 20% 할인', 'VIP 등급 회원 전용 20% 할인', 'percentage', 20.00, NOW(), NOW() + INTERVAL '1 year'),
('CHRISTMAS2025', '크리스마스 특별 할인', '2025 크리스마스 특별 25% 할인', 'percentage', 25.00, NOW(), NOW() + INTERVAL '3 months')
ON CONFLICT (code) DO NOTHING;

-- 완료 메시지
SELECT 'Christmas Trading 완전한 데이터베이스 스키마 생성 완료!' as message;
SELECT COUNT(*) as table_count FROM information_schema.tables WHERE table_schema = 'public';