/**
 * Christmas Trading Backend API Service
 * 백엔드 서버와의 연동을 위한 API 서비스
 */

// 🔗 Christmas Trading - API Service
// Phase 1-C: Mixed Content 해결 - Netlify Functions 프록시 복원

// API Base URL 설정 (Netlify 프록시 의존)
const API_BASE_URL = ''; // VITE_API_BASE_URL 사용 안함. Netlify 프록시가 /api/*를 처리

console.log('🔧 API Service 초기화 (Netlify 프록시 의존):', {
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
    this.baseURL = API_BASE_URL; // 이제 baseURL은 '' (빈 문자열)
  }

  async request(endpoint, options = {}) {
    // endpoint는 '/api/auth/session'과 같이 반드시 '/api/'로 시작해야 함
    // baseURL이 빈 문자열이므로, url은 endpoint 자체가 됨 (예: '/api/auth/session')
    const url = `${this.baseURL}${endpoint}`; 
    console.log(`🌐 API 요청 (Netlify 프록시): ${options.method || 'GET'} ${url}`);
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
      throw new Error(`백엔드 서버에 연결할 수 없습니다. (${this.baseURL})`);
    }
  }

  // 인증 관련 API
  async login(credentials) {
    return this.request('/api/auth/login', { // endpoint가 '/api/'로 시작
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData) {
    return this.request('/api/auth/register', { // endpoint가 '/api/'로 시작
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getSession() {
    return this.request('/api/auth/session'); // endpoint가 '/api/'로 시작
  }

  async logout() {
    return this.request('/api/auth/logout', { // endpoint가 '/api/'로 시작
      method: 'POST',
    });
  }

  // 거래 관련 API
  async getTrades() {
    return this.request('/api/trades'); // endpoint가 '/api/'로 시작
  }

  async createTrade(tradeData) {
    return this.request('/api/trades', { // endpoint가 '/api/'로 시작
      method: 'POST',
      body: JSON.stringify(tradeData),
    });
  }

  // 포트폴리오 관련 API
  async getPortfolio() {
    return this.request('/api/portfolio'); // endpoint가 '/api/'로 시작
  }

  // 시장 데이터 API
  async getMarketData() {
    return this.request('/api/market/data'); // endpoint가 '/api/'로 시작
  }

  // 헬스 체크
  async healthCheck() {
    return this.request('/api/health'); // endpoint가 '/api/'로 시작
  }

  // GET 요청 (endpoint는 /api/로 시작하는 전체 경로여야 함)
  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' })
  }

  // POST 요청 (endpoint는 /api/로 시작하는 전체 경로여야 함)
  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  // PUT 요청 (endpoint는 /api/로 시작하는 전체 경로여야 함)
  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  // DELETE 요청 (endpoint는 /api/로 시작하는 전체 경로여야 함)
  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' })
  }

  // 서버 기본 정보 - 이 엔드포인트는 백엔드에 /api/가 아닌 루트에 있으므로 주의
  // 하지만 Netlify 프록시는 /api/* 만 처리하므로 이 호출은 실패할 수 있음.
  // 필요하다면 Netlify에 루트 경로 프록시도 추가해야 함.
  // 여기서는 일단 /api/로 맞춤 (백엔드가 /api/를 기본으로 갖도록 수정하는 것이 더 나을 수 있음)
  async getServerInfo() {
    return this.get('/api/') // 백엔드 루트 '/' 대신 '/api/'로 요청 (Nginx가 받아서 백엔드 '/'로 전달 가정)
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

  // 관리자 API
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

  // KIS API
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

  // 텔레그램 API
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
export const get = (endpoint) => apiService.get(endpoint);
export const post = (endpoint, data) => apiService.post(endpoint, data);
export const put = (endpoint, data) => apiService.put(endpoint, data);
export const deleteRequest = (endpoint) => apiService.delete(endpoint); // delete는 예약어라 변경
export const getServerInfo = () => apiService.getServerInfo();
export const getSimulationInfo = () => apiService.getSimulationInfo();
export const getProfile = (token) => apiService.getProfile(token);
export const getAdminStats = (token) => apiService.getAdminStats(token);
export const getUserList = (token) => apiService.getUserList(token);
export const getSystemLogs = (token) => apiService.getSystemLogs(token);
export const getKisStatus = () => apiService.getKisStatus();
export const testKisToken = (appKey, appSecret, mockMode) => apiService.testKisToken(appKey, appSecret, mockMode);
export const getStockPrice = (symbol, mockMode) => apiService.getStockPrice(symbol, mockMode);
export const testMockOrder = (orderData) => apiService.testMockOrder(orderData);
export const getAccountBalance = (mockMode) => apiService.getAccountBalance(mockMode);
export const saveKisSettings = (settings) => apiService.saveKisSettings(settings);
export const loadKisSettings = () => apiService.loadKisSettings();
export const validateTelegramToken = (botToken) => apiService.validateTelegramToken(botToken);
export const sendTelegramTestMessage = (botToken, chatId, customMessage) => apiService.sendTelegramTestMessage(botToken, chatId, customMessage);
export const sendTradingAlert = (botToken, chatId, alertType, data) => apiService.sendTradingAlert(botToken, chatId, alertType, data);

export default apiService; 