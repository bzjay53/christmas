-- 🚨 긴급 수정: ai_learning_data.strategy_type 컬럼 누락 문제 해결
-- Christmas Trading Database Schema Fix
-- 실행일: 2025-05-27

-- 1. ai_learning_data 테이블에 strategy_type 컬럼 추가
ALTER TABLE ai_learning_data 
ADD COLUMN IF NOT EXISTS strategy_type VARCHAR(50) DEFAULT 'traditional';

-- 2. ai_strategy_performance 테이블에 strategy_type 컬럼 추가 (있다면 스킵)
ALTER TABLE ai_strategy_performance 
ADD COLUMN IF NOT EXISTS strategy_type VARCHAR(50) DEFAULT 'traditional';

-- 3. 기존 NULL 데이터 업데이트
UPDATE ai_learning_data 
SET strategy_type = 'traditional' 
WHERE strategy_type IS NULL;

UPDATE ai_strategy_performance 
SET strategy_type = 'traditional' 
WHERE strategy_type IS NULL;

-- 4. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_strategy_type 
ON ai_learning_data(strategy_type);

CREATE INDEX IF NOT EXISTS idx_ai_strategy_performance_strategy_type 
ON ai_strategy_performance(strategy_type);

-- 5. 복합 인덱스 추가 (사용자별 전략 타입 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_user_strategy 
ON ai_learning_data(user_id, strategy_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_strategy_performance_user_strategy 
ON ai_strategy_performance(user_id, strategy_type, last_updated DESC);

-- 6. 전략 타입 제약 조건 추가 (데이터 무결성)
ALTER TABLE ai_learning_data 
ADD CONSTRAINT IF NOT EXISTS chk_strategy_type_valid 
CHECK (strategy_type IN ('traditional', 'ai_learning', 'hybrid', 'custom'));

ALTER TABLE ai_strategy_performance 
ADD CONSTRAINT IF NOT EXISTS chk_strategy_type_valid 
CHECK (strategy_type IN ('traditional', 'ai_learning', 'hybrid', 'custom'));

-- 7. 테이블 구조 확인
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name IN ('ai_learning_data', 'ai_strategy_performance')
    AND column_name = 'strategy_type'
ORDER BY table_name, ordinal_position;

-- 8. 성공 메시지
SELECT 'strategy_type 컬럼 추가 완료! 🎉' as message; 