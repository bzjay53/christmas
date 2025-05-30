-- 🎄 Christmas Trading: AI 테이블 스키마 최종 수정 (PostgreSQL 호환)
-- 실행일: 2025-05-30
-- 목적: AI 자체학습 시스템을 위한 누락된 컬럼 추가

-- =====================================================
-- 1. ai_learning_data 테이블 컬럼 추가
-- =====================================================

-- 전략 타입 컬럼 (핵심!)
ALTER TABLE ai_learning_data 
ADD COLUMN IF NOT EXISTS strategy_type VARCHAR(50) DEFAULT 'traditional';

-- 학습 단계 컬럼 
ALTER TABLE ai_learning_data 
ADD COLUMN IF NOT EXISTS learning_phase VARCHAR(20) DEFAULT 'training';

-- AI 신뢰도 점수
ALTER TABLE ai_learning_data 
ADD COLUMN IF NOT EXISTS confidence_score DECIMAL(5,4);

-- AI 결정 근거
ALTER TABLE ai_learning_data 
ADD COLUMN IF NOT EXISTS reasoning TEXT;

-- 사용자 피드백
ALTER TABLE ai_learning_data 
ADD COLUMN IF NOT EXISTS feedback_score INTEGER;

ALTER TABLE ai_learning_data 
ADD COLUMN IF NOT EXISTS user_feedback TEXT;

-- 모델 버전
ALTER TABLE ai_learning_data 
ADD COLUMN IF NOT EXISTS model_version VARCHAR(20) DEFAULT 'v1.0';

-- =====================================================
-- 2. ai_strategy_performance 테이블 컬럼 추가
-- =====================================================

-- 전략 타입 컬럼 (핵심!)
ALTER TABLE ai_strategy_performance 
ADD COLUMN IF NOT EXISTS strategy_type VARCHAR(50) DEFAULT 'traditional';

-- 전략 버전
ALTER TABLE ai_strategy_performance 
ADD COLUMN IF NOT EXISTS strategy_version VARCHAR(20) DEFAULT 'v1.0';

-- AI 학습 관련 컬럼들
ALTER TABLE ai_strategy_performance 
ADD COLUMN IF NOT EXISTS learning_iterations INTEGER DEFAULT 0;

ALTER TABLE ai_strategy_performance 
ADD COLUMN IF NOT EXISTS model_accuracy DECIMAL(5,4) DEFAULT 0.0;

ALTER TABLE ai_strategy_performance 
ADD COLUMN IF NOT EXISTS prediction_confidence DECIMAL(5,4) DEFAULT 0.0;

-- 리스크 관리 컬럼들
ALTER TABLE ai_strategy_performance 
ADD COLUMN IF NOT EXISTS max_position_size DECIMAL(5,4) DEFAULT 0.1;

ALTER TABLE ai_strategy_performance 
ADD COLUMN IF NOT EXISTS current_drawdown DECIMAL(5,4) DEFAULT 0.0;

ALTER TABLE ai_strategy_performance 
ADD COLUMN IF NOT EXISTS risk_adjusted_return DECIMAL(5,4) DEFAULT 0.0;

-- 평가 기간 컬럼들
ALTER TABLE ai_strategy_performance 
ADD COLUMN IF NOT EXISTS evaluation_period_start TIMESTAMP WITH TIME ZONE;

ALTER TABLE ai_strategy_performance 
ADD COLUMN IF NOT EXISTS evaluation_period_end TIMESTAMP WITH TIME ZONE;

ALTER TABLE ai_strategy_performance 
ADD COLUMN IF NOT EXISTS last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- =====================================================
-- 3. 기존 NULL 데이터 업데이트
-- =====================================================

-- ai_learning_data 기본값 설정
UPDATE ai_learning_data 
SET strategy_type = 'traditional' 
WHERE strategy_type IS NULL;

UPDATE ai_learning_data 
SET learning_phase = 'training' 
WHERE learning_phase IS NULL;

UPDATE ai_learning_data 
SET model_version = 'v1.0' 
WHERE model_version IS NULL;

-- ai_strategy_performance 기본값 설정
UPDATE ai_strategy_performance 
SET strategy_type = 'traditional' 
WHERE strategy_type IS NULL;

UPDATE ai_strategy_performance 
SET strategy_version = 'v1.0' 
WHERE strategy_version IS NULL;

-- =====================================================
-- 4. 제약 조건 추가 (PostgreSQL 호환 방식)
-- =====================================================

-- 제약 조건을 안전하게 추가하는 DO 블록
DO $$ 
BEGIN
    -- ai_learning_data.strategy_type 제약 조건
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_ai_learning_strategy_type' 
        AND table_name = 'ai_learning_data'
    ) THEN
        ALTER TABLE ai_learning_data 
        ADD CONSTRAINT chk_ai_learning_strategy_type 
        CHECK (strategy_type IN ('traditional', 'ai_learning', 'hybrid', 'custom'));
    END IF;

    -- ai_strategy_performance.strategy_type 제약 조건
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_ai_performance_strategy_type' 
        AND table_name = 'ai_strategy_performance'
    ) THEN
        ALTER TABLE ai_strategy_performance 
        ADD CONSTRAINT chk_ai_performance_strategy_type 
        CHECK (strategy_type IN ('traditional', 'ai_learning', 'hybrid', 'custom'));
    END IF;

    -- ai_learning_data.learning_phase 제약 조건
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_learning_phase' 
        AND table_name = 'ai_learning_data'
    ) THEN
        ALTER TABLE ai_learning_data 
        ADD CONSTRAINT chk_learning_phase 
        CHECK (learning_phase IN ('training', 'validation', 'production'));
    END IF;

    -- ai_learning_data.confidence_score 제약 조건
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_confidence_score' 
        AND table_name = 'ai_learning_data'
    ) THEN
        ALTER TABLE ai_learning_data 
        ADD CONSTRAINT chk_confidence_score 
        CHECK (confidence_score BETWEEN 0.0 AND 1.0);
    END IF;

    -- ai_learning_data.feedback_score 제약 조건
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'chk_feedback_score' 
        AND table_name = 'ai_learning_data'
    ) THEN
        ALTER TABLE ai_learning_data 
        ADD CONSTRAINT chk_feedback_score 
        CHECK (feedback_score BETWEEN 1 AND 5);
    END IF;
END $$;

-- =====================================================
-- 5. 인덱스 추가 (성능 최적화)
-- =====================================================

-- 전략 타입별 인덱스
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_strategy_type 
ON ai_learning_data(strategy_type);

CREATE INDEX IF NOT EXISTS idx_ai_learning_data_learning_phase 
ON ai_learning_data(learning_phase);

CREATE INDEX IF NOT EXISTS idx_ai_strategy_performance_strategy_type 
ON ai_strategy_performance(strategy_type);

-- 복합 인덱스 (사용자별 전략 타입 조회 최적화)
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_user_strategy 
ON ai_learning_data(user_id, strategy_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_strategy_performance_user_strategy 
ON ai_strategy_performance(user_id, strategy_type, last_updated DESC);

-- 시간 기반 인덱스
CREATE INDEX IF NOT EXISTS idx_ai_learning_data_created_at 
ON ai_learning_data(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_strategy_performance_last_updated 
ON ai_strategy_performance(last_updated DESC);

-- =====================================================
-- 6. 최종 테이블 구조 확인
-- =====================================================

-- ai_learning_data 테이블 구조 확인
SELECT 
    'ai_learning_data' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'ai_learning_data'
ORDER BY ordinal_position;

-- ai_strategy_performance 테이블 구조 확인
SELECT 
    'ai_strategy_performance' as table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'ai_strategy_performance'
ORDER BY ordinal_position;

-- =====================================================
-- 7. 데이터 현황 확인
-- =====================================================

-- 데이터 개수 확인
SELECT 
    'ai_learning_data' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT strategy_type) as strategy_types,
    MIN(created_at) as first_record,
    MAX(created_at) as last_record
FROM ai_learning_data

UNION ALL

SELECT 
    'ai_strategy_performance' as table_name,
    COUNT(*) as total_records,
    COUNT(DISTINCT user_id) as unique_users,
    COUNT(DISTINCT strategy_type) as strategy_types,
    MIN(created_at) as first_record,
    MAX(created_at) as last_record
FROM ai_strategy_performance;

-- 전략별 학습 데이터 분포 확인
SELECT 
    'ai_learning_data_distribution' as info,
    strategy_type,
    learning_phase,
    COUNT(*) as count,
    AVG(confidence_score) as avg_confidence,
    COUNT(CASE WHEN success = true THEN 1 END) as successful_trades
FROM ai_learning_data 
GROUP BY strategy_type, learning_phase
ORDER BY strategy_type, learning_phase;

-- =====================================================
-- 🎄 Christmas AI 테이블 수정 완료! 🎄
-- =====================================================

-- 성공 메시지
SELECT '🎉 AI 테이블 스키마 수정이 완료되었습니다!' as success_message; 