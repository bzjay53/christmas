// Netlify 서버리스 함수의 기본 진입점
exports.handler = async (event, context) => {
  try {
    // 요청 경로 추출
    const path = event.path.replace('/.netlify/functions/index', '');
    const method = event.httpMethod;
    
    console.log(`처리 중인 요청: ${method} ${path}`);
    
    // 기본 응답 헤더 설정
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };
    
    // OPTIONS 요청 처리 (CORS)
    if (method === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'CORS enabled' })
      };
    }
    
    // API 경로 라우팅
    if (path.startsWith('/api')) {
      return await handleApiRequest(path, method, event, headers);
    }
    
    // 기본 응답
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: '요청한 경로를 찾을 수 없습니다.' })
    };
  } catch (error) {
    console.error('오류 발생:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: '서버 오류가 발생했습니다.', 
        error: process.env.NODE_ENV === 'development' ? error.message : 'Internal Server Error' 
      })
    };
  }
};

// API 요청 핸들러
async function handleApiRequest(path, method, event, headers) {
  // 경로에서 API 엔드포인트 추출
  const endpoint = path.replace('/api', '');
  const requestBody = event.body ? JSON.parse(event.body) : {};
  
  // 여기에 API 엔드포인트 라우팅 로직 구현
  switch (true) {
    // 대시보드 데이터 API
    case endpoint === '/dashboard' && method === 'GET':
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          accountValue: 10000000,
          profit: 250000,
          profitRate: 2.5,
          positions: [
            { symbol: 'AAPL', quantity: 10, entryPrice: 150.0, currentPrice: 155.0, profit: 50.0 },
            { symbol: 'MSFT', quantity: 5, entryPrice: 300.0, currentPrice: 310.0, profit: 50.0 }
          ]
        })
      };
    
    // 백테스트 API
    case endpoint === '/backtest' && method === 'POST':
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'success',
          result: {
            totalReturn: 15.2,
            winRate: 68.5,
            sharpeRatio: 1.8,
            maxDrawdown: -12.3,
            trades: 125
          }
        })
      };
    
    // 데모 거래 API
    case endpoint === '/demo/trade' && method === 'POST':
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          orderId: 'demo-' + Math.floor(Math.random() * 1000000),
          status: 'executed',
          symbol: requestBody.symbol,
          side: requestBody.side,
          quantity: requestBody.quantity,
          price: requestBody.price,
          timestamp: new Date().toISOString()
        })
      };
    
    // 기타 경로는 404 반환
    default:
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({ message: '요청한 API 엔드포인트를 찾을 수 없습니다.' })
      };
  }
} 