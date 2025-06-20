# Christmas Trading 데이터베이스 스키마

## 📋 문서 정보
- **작성일**: 2025-05-26
- **버전**: 1.0
- **데이터베이스**: Supabase PostgreSQL
- **URL**: https://qehzzsxzjijfzqkysazc.supabase.co

## 🗄️ 데이터베이스 개요

### 스키마 구조
```
christmas_trading_db
├── users                 # 사용자 정보
├── coupons              # 쿠폰 관리
├── coupon_usage         # 쿠폰 사용 내역
├── referral_codes       # 리퍼럴 코드
├── referral_rewards     # 리퍼럴 보상
├── trading_orders       # 거래 주문
└── user_sessions        # 사용자 세션
```

## 📊 테이블 상세 설계

### 1. users (사용자 정보)
```sql
CREATE TABLE users (
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true
);
```

### 2. coupons (쿠폰 관리)
```sql
CREATE TABLE coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL, -- 'percentage', 'fixed'
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
```

### 3. coupon_usage (쿠폰 사용 내역)
```sql
CREATE TABLE coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES coupons(id),
    user_id UUID NOT NULL REFERENCES users(id),
    order_id VARCHAR(100),
    discount_amount DECIMAL(10,2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(coupon_id, user_id, order_id)
);
```

### 4. referral_codes (리퍼럴 코드)
```sql
CREATE TABLE referral_codes (
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
```

### 5. referral_rewards (리퍼럴 보상)
```sql
CREATE TABLE referral_rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    referrer_id UUID NOT NULL REFERENCES users(id),
    referred_id UUID NOT NULL REFERENCES users(id),
    referral_code_id UUID NOT NULL REFERENCES referral_codes(id),
    reward_type VARCHAR(20) NOT NULL, -- 'signup', 'first_order', 'milestone'
    reward_amount DECIMAL(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'paid', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE
);
```

### 6. trading_orders (거래 주문)
```sql
CREATE TABLE trading_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    order_id VARCHAR(100) UNIQUE NOT NULL,
    stock_code VARCHAR(20) NOT NULL,
    stock_name VARCHAR(100),
    order_type VARCHAR(10) NOT NULL, -- 'buy', 'sell'
    quantity INTEGER NOT NULL,
    price DECIMAL(12,2) NOT NULL,
    total_amount DECIMAL(15,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'executed', 'cancelled'
    kis_order_id VARCHAR(100),
    executed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### 7. user_sessions (사용자 세션)
```sql
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id),
    session_token VARCHAR(500) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## 🔍 인덱스 설계

### 성능 최적화를 위한 인덱스
```sql
-- 사용자 관련 인덱스
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_users_referral_code ON users(referral_code);
CREATE INDEX idx_users_tier ON users(tier);

-- 쿠폰 관련 인덱스
CREATE INDEX idx_coupons_code ON coupons(code);
CREATE INDEX idx_coupons_valid_period ON coupons(valid_from, valid_until);
CREATE INDEX idx_coupon_usage_user_id ON coupon_usage(user_id);
CREATE INDEX idx_coupon_usage_coupon_id ON coupon_usage(coupon_id);

-- 리퍼럴 관련 인덱스
CREATE INDEX idx_referral_codes_code ON referral_codes(code);
CREATE INDEX idx_referral_codes_owner ON referral_codes(owner_id);
CREATE INDEX idx_referral_rewards_referrer ON referral_rewards(referrer_id);

-- 거래 관련 인덱스
CREATE INDEX idx_trading_orders_user_id ON trading_orders(user_id);
CREATE INDEX idx_trading_orders_stock_code ON trading_orders(stock_code);
CREATE INDEX idx_trading_orders_status ON trading_orders(status);
CREATE INDEX idx_trading_orders_created_at ON trading_orders(created_at);

-- 세션 관련 인덱스
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
```

## 🔒 보안 설정

### Row Level Security (RLS) 정책
```sql
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

-- 쿠폰 사용 내역 RLS
ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own coupon usage" ON coupon_usage
    FOR SELECT USING (auth.uid() = user_id);
```

## 🔧 트리거 및 함수

### 자동 업데이트 트리거
```sql
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
```

### 리퍼럴 코드 생성 함수
```sql
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
```

## 📊 초기 데이터

### 기본 쿠폰 데이터
```sql
INSERT INTO coupons (code, name, description, discount_type, discount_value, valid_from, valid_until) VALUES
('WELCOME10', '신규 가입 10% 할인', '신규 회원 가입 시 10% 할인 쿠폰', 'percentage', 10.00, NOW(), NOW() + INTERVAL '1 year'),
('FIRST5000', '첫 거래 5000원 할인', '첫 거래 시 5000원 할인', 'fixed', 5000.00, NOW(), NOW() + INTERVAL '6 months'),
('VIP20', 'VIP 회원 20% 할인', 'VIP 등급 회원 전용 20% 할인', 'percentage', 20.00, NOW(), NOW() + INTERVAL '1 year');
```

## 🔄 마이그레이션 스크립트

### 전체 스키마 생성 스크립트
```sql
-- 1. 테이블 생성
-- (위의 CREATE TABLE 문들을 순서대로 실행)

-- 2. 인덱스 생성
-- (위의 CREATE INDEX 문들을 실행)

-- 3. RLS 정책 설정
-- (위의 RLS 정책들을 실행)

-- 4. 트리거 및 함수 생성
-- (위의 함수 및 트리거들을 실행)

-- 5. 초기 데이터 삽입
-- (위의 INSERT 문들을 실행)
```

## 📈 성능 모니터링

### 주요 모니터링 쿼리
```sql
-- 가장 많이 사용되는 쿠폰
SELECT c.name, c.code, COUNT(cu.id) as usage_count
FROM coupons c
LEFT JOIN coupon_usage cu ON c.id = cu.coupon_id
GROUP BY c.id, c.name, c.code
ORDER BY usage_count DESC;

-- 사용자별 거래 통계
SELECT u.email, COUNT(to.id) as order_count, SUM(to.total_amount) as total_amount
FROM users u
LEFT JOIN trading_orders to ON u.id = to.user_id
GROUP BY u.id, u.email
ORDER BY total_amount DESC;

-- 리퍼럴 성과 통계
SELECT u.email as referrer, COUNT(rr.id) as referral_count, SUM(rr.reward_amount) as total_rewards
FROM users u
LEFT JOIN referral_rewards rr ON u.id = rr.referrer_id
GROUP BY u.id, u.email
ORDER BY total_rewards DESC;
``` 