const { createClient } = require('@supabase/supabase-js')

// Supabase 설정
const supabaseUrl = 'https://qehzzsxzjijfzqkysazc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlaHp6c3h6amlqZnpxa3lzYXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNTgxMTQsImV4cCI6MjA2MzYzNDExNH0.zjrrUaVajb9fV1NRwzA_RMy3-r3Lpww9Uen-cZYXDuE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createMissingTables() {
  console.log('🎄 Christmas Trading 누락된 테이블 생성 시작...')
  
  try {
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
    
    const { data: couponsResult, error: couponsError } = await supabase.rpc('exec_sql', {
      sql: createCouponsSQL
    })
    
    if (couponsError) {
      console.log('⚠️  RPC 방식 실패, 다른 방법을 시도합니다...')
      console.log('오류:', couponsError.message)
    } else {
      console.log('✅ coupons 테이블 생성 성공!')
    }
    
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
    
    const { data: ordersResult, error: ordersError } = await supabase.rpc('exec_sql', {
      sql: createOrdersSQL
    })
    
    if (ordersError) {
      console.log('⚠️  RPC 방식 실패, 다른 방법을 시도합니다...')
      console.log('오류:', ordersError.message)
    } else {
      console.log('✅ trading_orders 테이블 생성 성공!')
    }
    
    // 3. 테이블 생성 확인
    console.log('\n🔍 테이블 생성 결과 확인 중...')
    
    // coupons 테이블 확인
    const { data: couponCheck, error: couponCheckError } = await supabase
      .from('coupons')
      .select('count')
      .limit(1)
    
    console.log('- coupons 테이블:', couponCheckError ? '❌ 생성 실패' : '✅ 생성 성공')
    
    // trading_orders 테이블 확인
    const { data: orderCheck, error: orderCheckError } = await supabase
      .from('trading_orders')
      .select('count')
      .limit(1)
    
    console.log('- trading_orders 테이블:', orderCheckError ? '❌ 생성 실패' : '✅ 생성 성공')
    
    if (couponCheckError || orderCheckError) {
      console.log('\n🚨 일부 테이블 생성에 실패했습니다!')
      console.log('💡 수동으로 Supabase SQL Editor에서 다음 SQL을 실행해주세요:')
      console.log('\n--- coupons 테이블 ---')
      console.log(createCouponsSQL)
      console.log('\n--- trading_orders 테이블 ---')
      console.log(createOrdersSQL)
    } else {
      console.log('\n🎉 모든 테이블이 성공적으로 생성되었습니다!')
    }
    
  } catch (error) {
    console.error('❌ 테이블 생성 실패:', error)
  }
}

// 스크립트 실행
if (require.main === module) {
  createMissingTables().then(() => {
    console.log('\n🎉 스크립트 실행 완료')
    process.exit(0)
  }).catch((error) => {
    console.error('💥 스크립트 실행 오류:', error)
    process.exit(1)
  })
}

module.exports = { createMissingTables } 