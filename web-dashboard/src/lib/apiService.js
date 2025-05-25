/**
 * Christmas Trading Backend API Service
 * 백엔드 서버와의 연동을 위한 API 서비스
 */

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000'

class ApiService {
  constructor() {
    this.baseURL = API_BASE_URL
  }

  // 기본 fetch 래퍼
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`
    
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      }
    }

    const config = {
      ...defaultOptions,
      ...options
    }

    try {
      console.log(`🌐 API 요청: ${config.method || 'GET'} ${url}`)
      
      const response = await fetch(url, config)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data = await response.json()
      console.log(`✅ API 응답 성공:`, data)
      
      return data
    } catch (error) {
      console.error(`❌ API 요청 실패 (${url}):`, error)
      throw error
    }
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

  // 서버 상태 확인
  async getHealth() {
    return this.get('/health')
  }

  // 서버 기본 정보
  async getServerInfo() {
    return this.get('/')
  }

  // 시뮬레이션 모드 정보
  async getSimulationInfo() {
    return this.get('/api/simulation')
  }

  // 인증 관련 API
  async login(credentials) {
    return this.post('/api/auth/login', credentials)
  }

  async signup(userData) {
    return this.post('/api/auth/signup', userData)
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
}

// 싱글톤 인스턴스
const apiService = new ApiService()

export default apiService

// 개별 함수로도 export
export const {
  get,
  post,
  put,
  delete: deleteRequest,
  getHealth,
  getServerInfo,
  getSimulationInfo,
  login,
  signup,
  getProfile,
  getAdminStats,
  getUserList,
  getSystemLogs
} = apiService 