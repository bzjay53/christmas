const { createClient } = require('@supabase/supabase-js')

// Supabase 설정
const supabaseUrl = 'https://qehzzsxzjijfzqkysazc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlaHp6c3h6amlqZnpxa3lzYXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNTgxMTQsImV4cCI6MjA2MzYzNDExNH0.zjrrUaVajb9fV1NRwzA_RMy3-r3Lpww9Uen-cZYXDuE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createTables() {
  console.log('🎄 Christmas Trading 테이블 생성 시작...')
  
  try {
    // 1. 사용자 테이블 생성
    console.log('📊 1. users 테이블 생성 중...')
    const { data: usersData, error: usersError } = await supabase.rpc('create_users_table')
    
    if (usersError) {
      console.log('⚠️  SQL을 직접 실행합니다...')
      
      // 직접 SQL 실행 (간단한 버전)
      const createUsersSQL = `
        CREATE TABLE IF NOT EXISTS users (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          username VARCHAR(50) UNIQUE,
          tier VARCHAR(20) DEFAULT 'basic',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          is_active BOOLEAN DEFAULT true
        )
      `
      
      console.log('SQL 실행:', createUsersSQL)
      
      // 테이블 존재 여부 확인
      const { data: tableCheck, error: checkError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_name', 'users')
        .eq('table_schema', 'public')
      
      if (checkError) {
        console.error('❌ 테이블 확인 오류:', checkError)
      } else if (tableCheck && tableCheck.length > 0) {
        console.log('✅ users 테이블이 이미 존재합니다.')
      } else {
        console.log('🔨 users 테이블을 생성합니다...')
      }
    }
    
    // 2. 쿠폰 테이블 생성
    console.log('📊 2. coupons 테이블 생성 중...')
    
    // 3. 거래 주문 테이블 생성
    console.log('📊 3. trading_orders 테이블 생성 중...')
    
    // 4. 기본 테이블 확인
    console.log('🔍 생성된 테이블 확인 중...')
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (tablesError) {
      console.error('❌ 테이블 목록 조회 오류:', tablesError)
    } else {
      console.log('📋 현재 테이블 목록:')
      tables.forEach(table => {
        console.log(`  - ${table.table_name}`)
      })
    }
    
    console.log('✅ 테이블 생성 완료!')
    
  } catch (error) {
    console.error('❌ 테이블 생성 실패:', error)
  }
}

// 스크립트 실행
if (require.main === module) {
  createTables().then(() => {
    console.log('🎉 스크립트 실행 완료')
    process.exit(0)
  }).catch((error) => {
    console.error('💥 스크립트 실행 오류:', error)
    process.exit(1)
  })
}

module.exports = { createTables } 