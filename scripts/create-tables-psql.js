const { Client } = require('pg')

// Supabase PostgreSQL 연결 설정
const client = new Client({
  host: 'db.qehzzsxzjijfzqkysazc.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'your-database-password', // 실제 비밀번호로 변경 필요
  ssl: {
    rejectUnauthorized: false
  }
})

async function createTables() {
  console.log('🎄 Christmas Trading PostgreSQL 직접 연결로 테이블 생성 시작...')
  
  try {
    // 데이터베이스 연결
    console.log('🔌 PostgreSQL 데이터베이스 연결 중...')
    await client.connect()
    console.log('✅ 데이터베이스 연결 성공!')
    
    // 1. coupons 테이블 생성
    console.log('📊 1. coupons 테이블 생성 중...')
    const createCouponsSQL = `
      CREATE TABLE IF NOT EXISTS coupons (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        code VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(200) NOT NULL,
        description TEXT,
        discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
        discount_value DECIMAL(10,2) NOT NULL,
        min_order_amount DECIMAL(10,2) DEFAULT 0,
        max_discount_amount DECIMAL(10,2),
        usage_limit INTEGER,
        used_count INTEGER DEFAULT 0,
        valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
        valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_by UUID REFERENCES users(id),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    await client.query(createCouponsSQL)
    console.log('✅ coupons 테이블 생성 성공!')
    
    // 2. trading_orders 테이블 생성
    console.log('📊 2. trading_orders 테이블 생성 중...')
    const createOrdersSQL = `
      CREATE TABLE IF NOT EXISTS trading_orders (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        order_id VARCHAR(100) UNIQUE NOT NULL,
        stock_code VARCHAR(20) NOT NULL,
        stock_name VARCHAR(100),
        order_type VARCHAR(10) NOT NULL CHECK (order_type IN ('buy', 'sell')),
        quantity INTEGER NOT NULL CHECK (quantity > 0),
        price DECIMAL(12,2) NOT NULL CHECK (price > 0),
        total_amount DECIMAL(15,2) NOT NULL CHECK (total_amount > 0),
        status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'executed', 'cancelled')),
        kis_order_id VARCHAR(100),
        executed_at TIMESTAMP WITH TIME ZONE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `
    
    await client.query(createOrdersSQL)
    console.log('✅ trading_orders 테이블 생성 성공!')
    
    // 3. 인덱스 생성
    console.log('📊 3. 인덱스 생성 중...')
    const indexQueries = [
      'CREATE INDEX IF NOT EXISTS idx_coupons_code ON coupons(code);',
      'CREATE INDEX IF NOT EXISTS idx_coupons_valid_period ON coupons(valid_from, valid_until);',
      'CREATE INDEX IF NOT EXISTS idx_coupons_is_active ON coupons(is_active);',
      'CREATE INDEX IF NOT EXISTS idx_trading_orders_user_id ON trading_orders(user_id);',
      'CREATE INDEX IF NOT EXISTS idx_trading_orders_stock_code ON trading_orders(stock_code);',
      'CREATE INDEX IF NOT EXISTS idx_trading_orders_status ON trading_orders(status);',
      'CREATE INDEX IF NOT EXISTS idx_trading_orders_created_at ON trading_orders(created_at);'
    ]
    
    for (const indexQuery of indexQueries) {
      await client.query(indexQuery)
    }
    console.log('✅ 인덱스 생성 성공!')
    
    // 4. 기본 데이터 삽입
    console.log('📊 4. 기본 쿠폰 데이터 삽입 중...')
    const insertCouponsSQL = `
      INSERT INTO coupons (code, name, description, discount_type, discount_value, valid_from, valid_until) VALUES
      ('WELCOME10', '신규 가입 10% 할인', '신규 회원 가입 시 10% 할인 쿠폰', 'percentage', 10.00, NOW(), NOW() + INTERVAL '1 year'),
      ('FIRST5000', '첫 거래 5000원 할인', '첫 거래 시 5000원 할인', 'fixed', 5000.00, NOW(), NOW() + INTERVAL '6 months'),
      ('VIP20', 'VIP 회원 20% 할인', 'VIP 등급 회원 전용 20% 할인', 'percentage', 20.00, NOW(), NOW() + INTERVAL '1 year')
      ON CONFLICT (code) DO NOTHING;
    `
    
    await client.query(insertCouponsSQL)
    console.log('✅ 기본 쿠폰 데이터 삽입 성공!')
    
    // 5. 테이블 생성 확인
    console.log('🔍 생성된 테이블 확인 중...')
    const checkTablesSQL = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'coupons', 'trading_orders')
      ORDER BY table_name;
    `
    
    const result = await client.query(checkTablesSQL)
    console.log('📋 생성된 테이블 목록:')
    result.rows.forEach(row => {
      console.log(`  - ${row.table_name}`)
    })
    
    // 6. 레코드 수 확인
    const countSQL = `
      SELECT 'users' as table_name, COUNT(*) as count FROM users
      UNION ALL
      SELECT 'coupons' as table_name, COUNT(*) as count FROM coupons
      UNION ALL
      SELECT 'trading_orders' as table_name, COUNT(*) as count FROM trading_orders;
    `
    
    const countResult = await client.query(countSQL)
    console.log('📊 각 테이블의 레코드 수:')
    countResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}: ${row.count}개`)
    })
    
    console.log('\n🎉 모든 테이블이 성공적으로 생성되었습니다!')
    
  } catch (error) {
    console.error('❌ 테이블 생성 실패:', error.message)
    
    if (error.message.includes('password authentication failed')) {
      console.log('\n💡 해결 방법:')
      console.log('1. Supabase 대시보드에서 데이터베이스 비밀번호 확인')
      console.log('2. 스크립트의 password 값을 실제 비밀번호로 변경')
      console.log('3. 또는 scripts/supabase-manual-setup.md 가이드를 따라 수동으로 생성')
    }
  } finally {
    // 연결 종료
    await client.end()
    console.log('🔌 데이터베이스 연결 종료')
  }
}

// 스크립트 실행
if (require.main === module) {
  createTables().then(() => {
    console.log('\n🎉 스크립트 실행 완료')
    process.exit(0)
  }).catch((error) => {
    console.error('💥 스크립트 실행 오류:', error)
    process.exit(1)
  })
}

module.exports = { createTables } 