-- Christmas Trading - 누락된 테이블 생성 SQL
-- Supabase SQL Editor에서 실행하세요

-- 1. coupons 테이블 생성
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

-- 2. trading_orders 테이블 생성
CREATE TABLE IF NOT EXISTS trading_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id VARCHAR(100) UNIQUE NOT NULL,
  stock_code VARCHAR(20) NOT NULL,
  stock_name VARCHAR(100),
  order_type VARCHAR(10) NOT NULL CHECK (order_type IN ('buy', 'sell')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(12,2) NOT NULL CHECK (price > 0),
  total_amount DECIMAL(15,2) NOT NULL CHECK (total_amount > 0),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'cancelled')),
  kis_order_id VARCHAR(100),
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성 (성능 향상)
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_period ON coupons(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);

CREATE INDEX IF NOT EXISTS idx_trading_orders_user_id ON trading_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_orders_stock_code ON trading_orders(stock_code);
CREATE INDEX IF NOT EXISTS idx_trading_orders_status ON trading_orders(status);
CREATE INDEX IF NOT EXISTS idx_trading_orders_created_at ON trading_orders(created_at);

-- 4. 기본 쿠폰 데이터 삽입 (선택사항)
INSERT INTO coupons (code, name, description, discount_type, discount_value, valid_from, valid_until) VALUES
('WELCOME10', '신규 가입 10% 할인', '신규 회원 가입 시 10% 할인 쿠폰', 'percentage', 10.00, NOW(), NOW() + INTERVAL '1 year'),
('FIRST5000', '첫 거래 5000원 할인', '첫 거래 시 5000원 할인', 'fixed', 5000.00, NOW(), NOW() + INTERVAL '6 months'),
('VIP20', 'VIP 회원 20% 할인', 'VIP 등급 회원 전용 20% 할인', 'percentage', 20.00, NOW(), NOW() + INTERVAL '1 year')
ON CONFLICT (code) DO NOTHING;

-- 5. 생성 확인 쿼리
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'coupons', 'trading_orders')
ORDER BY table_name; 