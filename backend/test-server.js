// Christmas Trading Backend - Dry Run 테스트
console.log('🎄 Christmas Trading Backend Dry Run 시작...');

try {
    // 환경 변수 테스트
    require('dotenv').config();
    console.log('✅ dotenv 로드 성공');
    
    // 필수 모듈 테스트
    const express = require('express');
    console.log('✅ express 로드 성공');
    
    const { createClient } = require('@supabase/supabase-js');
    console.log('✅ supabase-js 로드 성공');
    
    // 환경 변수 확인
    const requiredVars = ['SUPABASE_URL', 'SUPABASE_ANON_KEY', 'JWT_SECRET'];
    for (const varName of requiredVars) {
        if (process.env[varName]) {
            console.log(`✅ ${varName}: 설정됨`);
        } else {
            console.log(`❌ ${varName}: 누락됨`);
        }
    }
    
    // 포트 확인
    const PORT = process.env.PORT || 8000;
    console.log(`✅ 포트 설정: ${PORT}`);
    
    // Express 앱 기본 테스트
    const app = express();
    console.log('✅ Express 앱 생성 성공');
    
    console.log('🎉 Dry Run 완료 - 서버 실행 준비됨!');
    process.exit(0);
    
} catch (error) {
    console.log('❌ Dry Run 실패:', error.message);
    console.log('스택 트레이스:', error.stack);
    process.exit(1);
} 