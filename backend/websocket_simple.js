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
        console.log(`📡 클라이언트 ${clientId} 구독 요청:`, payload);
        this.sendToClient(clientId, 'subscribed', {
          channels: payload.channels || ['all'],
          message: '구독이 완료되었습니다.'
        });
        break;

      case 'user_auth':
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

  getConnectedClientsCount() {
    return this.clients.size;
  }

  getServerStatus() {
    return {
      connectedClients: this.clients.size,
      uptime: process.uptime(),
      status: 'active'
    };
  }
}

module.exports = WebSocketServer; 