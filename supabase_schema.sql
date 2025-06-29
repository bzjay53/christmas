-- 🎄 Christmas Trading 데이터베이스 스키마
-- Supabase PostgreSQL 스키마

-- 사용자 프로필 테이블
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  display_name TEXT,
  role TEXT DEFAULT 'basic' CHECK (role IN ('admin', 'premium', 'basic', 'free')),
  subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'basic', 'premium', 'vip')),
  portfolio_balance_usdt NUMERIC(15,2) DEFAULT 0.00,
  available_cash_usdt NUMERIC(15,2) DEFAULT 1000.00,
  kyc_status TEXT DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'verified', 'rejected')),
  -- 개인 Binance API 키 (암호화 저장)
  binance_api_key_encrypted TEXT,
  binance_secret_key_encrypted TEXT,
  binance_api_active BOOLEAN DEFAULT FALSE,
  binance_api_permissions TEXT[], -- ['SPOT', 'FUTURES'] 등
  api_last_verified TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 거래 내역 테이블
CREATE TABLE trades (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  trade_type TEXT NOT NULL CHECK (trade_type IN ('buy', 'sell')),
  order_type TEXT NOT NULL CHECK (order_type IN ('market', 'limit', 'stop_loss')),
  quantity NUMERIC(20,8) NOT NULL,
  price NUMERIC(15,2) NOT NULL,
  total_amount NUMERIC(15,2) NOT NULL,
  fee_amount NUMERIC(15,2) DEFAULT 0.00,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled', 'failed')),
  strategy_type TEXT CHECK (strategy_type IN ('scalping', 'short_term', 'medium_term', 'long_term')),
  risk_level TEXT CHECK (risk_level IN ('aggressive', 'neutral', 'defensive')),
  is_ai_trade BOOLEAN DEFAULT FALSE,
  ai_confidence_score NUMERIC(3,2),
  trade_reason TEXT,
  execution_time TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 포트폴리오 보유 자산 테이블
CREATE TABLE portfolio_holdings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  symbol TEXT NOT NULL,
  quantity NUMERIC(20,8) NOT NULL DEFAULT 0,
  average_buy_price NUMERIC(15,2) NOT NULL DEFAULT 0,
  total_invested NUMERIC(15,2) NOT NULL DEFAULT 0,
  current_value NUMERIC(15,2) NOT NULL DEFAULT 0,
  unrealized_pnl NUMERIC(15,2) DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, symbol)
);

-- AI 매매 전략 설정 테이블
CREATE TABLE ai_trading_strategies (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  strategy_name TEXT NOT NULL,
  symbol TEXT NOT NULL,
  strategy_type TEXT NOT NULL CHECK (strategy_type IN ('scalping', 'short_term', 'medium_term', 'long_term')),
  risk_level TEXT NOT NULL CHECK (risk_level IN ('aggressive', 'neutral', 'defensive')),
  max_position_size NUMERIC(15,2) NOT NULL,
  stop_loss_percent NUMERIC(5,2) DEFAULT 5.00,
  take_profit_percent NUMERIC(5,2) DEFAULT 10.00,
  is_active BOOLEAN DEFAULT TRUE,
  daily_trade_limit INTEGER DEFAULT 10,
  min_confidence_score NUMERIC(3,2) DEFAULT 0.70,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 거래 신호 및 AI 분석 테이블
CREATE TABLE trading_signals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  symbol TEXT NOT NULL,
  signal_type TEXT NOT NULL CHECK (signal_type IN ('buy', 'sell', 'hold')),
  confidence_score NUMERIC(3,2) NOT NULL,
  price_target NUMERIC(15,2),
  stop_loss NUMERIC(15,2),
  strategy_type TEXT CHECK (strategy_type IN ('scalping', 'short_term', 'medium_term', 'long_term')),
  technical_indicators JSONB,
  market_sentiment TEXT,
  analysis_summary TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 구독 및 결제 내역 테이블
CREATE TABLE subscriptions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type TEXT NOT NULL CHECK (plan_type IN ('free', 'basic', 'premium', 'vip')),
  price_paid NUMERIC(10,2) NOT NULL DEFAULT 0,
  payment_method TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'cancelled', 'expired', 'pending')),
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE,
  auto_renew BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 시스템 알림 테이블
CREATE TABLE notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('trade', 'system', 'alert', 'promotion')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT FALSE,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 시장 데이터 캐시 테이블 (성능 최적화용)
CREATE TABLE market_data_cache (
  symbol TEXT PRIMARY KEY,
  price NUMERIC(15,2) NOT NULL,
  change_24h NUMERIC(15,2),
  change_percent_24h NUMERIC(5,2),
  volume_24h NUMERIC(20,2),
  high_24h NUMERIC(15,2),
  low_24h NUMERIC(15,2),
  market_cap NUMERIC(20,2),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_created_at ON trades(created_at);
CREATE INDEX idx_portfolio_holdings_user_id ON portfolio_holdings(user_id);
CREATE INDEX idx_ai_trading_strategies_user_id ON ai_trading_strategies(user_id);
CREATE INDEX idx_trading_signals_symbol ON trading_signals(symbol);
CREATE INDEX idx_trading_signals_created_at ON trading_signals(created_at);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_is_read ON notifications(is_read);

-- RLS (Row Level Security) 정책 설정
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE trades ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolio_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_trading_strategies ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 데이터만 접근 가능
CREATE POLICY "Users can only access their own profile" ON profiles
  FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can only access their own trades" ON trades
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own portfolio" ON portfolio_holdings
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own strategies" ON ai_trading_strategies
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own subscriptions" ON subscriptions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own notifications" ON notifications
  FOR ALL USING (auth.uid() = user_id);

-- 시장 데이터는 모든 사용자가 읽기 가능
CREATE POLICY "Anyone can read market data" ON market_data_cache
  FOR SELECT USING (true);

-- 거래 신호는 구독 티어에 따라 접근 제한
CREATE POLICY "Trading signals access based on subscription" ON trading_signals
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.subscription_tier IN ('basic', 'premium', 'vip')
    )
  );

-- 트리거 함수: updated_at 자동 업데이트
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_portfolio_holdings_updated_at BEFORE UPDATE ON portfolio_holdings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_trading_strategies_updated_at BEFORE UPDATE ON ai_trading_strategies
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 프로필 자동 생성 함수 (사용자 가입 시 자동 실행)
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, display_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ language 'plpgsql' security definer;

-- 새 사용자 가입 시 프로필 자동 생성 트리거
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- 구독 티어별 제한 확인 함수
CREATE OR REPLACE FUNCTION check_subscription_limits(
  user_uuid UUID,
  action_type TEXT
) RETURNS BOOLEAN AS $$
DECLARE
  user_tier TEXT;
  daily_trades INTEGER;
  tier_limit INTEGER;
BEGIN
  -- 사용자 구독 티어 조회
  SELECT subscription_tier INTO user_tier
  FROM profiles WHERE id = user_uuid;
  
  -- 오늘 거래 횟수 조회
  SELECT COUNT(*) INTO daily_trades
  FROM trades 
  WHERE user_id = user_uuid 
  AND DATE(created_at) = CURRENT_DATE;
  
  -- 티어별 제한 확인
  CASE user_tier
    WHEN 'free' THEN tier_limit := 5;
    WHEN 'basic' THEN tier_limit := 20;
    WHEN 'premium' THEN tier_limit := 100;
    WHEN 'vip' THEN tier_limit := 1000;
    ELSE tier_limit := 0;
  END CASE;
  
  RETURN daily_trades < tier_limit;
END;
$$ language 'plpgsql' security definer;

-- 초기 데이터 삽입 (예시 시장 데이터)
INSERT INTO market_data_cache (symbol, price, change_24h, change_percent_24h, volume_24h, high_24h, low_24h) VALUES
('BTCUSDT', 43250.00, 1250.00, 2.98, 28500000000, 44100, 41800),
('ETHUSDT', 2580.50, -45.00, -1.72, 15200000000, 2650, 2520),
('BNBUSDT', 315.75, 12.30, 4.05, 890000000, 320, 298),
('ADAUSDT', 0.485, 0.023, 4.98, 1200000000, 0.495, 0.462),
('SOLUSDT', 98.75, -2.45, -2.42, 2100000000, 102.30, 96.80),
('DOTUSDT', 6.85, 0.32, 4.89, 850000000, 7.10, 6.45),
('LINKUSDT', 14.25, -0.85, -5.63, 1800000000, 15.20, 14.10),
('MATICUSDT', 0.825, 0.045, 5.77, 1100000000, 0.840, 0.785),
('AVAXUSDT', 35.80, 1.25, 3.61, 980000000, 36.50, 34.20),
('ATOMUSDT', 10.45, -0.35, -3.24, 650000000, 10.95, 10.15);