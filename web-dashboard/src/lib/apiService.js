/**
 * Christmas Trading Backend API Service
 * 백엔드 서버와의 연동을 위한 API 서비스
 */

// 🔗 Christmas Trading - API Service
// Phase 1-C: Mixed Content 해결 - Netlify Functions 프록시 복원

// 환경별 API 설정
const isDevelopment = import.meta.env.DEV;
const useBackendProxy = import.meta.env.VITE_USE_BACKEND_PROXY === 'true';

// API Base URL 설정 (Mixed Content 해결)
const API_BASE_URL = '/api'; // Netlify Functions 프록시 사용

console.log('🔧 API Service 초기화 (Mixed Content 해결):', {
  isDevelopment,
  useBackendProxy,
  API_BASE_URL,
  env: import.meta.env.MODE
});

// 환경변수 디버깅
console.log('🔧 환경 변수 디버깅:', {
  VITE_USE_BACKEND_PROXY: import.meta.env.VITE_USE_BACKEND_PROXY,
  VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL ? 'SET' : 'NOT_SET',
  VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT_SET'
});

// Supabase 설정 (보안 강화)
console.log('🔧 Supabase 설정:', {
  url: import.meta.env.VITE_SUPABASE_URL || 'NOT_CONFIGURED',
  key: import.meta.env.VITE_SUPABASE_ANON_KEY ? 'CONFIGURED' : 'NOT_CONFIGURED'
});

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    
    console.log(`🌐 API 요청 (Netlify Functions 프록시): ${options.method || 'GET'} ${url}`);

    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ API 응답 성공: ${url}`, data);
      return data;
    } catch (error) {
      console.error(`❌ API 요청 실패 (${url}):`, error);
      throw new Error(`백엔드 서버에 연결할 수 없습니다. 서버가 실행 중인지 확인해주세요. (${this.baseURL})`);
    }
  }

  // 인증 관련 API
  async login(credentials) {
    return this.request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData) {
    return this.request('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getSession() {
    return this.request('/api/auth/session');
  }

  async logout() {
    return this.request('/api/auth/logout', {
      method: 'POST',
    });
  }

  // 거래 관련 API
  async getTrades() {
    return this.request('/api/trades');
  }

  async createTrade(tradeData) {
    return this.request('/api/trades', {
      method: 'POST',
      body: JSON.stringify(tradeData),
    });
  }

  // 포트폴리오 관련 API
  async getPortfolio() {
    return this.request('/api/portfolio');
  }

  // 시장 데이터 API
  async getMarketData() {
    return this.request('/api/market/data');
  }

  // 헬스 체크
  async healthCheck() {
    return this.request('/health');
  }

  // GET 요청
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' })
  }

  // POST 요청
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // PUT 요청
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // DELETE 요청
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }

  // 서버 기본 정보
  async getServerInfo() {
    return this.get('/')
  }

  // 시뮬레이션 모드 정보
  async getSimulationInfo() {
    return this.get('/api/simulation')
  }

  async getProfile(token) {
    return this.request('/api/auth/me', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  }

  // 관리자 API (향후 확장)
  async getAdminStats(token) {
    return this.request('/api/admin/stats', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  }

  async getUserList(token) {
    return this.request('/api/admin/users', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  }

  // 시스템 모니터링
  async getSystemLogs(token) {
    return this.request('/api/admin/logs', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
  }

  // KIS API 관련 메서드 추가
  async getKisStatus() {
    return this.get('/api/kis/status')
  }

  async testKisToken(appKey, appSecret, mockMode = true) {
    return this.post('/api/kis/token/test', {
      appKey,
      appSecret,
      mockMode
    })
  }

  async getStockPrice(symbol = '005930', mockMode = true) {
    return this.get(`/api/kis/stock/${symbol}/price?mock=${mockMode}`)
  }

  async testMockOrder(orderData = {}) {
    return this.post('/api/kis/test/mock-order', orderData)
  }

  async getAccountBalance(mockMode = true) {
    return this.get(`/api/kis/account/balance?mock=${mockMode}`)
  }

  async saveKisSettings(settings) {
    return this.post('/api/kis/save-settings', settings)
  }

  async loadKisSettings() {
    return this.get('/api/kis/load-settings')
  }

  // 텔레그램 API 관련 메서드 추가
  async validateTelegramToken(botToken) {
    return this.post('/api/telegram/validate-token', { botToken })
  }

  async sendTelegramTestMessage(botToken, chatId, customMessage = null) {
    return this.post('/api/telegram/send-test-message', {
      botToken,
      chatId,
      customMessage
    })
  }

  async sendTradingAlert(botToken, chatId, alertType, data) {
    return this.post('/api/telegram/send-trading-alert', {
      botToken,
      chatId,
      alertType,
      data
    })
  }
}

// 싱글톤 인스턴스 생성
const apiService = new ApiService();

// 개별 함수들 (기존 호환성 유지)
export const login = (credentials) => apiService.login(credentials);
export const register = (userData) => apiService.register(userData);
export const getSession = () => apiService.getSession();
export const logout = () => apiService.logout();
export const getTrades = () => apiService.getTrades();
export const createTrade = (tradeData) => apiService.createTrade(tradeData);
export const getPortfolio = () => apiService.getPortfolio();
export const getMarketData = () => apiService.getMarketData();
export const healthCheck = () => apiService.healthCheck();

export default apiService; 