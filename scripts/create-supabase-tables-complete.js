/**
 * Christmas Trading Supabase 테이블 생성 스크립트
 * 모든 필요한 테이블을 생성합니다.
 */
require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || 'https://qehzzsxzjijfzqkysazc.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlaHp6c3h6amlqZnpxa3lzYXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNTgxMTQsImV4cCI6MjA2MzYzNDExNH0.zjrrUaVajb9fV1NRwzA_RMy3-r3Lpww9Uen-cZYXDuE';

const supabase = createClient(supabaseUrl, supabaseKey);

// 테이블 생성 SQL 쿼리들
const createTablesSQL = {
  // 1. 사용자 테이블 (password 컬럼 포함)
  users: `
    CREATE TABLE IF NOT EXISTS users (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL,
      username VARCHAR(100),
      full_name VARCHAR(255),
      phone VARCHAR(20),
      user_level VARCHAR(20) DEFAULT 'bronze',
      total_investment DECIMAL(15,2) DEFAULT 0,
      total_profit DECIMAL(15,2) DEFAULT 0,
      referral_code VARCHAR(20) UNIQUE,
      referred_by UUID REFERENCES users(id),
      is_active BOOLEAN DEFAULT true,
      email_verified BOOLEAN DEFAULT false,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,

  // 2. 쿠폰 테이블
  coupons: `
    CREATE TABLE IF NOT EXISTS coupons (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      code VARCHAR(50) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      description TEXT,
      discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
      discount_value DECIMAL(10,2) NOT NULL,
      min_investment DECIMAL(15,2) DEFAULT 0,
      max_discount DECIMAL(15,2),
      usage_limit INTEGER DEFAULT 1,
      used_count INTEGER DEFAULT 0,
      valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      valid_until TIMESTAMP WITH TIME ZONE,
      is_active BOOLEAN DEFAULT true,
      created_by UUID REFERENCES users(id),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,

  // 3. 쿠폰 사용 내역 테이블
  coupon_usage: `
    CREATE TABLE IF NOT EXISTS coupon_usage (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      coupon_id UUID NOT NULL REFERENCES coupons(id),
      user_id UUID NOT NULL REFERENCES users(id),
      order_id VARCHAR(255),
      discount_amount DECIMAL(10,2) NOT NULL,
      used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      UNIQUE(coupon_id, user_id)
    );
  `,

  // 4. 리퍼럴 코드 테이블
  referral_codes: `
    CREATE TABLE IF NOT EXISTS referral_codes (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      code VARCHAR(20) UNIQUE NOT NULL,
      user_id UUID NOT NULL REFERENCES users(id),
      usage_count INTEGER DEFAULT 0,
      max_usage INTEGER DEFAULT 100,
      reward_amount DECIMAL(10,2) DEFAULT 10.00,
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,

  // 5. 리퍼럴 보상 테이블
  referral_rewards: `
    CREATE TABLE IF NOT EXISTS referral_rewards (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      referrer_id UUID NOT NULL REFERENCES users(id),
      referred_id UUID NOT NULL REFERENCES users(id),
      referral_code_id UUID NOT NULL REFERENCES referral_codes(id),
      reward_amount DECIMAL(10,2) NOT NULL,
      reward_type VARCHAR(20) DEFAULT 'cash',
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      paid_at TIMESTAMP WITH TIME ZONE
    );
  `,

  // 6. 거래 내역 테이블
  trades: `
    CREATE TABLE IF NOT EXISTS trades (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id),
      symbol VARCHAR(20) NOT NULL,
      side VARCHAR(10) NOT NULL CHECK (side IN ('buy', 'sell')),
      quantity DECIMAL(15,4) NOT NULL,
      price DECIMAL(15,4) NOT NULL,
      total_amount DECIMAL(15,2) NOT NULL,
      fee DECIMAL(10,2) DEFAULT 0,
      status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'filled', 'cancelled', 'failed')),
      order_type VARCHAR(20) DEFAULT 'market' CHECK (order_type IN ('market', 'limit', 'stop')),
      executed_at TIMESTAMP WITH TIME ZONE,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `,

  // 7. 사용자 세션 테이블
  user_sessions: `
    CREATE TABLE IF NOT EXISTS user_sessions (
      id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
      user_id UUID NOT NULL REFERENCES users(id),
      token_hash VARCHAR(255) NOT NULL,
      ip_address INET,
      user_agent TEXT,
      expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
  `
};

// 인덱스 생성 SQL
const createIndexesSQL = [
  'CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);',
  'CREATE INDEX IF NOT EXISTS idx_users_referral_code ON users(referral_code);',
  'CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);',
  'CREATE INDEX IF NOT EXISTS idx_coupon_usage_user_id ON coupon_usage(user_id);',
  'CREATE INDEX IF NOT EXISTS idx_referral_codes_code ON referral_codes(code);',
  'CREATE INDEX IF NOT EXISTS idx_referral_codes_user_id ON referral_codes(user_id);',
  'CREATE INDEX IF NOT EXISTS idx_trades_user_id ON trades(user_id);',
  'CREATE INDEX IF NOT EXISTS idx_trades_symbol ON trades(symbol);',
  'CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);',
  'CREATE INDEX IF NOT EXISTS idx_user_sessions_token_hash ON user_sessions(token_hash);'
];

// RLS (Row Level Security) 정책 생성
const createRLSPolicies = [
  'ALTER TABLE users ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE coupon_usage ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE referral_codes ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE trades ENABLE ROW LEVEL SECURITY;',
  'ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;'
];

async function createTables() {
  console.log('🎄 Christmas Trading Supabase 테이블 생성 시작...');

  try {
    // 1. 연결 테스트
    console.log('📡 Supabase 연결 테스트...');
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1);
    
    if (testError && !testError.message.includes('relation "users" does not exist')) {
      throw new Error(`연결 실패: ${testError.message}`);
    }
    console.log('✅ Supabase 연결 성공');

    // 2. 테이블 생성
    console.log('🔨 테이블 생성 중...');
    for (const [tableName, sql] of Object.entries(createTablesSQL)) {
      console.log(`  📋 ${tableName} 테이블 생성 중...`);
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        console.error(`❌ ${tableName} 테이블 생성 실패:`, error);
      } else {
        console.log(`✅ ${tableName} 테이블 생성 완료`);
      }
    }

    // 3. 인덱스 생성
    console.log('🔍 인덱스 생성 중...');
    for (const sql of createIndexesSQL) {
      const { error } = await supabase.rpc('exec_sql', { sql });
      if (error) {
        console.error('❌ 인덱스 생성 실패:', error);
      }
    }
    console.log('✅ 인덱스 생성 완료');

    // 4. 테이블 확인
    console.log('📊 생성된 테이블 확인...');
    const tables = Object.keys(createTablesSQL);
    for (const table of tables) {
      const { data, error } = await supabase
        .from(table)
        .select('*')
        .limit(1);
      
      if (error) {
        console.error(`❌ ${table} 테이블 확인 실패:`, error.message);
      } else {
        console.log(`✅ ${table} 테이블 정상 작동`);
      }
    }

    console.log('🎉 모든 테이블 생성 완료!');
    return true;

  } catch (error) {
    console.error('❌ 테이블 생성 중 오류 발생:', error);
    return false;
  }
}

// 테스트 데이터 생성
async function createTestData() {
  console.log('🧪 테스트 데이터 생성 중...');

  try {
    // 1. 테스트 사용자 생성
    const testUsers = [
      {
        email: 'admin@christmas.com',
        password: '$2a$10$rQJ8vQZ9Zv8Zv8Zv8Zv8ZuZv8Zv8Zv8Zv8Zv8Zv8Zv8Zv8Zv8Z', // admin123
        username: 'admin',
        full_name: 'Christmas Admin',
        user_level: 'platinum',
        referral_code: 'ADMIN2024'
      },
      {
        email: 'user@christmas.com',
        password: '$2a$10$rQJ8vQZ9Zv8Zv8Zv8Zv8ZuZv8Zv8Zv8Zv8Zv8Zv8Zv8Zv8Zv8Z', // user123
        username: 'testuser',
        full_name: 'Test User',
        user_level: 'bronze',
        referral_code: 'USER2024'
      }
    ];

    for (const user of testUsers) {
      const { error } = await supabase
        .from('users')
        .insert(user);
      
      if (error && !error.message.includes('duplicate key')) {
        console.error('❌ 테스트 사용자 생성 실패:', error);
      } else {
        console.log(`✅ 테스트 사용자 생성: ${user.email}`);
      }
    }

    // 2. 테스트 쿠폰 생성
    const testCoupons = [
      {
        code: 'WELCOME2024',
        name: '신규 가입 쿠폰',
        description: '신규 가입자를 위한 10% 할인 쿠폰',
        discount_type: 'percentage',
        discount_value: 10,
        min_investment: 100,
        usage_limit: 1000
      },
      {
        code: 'CHRISTMAS50',
        name: '크리스마스 특별 쿠폰',
        description: '크리스마스 특별 50달러 할인',
        discount_type: 'fixed',
        discount_value: 50,
        min_investment: 500,
        usage_limit: 100
      }
    ];

    for (const coupon of testCoupons) {
      const { error } = await supabase
        .from('coupons')
        .insert(coupon);
      
      if (error && !error.message.includes('duplicate key')) {
        console.error('❌ 테스트 쿠폰 생성 실패:', error);
      } else {
        console.log(`✅ 테스트 쿠폰 생성: ${coupon.code}`);
      }
    }

    console.log('🎉 테스트 데이터 생성 완료!');
    return true;

  } catch (error) {
    console.error('❌ 테스트 데이터 생성 중 오류:', error);
    return false;
  }
}

// 메인 실행 함수
async function main() {
  console.log('🎄 Christmas Trading Supabase 초기화 시작...\n');

  const tablesCreated = await createTables();
  if (!tablesCreated) {
    console.error('❌ 테이블 생성 실패로 인해 초기화를 중단합니다.');
    process.exit(1);
  }

  const testDataCreated = await createTestData();
  if (!testDataCreated) {
    console.warn('⚠️ 테스트 데이터 생성에 실패했지만 계속 진행합니다.');
  }

  console.log('\n🎉 Christmas Trading Supabase 초기화 완료!');
  console.log('\n📋 생성된 테이블:');
  console.log('  - users (사용자)');
  console.log('  - coupons (쿠폰)');
  console.log('  - coupon_usage (쿠폰 사용 내역)');
  console.log('  - referral_codes (리퍼럴 코드)');
  console.log('  - referral_rewards (리퍼럴 보상)');
  console.log('  - trades (거래 내역)');
  console.log('  - user_sessions (사용자 세션)');
  
  console.log('\n👤 테스트 계정:');
  console.log('  - admin@christmas.com / admin123');
  console.log('  - user@christmas.com / user123');
  
  console.log('\n🎫 테스트 쿠폰:');
  console.log('  - WELCOME2024 (10% 할인)');
  console.log('  - CHRISTMAS50 ($50 할인)');
}

// 스크립트 실행
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { createTables, createTestData }; 