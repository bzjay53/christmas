/**
 * WebSocket 서버 - 실시간 알림 시스템
 * Christmas Trading 실시간 데이터 및 알림 처리
 */
const WebSocket = require('ws');

class WebSocketServer {
  constructor(server) {
    this.wss = new WebSocket.Server({ server });
    this.clients = new Map();
    this.setupWebSocketServer();
    console.log('🔌 WebSocket 서버 초기화 완료');
  }

  setupWebSocketServer() {
    this.wss.on('connection', (ws, req) => {
      const clientId = this.generateClientId();
      this.clients.set(clientId, {
        ws: ws,
        userId: null,
        connectedAt: new Date(),
        lastHeartbeat: new Date()
      });

      console.log(`🔗 새 WebSocket 클라이언트 연결: ${clientId} (총 ${this.clients.size}개)`);

      // 연결 환영 메시지
      this.sendToClient(clientId, 'connected', {
        clientId: clientId,
        serverTime: new Date().toISOString(),
        message: 'Christmas Trading WebSocket 서버에 연결되었습니다!'
      });

      // 메시지 처리
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data);
          this.handleMessage(clientId, message);
        } catch (error) {
          console.error('❌ WebSocket 메시지 파싱 실패:', error);
        }
      });

      // 연결 종료 처리
      ws.on('close', () => {
        console.log(`🔌 WebSocket 클라이언트 연결 종료: ${clientId}`);
        this.clients.delete(clientId);
      });

      // 에러 처리
      ws.on('error', (error) => {
        console.error(`❌ WebSocket 클라이언트 에러 (${clientId}):`, error);
        this.clients.delete(clientId);
      });
    });

    // 주기적 하트비트 및 시뮬레이션 데이터 전송
    setInterval(() => {
      this.sendHeartbeat();
      this.sendSimulationData();
    }, 30000); // 30초마다

    // 실시간 거래 신호 시뮬레이션 (더 자주)
    setInterval(() => {
      this.sendTradingSignals();
    }, 60000); // 1분마다
  }

  generateClientId() {
    return 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
  }

  handleMessage(clientId, message) {
    const { type, payload } = message;
    const client = this.clients.get(clientId);

    if (!client) return;

    switch (type) {
      case 'heartbeat':
        client.lastHeartbeat = new Date();
        this.sendToClient(clientId, 'heartbeat', {
          serverTime: new Date().toISOString(),
          clientTime: payload.timestamp
        });
        break;

      case 'subscribe':
        // 구독 요청 처리
        console.log(`📡 클라이언트 ${clientId} 구독 요청:`, payload);
        this.sendToClient(clientId, 'subscribed', {
          channels: payload.channels || ['all'],
          message: '구독이 완료되었습니다.'
        });
        break;

      case 'user_auth':
        // 사용자 인증 정보 저장
        client.userId = payload.userId;
        console.log(`👤 클라이언트 ${clientId} 사용자 인증: ${payload.userId}`);
        break;

      default:
        console.log(`🔍 알 수 없는 메시지 타입 (${clientId}):`, type, payload);
    }
  }

  sendToClient(clientId, type, payload) {
    const client = this.clients.get(clientId);
    if (client && client.ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, payload });
      client.ws.send(message);
    }
  }

  broadcast(type, payload, excludeClientId = null) {
    const message = JSON.stringify({ type, payload });
    
    this.clients.forEach((client, clientId) => {
      if (clientId !== excludeClientId && client.ws.readyState === WebSocket.OPEN) {
        client.ws.send(message);
      }
    });
  }

  sendHeartbeat() {
    this.broadcast('heartbeat', {
      serverTime: new Date().toISOString(),
      connectedClients: this.clients.size,
      uptime: process.uptime()
    });
  }

  sendSimulationData() {
    // 시스템 상태 알림
    this.broadcast('system_alert', {
      level: 'info',
      message: `시스템 정상 운영 중 (연결된 클라이언트: ${this.clients.size}개)`,
      timestamp: new Date().toISOString()
    });

    // 실시간 가격 업데이트 시뮬레이션
    const symbols = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN'];
    const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    const basePrice = {
      'AAPL': 185.20,
      'TSLA': 245.80,
      'NVDA': 890.50,
      'MSFT': 425.30,
      'GOOGL': 142.10,
      'AMZN': 148.90
    };

    const price = basePrice[randomSymbol] * (1 + (Math.random() - 0.5) * 0.02); // ±1% 변동

    this.broadcast('price_update', {
      symbol: randomSymbol,
      price: price.toFixed(2),
      change: ((price - basePrice[randomSymbol]) / basePrice[randomSymbol] * 100).toFixed(2),
      timestamp: new Date().toISOString()
    });
  }

  sendTradingSignals() {
    const symbols = ['AAPL', 'TSLA', 'NVDA', 'MSFT', 'GOOGL', 'AMZN'];
    const actions = ['BUY', 'SELL', 'HOLD'];
    const randomSymbol = symbols[Math.floor(Math.random() * symbols.length)];
    const randomAction = actions[Math.floor(Math.random() * actions.length)];
    const confidence = Math.floor(Math.random() * 30) + 70; // 70-99% 신뢰도

    // 거래 신호가 너무 자주 발생하지 않도록 확률 조정
    if (Math.random() > 0.3) return; // 30% 확률로만 신호 발생

    this.broadcast('trading_signal', {
      symbol: randomSymbol,
      action: randomAction,
      confidence: confidence,
      reason: this.generateSignalReason(randomAction),
      timestamp: new Date().toISOString(),
      aiModel: 'Christmas AI v2.0'
    });

    console.log(`🎯 거래 신호 브로드캐스트: ${randomSymbol} ${randomAction} (${confidence}%)`);
  }

  generateSignalReason(action) {
    const reasons = {
      'BUY': [
        '기술적 분석 상승 패턴 감지',
        '거래량 급증 및 모멘텀 상승',
        'AI 모델 강한 매수 신호',
        '지지선 반등 패턴 확인'
      ],
      'SELL': [
        '저항선 도달 및 과매수 구간',
        '하락 패턴 및 거래량 감소',
        'AI 모델 매도 신호 감지',
        '리스크 관리 차원 매도'
      ],
      'HOLD': [
        '횡보 구간 진입',
        '추가 신호 대기 필요',
        '현재 포지션 유지 권장',
        '시장 불확실성 증가'
      ]
    };

    const actionReasons = reasons[action] || reasons['HOLD'];
    return actionReasons[Math.floor(Math.random() * actionReasons.length)];
  }

  // 특정 사용자에게 알림 전송
  sendToUser(userId, type, payload) {
    this.clients.forEach((client, clientId) => {
      if (client.userId === userId && client.ws.readyState === WebSocket.OPEN) {
        this.sendToClient(clientId, type, payload);
      }
    });
  }

  // 수익/손실 알림 전송
  sendProfitAlert(userId, alertData) {
    this.sendToUser(userId, 'profit_alert', {
      ...alertData,
      timestamp: new Date().toISOString()
    });
  }

  // 주문 체결 알림 전송
  sendOrderUpdate(userId, orderData) {
    this.sendToUser(userId, 'order_update', {
      ...orderData,
      timestamp: new Date().toISOString()
    });
  }

  // 연결된 클라이언트 수 반환
  getConnectedClientsCount() {
    return this.clients.size;
  }

  // 서버 상태 정보 반환
  getServerStatus() {
    return {
      connectedClients: this.clients.size,
      uptime: process.uptime(),
      lastHeartbeat: new Date().toISOString()
    };
  }
}

module.exports = WebSocketServer; 