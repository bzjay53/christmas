// 🧪 테스트용 간단한 Function
exports.handler = async (event, context) => {
  console.log('🚀 Hello Function Called');
  console.log('Event:', JSON.stringify(event, null, 2));
  
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      message: 'Hello from Netlify Functions!',
      timestamp: new Date().toISOString(),
      path: event.path,
      method: event.httpMethod
    })
  };
}; 