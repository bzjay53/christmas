// Enhanced Netlify Functions API Proxy
// Mixed Content 문제 해결을 위한 강화 버전
// Last updated: 2025-05-30 23:15 KST

const http = require('http');
const https = require('https');
const url = require('url');

const BACKEND_URL = 'http://31.220.83.213:8000';

exports.handler = async (event, context) => {
  const startTime = Date.now();
  
  console.log('🔧 Enhanced API Proxy Called:', {
    method: event.httpMethod,
    path: event.path,
    rawPath: event.rawPath,
    queryStringParameters: event.queryStringParameters,
    timestamp: new Date().toISOString(),
    userAgent: event.headers['user-agent'],
    origin: event.headers.origin
  });

  // CORS 최적화 헤더
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache',
    'X-Powered-By': 'Christmas-Proxy/2.1'
  };

  // OPTIONS 요청 처리 (CORS preflight)
  if (event.httpMethod === 'OPTIONS') {
    console.log('✅ CORS preflight request handled');
    return {
      statusCode: 200,
      headers: corsHeaders,
      body: ''
    };
  }

  try {
    // API 경로 처리 (더 강력한 처리)
    let apiPath = event.path || event.rawPath || '';
    
    // /api/proxy 제거
    apiPath = apiPath.replace('/api/proxy', '');
    apiPath = apiPath.replace('/.netlify/functions/api-proxy', '');
    
    // 빈 경로 처리
    if (apiPath === '' || apiPath === '/') {
      apiPath = '/health';
    }
    
    // 쿼리 스트링 처리
    if (event.queryStringParameters) {
      const queryString = new URLSearchParams(event.queryStringParameters).toString();
      if (queryString) {
        apiPath += `?${queryString}`;
      }
    }
    
    const targetUrl = `${BACKEND_URL}${apiPath}`;
    
    console.log(`🔄 Proxying: ${event.httpMethod} ${targetUrl} (original path: ${event.path})`);

    // HTTP 요청 실행
    const response = await makeRequest(targetUrl, event);
    
    const processingTime = Date.now() - startTime;
    console.log(`✅ Response: ${response.statusCode} (${processingTime}ms)`);
    
    return {
      statusCode: response.statusCode,
      headers: corsHeaders,
      body: response.data
    };

  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error('❌ Enhanced Proxy Error:', {
      error: error.message,
      stack: error.stack,
      processingTime,
      timestamp: new Date().toISOString()
    });
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'Enhanced API Proxy Error',
        message: error.message,
        timestamp: new Date().toISOString(),
        processingTime,
        backend_url: BACKEND_URL
      })
    };
  }
};

// HTTP 요청 헬퍼 함수 (개선된 버전)
function makeRequest(targetUrl, event) {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(targetUrl);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 8000,
      path: parsedUrl.path,
      method: event.httpMethod,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Christmas-Proxy/2.0',
        'Accept': 'application/json',
        'Connection': 'keep-alive'
      },
      timeout: 30000
    };

    // Authorization 헤더 전달
    if (event.headers.authorization) {
      options.headers['Authorization'] = event.headers.authorization;
    }

    console.log('🔗 Request options:', {
      hostname: options.hostname,
      port: options.port,
      path: options.path,
      method: options.method
    });

    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        console.log(`📦 Response received: ${res.statusCode} ${res.statusMessage}`);
        resolve({
          statusCode: res.statusCode,
          data: data
        });
      });
    });

    req.on('error', (error) => {
      console.error('🚨 HTTP Request Error:', error);
      reject(error);
    });

    req.on('timeout', () => {
      console.error('⏰ Request timeout');
      req.destroy();
      reject(new Error('Request timeout (30s)'));
    });

    // POST/PUT 데이터 전송
    if (event.body && (event.httpMethod === 'POST' || event.httpMethod === 'PUT')) {
      console.log('📤 Sending body data:', event.body.substring(0, 100));
      req.write(event.body);
    }
    
    req.end();
  });
} 