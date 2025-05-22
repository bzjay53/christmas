// 모의투자 API를 처리하는 서버리스 함수
exports.handler = async (event, context) => {
  try {
    // 요청 정보 추출
    const path = event.path.replace('/.netlify/functions/demo-trade', '');
    const method = event.httpMethod;
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS'
    };
    
    // CORS 사전 요청 처리
    if (method === 'OPTIONS') {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ message: 'CORS enabled' })
      };
    }
    
    // 요청 바디 파싱
    const requestBody = event.body ? JSON.parse(event.body) : {};
    
    // 모의투자 API 엔드포인트 라우팅
    if (method === 'GET' && path === '/stocks') {
      // 주식 목록 제공
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          stocks: [
            { symbol: 'AAPL', name: '애플', price: 155.0, change: 1.5, changePercent: 0.98 },
            { symbol: 'MSFT', name: '마이크로소프트', price: 310.0, change: -2.3, changePercent: -0.74 },
            { symbol: 'GOOGL', name: '알파벳', price: 2750.0, change: 15.0, changePercent: 0.55 },
            { symbol: 'AMZN', name: '아마존', price: 3350.0, change: 20.0, changePercent: 0.60 },
            { symbol: 'TSLA', name: '테슬라', price: 950.0, change: -5.0, changePercent: -0.52 }
          ]
        })
      };
    } else if (method === 'GET' && path === '/account') {
      // 계좌 정보 제공
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          balance: 10000000,
          equity: 10250000,
          availableCash: 5000000,
          dayPnL: 250000,
          totalPnL: 250000,
          profitRate: 2.5
        })
      };
    } else if (method === 'GET' && path === '/positions') {
      // 포지션 정보 제공
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          positions: [
            { 
              symbol: 'AAPL', 
              name: '애플',
              quantity: 10, 
              entryPrice: 150.0, 
              currentPrice: 155.0, 
              marketValue: 1550.0,
              profit: 50.0, 
              profitRate: 3.33,
              entryDate: '2025-06-01T09:30:00Z'
            },
            { 
              symbol: 'MSFT', 
              name: '마이크로소프트',
              quantity: 5, 
              entryPrice: 300.0, 
              currentPrice: 310.0, 
              marketValue: 1550.0,
              profit: 50.0, 
              profitRate: 3.33,
              entryDate: '2025-06-02T10:15:00Z'
            }
          ]
        })
      };
    } else if (method === 'POST' && path === '/order') {
      // 주문 처리
      const { symbol, side, quantity, price, orderType } = requestBody;
      
      // 주문 유효성 검사
      if (!symbol || !side || !quantity || (orderType === 'LIMIT' && !price)) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ 
            status: 'error', 
            message: '필수 주문 정보가 누락되었습니다.' 
          })
        };
      }
      
      // 모의 주문 처리 (실제로는 DB에 저장하겠지만, 여기서는 응답만 반환)
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          status: 'success',
          orderId: `demo-${Date.now()}`,
          symbol,
          side,
          quantity,
          price: price || 'market',
          orderType: orderType || 'MARKET',
          timestamp: new Date().toISOString(),
          message: '주문이 성공적으로 처리되었습니다.'
        })
      };
    } else if (method === 'GET' && path === '/orders') {
      // 주문 내역 제공
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({
          orders: [
            { 
              orderId: 'demo-1654321',
              symbol: 'AAPL', 
              side: 'BUY', 
              quantity: 10, 
              price: 150.0, 
              orderType: 'LIMIT',
              status: 'FILLED',
              timestamp: '2025-06-01T09:30:00Z'
            },
            { 
              orderId: 'demo-1654322',
              symbol: 'MSFT', 
              side: 'BUY', 
              quantity: 5, 
              price: 300.0, 
              orderType: 'LIMIT',
              status: 'FILLED',
              timestamp: '2025-06-02T10:15:00Z'
            }
          ]
        })
      };
    } else if (method === 'GET' && path.startsWith('/chart/')) {
      // 차트 데이터 제공 (심볼별)
      const symbol = path.replace('/chart/', '');
      
      // 모의 차트 데이터 생성
      const chartData = generateChartData(symbol);
      
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ chartData })
      };
    }
    
    // 기타 경로는 404 반환
    return {
      statusCode: 404,
      headers,
      body: JSON.stringify({ message: '요청한 API 엔드포인트를 찾을 수 없습니다.' })
    };
  } catch (error) {
    console.error('모의투자 API 요청 중 오류 발생:', error);
    
    // 오류 응답 반환
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

// 모의 차트 데이터 생성 함수
function generateChartData(symbol) {
  const data = [];
  const now = new Date();
  const basePrice = getBasePrice(symbol);
  
  // 1분 단위 데이터 생성 (최근 60분)
  for (let i = 59; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60000);
    const volatility = 0.002;  // 변동성 계수
    const random = (Math.random() * 2 - 1) * volatility;
    
    // 가격 변동 시뮬레이션
    const factor = 1 + random;
    const prevPrice = i === 59 ? basePrice : data[59 - i - 1].close;
    const close = prevPrice * factor;
    const open = prevPrice * (1 + (Math.random() * 0.6 - 0.3) * volatility);
    const high = Math.max(open, close) * (1 + Math.random() * 0.5 * volatility);
    const low = Math.min(open, close) * (1 - Math.random() * 0.5 * volatility);
    const volume = Math.floor(Math.random() * 1000) + 500;
    
    data.push({
      time: time.toISOString(),
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume
    });
  }
  
  return data;
}

// 심볼별 기준 가격 설정
function getBasePrice(symbol) {
  const prices = {
    'AAPL': 155.0,
    'MSFT': 310.0,
    'GOOGL': 2750.0,
    'AMZN': 3350.0,
    'TSLA': 950.0
  };
  
  return prices[symbol] || 100.0;  // 기본값 100
} 