/**
 * Telegram Bot API Routes
 * 텔레그램 봇 관련 API 엔드포인트
 */
const express = require('express');
const axios = require('axios');
const router = express.Router();

// 텔레그램 봇 토큰 검증
router.post('/validate-token', async (req, res) => {
  try {
    const { botToken } = req.body;
    
    if (!botToken) {
      return res.status(400).json({
        success: false,
        message: '봇 토큰이 필요합니다.'
      });
    }
    
    // 텔레그램 API로 봇 정보 조회
    const response = await axios.get(`https://api.telegram.org/bot${botToken}/getMe`);
    
    if (response.data.ok) {
      const botInfo = response.data.result;
      res.json({
        success: true,
        message: '봇 토큰이 유효합니다.',
        botInfo: {
          id: botInfo.id,
          username: botInfo.username,
          firstName: botInfo.first_name,
          canJoinGroups: botInfo.can_join_groups,
          canReadAllGroupMessages: botInfo.can_read_all_group_messages,
          supportsInlineQueries: botInfo.supports_inline_queries
        }
      });
    } else {
      res.status(400).json({
        success: false,
        message: '유효하지 않은 봇 토큰입니다.',
        error: response.data.description
      });
    }
  } catch (error) {
    console.error('텔레그램 봇 토큰 검증 실패:', error);
    res.status(500).json({
      success: false,
      message: '봇 토큰 검증 중 오류가 발생했습니다.',
      error: error.response?.data?.description || error.message
    });
  }
});

// 테스트 메시지 전송
router.post('/send-test-message', async (req, res) => {
  try {
    const { botToken, chatId, customMessage } = req.body;
    
    if (!botToken || !chatId) {
      return res.status(400).json({
        success: false,
        message: '봇 토큰과 채팅 ID가 필요합니다.'
      });
    }
    
    const message = customMessage || `🎄 Christmas Trading 테스트 메시지

✅ 텔레그램 봇 연동이 성공적으로 완료되었습니다!

📊 앞으로 다음과 같은 알림을 받으실 수 있습니다:
• 거래 신호 알림
• 수익/손실 현황
• 시스템 상태 알림
• 중요 공지사항

🕐 전송 시간: ${new Date().toLocaleString('ko-KR')}`;
    
    const response = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    });
    
    if (response.data.ok) {
      res.json({
        success: true,
        message: '테스트 메시지가 성공적으로 전송되었습니다.',
        messageId: response.data.result.message_id,
        sentAt: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        message: '메시지 전송에 실패했습니다.',
        error: response.data.description
      });
    }
  } catch (error) {
    console.error('텔레그램 메시지 전송 실패:', error);
    
    let errorMessage = '메시지 전송 중 오류가 발생했습니다.';
    
    if (error.response?.data?.description) {
      const description = error.response.data.description;
      if (description.includes('chat not found')) {
        errorMessage = '채팅 ID를 찾을 수 없습니다. 봇과 대화를 시작했는지 확인해주세요.';
      } else if (description.includes('bot was blocked')) {
        errorMessage = '봇이 차단되었습니다. 봇을 차단 해제하고 다시 시도해주세요.';
      } else if (description.includes('Unauthorized')) {
        errorMessage = '봇 토큰이 유효하지 않습니다.';
      }
    }
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      error: error.response?.data?.description || error.message
    });
  }
});

// 실시간 알림 전송 (거래 신호용)
router.post('/send-trading-alert', async (req, res) => {
  try {
    const { botToken, chatId, alertType, data } = req.body;
    
    if (!botToken || !chatId || !alertType) {
      return res.status(400).json({
        success: false,
        message: '필수 파라미터가 누락되었습니다.'
      });
    }
    
    let message = '';
    
    switch (alertType) {
      case 'buy_signal':
        message = `🟢 매수 신호 발생!

📈 종목: ${data.symbol}
💰 현재가: ${data.price}원
📊 신호 강도: ${data.confidence}%
⏰ 시간: ${new Date().toLocaleString('ko-KR')}

${data.reason || ''}`;
        break;
        
      case 'sell_signal':
        message = `🔴 매도 신호 발생!

📉 종목: ${data.symbol}
💰 현재가: ${data.price}원
📊 신호 강도: ${data.confidence}%
⏰ 시간: ${new Date().toLocaleString('ko-KR')}

${data.reason || ''}`;
        break;
        
      case 'profit_alert':
        message = `💰 수익 알림

📈 종목: ${data.symbol}
💵 수익금: ${data.profit}원 (${data.profitRate}%)
⏰ 시간: ${new Date().toLocaleString('ko-KR')}`;
        break;
        
      case 'loss_alert':
        message = `⚠️ 손실 알림

📉 종목: ${data.symbol}
💸 손실금: ${data.loss}원 (${data.lossRate}%)
⏰ 시간: ${new Date().toLocaleString('ko-KR')}`;
        break;
        
      case 'system_alert':
        message = `🔧 시스템 알림

${data.message}
⏰ 시간: ${new Date().toLocaleString('ko-KR')}`;
        break;
        
      default:
        message = data.message || '알림 메시지';
    }
    
    const response = await axios.post(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      chat_id: chatId,
      text: message,
      parse_mode: 'HTML'
    });
    
    if (response.data.ok) {
      res.json({
        success: true,
        message: '알림이 성공적으로 전송되었습니다.',
        messageId: response.data.result.message_id
      });
    } else {
      res.status(400).json({
        success: false,
        message: '알림 전송에 실패했습니다.',
        error: response.data.description
      });
    }
  } catch (error) {
    console.error('텔레그램 알림 전송 실패:', error);
    res.status(500).json({
      success: false,
      message: '알림 전송 중 오류가 발생했습니다.',
      error: error.response?.data?.description || error.message
    });
  }
});

module.exports = router; 