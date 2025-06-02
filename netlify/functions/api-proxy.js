// 🔗 Christmas Trading - Netlify Functions API Proxy
// Phase 1-C: Mixed Content 해결 및 라우팅 개선

// 백엔드 URL을 Nginx를 통하도록 변경 (80번 포트 사용)
const BACKEND_BASE_URL = 'http://31.220.83.213'; // 포트 8000 제거

exports.handler = async (event, context) => {
  // RAW INPUT LOGGING
  console.log('RAW event.path:', event.path);
  console.log('RAW event.queryStringParameters:', event.queryStringParameters);

  // CORS 헤더 설정
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Credentials': 'true'
  };

  try {
    // OPTIONS 요청 처리 (CORS preflight)
    if (event.httpMethod === 'OPTIONS') {
      console.log('🚀 CORS Preflight Request');
      return {
        statusCode: 200,
        headers: corsHeaders,
        body: JSON.stringify({ message: 'CORS preflight OK' })
      };
    }

    // 요청 정보 로깅
    console.log(`🔍 API Proxy Request:`, {
      method: event.httpMethod,
      path: event.path,
      queryStringParameters: event.queryStringParameters,
      headers: event.headers,
      timestamp: new Date().toISOString()
    });

    const functionPrefix = '/.netlify/functions/api-proxy';
    // event.path에서 함수 자체 경로 부분을 제거하여 순수 splat 경로를 얻습니다. (예: /auth/session)
    const splatPath = event.path.startsWith(functionPrefix) ? event.path.substring(functionPrefix.length) : event.path;
    // 백엔드가 기대하는 /api 접두사를 splat 경로 앞에 추가합니다. (예: /api/auth/session)
    const backendApiPath = `/api${splatPath}`;
    
    // targetUrl은 BACKEND_BASE_URL 뒤에 전체 API 경로가 붙어야 함
    // 예: http://31.220.83.213/api/auth/session
    const targetUrl = `${BACKEND_BASE_URL}${backendApiPath}`; 
    
    console.log(`🔗 Proxying to (Nginx): ${targetUrl}`); // 로그 메시지 변경

    // 요청 헤더 준비
    const requestHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'Christmas-Trading-Frontend/2.1.1'
    };

    // Authorization 헤더 전달
    if (event.headers.authorization) {
      requestHeaders.Authorization = event.headers.authorization;
    }

    // 쿼리 파라미터 처리
    let fullUrl = targetUrl;
    if (event.queryStringParameters && Object.keys(event.queryStringParameters).length > 0) {
      const queryString = new URLSearchParams(event.queryStringParameters).toString();
      fullUrl = `${targetUrl}?${queryString}`;
    }

    // HTTP 요청 생성
    const requestOptions = {
      method: event.httpMethod,
      headers: requestHeaders
    };

    // POST/PUT 요청 시 body 추가
    if (event.body && ['POST', 'PUT', 'PATCH'].includes(event.httpMethod)) {
      requestOptions.body = event.body;
    }

    console.log(`📤 Request Options:`, { url: fullUrl, options: requestOptions });

    // 백엔드 요청 실행
    // Dynamic import for node-fetch
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(fullUrl, requestOptions);
    const responseText = await response.text();

    console.log(`📥 Backend Response:`, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      bodyLength: responseText.length
    });

    // 응답 데이터 파싱
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch (e) {
      console.log(`⚠️ Non-JSON response, returning as text: [${responseText.substring(0,100)}...]`); // 응답 앞부분 로깅
      responseData = responseText;
    }

    // 성공 응답
    return {
      statusCode: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': response.headers.get('content-type') || 'application/json' // 백엔드 응답의 Content-Type 사용
      },
      body: response.headers.get('content-type')?.includes('application/json') ? JSON.stringify(responseData) : responseText // JSON이면 stringify, 아니면 그대로
    };

  } catch (error) {
    // 에러 로깅
    console.error(`❌ API Proxy Error:`, {
      message: error.message,
      stack: error.stack,
      event: {
        path: event.path,
        method: event.httpMethod,
        headers: event.headers
      },
      timestamp: new Date().toISOString()
    });

    // 에러 응답
    return {
      statusCode: 500,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        error: 'Proxy Server Error',
        message: error.message,
        timestamp: new Date().toISOString(),
        path: event.path
      })
    };
  }
}; 