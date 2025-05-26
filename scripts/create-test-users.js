const { createClient } = require('@supabase/supabase-js')
const bcrypt = require('bcryptjs')

// Supabase 설정
const supabaseUrl = 'https://qehzzsxzjijfzqkysazc.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlaHp6c3h6amlqZnpxa3lzYXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNTgxMTQsImV4cCI6MjA2MzYzNDExNH0.zjrrUaVajb9fV1NRwzA_RMy3-r3Lpww9Uen-cZYXDuE'

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function createTestUsers() {
  console.log('🎄 Christmas Trading 테스트 사용자 생성 시작...')
  
  try {
    // 테스트 계정 정보
    const testUsers = [
      {
        email: 'lvninety9@gmail.com',
        password: 'password123',
        first_name: 'Christmas',
        last_name: 'Admin',
        membership_type: 'lifetime',
        is_email_verified: true,
        is_admin: true,
        personal_referral_code: 'ADMIN2024'
      },
      {
        email: 'admin@christmas.com',
        password: 'password123',
        first_name: 'Christmas',
        last_name: 'Administrator',
        membership_type: 'lifetime',
        is_email_verified: true,
        is_admin: true,
        personal_referral_code: 'CHRISTMAS'
      },
      {
        email: 'user@christmas.com',
        password: 'password',
        first_name: 'Test',
        last_name: 'User',
        membership_type: 'premium',
        is_email_verified: true,
        is_admin: false,
        personal_referral_code: 'TESTUSER'
      }
    ]
    
    for (const user of testUsers) {
      console.log(`👤 사용자 생성 중: ${user.email}`)
      
      // 비밀번호 해시화
      const hashedPassword = await bcrypt.hash(user.password, 12)
      
      // 사용자 데이터 준비
      const userData = {
        ...user,
        password: hashedPassword
      }
      
      // 기존 사용자 확인
      const { data: existingUser } = await supabase
        .from('users')
        .select('email')
        .eq('email', user.email)
        .single()
      
      if (existingUser) {
        console.log(`   ⚠️ 이미 존재하는 사용자: ${user.email}`)
        
        // 기존 사용자 업데이트
        const { error: updateError } = await supabase
          .from('users')
          .update({
            password: hashedPassword,
            first_name: user.first_name,
            last_name: user.last_name,
            membership_type: user.membership_type,
            is_email_verified: user.is_email_verified,
            is_admin: user.is_admin,
            personal_referral_code: user.personal_referral_code
          })
          .eq('email', user.email)
        
        if (updateError) {
          console.error(`   ❌ 사용자 업데이트 실패: ${updateError.message}`)
        } else {
          console.log(`   ✅ 사용자 업데이트 완료: ${user.email}`)
        }
      } else {
        // 새 사용자 생성
        const { error: insertError } = await supabase
          .from('users')
          .insert([userData])
        
        if (insertError) {
          console.error(`   ❌ 사용자 생성 실패: ${insertError.message}`)
        } else {
          console.log(`   ✅ 사용자 생성 완료: ${user.email}`)
        }
      }
    }
    
    // 생성된 사용자 확인
    console.log('\n📋 생성된 사용자 목록:')
    const { data: users, error: selectError } = await supabase
      .from('users')
      .select('email, first_name, last_name, membership_type, is_admin, personal_referral_code')
      .order('created_at', { ascending: false })
    
    if (selectError) {
      console.error('❌ 사용자 조회 실패:', selectError.message)
    } else {
      users.forEach(user => {
        console.log(`  - ${user.email} (${user.first_name} ${user.last_name})`)
        console.log(`    등급: ${user.membership_type}, 관리자: ${user.is_admin ? 'Yes' : 'No'}, 코드: ${user.personal_referral_code}`)
      })
    }
    
    console.log('\n🎉 테스트 사용자 생성 완료!')
    
  } catch (error) {
    console.error('❌ 전체 프로세스 실패:', error.message)
  }
}

// 스크립트 실행
createTestUsers() 