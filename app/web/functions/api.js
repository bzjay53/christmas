// Python API와 통신하기 위한 서버리스 함수
const fetch = require('node-fetch');

// API 요청을 처리하는 핸들러
exports.handler = async (event, context) => {
  try {
    // 요청 정보 추출
    const path = event.path.replace('/.netlify/functions/api', '');
    const method = event.httpMethod;
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };
    
    // CORS 사전 요청(Preflight) 처리
    if (method === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'CORS enabled' })
      };
    }
    
    // API 기본 URL 설정 (환경 변수 또는 기본값 사용)
    const apiBaseUrl = process.env.API_BASE_URL || 'http://localhost:8000';
    const apiUrl = `${apiBaseUrl}${path}`;
    
    // 요청 바디 준비
    const requestBody = event.body ? JSON.parse(event.body) : null;
    
    // API 요청 설정
    const fetchOptions = {
      method,
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    // POST, PUT 요청인 경우 바디 추가
    if (requestBody && (method === 'POST' || method === 'PUT')) {
      fetchOptions.body = JSON.stringify(requestBody);
    }
    
    // API 호출
    console.log(`API 요청: ${method} ${apiUrl}`);
    const response = await fetch(apiUrl, fetchOptions);
    const data = await response.json();
    
    // 응답 반환
    return {
      statusCode: response.status,
      headers,
      body: JSON.stringify(data)
    };
  } catch (error) {
    console.error('API 요청 중 오류 발생:', error);
    
    // 오류 응답 반환
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'API 요청 중 오류가 발생했습니다.',
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error'
      })
    };
  }
}; 