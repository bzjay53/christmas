/**
 * AI 테이블 자동 수정 테스트 스크립트
 * Christmas Trading - AI Tables Schema Fix
 */

const axios = require('axios');

const BASE_URL = 'http://localhost:8000';

async function testAITablesFix() {
  console.log('🚀 AI 테이블 자동 수정 시작...\n');
  
  try {
    // 1. 서버 상태 확인
    console.log('1️⃣ 서버 상태 확인 중...');
    const healthResponse = await axios.get(`${BASE_URL}/health`);
    console.log('✅ 서버 상태:', healthResponse.data.status);
    console.log('📊 데이터베이스:', healthResponse.data.database);
    console.log('');
    
    // 2. AI 테이블 현재 상태 확인
    console.log('2️⃣ AI 테이블 현재 상태 확인 중...');
    try {
      const statusResponse = await axios.get(`${BASE_URL}/api/setup/ai-tables-status`);
      const statusData = statusResponse.data;
      
      console.log('📋 테이블 현재 상태:');
      console.log('- 총 필요 테이블:', statusData.data.summary.totalTablesRequired);
      console.log('- 존재하는 테이블:', statusData.data.summary.existingTables);
      console.log('- 누락 테이블:', statusData.data.summary.missingTables);
      console.log('- 스키마 수정 필요:', statusData.data.summary.needsSchemaFix ? '⚠️ 필요' : '✅ 정상');
      
      if (statusData.data.summary.needsSchemaFix) {
        console.log('\n🔧 누락된 컬럼이 발견되었습니다. 자동 수정을 진행합니다...\n');
        
        // 3. AI 테이블 자동 수정 실행
        console.log('3️⃣ AI 테이블 스키마 자동 수정 실행 중...');
        const fixResponse = await axios.post(`${BASE_URL}/api/setup/fix-ai-tables`);
        const fixData = fixResponse.data;
        
        console.log('🎉 수정 결과:');
        console.log('- 총 쿼리 실행:', fixData.data.summary.totalQueries);
        console.log('- 성공:', fixData.data.summary.successCount);
        console.log('- 실패:', fixData.data.summary.errorCount);
        console.log('- 전체 성공:', fixData.data.summary.success ? '✅ 성공' : '❌ 실패');
        console.log('- 메시지:', fixData.data.summary.message);
        
        if (fixData.data.results && fixData.data.results.length > 0) {
          console.log('\n📝 상세 결과:');
          fixData.data.results.forEach((result, index) => {
            const status = result.status === 'success' ? '✅' : '❌';
            console.log(`${status} ${index + 1}. ${result.query}`);
            if (result.error) {
              console.log(`   오류: ${result.error}`);
            }
          });
        }
        
      } else {
        console.log('✅ AI 테이블 스키마가 이미 정상 상태입니다!');
      }
      
    } catch (error) {
      if (error.response?.status === 404) {
        console.log('❌ API 엔드포인트를 찾을 수 없습니다. 서버가 최신 버전이 아닐 수 있습니다.');
      } else {
        console.error('❌ API 호출 실패:', error.message);
      }
      return;
    }
    
    // 4. 수정 후 최종 상태 확인
    console.log('\n4️⃣ 수정 후 최종 상태 확인 중...');
    const finalStatusResponse = await axios.get(`${BASE_URL}/api/setup/ai-tables-status`);
    const finalData = finalStatusResponse.data;
    
    console.log('🎯 최종 상태:');
    console.log('- 스키마 상태:', finalData.data.summary.needsSchemaFix ? '⚠️ 여전히 수정 필요' : '✅ 완전 정상');
    console.log('- 데이터 개수:', JSON.stringify(finalData.data.summary.dataCounts, null, 2));
    
    // 5. 테이블 구조 확인
    if (finalData.data.tableStructures) {
      console.log('\n📊 테이블별 상세 구조:');
      Object.entries(finalData.data.tableStructures).forEach(([tableName, structure]) => {
        console.log(`\n🔹 ${tableName}:`);
        console.log(`   - 총 컬럼: ${structure.totalColumns}/${structure.requiredColumns}`);
        console.log(`   - 누락 컬럼: ${structure.missingColumns.length > 0 ? structure.missingColumns.join(', ') : '없음'}`);
        console.log(`   - 상태: ${structure.needsFix ? '⚠️ 수정 필요' : '✅ 정상'}`);
      });
    }
    
    console.log('\n🎄 Christmas AI 테이블 수정 완료! 🎄\n');
    
  } catch (error) {
    console.error('❌ 전체 프로세스 실패:', error.message);
    if (error.response) {
      console.error('응답 상태:', error.response.status);
      console.error('응답 데이터:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

// 실행
testAITablesFix(); 