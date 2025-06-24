# 🗄️ Supabase Database Schema Design

## 📅 **생성 일시**: 2025-06-23 18:45 UTC
## 🔄 **상태**: Firebase → PostgreSQL 변환 설계

---

## 🎯 **설계 원칙**

### **Firebase vs Supabase 구조 변환**
- **Firebase**: Document-based (NoSQL)
- **Supabase**: Table-based (PostgreSQL)
- **목표**: 관계형 DB 장점 활용하며 기존 로직 유지

---

## 🏗️ **핵심 테이블 설계**

### **1. users (사용자 테이블)**
```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  portfolio_balance DECIMAL(15,2) DEFAULT 0.00,
  available_cash DECIMAL(15,2) DEFAULT 100000.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**인덱스:**
- `users_email_idx` ON email
- `users_created_at_idx` ON created_at

---

### **2. stocks (종목 정보 테이블)**
```sql
CREATE TABLE stocks (
  symbol VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  current_price DECIMAL(10,2),
  price_change DECIMAL(10,2),
  price_change_percent DECIMAL(5,2),
  market VARCHAR(20) DEFAULT 'KOSPI',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**인덱스:**
- `stocks_market_idx` ON market
- `stocks_last_updated_idx` ON last_updated

---

### **3. portfolios (포트폴리오 보유 테이블)**
```sql
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(10) REFERENCES stocks(symbol) ON DELETE CASCADE,
  quantity INTEGER NOT NULL CHECK (quantity >= 0),
  avg_cost DECIMAL(10,2) NOT NULL,
  total_cost DECIMAL(15,2) GENERATED ALWAYS AS (quantity * avg_cost) STORED,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, symbol)
);
```

**인덱스:**
- `portfolios_user_id_idx` ON user_id
- `portfolios_symbol_idx` ON symbol
- `portfolios_user_symbol_idx` ON (user_id, symbol)

---

### **4. orders (주문 내역 테이블)**
```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  symbol VARCHAR(10) REFERENCES stocks(symbol) ON DELETE CASCADE,
  order_type VARCHAR(4) CHECK (order_type IN ('buy', 'sell')),
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  price DECIMAL(10,2) NOT NULL,
  total_amount DECIMAL(15,2) GENERATED ALWAYS AS (quantity * price) STORED,
  status VARCHAR(10) DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_at TIMESTAMP WITH TIME ZONE
);
```

**인덱스:**
- `orders_user_id_idx` ON user_id
- `orders_symbol_idx` ON symbol
- `orders_status_idx` ON status
- `orders_created_at_idx` ON created_at

---

## 🔄 **실시간 기능 설계**

### **Supabase Realtime 활용**
```sql
-- 실시간 구독 활성화
ALTER TABLE stocks REPLICA IDENTITY FULL;
ALTER TABLE portfolios REPLICA IDENTITY FULL;
ALTER TABLE orders REPLICA IDENTITY FULL;

-- Publication 생성 (Supabase에서 자동 처리)
```

---

## 🎯 **초기 데이터 구조**

### **Sample Stocks (KOSPI 주요 종목)**
```sql
INSERT INTO stocks (symbol, name, current_price, market) VALUES
('005930', '삼성전자', 75000, 'KOSPI'),
('000660', 'SK하이닉스', 145000, 'KOSPI'),
('035420', 'NAVER', 185000, 'KOSPI'),
('005380', '현대차', 195000, 'KOSPI'),
('006400', '삼성SDI', 420000, 'KOSPI'),
('035720', '카카오', 55000, 'KOSPI'),
('051910', 'LG화학', 380000, 'KOSPI'),
('096770', 'SK이노베이션', 145000, 'KOSPI');
```

---

## 🔒 **보안 및 RLS (Row Level Security)**

### **사용자별 데이터 격리**
```sql
-- Users 테이블: 본인 데이터만 조회
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own profile" ON users
  FOR ALL USING (auth.uid() = id);

-- Portfolios 테이블: 본인 포트폴리오만 조회
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own portfolio" ON portfolios
  FOR ALL USING (auth.uid() = user_id);

-- Orders 테이블: 본인 주문만 조회
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own orders" ON orders
  FOR ALL USING (auth.uid() = user_id);

-- Stocks 테이블: 모든 사용자 조회 가능 (읽기 전용)
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view stocks" ON stocks
  FOR SELECT USING (true);
```

---

## 📊 **성능 최적화**

### **복합 인덱스**
```sql
-- 포트폴리오 조회 최적화
CREATE INDEX portfolios_user_performance_idx 
ON portfolios (user_id, symbol, updated_at DESC);

-- 주문 내역 조회 최적화  
CREATE INDEX orders_user_history_idx 
ON orders (user_id, created_at DESC, status);

-- 시장 데이터 조회 최적화
CREATE INDEX stocks_market_price_idx 
ON stocks (market, current_price DESC);
```

---

## 🎯 **구현 우선순위**

### **Phase 2.2: 기본 테이블 (1-2일)**
1. **stocks 테이블** - 시장 데이터 기반
2. **users 테이블** - 기본 사용자 관리
3. **portfolios 테이블** - 포트폴리오 추적

### **Phase 2.3: 고급 기능 (2-3일)**
1. **orders 테이블** - 거래 기능
2. **실시간 업데이트** - Supabase Realtime
3. **RLS 보안** - 사용자별 데이터 격리

---

## 🔄 **Firebase 대비 개선사항**

### **관계형 DB 장점**
- ✅ **JOIN 쿼리**: 복잡한 데이터 조회 최적화
- ✅ **제약 조건**: 데이터 무결성 보장
- ✅ **ACID 트랜잭션**: 일관성 있는 거래 처리
- ✅ **SQL 표준**: 강력한 쿼리 기능

### **Supabase 고유 기능**
- ✅ **실시간 구독**: Firebase와 동일한 실시간 기능
- ✅ **Auth 통합**: PostgreSQL과 완벽한 인증 연동
- ✅ **자동 API**: REST API 자동 생성
- ✅ **타입 안정성**: TypeScript 자동 타입 생성

---

## 🚀 **다음 실행 단계**

### **즉시 실행 가능**
```sql
-- 1. stocks 테이블부터 생성 및 테스트
-- 2. 샘플 데이터 삽입
-- 3. React 연동 테스트
-- 4. 실시간 업데이트 확인
```

---

**📋 상태: 설계 완료, 구현 준비됨**
**🎯 다음: stocks 테이블 생성 및 연동 테스트**

*설계 완료: 2025-06-23 18:45 UTC*