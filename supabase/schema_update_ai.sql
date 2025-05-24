-- Christmas Trading: AI 자체 학습형 매매 시스템 확장
-- 실행 날짜: 2024-12-24
-- Phase 3.5: OpenAI API 및 AI 학습 시스템 구축

-- 기존 users 테이블에 OpenAI API 키 및 AI 학습 설정 필드 추가
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS openai_api_key TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS openai_model TEXT DEFAULT 'gpt-4o-mini';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ai_learning_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ai_strategy_level TEXT DEFAULT 'basic' CHECK (ai_strategy_level IN ('basic', 'intermediate', 'advanced', 'expert'));
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ai_risk_tolerance NUMERIC DEFAULT 0.5 CHECK (ai_risk_tolerance BETWEEN 0.1 AND 1.0);
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS ai_learning_data_consent BOOLEAN DEFAULT FALSE;

-- AI 학습 데이터 테이블 생성
CREATE TABLE IF NOT EXISTS public.ai_learning_data (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- 사용자 정보
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  
  -- 시장 데이터
  symbol TEXT NOT NULL,
  timeframe TEXT NOT NULL DEFAULT '1m', -- 1m, 5m, 15m, 1h, 4h, 1d
  market_data JSONB NOT NULL, -- OHLCV + 기술지표 데이터
  
  -- 매매 결정 데이터
  action TEXT CHECK (action IN ('buy', 'sell', 'hold')) NOT NULL,
  confidence_score NUMERIC CHECK (confidence_score BETWEEN 0.0 AND 1.0),
  reasoning TEXT, -- AI 결정 근거
  
  -- 결과 데이터
  entry_price NUMERIC,
  exit_price NUMERIC,
  profit_loss NUMERIC,
  success BOOLEAN,
  
  -- AI 모델 정보
  model_version TEXT DEFAULT 'v1.0',
  strategy_name TEXT DEFAULT 'christmas_ai_v1',
  
  -- 학습 메타데이터
  learning_phase TEXT DEFAULT 'training' CHECK (learning_phase IN ('training', 'validation', 'production')),
  feedback_score INTEGER CHECK (feedback_score BETWEEN 1 AND 5),
  user_feedback TEXT,
  
  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- AI 전략 성과 테이블
CREATE TABLE IF NOT EXISTS public.ai_strategy_performance (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  
  -- 사용자 및 전략 정보
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
  strategy_name TEXT NOT NULL,
  strategy_version TEXT DEFAULT 'v1.0',
  
  -- 성과 지표
  total_trades INTEGER DEFAULT 0,
  winning_trades INTEGER DEFAULT 0,
  losing_trades INTEGER DEFAULT 0,
  win_rate NUMERIC DEFAULT 0.0,
  total_profit_loss NUMERIC DEFAULT 0.0,
  max_drawdown NUMERIC DEFAULT 0.0,
  sharpe_ratio NUMERIC DEFAULT 0.0,
  
  -- 기간별 성과
  daily_return NUMERIC DEFAULT 0.0,
  weekly_return NUMERIC DEFAULT 0.0,
  monthly_return NUMERIC DEFAULT 0.0,
  
  -- AI 학습 지표
  learning_iterations INTEGER DEFAULT 0,
  model_accuracy NUMERIC DEFAULT 0.0,
  prediction_confidence NUMERIC DEFAULT 0.0,
  
  -- 리스크 관리
  max_position_size NUMERIC DEFAULT 0.1,
  current_drawdown NUMERIC DEFAULT 0.0,
  risk_adjusted_return NUMERIC DEFAULT 0.0,
  
  -- 메타데이터
  evaluation_period_start TIMESTAMP WITH TIME ZONE,
  evaluation_period_end TIMESTAMP WITH TIME ZONE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- 타임스탬프
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_users_openai_api_key ON public.users(openai_api_key) WHERE openai_api_key IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_ai_learning_enabled ON public.users(ai_learning_enabled);
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_user_id ON public.ai_learning_data(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_symbol ON public.ai_learning_data(symbol);
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_created_at ON public.ai_learning_data(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_strategy_performance_user_id ON public.ai_strategy_performance(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_strategy_performance_strategy ON public.ai_strategy_performance(strategy_name, strategy_version);

-- RLS 정책 설정
ALTER TABLE public.ai_learning_data ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_strategy_performance ENABLE ROW LEVEL SECURITY;

-- 사용자는 자신의 AI 데이터만 접근 가능
CREATE POLICY "Users can manage their own AI learning data" ON public.ai_learning_data
  FOR ALL USING (user_id = auth.uid());

CREATE POLICY "Users can manage their own AI strategy performance" ON public.ai_strategy_performance
  FOR ALL USING (user_id = auth.uid());

-- 트리거 추가 (updated_at 자동 업데이트)
CREATE TRIGGER set_updated_at_ai_learning BEFORE UPDATE ON public.ai_learning_data FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER set_updated_at_ai_performance BEFORE UPDATE ON public.ai_strategy_performance FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- 권한 설정
GRANT ALL ON public.ai_learning_data TO authenticated;
GRANT ALL ON public.ai_strategy_performance TO authenticated;

-- 스키마 업데이트 확인
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'users' 
AND (column_name LIKE 'openai_%' OR column_name LIKE 'ai_%')
ORDER BY column_name;

-- AI 테이블 확인
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name IN ('ai_learning_data', 'ai_strategy_performance')
ORDER BY table_name, ordinal_position; 