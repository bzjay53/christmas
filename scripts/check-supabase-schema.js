const { createClient } = require('@supabase/supabase-js')

// Supabase 설정
const supabaseUrl = 'https://qehzzsxzjijfzqkysazc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlaHp6c3h6amlqZnpxa3lzYXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNTgxMTQsImV4cCI6MjA2MzYzNDExNH0.zjrrUaVajb9fV1NRwzA_RMy3-r3Lpww9Uen-cZYXDuE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function checkSchema() {
  console.log('🔍 Supabase 스키마 확인 중...')
  
  try {
    // 테이블 존재 확인
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
    
    if (tablesError) {
      console.log('❌ 테이블 목록 조회 실패:', tablesError.message)
      
      // 대안: users 테이블에서 빈 결과 조회로 컬럼 확인
      console.log('🔄 대안 방법으로 users 테이블 확인...')
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .limit(0)
      
      if (error) {
        console.log('❌ users 테이블 접근 실패:', error.message)
        
        // 테이블이 없다면 생성 시도
        console.log('🔧 users 테이블 생성 시도...')
        await createUsersTable()
      } else {
        console.log('✅ users 테이블이 존재하지만 컬럼 정보를 확인할 수 없습니다.')
      }
    } else {
      console.log('📋 사용 가능한 테이블:')
      tables.forEach(table => {
        console.log(`  - ${table.table_name}`)
      })
    }
    
    // users 테이블 데이터 확인
    console.log('\n👥 현재 users 테이블 데이터:')
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(5)
    
    if (usersError) {
      console.log('❌ users 데이터 조회 실패:', usersError.message)
    } else {
      if (users.length === 0) {
        console.log('📭 users 테이블이 비어있습니다.')
      } else {
        console.log(`📊 ${users.length}개의 사용자 발견:`)
        users.forEach(user => {
          console.log(`  - ${user.email || user.id}`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ 스키마 확인 실패:', error.message)
  }
}

async function createUsersTable() {
  console.log('🔧 users 테이블 생성 중...')
  
  // 백엔드 API를 통해 테이블 생성 요청
  try {
    const response = await fetch('http://31.220.83.213/api/database-status')
    const result = await response.json()
    console.log('📊 데이터베이스 상태:', result)
  } catch (error) {
    console.log('❌ 백엔드 API 호출 실패:', error.message)
  }
}

// 스크립트 실행
checkSchema() 