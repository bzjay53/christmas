/**
 * WebSocket 클라이언트 - 실시간 알림 시스템
 * Christmas Trading 실시간 데이터 및 알림 처리
 */

class WebSocketClient {
  constructor() {
    this.ws = null
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.reconnectInterval = 5000
    this.listeners = new Map()
    this.isConnected = false
    this.heartbeatInterval = null
  }

  // WebSocket 연결
  connect(url = 'ws://localhost:8000') {
    try {
      console.log('🔌 WebSocket 연결 시도:', url)
      
      this.ws = new WebSocket(url)
      
      this.ws.onopen = () => {
        console.log('✅ WebSocket 연결 성공')
        this.isConnected = true
        this.reconnectAttempts = 0
        this.startHeartbeat()
        this.emit('connected', { timestamp: new Date().toISOString() })
      }
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          console.log('📨 WebSocket 메시지 수신:', data)
          this.handleMessage(data)
        } catch (error) {
          console.error('❌ WebSocket 메시지 파싱 실패:', error)
        }
      }
      
      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket 연결 종료:', event.code, event.reason)
        this.isConnected = false
        this.stopHeartbeat()
        this.emit('disconnected', { code: event.code, reason: event.reason })
        
        // 자동 재연결 시도
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++
          console.log(`🔄 WebSocket 재연결 시도 ${this.reconnectAttempts}/${this.maxReconnectAttempts}`)
          setTimeout(() => this.connect(url), this.reconnectInterval)
        }
      }
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket 오류:', error)
        this.emit('error', { error: error.message })
      }
      
    } catch (error) {
      console.error('❌ WebSocket 연결 실패:', error)
    }
  }

  // 메시지 처리
  handleMessage(data) {
    const { type, payload } = data
    
    switch (type) {
      case 'trading_signal':
        this.emit('tradingSignal', payload)
        break
      case 'price_update':
        this.emit('priceUpdate', payload)
        break
      case 'order_update':
        this.emit('orderUpdate', payload)
        break
      case 'profit_alert':
        this.emit('profitAlert', payload)
        break
      case 'system_alert':
        this.emit('systemAlert', payload)
        break
      case 'heartbeat':
        this.emit('heartbeat', payload)
        break
      default:
        console.log('🔍 알 수 없는 메시지 타입:', type, payload)
    }
  }

  // 하트비트 시작
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        this.send('heartbeat', { timestamp: new Date().toISOString() })
      }
    }, 30000) // 30초마다 하트비트
  }

  // 하트비트 중지
  stopHeartbeat() {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }
  }

  // 메시지 전송
  send(type, payload) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = JSON.stringify({ type, payload })
      this.ws.send(message)
      console.log('📤 WebSocket 메시지 전송:', { type, payload })
    } else {
      console.warn('⚠️ WebSocket 연결되지 않음, 메시지 전송 실패')
    }
  }

  // 이벤트 리스너 등록
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    this.listeners.get(event).push(callback)
  }

  // 이벤트 리스너 제거
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event)
      const index = callbacks.indexOf(callback)
      if (index > -1) {
        callbacks.splice(index, 1)
      }
    }
  }

  // 이벤트 발생
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`❌ 이벤트 리스너 실행 실패 (${event}):`, error)
        }
      })
    }
  }

  // 연결 종료
  disconnect() {
    this.stopHeartbeat()
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
    this.isConnected = false
    this.listeners.clear()
  }

  // 연결 상태 확인
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: this.ws ? this.ws.readyState : WebSocket.CLOSED,
      reconnectAttempts: this.reconnectAttempts
    }
  }
}

// 싱글톤 인스턴스 생성
const websocketClient = new WebSocketClient()

export default websocketClient 