-- 🚨 긴급 수정: AI 테이블 누락 컬럼 추가
-- Christmas Trading AI Tables Schema Fix
-- 실행일: 2025-05-30

-- 1. ai_learning_data 테이블에 누락된 컬럼들 추가
ALTER TABLE ai_learning_data 
ADD COLUMN IF NOT EXISTS strategy_type VARCHAR(50) DEFAULT 'traditional' 
CHECK (strategy_type IN ('traditional', 'ai_learning', 'hybrid', 'custom'));

ALTER TABLE ai_learning_data 
ADD COLUMN IF NOT EXISTS learning_phase VARCHAR(20) DEFAULT 'training' 
CHECK (learning_phase IN ('training', 'validation', 'production'));

ALTER TABLE ai_learning_data 
ADD COLUMN IF NOT EXISTS feedback_score INTEGER 
CHECK (feedback_score BETWEEN 1 AND 5);

ALTER TABLE ai_learning_data 
ADD COLUMN IF NOT EXISTS user_feedback TEXT;

ALTER TABLE ai_learning_data 
ADD COLUMN IF NOT EXISTS model_version VARCHAR(20) DEFAULT 'v1.0';

ALTER TABLE ai_learning_data 
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(5,4) 
CHECK (confidence_score BETWEEN 0.0 AND 1.0);

ALTER TABLE ai_learning_data 
ADD COLUMN IF NOT EXISTS reasoning TEXT;

-- 2. ai_strategy_performance 테이블에 누락된 컬럼들 추가
ALTER TABLE ai_strategy_performance 
ADD COLUMN IF NOT EXISTS strategy_type VARCHAR(50) DEFAULT 'traditional' 
CHECK (strategy_type IN ('traditional', 'ai_learning', 'hybrid', 'custom'));

ALTER TABLE ai_strategy_performance 
ADD COLUMN IF NOT EXISTS strategy_version VARCHAR(20) DEFAULT 'v1.0';

ALTER TABLE ai_strategy_performance 
ADD COLUMN IF NOT EXISTS learning_iterations INTEGER DEFAULT 0;

ALTER TABLE ai_strategy_performance 
ADD COLUMN IF NOT EXISTS model_accuracy DECIMAL(5,4) DEFAULT 0.0;

ALTER TABLE ai_strategy_performance 
ADD COLUMN IF NOT EXISTS prediction_confidence DECIMAL(5,4) DEFAULT 0.0;

ALTER TABLE ai_strategy_performance 
ADD COLUMN IF NOT EXISTS max_position_size DECIMAL(5,4) DEFAULT 0.1;

ALTER TABLE ai_strategy_performance 
ADD COLUMN IF NOT EXISTS current_drawdown DECIMAL(5,4) DEFAULT 0.0;

ALTER TABLE ai_strategy_performance 
ADD COLUMN IF NOT EXISTS risk_adjusted_return DECIMAL(5,4) DEFAULT 0.0;

ALTER TABLE ai_strategy_performance 
ADD COLUMN IF NOT EXISTS evaluation_period_start TIMESTAMP WITH TIME ZONE;

ALTER TABLE ai_strategy_performance 
ADD COLUMN IF NOT EXISTS evaluation_period_end TIMESTAMP WITH TIME ZONE;

ALTER TABLE ai_strategy_performance 
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 3. 기존 NULL 데이터 업데이트
UPDATE ai_learning_data 
SET strategy_type = 'traditional' 
WHERE strategy_type IS NULL;

UPDATE ai_learning_data 
SET learning_phase = 'training' 
WHERE learning_phase IS NULL;

UPDATE ai_learning_data 
SET model_version = 'v1.0' 
WHERE model_version IS NULL;

UPDATE ai_strategy_performance 
SET strategy_type = 'traditional' 
WHERE strategy_type IS NULL;

UPDATE ai_strategy_performance 
SET strategy_version = 'v1.0' 
WHERE strategy_version IS NULL;

-- 4. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_strategy_type 
ON ai_learning_data(strategy_type);

CREATE INDEX IF NOT EXISTS idx_ai_learning_data_learning_phase 
ON ai_learning_data(learning_phase);

CREATE INDEX IF NOT EXISTS idx_ai_strategy_performance_strategy_type 
ON ai_strategy_performance(strategy_type);

-- 5. 복합 인덱스 추가 (사용자별 전략 타입 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_user_strategy 
ON ai_learning_data(user_id, strategy_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_strategy_performance_user_strategy 
ON ai_strategy_performance(user_id, strategy_type, last_updated DESC);

-- 6. 테이블 구조 최종 확인
SELECT 
    'ai_learning_data_columns' as info,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'ai_learning_data'
ORDER BY ordinal_position;

-- 7. 데이터 현황 확인 (수정된 쿼리)
SELECT 
    'ai_learning_data' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT COALESCE(strategy_type, 'unknown')) as strategy_types,
    MIN(created_at) as first_record,
    MAX(created_at) as last_record
FROM ai_learning_data
UNION ALL
SELECT 
    'ai_strategy_performance' as table_name,
    COUNT(*) as record_count,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT COALESCE(strategy_type, 'unknown')) as strategy_types,
    MIN(created_at) as first_record,
    MAX(created_at) as last_record
FROM ai_strategy_performance; 