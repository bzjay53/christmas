const { createClient } = require('@supabase/supabase-js')

// Supabase 설정
const supabaseUrl = 'https://qehzzsxzjijfzqkysazc.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlaHp6c3h6amlqZnpxa3lzYXpjIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0ODA1ODExNCwiZXhwIjoyMDYzNjM0MTE0fQ.Ej3qjPkgOLQjmOqtlBbmXkJOGOlL8yOQJOGOlL8yOQ' // 서비스 키 필요

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createTables() {
  console.log('🎄 Christmas Trading Supabase 테이블 생성 시작...')
  
  try {
    // 1. 사용자 테이블 생성
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS users (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          
          -- 회원 등급 시스템
          membership_type VARCHAR(20) DEFAULT 'free' CHECK (membership_type IN ('guest', 'free', 'premium', 'lifetime')),
          membership_start_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          membership_end_date TIMESTAMP WITH TIME ZONE,
          free_trial_end_date TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
          
          -- 거래 제한 관리
          daily_trade_count INTEGER DEFAULT 0,
          daily_trade_reset_date DATE DEFAULT CURRENT_DATE,
          
          -- 초대 시스템
          personal_referral_code VARCHAR(20) UNIQUE,
          referred_by VARCHAR(20),
          total_extension_days INTEGER DEFAULT 0 CHECK (total_extension_days <= 90),
          
          -- 알림 설정 (JSONB)
          notification_settings JSONB DEFAULT '{
              "email": true,
              "telegram": false,
              "push": true,
              "tradingAlerts": true,
              "portfolioUpdates": true
          }',
          
          -- 텔레그램 정보
          telegram_chat_id VARCHAR(50),
          telegram_username VARCHAR(100),
          
          -- 계정 상태
          is_email_verified BOOLEAN DEFAULT false,
          is_active BOOLEAN DEFAULT true,
          is_admin BOOLEAN DEFAULT false,
          last_login_at TIMESTAMP WITH TIME ZONE,
          
          -- 보안 관련
          email_verification_token VARCHAR(255),
          email_verification_expires TIMESTAMP WITH TIME ZONE,
          password_reset_token VARCHAR(255),
          password_reset_expires TIMESTAMP WITH TIME ZONE,
          login_attempts INTEGER DEFAULT 0 CHECK (login_attempts <= 5),
          lock_until TIMESTAMP WITH TIME ZONE,
          
          -- 타임스탬프
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    console.log('📋 사용자 테이블 생성 중...')
    const { error: tableError } = await supabase.rpc('exec_sql', { sql: createTableSQL })
    if (tableError) {
      console.error('❌ 테이블 생성 실패:', tableError)
      return
    }
    console.log('✅ 사용자 테이블 생성 완료')
    
    // 2. 인덱스 생성
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
      CREATE INDEX IF NOT EXISTS idx_users_personal_referral_code ON users(personal_referral_code);
      CREATE INDEX IF NOT EXISTS idx_users_membership_type ON users(membership_type);
      CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
    `
    
    console.log('📊 인덱스 생성 중...')
    const { error: indexError } = await supabase.rpc('exec_sql', { sql: indexSQL })
    if (indexError) {
      console.error('❌ 인덱스 생성 실패:', indexError)
    } else {
      console.log('✅ 인덱스 생성 완료')
    }
    
    // 3. RLS 설정
    const rlsSQL = `
      ALTER TABLE users ENABLE ROW LEVEL SECURITY;
      
      CREATE POLICY "Users can view own data" ON users
          FOR SELECT USING (auth.uid() = id);
      
      CREATE POLICY "Users can update own data" ON users
          FOR UPDATE USING (auth.uid() = id);
      
      CREATE POLICY "Service role can do everything" ON users
          FOR ALL USING (auth.role() = 'service_role');
    `
    
    console.log('🔒 RLS 정책 설정 중...')
    const { error: rlsError } = await supabase.rpc('exec_sql', { sql: rlsSQL })
    if (rlsError) {
      console.error('❌ RLS 설정 실패:', rlsError)
    } else {
      console.log('✅ RLS 정책 설정 완료')
    }
    
    // 4. 트리거 함수 생성
    const triggerSQL = `
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
          NEW.updated_at = NOW();
          RETURN NEW;
      END;
      $$ language 'plpgsql';
      
      DROP TRIGGER IF EXISTS update_users_updated_at ON users;
      CREATE TRIGGER update_users_updated_at
          BEFORE UPDATE ON users
          FOR EACH ROW
          EXECUTE FUNCTION update_updated_at_column();
    `
    
    console.log('⚡ 트리거 함수 생성 중...')
    const { error: triggerError } = await supabase.rpc('exec_sql', { sql: triggerSQL })
    if (triggerError) {
      console.error('❌ 트리거 생성 실패:', triggerError)
    } else {
      console.log('✅ 트리거 함수 생성 완료')
    }
    
    // 5. 테스트 계정 생성
    const testAccountsSQL = `
      INSERT INTO users (
          email,
          password,
          first_name,
          last_name,
          membership_type,
          is_email_verified,
          is_admin,
          personal_referral_code
      ) VALUES 
      (
          'lvninety9@gmail.com',
          '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq5S/kS',
          'Christmas',
          'Admin',
          'lifetime',
          true,
          true,
          'ADMIN2024'
      ),
      (
          'admin@christmas.com',
          '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj6hsxq5S/kS',
          'Christmas',
          'Administrator',
          'lifetime',
          true,
          true,
          'CHRISTMAS'
      ),
      (
          'user@christmas.com',
          '$2a$12$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
          'Test',
          'User',
          'premium',
          true,
          false,
          'TESTUSER'
      )
      ON CONFLICT (email) DO NOTHING;
    `
    
    console.log('👤 테스트 계정 생성 중...')
    const { error: accountError } = await supabase.rpc('exec_sql', { sql: testAccountsSQL })
    if (accountError) {
      console.error('❌ 테스트 계정 생성 실패:', accountError)
    } else {
      console.log('✅ 테스트 계정 생성 완료')
    }
    
    // 6. 통계 뷰 생성
    const viewSQL = `
      CREATE OR REPLACE VIEW user_stats AS
      SELECT 
          membership_type,
          COUNT(*) as total_users,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_users,
          COUNT(CASE WHEN is_email_verified = true THEN 1 END) as verified_users,
          COUNT(CASE WHEN last_login_at > NOW() - INTERVAL '30 days' THEN 1 END) as recent_active_users
      FROM users
      GROUP BY membership_type;
    `
    
    console.log('📊 통계 뷰 생성 중...')
    const { error: viewError } = await supabase.rpc('exec_sql', { sql: viewSQL })
    if (viewError) {
      console.error('❌ 통계 뷰 생성 실패:', viewError)
    } else {
      console.log('✅ 통계 뷰 생성 완료')
    }
    
    console.log('🎉 Christmas Trading Supabase 테이블 설정 완료!')
    
    // 7. 생성된 사용자 확인
    const { data: users, error: selectError } = await supabase
      .from('users')
      .select('email, first_name, last_name, membership_type, is_admin')
    
    if (selectError) {
      console.error('❌ 사용자 조회 실패:', selectError)
    } else {
      console.log('📋 생성된 테스트 계정:')
      users.forEach(user => {
        console.log(`  - ${user.email} (${user.first_name} ${user.last_name}) - ${user.membership_type}${user.is_admin ? ' [관리자]' : ''}`)
      })
    }
    
  } catch (error) {
    console.error('❌ 전체 프로세스 실패:', error)
  }
}

// 스크립트 실행
createTables() 