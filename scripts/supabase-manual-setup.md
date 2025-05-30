# Supabase 테이블 수동 생성 가이드

## 🎯 목표
Christmas Trading 프로젝트에 필요한 Supabase 테이블들을 수동으로 생성합니다.

## 📋 현재 상태
- ✅ `users` 테이블: 이미 존재
- ❌ `coupons` 테이블: 누락
- ❌ `trading_orders` 테이블: 누락

## 🔧 수동 생성 단계

### 1단계: Supabase 대시보드 접속
1. 웹 브라우저에서 https://supabase.com/dashboard 접속
2. 로그인 후 프로젝트 선택 (qehzzsxzjijfzqkysazc)

### 2단계: SQL Editor 열기
1. 왼쪽 메뉴에서 "SQL Editor" 클릭
2. "New query" 버튼 클릭

### 3단계: 테이블 생성 SQL 실행

#### A. coupons 테이블 생성
다음 SQL을 복사하여 실행:

```sql
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
```

#### B. trading_orders 테이블 생성
다음 SQL을 복사하여 실행:

```sql
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
```

#### C. 인덱스 생성 (선택사항)
성능 향상을 위한 인덱스:

```sql
-- coupons 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);
CREATE INDEX IF NOT EXISTS idx_coupons_valid_period ON coupons(valid_from, valid_until);
CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);

-- trading_orders 테이블 인덱스
CREATE INDEX IF NOT EXISTS idx_trading_orders_user_id ON trading_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_trading_orders_stock_code ON trading_orders(stock_code);
CREATE INDEX IF NOT EXISTS idx_trading_orders_status ON trading_orders(status);
CREATE INDEX IF NOT EXISTS idx_trading_orders_created_at ON trading_orders(created_at);
```

#### D. 기본 데이터 삽입 (선택사항)
테스트용 쿠폰 데이터:

```sql
INSERT INTO coupons (code, name, description, discount_type, discount_value, valid_from, valid_until) VALUES
('WELCOME10', '신규 가입 10% 할인', '신규 회원 가입 시 10% 할인 쿠폰', 'percentage', 10.00, NOW(), NOW() + INTERVAL '1 year'),
('FIRST5000', '첫 거래 5000원 할인', '첫 거래 시 5000원 할인', 'fixed', 5000.00, NOW(), NOW() + INTERVAL '6 months'),
('VIP20', 'VIP 회원 20% 할인', 'VIP 등급 회원 전용 20% 할인', 'percentage', 20.00, NOW(), NOW() + INTERVAL '1 year')
ON CONFLICT (code) DO NOTHING;
```

### 4단계: 생성 확인
다음 SQL로 테이블이 정상 생성되었는지 확인:

```sql
-- 테이블 목록 확인
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'coupons', 'trading_orders')
ORDER BY table_name;

-- 각 테이블의 레코드 수 확인
SELECT 'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'coupons' as table_name, COUNT(*) as count FROM coupons
UNION ALL
SELECT 'trading_orders' as table_name, COUNT(*) as count FROM trading_orders;
```

## ✅ 완료 후 확인사항
1. 모든 테이블이 생성되었는지 확인
2. 백엔드 API 테스트 실행
3. 프론트엔드 연동 테스트

## 🚨 문제 해결
- 권한 오류 발생 시: 프로젝트 소유자 권한으로 로그인 확인
- 외래키 오류 발생 시: users 테이블이 먼저 존재하는지 확인
- 문법 오류 발생 시: SQL 문법 검토 및 세미콜론 확인

## 📞 지원
문제 발생 시 Supabase 공식 문서 참조: https://supabase.com/docs 