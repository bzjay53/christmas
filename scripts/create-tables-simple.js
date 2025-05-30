const { createClient } = require('@supabase/supabase-js')

// Supabase 설정
const supabaseUrl = 'https://qehzzsxzjijfzqkysazc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlaHp6c3h6amlqZnpxa3lzYXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNTgxMTQsImV4cCI6MjA2MzYzNDExNH0.zjrrUaVajb9fV1NRwzA_RMy3-r3Lpww9Uen-cZYXDuE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createTables() {
  console.log('🎄 Christmas Trading 테이블 생성 시작...')
  
  try {
    // 1. 먼저 간단한 테스트 테이블로 연결 확인
    console.log('🔍 Supabase 연결 테스트 중...')
    
    // 테스트용 간단한 쿼리
    const { data: testData, error: testError } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (testError) {
      console.log('⚠️  users 테이블이 존재하지 않습니다. 테이블을 생성해야 합니다.')
      console.log('오류 상세:', testError.message)
    } else {
      console.log('✅ users 테이블이 이미 존재합니다!')
      console.log('테스트 결과:', testData)
    }
    
    // 2. 쿠폰 테이블 확인
    console.log('📊 coupons 테이블 확인 중...')
    const { data: couponData, error: couponError } = await supabase
      .from('coupons')
      .select('count')
      .limit(1)
    
    if (couponError) {
      console.log('⚠️  coupons 테이블이 존재하지 않습니다.')
      console.log('오류 상세:', couponError.message)
    } else {
      console.log('✅ coupons 테이블이 이미 존재합니다!')
    }
    
    // 3. 거래 주문 테이블 확인
    console.log('📊 trading_orders 테이블 확인 중...')
    const { data: orderData, error: orderError } = await supabase
      .from('trading_orders')
      .select('count')
      .limit(1)
    
    if (orderError) {
      console.log('⚠️  trading_orders 테이블이 존재하지 않습니다.')
      console.log('오류 상세:', orderError.message)
    } else {
      console.log('✅ trading_orders 테이블이 이미 존재합니다!')
    }
    
    console.log('\n📋 테이블 상태 요약:')
    console.log('- users 테이블:', testError ? '❌ 없음' : '✅ 존재')
    console.log('- coupons 테이블:', couponError ? '❌ 없음' : '✅ 존재')
    console.log('- trading_orders 테이블:', orderError ? '❌ 없음' : '✅ 존재')
    
    if (testError || couponError || orderError) {
      console.log('\n🚨 일부 테이블이 누락되었습니다!')
      console.log('💡 해결 방법:')
      console.log('1. Supabase 대시보드(https://supabase.com/dashboard)에 로그인')
      console.log('2. 프로젝트 선택 → SQL Editor')
      console.log('3. scripts/create-supabase-tables.sql 파일의 내용을 복사하여 실행')
      console.log('4. 또는 아래 명령어로 SQL 파일을 직접 실행:')
      console.log('   psql -h db.qehzzsxzjijfzqkysazc.supabase.co -U postgres -d postgres -f create-supabase-tables.sql')
    } else {
      console.log('\n🎉 모든 필수 테이블이 존재합니다!')
    }
    
  } catch (error) {
    console.error('❌ 테이블 확인 실패:', error)
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