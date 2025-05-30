// Netlify Functions API Proxy
// 백엔드 API를 프록시하여 Mixed Content 문제 해결
// Last updated: 2025-05-30 21:45 KST - Emergency deployment

const BACKEND_URL = 'http://31.220.83.213';

exports.handler = async (event, context) => {
  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': 'https://christmas-protocol.netlify.app',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // API 경로 추출 (/api/proxy/health -> /health)
    const apiPath = event.path.replace('/api/proxy', '');
    const targetUrl = `${BACKEND_URL}${apiPath}`;
    
    console.log(`🔄 API Proxy: ${event.httpMethod} ${targetUrl}`);

    // 백엔드 API 호출
    const response = await fetch(targetUrl, {
      method: event.httpMethod,
      headers: {
        'Content-Type': 'application/json',
        ...(event.headers.authorization && {
          'Authorization': event.headers.authorization
        })
      },
      ...(event.body && { body: event.body })
    });

    const data = await response.text();
    
    return {
      statusCode: response.status,
      headers,
      body: data
    };

  } catch (error) {
    console.error('❌ API Proxy Error:', error);
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'API Proxy Error',
        message: error.message,
        timestamp: new Date().toISOString()
      })
    };
  }
}; 