-- Check Users Table Structure for Authentication System
-- Execute this in Supabase SQL Editor to see current table structure

-- 1. Check users table columns and structure
SELECT 
    'users_table_structure' as info,
    column_name,
    data_type,
    is_nullable,
    column_default,
    character_maximum_length
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users'
ORDER BY ordinal_position;

-- 2. Check if users table exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
) as users_table_exists;

-- 3. Check current users table content (if any) - limited columns for privacy
SELECT 
    'users_sample_data' as info,
    id,
    email,
    CASE WHEN password IS NOT NULL THEN 'has_password' ELSE 'no_password' END as password_status,
    first_name,
    last_name,
    created_at
FROM users 
LIMIT 5;

-- 4. Check if auth.users exists (Supabase default)
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'auth' 
    AND table_name = 'users'
) as auth_users_exists;

-- 5. Required columns for Christmas Trading authentication
-- Based on backend/services/supabaseAuth.js requirements
WITH required_columns AS (
    SELECT column_name FROM (
        VALUES 
        ('id'),
        ('email'), 
        ('password'),
        ('first_name'),
        ('last_name'),
        ('membership_type'),
        ('created_at'),
        ('updated_at'),
        ('openai_api_key'),
        ('ai_learning_enabled'),
        ('selected_strategy')
    ) AS t(column_name)
),
existing_columns AS (
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
)
SELECT 
    'missing_columns_analysis' as info,
    r.column_name as required_column,
    CASE 
        WHEN e.column_name IS NOT NULL THEN 'EXISTS'
        ELSE 'MISSING'
    END as status
FROM required_columns r
LEFT JOIN existing_columns e ON r.column_name = e.column_name
ORDER BY 
    CASE WHEN e.column_name IS NULL THEN 1 ELSE 2 END,
    r.column_name;

-- 6. Check constraints on users table
SELECT 
    'users_constraints' as info,
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public' 
AND table_name = 'users';

-- 7. Count total users
SELECT 
    'users_count' as info,
    COUNT(*) as total_users,
    COUNT(CASE WHEN email IS NOT NULL THEN 1 END) as users_with_email,
    COUNT(CASE WHEN password IS NOT NULL THEN 1 END) as users_with_password
FROM users; 