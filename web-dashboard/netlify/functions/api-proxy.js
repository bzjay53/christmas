// Netlify Functions API Proxy
// 백엔드 API를 프록시하여 Mixed Content 문제 해결
// Last updated: 2025-05-30 22:00 KST - axios로 재구현

const BACKEND_URL = 'http://31.220.83.213:8000';

exports.handler = async (event, context) => {
  console.log('🔧 API Proxy Handler Called:', {
    path: event.path,
    method: event.httpMethod,
    timestamp: new Date().toISOString()
  });

  // CORS 헤더 설정
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Content-Type': 'application/json'
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // API 경로 추출 (/api/proxy/health -> /health)
    let apiPath = event.path.replace('/api/proxy', '');
    if (apiPath === '') apiPath = '/health'; // 기본 경로
    
    const targetUrl = `${BACKEND_URL}${apiPath}`;
    
    console.log(`🔄 Proxying: ${event.httpMethod} ${targetUrl}`);

    // HTTP 모듈을 사용한 요청 (Node.js 내장 모듈)
    const http = require('http');
    const url = require('url');
    
    const parsedUrl = url.parse(targetUrl);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 8000,
      path: parsedUrl.path,
      method: event.httpMethod,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Functions-Proxy'
      }
    };

    // 요청 실행
    const responseData = await new Promise((resolve, reject) => {
      const req = http.request(options, (res) => {
        let data = '';
        res.on('data', (chunk) => data += chunk);
        res.on('end', () => {
          console.log(`✅ Backend response: ${res.statusCode}`);
          resolve({
            statusCode: res.statusCode,
            data: data
          });
        });
      });

      req.on('error', (error) => {
        console.error('❌ HTTP Request Error:', error);
        reject(error);
      });

      // POST 데이터가 있으면 전송
      if (event.body) {
        req.write(event.body);
      }
      
      req.end();
    });

    return {
      statusCode: responseData.statusCode,
      headers,
      body: responseData.data
    };

  } catch (error) {
    console.error('❌ API Proxy Error:', {
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
    
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'API Proxy Error',
        message: error.message,
        timestamp: new Date().toISOString(),
        backend_url: BACKEND_URL
      })
    };
  }
}; 