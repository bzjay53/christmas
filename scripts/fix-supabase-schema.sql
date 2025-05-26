-- Christmas Trading Supabase 스키마 수정 스크립트
-- 누락된 컬럼들을 추가하고 완전한 스키마를 구성합니다.

-- 1. users 테이블 확장 (누락된 컬럼들 추가)
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_type VARCHAR(20) DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_trade_count INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_trade_reset_date DATE DEFAULT CURRENT_DATE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS free_trial_end_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS login_attempts INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS lock_until TIMESTAMP WITH TIME ZONE;

-- KIS API 설정 컬럼들
ALTER TABLE users ADD COLUMN IF NOT EXISTS kis_real_app_key VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS kis_real_app_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS kis_real_account VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS kis_demo_app_key VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS kis_demo_app_secret VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS kis_demo_account VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS kis_mock_mode BOOLEAN DEFAULT true;

-- 텔레그램 설정 컬럼들
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_chat_id VARCHAR(50);
ALTER TABLE users ADD COLUMN IF NOT EXISTS telegram_username VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_telegram BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_email BOOLEAN DEFAULT true;
ALTER TABLE users ADD COLUMN IF NOT EXISTS notification_push BOOLEAN DEFAULT false;

-- OpenAI 설정 컬럼들
ALTER TABLE users ADD COLUMN IF NOT EXISTS openai_api_key VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS openai_model VARCHAR(50) DEFAULT 'gpt-4o-mini';
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_learning_enabled BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_strategy_level VARCHAR(20) DEFAULT 'basic';
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_risk_tolerance DECIMAL(3,2) DEFAULT 0.5;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ai_learning_data_consent BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS selected_strategy VARCHAR(50) DEFAULT 'traditional';
ALTER TABLE users ADD COLUMN IF NOT EXISTS strategy_auto_switch BOOLEAN DEFAULT false;

-- 2. ai_learning_data 테이블 생성 (누락된 테이블)
CREATE TABLE IF NOT EXISTS ai_learning_data (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  symbol VARCHAR(20) NOT NULL,
  timeframe VARCHAR(10) DEFAULT '1m',
  market_data JSONB,
  action VARCHAR(10) NOT NULL,
  confidence_score DECIMAL(5,4),
  reasoning TEXT,
  entry_price DECIMAL(15,4),
  exit_price DECIMAL(15,4),
  profit_loss DECIMAL(15,2),
  success BOOLEAN,
  model_version VARCHAR(20) DEFAULT 'v1.0',
  strategy_name VARCHAR(50) DEFAULT 'christmas_ai_v1',
  strategy_type VARCHAR(20) DEFAULT 'traditional',
  learning_phase VARCHAR(20) DEFAULT 'training',
  feedback_score DECIMAL(3,2),
  user_feedback TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. ai_strategy_performance 테이블 생성 (누락된 테이블)
CREATE TABLE IF NOT EXISTS ai_strategy_performance (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  strategy_name VARCHAR(50) DEFAULT 'christmas_ai_v1',
  strategy_version VARCHAR(20) DEFAULT 'v1.0',
  strategy_type VARCHAR(20) DEFAULT 'traditional',
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  win_rate DECIMAL(5,4) DEFAULT 0.0,
  total_profit_loss DECIMAL(15,2) DEFAULT 0.0,
  max_drawdown DECIMAL(5,4) DEFAULT 0.0,
  sharpe_ratio DECIMAL(5,4) DEFAULT 0.0,
  daily_return DECIMAL(5,4) DEFAULT 0.0,
  weekly_return DECIMAL(5,4) DEFAULT 0.0,
  monthly_return DECIMAL(5,4) DEFAULT 0.0,
  learning_iterations INTEGER DEFAULT 0,
  model_accuracy DECIMAL(5,4) DEFAULT 0.0,
  prediction_confidence DECIMAL(5,4) DEFAULT 0.0,
  max_position_size DECIMAL(5,4) DEFAULT 0.1,
  current_drawdown DECIMAL(5,4) DEFAULT 0.0,
  risk_adjusted_return DECIMAL(5,4) DEFAULT 0.0,
  evaluation_period_start TIMESTAMP WITH TIME ZONE,
  evaluation_period_end TIMESTAMP WITH TIME ZONE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, strategy_name, strategy_version, strategy_type)
);

-- 4. trade_records 테이블 생성 (거래 기록)
CREATE TABLE IF NOT EXISTS trade_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id),
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
  quantity DECIMAL(15,4) NOT NULL,
  price DECIMAL(15,4) NOT NULL,
  total_amount DECIMAL(15,2) NOT NULL,
  fee DECIMAL(10,2) DEFAULT 0,
  trade_type VARCHAR(10) DEFAULT 'demo' CHECK (trade_type IN ('demo', 'real')),
  strategy_type VARCHAR(20) DEFAULT 'manual',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled', 'failed')),
  order_type VARCHAR(20) DEFAULT 'market' CHECK (order_type IN ('market', 'limit', 'stop')),
  executed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_users_membership_type ON users(membership_type);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_user_id ON ai_learning_data(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_strategy_type ON ai_learning_data(strategy_type);
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_symbol ON ai_learning_data(symbol);
CREATE INDEX IF NOT EXISTS idx_ai_strategy_performance_user_id ON ai_strategy_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_strategy_performance_strategy_type ON ai_strategy_performance(strategy_type);
CREATE INDEX IF NOT EXISTS idx_trade_records_user_id ON trade_records(user_id);
CREATE INDEX IF NOT EXISTS idx_trade_records_symbol ON trade_records(symbol);
CREATE INDEX IF NOT EXISTS idx_trade_records_trade_type ON trade_records(trade_type);

-- 6. RLS (Row Level Security) 정책 활성화
ALTER TABLE ai_learning_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_strategy_performance ENABLE ROW LEVEL SECURITY;
ALTER TABLE trade_records ENABLE ROW LEVEL SECURITY;

-- 7. 기본 RLS 정책 생성 (사용자는 자신의 데이터만 접근 가능)
CREATE POLICY IF NOT EXISTS "Users can view own ai_learning_data" ON ai_learning_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own ai_learning_data" ON ai_learning_data
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can view own ai_strategy_performance" ON ai_strategy_performance
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own ai_strategy_performance" ON ai_strategy_performance
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own ai_strategy_performance" ON ai_strategy_performance
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can view own trade_records" ON trade_records
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own trade_records" ON trade_records
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 8. 테스트 데이터 삽입 (선택사항)
INSERT INTO users (email, password, first_name, last_name, membership_type, referral_code) 
VALUES 
  ('admin@christmas.com', '$2a$10$rQJ8vQZ9Zv8Zv8Zv8Zv8ZuZv8Zv8Zv8Zv8Zv8Zv8Zv8Zv8Zv8Z', 'Christmas', 'Admin', 'premium', 'ADMIN2024'),
  ('user@christmas.com', '$2a$10$rQJ8vQZ9Zv8Zv8Zv8Zv8ZuZv8Zv8Zv8Zv8Zv8Zv8Zv8Zv8Zv8Z', 'Test', 'User', 'free', 'USER2024')
ON CONFLICT (email) DO NOTHING;

-- 완료 메시지
SELECT 'Christmas Trading Supabase 스키마 수정 완료!' as message; 