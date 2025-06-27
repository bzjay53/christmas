# 바이낸스 암호화폐 데이터베이스 스키마 설계

## 생성 일시: 2025-06-27 UTC
## 상태: 한국 주식 → 바이낸스 암호화폐 전환 설계

---

## 설계 원칙

### 한국 주식 시스템에서 암호화폐 시스템으로 전환
- **기존**: 주식 종목 (stocks) 중심 설계
- **신규**: 암호화폐 거래 쌍 (crypto_pairs) 중심 설계
- **목표**: 글로벌 암호화폐 시장 특성 반영하며 PostgreSQL 관계형 DB 장점 활용

### 암호화폐 특성 반영
- **24/7 거래**: 시장 시간 제한 없음
- **높은 정밀도**: 소수점 8자리까지 지원
- **다양한 거래 쌍**: BTC/USDT, ETH/BTC 등 복합 구조
- **실시간 변동성**: 고빈도 가격 업데이트 지원

---

## 핵심 테이블 설계

### 1. users (사용자 테이블) - 기존 구조 유지

```sql
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(100),
  portfolio_balance_usdt DECIMAL(20,8) DEFAULT 0.00000000, -- USDT 기준 총 자산
  available_cash_usdt DECIMAL(20,8) DEFAULT 1000.00000000, -- 거래 가능 USDT
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**변경사항:**
- `portfolio_balance` → `portfolio_balance_usdt` (USDT 기준)
- `available_cash` → `available_cash_usdt` (USDT 기준)
- `DECIMAL(15,2)` → `DECIMAL(20,8)` (암호화폐 정밀도)

**인덱스:**
- `users_email_idx` ON email
- `users_created_at_idx` ON created_at

---

### 2. crypto_pairs (암호화폐 거래 쌍 테이블) - 신규

```sql
CREATE TABLE crypto_pairs (
  symbol VARCHAR(20) PRIMARY KEY,           -- 'BTCUSDT', 'ETHUSDT'
  base_asset VARCHAR(10) NOT NULL,          -- 'BTC', 'ETH'
  quote_asset VARCHAR(10) NOT NULL,         -- 'USDT', 'BTC'
  current_price DECIMAL(20,8),              -- 현재 가격
  price_change_24h DECIMAL(20,8),           -- 24시간 변동액
  price_change_percent_24h DECIMAL(10,4),   -- 24시간 변동률
  volume_24h DECIMAL(20,8),                 -- 24시간 거래량
  quote_volume_24h DECIMAL(20,8),           -- 24시간 거래대금
  high_24h DECIMAL(20,8),                   -- 24시간 최고가
  low_24h DECIMAL(20,8),                    -- 24시간 최저가
  market_cap DECIMAL(25,2),                 -- 시가총액 (USD)
  is_active BOOLEAN DEFAULT true,           -- 거래 활성화 여부
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

**주요 특징:**
- 바이낸스 API 응답 구조와 1:1 매핑
- 24시간 통계 데이터 포함
- 높은 정밀도 (소수점 8자리) 지원

**인덱스:**
- `crypto_pairs_base_asset_idx` ON base_asset
- `crypto_pairs_quote_asset_idx` ON quote_asset
- `crypto_pairs_last_updated_idx` ON last_updated
- `crypto_pairs_active_idx` ON is_active

---

### 3. portfolios (포트폴리오 테이블) - 암호화폐 맞춤 수정

```sql
CREATE TABLE portfolios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  asset VARCHAR(10) NOT NULL,               -- 'BTC', 'ETH', 'USDT'
  quantity DECIMAL(20,8) NOT NULL,          -- 보유 수량
  avg_cost_usdt DECIMAL(20,8),              -- 평균 매입 단가 (USDT)
  total_cost_usdt DECIMAL(20,8),            -- 총 매입 금액 (USDT)
  unrealized_pnl_usdt DECIMAL(20,8),        -- 미실현 손익 (USDT)
  realized_pnl_usdt DECIMAL(20,8) DEFAULT 0, -- 실현 손익 (USDT)
  first_purchase_at TIMESTAMP WITH TIME ZONE,
  last_transaction_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(user_id, asset)
);
```

**변경사항:**
- `symbol` → `asset` (암호화폐 자산명)
- `avg_cost` → `avg_cost_usdt` (USDT 기준 평균 단가)
- 실현/미실현 손익 분리 추적
- 소수점 8자리 정밀도

**인덱스:**
- `portfolios_user_id_idx` ON user_id
- `portfolios_asset_idx` ON asset
- `portfolios_last_transaction_idx` ON last_transaction_at

---

### 4. orders (주문 테이블) - 암호화폐 거래 맞춤

```sql
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  binance_order_id BIGINT,                  -- 바이낸스 주문 ID
  symbol VARCHAR(20) NOT NULL,              -- 'BTCUSDT', 'ETHUSDT'
  side VARCHAR(4) NOT NULL,                 -- 'BUY', 'SELL'
  type VARCHAR(10) NOT NULL,                -- 'MARKET', 'LIMIT', 'STOP_LOSS'
  quantity DECIMAL(20,8) NOT NULL,          -- 주문 수량
  price DECIMAL(20,8),                      -- 주문 가격 (LIMIT 주문시)
  executed_quantity DECIMAL(20,8) DEFAULT 0, -- 체결 수량
  executed_quote_quantity DECIMAL(20,8) DEFAULT 0, -- 체결 금액
  avg_execution_price DECIMAL(20,8),        -- 평균 체결 가격
  status VARCHAR(20) DEFAULT 'PENDING',     -- 'PENDING', 'FILLED', 'CANCELED', 'REJECTED'
  commission DECIMAL(20,8) DEFAULT 0,       -- 수수료
  commission_asset VARCHAR(10),             -- 수수료 자산 ('BNB', 'USDT')
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  executed_at TIMESTAMP WITH TIME ZONE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CHECK (side IN ('BUY', 'SELL')),
  CHECK (type IN ('MARKET', 'LIMIT', 'STOP_LOSS', 'STOP_LOSS_LIMIT', 'TAKE_PROFIT', 'TAKE_PROFIT_LIMIT')),
  CHECK (status IN ('PENDING', 'FILLED', 'PARTIALLY_FILLED', 'CANCELED', 'REJECTED', 'EXPIRED'))
);
```

**변경사항:**
- `binance_order_id` 추가 (바이낸스 API 연동)
- `symbol` 구조 변경 (주식 코드 → 암호화폐 거래 쌍)
- 다양한 주문 타입 지원
- 수수료 추적 기능 강화
- 부분 체결 지원

**인덱스:**
- `orders_user_id_idx` ON user_id
- `orders_symbol_idx` ON symbol
- `orders_status_idx` ON status
- `orders_binance_order_id_idx` ON binance_order_id
- `orders_created_at_idx` ON created_at

---

### 5. price_history (가격 히스토리 테이블) - 신규

```sql
CREATE TABLE price_history (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  open_price DECIMAL(20,8) NOT NULL,
  high_price DECIMAL(20,8) NOT NULL,
  low_price DECIMAL(20,8) NOT NULL,
  close_price DECIMAL(20,8) NOT NULL,
  volume DECIMAL(20,8) NOT NULL,
  quote_volume DECIMAL(20,8) NOT NULL,
  interval_type VARCHAR(10) NOT NULL,       -- '1m', '5m', '1h', '1d'
  open_time TIMESTAMP WITH TIME ZONE NOT NULL,
  close_time TIMESTAMP WITH TIME ZONE NOT NULL,
  
  UNIQUE(symbol, interval_type, open_time)
);
```

**용도:**
- 차트 데이터 저장 및 조회
- 기술적 분석 지표 계산
- 과거 데이터 백업

**인덱스:**
- `price_history_symbol_interval_idx` ON (symbol, interval_type, open_time)
- `price_history_close_time_idx` ON close_time

---

### 6. staking_rewards (스테이킹 보상 테이블) - 신규

```sql
CREATE TABLE staking_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  asset VARCHAR(10) NOT NULL,               -- 스테이킹 자산
  staked_amount DECIMAL(20,8) NOT NULL,     -- 스테이킹 수량
  reward_amount DECIMAL(20,8) NOT NULL,     -- 보상 수량
  reward_asset VARCHAR(10) NOT NULL,        -- 보상 자산
  apy_rate DECIMAL(8,4),                    -- 연 수익률
  start_date DATE NOT NULL,
  end_date DATE,
  status VARCHAR(20) DEFAULT 'ACTIVE',      -- 'ACTIVE', 'COMPLETED', 'CANCELED'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  CHECK (status IN ('ACTIVE', 'COMPLETED', 'CANCELED'))
);
```

**용도:**
- DeFi 스테이킹 수익 추적
- 연 수익률 계산
- 포트폴리오 수익성 분석

**인덱스:**
- `staking_rewards_user_id_idx` ON user_id
- `staking_rewards_asset_idx` ON asset
- `staking_rewards_status_idx` ON status

---

## 초기 데이터 설정

### 주요 암호화폐 거래 쌍 등록

```sql
-- 메이저 암호화폐 거래 쌍
INSERT INTO crypto_pairs (symbol, base_asset, quote_asset, current_price, is_active) VALUES
('BTCUSDT', 'BTC', 'USDT', 43250.12345678, true),
('ETHUSDT', 'ETH', 'USDT', 2680.45678901, true),
('BNBUSDT', 'BNB', 'USDT', 315.67890123, true),
('ADAUSDT', 'ADA', 'USDT', 0.52341234, true),
('SOLUSDT', 'SOL', 'USDT', 98.76543210, true),
('XRPUSDT', 'XRP', 'USDT', 0.61234567, true),
('DOTUSDT', 'DOT', 'USDT', 6.78901234, true),
('AVAXUSDT', 'AVAX', 'USDT', 37.89012345, true),

-- BTC 기준 거래 쌍
('ETHBTC', 'ETH', 'BTC', 0.06198765, true),
('BNBBTC', 'BNB', 'BTC', 0.00730123, true),
('ADABTC', 'ADA', 'BTC', 0.00001211, true);
```

### 테스트 사용자 및 포트폴리오

```sql
-- 테스트 사용자 생성
INSERT INTO users (email, display_name, available_cash_usdt) VALUES
('test@example.com', 'Test User', 10000.00000000);

-- 테스트 포트폴리오
INSERT INTO portfolios (user_id, asset, quantity, avg_cost_usdt, total_cost_usdt) VALUES
((SELECT id FROM users WHERE email = 'test@example.com'), 'BTC', 0.23456789, 42000.00000000, 9849.23076000),
((SELECT id FROM users WHERE email = 'test@example.com'), 'ETH', 3.45678901, 2600.00000000, 8987.65142600),
((SELECT id FROM users WHERE email = 'test@example.com'), 'USDT', 1500.00000000, 1.00000000, 1500.00000000);
```

---

## 뷰 (Views) 정의

### 1. 사용자 포트폴리오 요약 뷰

```sql
CREATE VIEW user_portfolio_summary AS
SELECT 
  u.id as user_id,
  u.email,
  u.display_name,
  COUNT(p.asset) as total_assets,
  SUM(p.quantity * cp.current_price) as total_value_usdt,
  u.available_cash_usdt,
  (SUM(p.quantity * cp.current_price) + u.available_cash_usdt) as total_balance_usdt,
  SUM(p.unrealized_pnl_usdt) as total_unrealized_pnl_usdt
FROM users u
LEFT JOIN portfolios p ON u.id = p.user_id
LEFT JOIN crypto_pairs cp ON (p.asset || 'USDT') = cp.symbol
GROUP BY u.id, u.email, u.display_name, u.available_cash_usdt;
```

### 2. 활성 주문 현황 뷰

```sql
CREATE VIEW active_orders_summary AS
SELECT 
  u.email,
  o.symbol,
  o.side,
  o.type,
  o.quantity,
  o.price,
  o.status,
  o.created_at
FROM orders o
JOIN users u ON o.user_id = u.id
WHERE o.status IN ('PENDING', 'PARTIALLY_FILLED')
ORDER BY o.created_at DESC;
```

---

## 트리거 (Triggers) 설정

### 1. 포트폴리오 자동 업데이트

```sql
CREATE OR REPLACE FUNCTION update_portfolio_after_order()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'FILLED' THEN
    -- 매수인 경우
    IF NEW.side = 'BUY' THEN
      INSERT INTO portfolios (user_id, asset, quantity, avg_cost_usdt, total_cost_usdt, last_transaction_at)
      VALUES (NEW.user_id, 
              SPLIT_PART(NEW.symbol, 'USDT', 1), 
              NEW.executed_quantity, 
              NEW.avg_execution_price, 
              NEW.executed_quote_quantity,
              NEW.executed_at)
      ON CONFLICT (user_id, asset) 
      DO UPDATE SET 
        quantity = portfolios.quantity + NEW.executed_quantity,
        avg_cost_usdt = (portfolios.total_cost_usdt + NEW.executed_quote_quantity) / (portfolios.quantity + NEW.executed_quantity),
        total_cost_usdt = portfolios.total_cost_usdt + NEW.executed_quote_quantity,
        last_transaction_at = NEW.executed_at;
    END IF;
    
    -- 매도인 경우
    IF NEW.side = 'SELL' THEN
      UPDATE portfolios 
      SET quantity = quantity - NEW.executed_quantity,
          last_transaction_at = NEW.executed_at
      WHERE user_id = NEW.user_id 
        AND asset = SPLIT_PART(NEW.symbol, 'USDT', 1);
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_portfolio_after_order
  AFTER UPDATE ON orders
  FOR EACH ROW
  EXECUTE FUNCTION update_portfolio_after_order();
```

### 2. 가격 업데이트 시간 자동 설정

```sql
CREATE OR REPLACE FUNCTION update_crypto_pairs_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_crypto_pairs_timestamp
  BEFORE UPDATE ON crypto_pairs
  FOR EACH ROW
  EXECUTE FUNCTION update_crypto_pairs_timestamp();
```

---

## 보안 및 성능 최적화

### 1. Row Level Security (RLS) 설정

```sql
-- 사용자는 자신의 데이터만 접근 가능
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE staking_rewards ENABLE ROW LEVEL SECURITY;

-- 포트폴리오 RLS 정책
CREATE POLICY "Users can view own portfolios" ON portfolios
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own portfolios" ON portfolios
  FOR UPDATE USING (auth.uid() = user_id);

-- 주문 RLS 정책
CREATE POLICY "Users can view own orders" ON orders
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own orders" ON orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### 2. 파티셔닝 (대용량 데이터 처리)

```sql
-- 가격 히스토리 테이블 월별 파티셔닝
CREATE TABLE price_history_2025_01 PARTITION OF price_history
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE price_history_2025_02 PARTITION OF price_history
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');
```

---

## 백업 및 복구 전략

### 1. 실시간 백업 설정

```sql
-- 중요 거래 데이터 실시간 복제
CREATE PUBLICATION crypto_trading_replication FOR TABLE orders, portfolios;
```

### 2. 데이터 보존 정책

```sql
-- 90일 이전 1분 차트 데이터 삭제
CREATE OR REPLACE FUNCTION cleanup_old_price_history()
RETURNS void AS $$
BEGIN
  DELETE FROM price_history 
  WHERE interval_type = '1m' 
    AND close_time < NOW() - INTERVAL '90 days';
END;
$$ LANGUAGE plpgsql;

-- 매일 새벽 3시 정리 작업 실행
SELECT cron.schedule('cleanup-price-history', '0 3 * * *', 'SELECT cleanup_old_price_history();');
```

---

## API 연동 고려사항

### 1. 바이낸스 API 데이터 매핑

| 바이낸스 API 필드 | 데이터베이스 필드 | 타입 변환 |
|------------------|------------------|-----------|
| `symbol` | `symbol` | VARCHAR(20) |
| `price` | `current_price` | parseFloat → DECIMAL(20,8) |
| `priceChange` | `price_change_24h` | parseFloat → DECIMAL(20,8) |
| `priceChangePercent` | `price_change_percent_24h` | parseFloat → DECIMAL(10,4) |
| `volume` | `volume_24h` | parseFloat → DECIMAL(20,8) |

### 2. 실시간 업데이트 전략

```sql
-- 가격 데이터 배치 업데이트 (성능 최적화)
CREATE OR REPLACE FUNCTION batch_update_crypto_prices(
  symbols TEXT[],
  prices DECIMAL(20,8)[],
  changes DECIMAL(20,8)[],
  volumes DECIMAL(20,8)[]
)
RETURNS void AS $$
DECLARE
  i INTEGER;
BEGIN
  FOR i IN 1..array_length(symbols, 1) LOOP
    UPDATE crypto_pairs 
    SET current_price = prices[i],
        price_change_24h = changes[i],
        volume_24h = volumes[i],
        last_updated = NOW()
    WHERE symbol = symbols[i];
  END LOOP;
END;
$$ LANGUAGE plpgsql;
```

---

## 마이그레이션 스크립트

### 기존 주식 데이터에서 암호화폐 데이터로 전환

```sql
-- 1. 기존 테이블 백업
CREATE TABLE stocks_backup AS SELECT * FROM stocks;
CREATE TABLE portfolios_backup AS SELECT * FROM portfolios;
CREATE TABLE orders_backup AS SELECT * FROM orders;

-- 2. 새로운 스키마 적용
-- (위의 CREATE TABLE 문들 실행)

-- 3. 사용자 데이터 마이그레이션
UPDATE users SET 
  portfolio_balance_usdt = portfolio_balance,
  available_cash_usdt = available_cash;

-- 4. 기존 테이블 제거 (백업 확인 후)
-- DROP TABLE IF EXISTS stocks;
-- DROP TABLE IF EXISTS portfolios_backup;
-- DROP TABLE IF EXISTS orders_backup;
```

---

## 모니터링 및 알림

### 1. 성능 모니터링 쿼리

```sql
-- 느린 쿼리 모니터링
SELECT query, mean_time, calls, total_time
FROM pg_stat_statements 
WHERE mean_time > 1000 
ORDER BY mean_time DESC;

-- 테이블 크기 모니터링
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(tablename::regclass)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(tablename::regclass) DESC;
```

### 2. 데이터 일관성 검증

```sql
-- 포트폴리오 데이터 일관성 검증
CREATE OR REPLACE FUNCTION verify_portfolio_consistency()
RETURNS TABLE(user_email TEXT, inconsistency_type TEXT, details TEXT) AS $$
BEGIN
  -- 음수 잔고 검증
  RETURN QUERY
  SELECT u.email, 'negative_balance', 'Asset: ' || p.asset || ', Quantity: ' || p.quantity
  FROM portfolios p
  JOIN users u ON p.user_id = u.id
  WHERE p.quantity < 0;
  
  -- 주문과 포트폴리오 불일치 검증
  -- (추가 검증 로직...)
END;
$$ LANGUAGE plpgsql;
```

---

문서 작성 완료: 2025-06-27 UTC
다음 업데이트 예정: 바이낸스 API 통합 및 실제 데이터 연동 완료 후