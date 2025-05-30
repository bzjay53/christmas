// 간단한 Netlify Functions 테스트
// 2025-05-30 22:00 KST - Functions 작동 확인용

exports.handler = async (event, context) => {
  console.log('🧪 Test Function Called:', {
    method: event.httpMethod,
    path: event.path,
    timestamp: new Date().toISOString()
  });

  return {
    statusCode: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      success: true,
      message: '🎉 Netlify Functions 테스트 성공!',
      timestamp: new Date().toISOString(),
      method: event.httpMethod,
      path: event.path
    })
  };
}; 