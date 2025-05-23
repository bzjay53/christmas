// 피드백 제출 처리 함수
const axios = require('axios');

exports.handler = async function(event, context) {
  // POST 요청이 아닌 경우 에러 반환
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method Not Allowed' }),
      headers: {
        'Content-Type': 'application/json',
        'Allow': 'POST'
      }
    };
  }

  try {
    // 요청 본문 파싱
    const payload = JSON.parse(event.body);
    
    // 필수 필드 검증
    const requiredFields = ['name', 'email', 'category', 'title', 'description'];
    for (const field of requiredFields) {
      if (!payload[field]) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: `Missing required field: ${field}` }),
          headers: { 'Content-Type': 'application/json' }
        };
      }
    }

    // 피드백 데이터 구성
    const feedback = {
      name: payload.name,
      email: payload.email,
      category: payload.category,
      severity: payload.severity || 'medium',
      title: payload.title,
      description: payload.description,
      timestamp: new Date().toISOString(),
      source: 'web_form'
    };

    // 로그에 피드백 기록 (실제 환경에서는 데이터베이스에 저장)
    console.log('Received feedback:', feedback);

    // 텔레그램 봇에 알림 전송 (실제 환경에서는 환경 변수로 토큰과 chat_id 관리)
    const telegramToken = process.env.TELEGRAM_BOT_TOKEN || '7889451962:AAE3IwomldkE9jXxgmJHWQOLIU-yegU5X2Y';
    const chatId = process.env.TELEGRAM_CHAT_ID || '1394057485';
    
    const telegramMessage = `
📢 새로운 베타 피드백이 접수되었습니다!

제목: ${feedback.title}
카테고리: ${feedback.category}
심각도: ${feedback.severity}
제출자: ${feedback.name} (${feedback.email})

📝 상세 내용:
${feedback.description}

⏰ 제출 시간: ${new Date(feedback.timestamp).toLocaleString()}
`;

    // 텔레그램 메시지 전송
    await axios.post(`https://api.telegram.org/bot${telegramToken}/sendMessage`, {
      chat_id: chatId,
      text: telegramMessage,
      parse_mode: 'HTML'
    });

    // 성공 응답 반환
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: '피드백이 성공적으로 제출되었습니다.',
        id: `feedback-${Date.now()}`
      }),
      headers: { 'Content-Type': 'application/json' }
    };
    
  } catch (error) {
    console.error('Error processing feedback:', error);
    
    // 오류 응답 반환
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: '피드백 처리 중 오류가 발생했습니다.', 
        details: error.message 
      }),
      headers: { 'Content-Type': 'application/json' }
    };
  }
}; 