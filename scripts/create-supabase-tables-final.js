// Christmas Trading Supabase 테이블 생성 스크립트
// 2025-05-26

const { createClient } = require('@supabase/supabase-js');

// Supabase 설정
const supabaseUrl = 'https://qehzzsxzjijfzqkysazc.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlaHp6c3h6amlqZnpxa3lzYXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNTgxMTQsImV4cCI6MjA2MzYzNDExNH0.zjrrUaVajb9fV1NRwzA_RMy3-r3Lpww9Uen-cZYXDuE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTables() {
  console.log('🚀 Supabase 테이블 생성 시작...');

  try {
    // 1. users 테이블 생성
    console.log('1. users 테이블 생성 중...');
    const { data: usersData, error: usersError } = await supabase.rpc('create_users_table');
    if (usersError) {
      console.log('users 테이블이 이미 존재하거나 생성 중 오류:', usersError.message);
    } else {
      console.log('✅ users 테이블 생성 완료');
    }

    // 2. coupons 테이블 생성
    console.log('2. coupons 테이블 생성 중...');
    const { data: couponsData, error: couponsError } = await supabase.rpc('create_coupons_table');
    if (couponsError) {
      console.log('coupons 테이블이 이미 존재하거나 생성 중 오류:', couponsError.message);
    } else {
      console.log('✅ coupons 테이블 생성 완료');
    }

    // 3. referral_codes 테이블 생성
    console.log('3. referral_codes 테이블 생성 중...');
    const { data: referralData, error: referralError } = await supabase.rpc('create_referral_codes_table');
    if (referralError) {
      console.log('referral_codes 테이블이 이미 존재하거나 생성 중 오류:', referralError.message);
    } else {
      console.log('✅ referral_codes 테이블 생성 완료');
    }

    // 4. 테스트 사용자 생성
    console.log('4. 테스트 사용자 생성 중...');
    const { data: userData, error: userError } = await supabase
      .from('users')
      .insert([
        {
          email: 'lvninety9@gmail.com',
          password: '$2b$10$hashedPasswordExample', // 실제로는 bcrypt로 해시된 비밀번호
          username: 'testuser',
          tier: 'basic',
          created_at: new Date().toISOString()
        }
      ])
      .select();

    if (userError) {
      console.log('테스트 사용자가 이미 존재하거나 생성 중 오류:', userError.message);
    } else {
      console.log('✅ 테스트 사용자 생성 완료:', userData);
    }

    // 5. 테이블 확인
    console.log('5. 생성된 테이블 확인 중...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['users', 'coupons', 'referral_codes', 'coupon_usage', 'referral_rewards']);

    if (tablesError) {
      console.log('테이블 확인 중 오류:', tablesError.message);
    } else {
      console.log('✅ 생성된 테이블 목록:', tables);
    }

    console.log('🎉 Supabase 테이블 생성 완료!');

  } catch (error) {
    console.error('❌ 테이블 생성 중 오류 발생:', error);
  }
}

// 직접 실행
if (require.main === module) {
  createTables();
}

module.exports = { createTables }; 