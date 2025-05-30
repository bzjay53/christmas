-- Check Users Table Structure (Safe Version)
-- Execute this in Supabase SQL Editor - works even if columns are missing

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

-- 3. Check current users table content (safe way - only existing columns)
SELECT 
    'users_sample_data' as info,
    id,
    email,
    created_at
FROM users 
LIMIT 3;

-- 4. Check if auth.users exists (Supabase default)
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.tables 
    WHERE table_schema = 'auth' 
    AND table_name = 'users'
) as auth_users_exists;

-- 5. Detailed column analysis for authentication requirements
WITH required_columns AS (
    SELECT column_name, description FROM (
        VALUES 
        ('id', 'Primary Key'),
        ('email', 'User Email'),
        ('password', 'Hashed Password - CRITICAL FOR AUTH'),
        ('first_name', 'First Name'),
        ('last_name', 'Last Name'),
        ('membership_type', 'User Membership Level'),
        ('created_at', 'Account Creation Time'),
        ('updated_at', 'Last Update Time'),
        ('openai_api_key', 'OpenAI API Key for AI Features'),
        ('ai_learning_enabled', 'AI Learning Feature Toggle'),
        ('selected_strategy', 'Trading Strategy Selection'),
        ('ai_risk_tolerance', 'AI Risk Tolerance Level'),
        ('strategy_auto_switch', 'Auto Strategy Switch Setting')
    ) AS t(column_name, description)
),
existing_columns AS (
    SELECT column_name, data_type
    FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'users'
)
SELECT 
    'column_analysis' as info,
    r.column_name as required_column,
    r.description,
    CASE 
        WHEN e.column_name IS NOT NULL THEN '✅ EXISTS'
        ELSE '❌ MISSING'
    END as status,
    COALESCE(e.data_type, 'N/A') as current_data_type
FROM required_columns r
LEFT JOIN existing_columns e ON r.column_name = e.column_name
ORDER BY 
    CASE WHEN e.column_name IS NULL THEN 1 ELSE 2 END,
    r.column_name;

-- 6. Check what authentication method is currently used
WITH auth_analysis AS (
    SELECT 
        CASE 
            WHEN EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'password') 
            THEN 'CUSTOM_AUTH_WITH_PASSWORD'
            WHEN EXISTS(SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users')
            THEN 'SUPABASE_DEFAULT_AUTH'
            ELSE 'UNKNOWN_AUTH_SYSTEM'
        END as auth_type
)
SELECT 
    'authentication_analysis' as info,
    auth_type,
    CASE auth_type
        WHEN 'CUSTOM_AUTH_WITH_PASSWORD' THEN 'Using custom authentication with password column'
        WHEN 'SUPABASE_DEFAULT_AUTH' THEN 'Using Supabase built-in authentication (auth.users table)'
        ELSE 'Authentication system not properly configured'
    END as description,
    CASE auth_type
        WHEN 'CUSTOM_AUTH_WITH_PASSWORD' THEN '✅ Ready for Christmas Trading backend'
        WHEN 'SUPABASE_DEFAULT_AUTH' THEN '⚠️ Need to add password column or modify backend'
        ELSE '❌ Requires setup'
    END as compatibility
FROM auth_analysis;

-- 7. Count total users and check data
SELECT 
    'users_statistics' as info,
    COUNT(*) as total_users,
    COUNT(CASE WHEN email IS NOT NULL AND email != '' THEN 1 END) as users_with_email,
    MIN(created_at) as first_user_created,
    MAX(created_at) as last_user_created
FROM users;

-- 8. Check if there are any test accounts
SELECT 
    'test_accounts_check' as info,
    COUNT(*) as potential_test_accounts
FROM users 
WHERE email LIKE '%test%' 
   OR email LIKE '%admin%' 
   OR email LIKE '%christmas%';

-- 9. Check auth.users if it exists (Supabase default)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'auth' AND table_name = 'users') THEN
        RAISE NOTICE 'Supabase auth.users table exists - checking sample data...';
    ELSE
        RAISE NOTICE 'No Supabase auth.users table found';
    END IF;
END $$; 