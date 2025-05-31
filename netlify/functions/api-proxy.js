// 🔗 Christmas Trading - Netlify Functions API Proxy
// Phase 1-B: 로깅 강화 및 에러 핸들링 개선

const BACKEND_BASE_URL = 'http://31.220.83.213:8000';

exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://christmas-protocol.netlify.app',
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

    // 프록시 경로 추출 (/api/proxy/xxx → /xxx)
    const proxyPath = event.path.replace('/api/proxy', '').replace('/.netlify/functions/api-proxy', '');
    const targetUrl = `${BACKEND_BASE_URL}${proxyPath}`;
    
    console.log(`🔗 Proxying to: ${targetUrl}`);

    // 요청 헤더 준비
    const requestHeaders = {
      'Content-Type': 'application/json',
      'User-Agent': 'Christmas-Trading-Frontend/2.1.0'
    };

    // Authorization 헤더 전달
    if (event.headers.authorization) {
      requestHeaders.Authorization = event.headers.authorization;
    }

    // 쿼리 파라미터 처리
    let fullUrl = targetUrl;
    if (event.queryStringParameters) {
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
      console.log(`⚠️ Non-JSON response, returning as text`);
      responseData = responseText;
    }

    // 성공 응답
    return {
      statusCode: response.status,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(responseData)
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