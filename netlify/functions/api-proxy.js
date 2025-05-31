// Netlify Functions API Proxy - 간소화 버전
// 백엔드 서버와 프론트엔드 간 프록시

const http = require('http');

const BACKEND_URL = 'http://31.220.83.213:8000';

exports.handler = async (event, context) => {
  console.log('🚀 API Proxy Function Called');
  console.log('Event:', JSON.stringify(event, null, 2));

  // CORS 헤더
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  // OPTIONS 요청 처리
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    // 경로 처리
    let path = event.path || '';
    path = path.replace('/api/proxy', '');
    path = path.replace('/.netlify/functions/api-proxy', '');
    
    if (!path || path === '/') {
      path = '/health';
    }

    const targetUrl = `${BACKEND_URL}${path}`;
    console.log(`Proxying to: ${targetUrl}`);

    // 백엔드 요청
    const response = await makeHttpRequest(targetUrl, event.httpMethod, event.body);
    
    return {
      statusCode: response.statusCode,
      headers,
      body: response.body
    };

  } catch (error) {
    console.error('Proxy Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Proxy Error',
        message: error.message,
        backend_url: BACKEND_URL
      })
    };
  }
};

function makeHttpRequest(url, method, body) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 8000,
      path: parsedUrl.pathname + parsedUrl.search,
      method: method,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Proxy'
      }
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          body: data
        });
      });
    });

    req.on('error', reject);
    
    if (body && (method === 'POST' || method === 'PUT')) {
      req.write(body);
    }
    
    req.end();
  });
} 