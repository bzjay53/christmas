const { createClient } = require('@supabase/supabase-js')

// Supabase 설정 (anon key 사용)
const supabaseUrl = 'https://qehzzsxzjijfzqkysazc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlaHp6c3h6amlqZnpxa3lzYXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNTgxMTQsImV4cCI6MjA2MzYzNDExNH0.zjrrUaVajb9fV1NRwzA_RMy3-r3Lpww9Uen-cZYXDuE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testConnection() {
  console.log('🎄 Christmas Trading Supabase 연결 테스트...')
  
  try {
    // 간단한 연결 테스트
    const { data, error } = await supabase
      .from('users')
      .select('count')
      .limit(1)
    
    if (error) {
      console.log('❌ 테이블이 존재하지 않음:', error.message)
      console.log('📋 테이블 생성이 필요합니다.')
      
      // 백엔드 API를 통해 테이블 생성 요청
      console.log('🔄 백엔드 API를 통한 테이블 생성 시도...')
      
      const response = await fetch('http://31.220.83.213/api/database-status')
      const dbStatus = await response.json()
      console.log('📊 데이터베이스 상태:', dbStatus)
      
    } else {
      console.log('✅ Supabase 연결 성공!')
      console.log('📊 데이터:', data)
    }
    
  } catch (error) {
    console.error('❌ 연결 테스트 실패:', error.message)
  }
}

// 스크립트 실행
testConnection() 