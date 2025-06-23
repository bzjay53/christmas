-- 🎄 Christmas Trading - Stocks Table Creation
-- 실행 위치: Supabase Dashboard > SQL Editor

-- 1. stocks 테이블 생성
CREATE TABLE stocks (
  symbol VARCHAR(10) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  current_price DECIMAL(10,2),
  price_change DECIMAL(10,2),
  price_change_percent DECIMAL(5,2),
  market VARCHAR(20) DEFAULT 'KOSPI',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 인덱스 생성 (성능 최적화)
CREATE INDEX stocks_market_idx ON stocks(market);
CREATE INDEX stocks_last_updated_idx ON stocks(last_updated);

-- 3. 샘플 데이터 삽입 (KOSPI 주요 종목)
INSERT INTO stocks (symbol, name, current_price, price_change, price_change_percent, market) VALUES
('005930', '삼성전자', 75000, 1500, 2.04, 'KOSPI'),
('000660', 'SK하이닉스', 145000, -2000, -1.36, 'KOSPI'),
('035420', 'NAVER', 185000, 3500, 1.93, 'KOSPI'),
('005380', '현대차', 195000, -1500, -0.76, 'KOSPI'),
('006400', '삼성SDI', 420000, 8000, 1.94, 'KOSPI'),
('035720', '카카오', 55000, -1000, -1.79, 'KOSPI'),
('051910', 'LG화학', 380000, 5000, 1.33, 'KOSPI'),
('096770', 'SK이노베이션', 145000, 2500, 1.75, 'KOSPI');

-- 4. RLS (Row Level Security) 설정
ALTER TABLE stocks ENABLE ROW LEVEL SECURITY;

-- 5. 모든 사용자가 주식 데이터를 조회할 수 있도록 정책 생성
CREATE POLICY "Anyone can view stocks" ON stocks
  FOR SELECT USING (true);

-- 6. 실시간 구독 활성화 (Supabase Realtime)
ALTER TABLE stocks REPLICA IDENTITY FULL;

-- 7. 데이터 확인
SELECT * FROM stocks ORDER BY current_price DESC;