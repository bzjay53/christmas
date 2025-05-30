-- Check AI Tables Structure for Christmas-protocol
-- Execute this in Supabase SQL Editor

-- 1. Check ai_learning_data table structure
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

-- 2. Check ai_strategy_performance table structure  
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

-- 3. Check ai_learning_data content (latest 10 records)
SELECT 
    'ai_learning_data_sample' as info,
    *
FROM ai_learning_data 
ORDER BY created_at DESC 
LIMIT 10;

-- 4. Check ai_strategy_performance content (latest 10 records)
SELECT 
    'ai_strategy_performance_sample' as info,
    *
FROM ai_strategy_performance 
ORDER BY created_at DESC 
LIMIT 10;

-- 5. Check data volume
SELECT 
    'ai_learning_data' as table_name,
    COUNT(*) as total_records,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM ai_learning_data
UNION ALL
SELECT 
    'ai_strategy_performance' as table_name,
    COUNT(*) as total_records,
    MIN(created_at) as earliest_record,
    MAX(created_at) as latest_record
FROM ai_strategy_performance;

-- 6. Check table relationships (if any foreign keys exist)
SELECT
    tc.table_name, 
    kcu.column_name, 
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
WHERE constraint_type = 'FOREIGN KEY' 
AND (tc.table_name = 'ai_learning_data' OR tc.table_name = 'ai_strategy_performance'); 