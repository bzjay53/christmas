import { createClient } from '@supabase/supabase-js'
import apiService from './apiService'

// 🚨 보안 강화: Supabase 키 완전 제거
// 모든 데이터베이스 요청은 백엔드 프록시를 통해서만 처리

console.log('🔧 환경 변수 디버깅:', {
  VITE_API_BASE_URL: import.meta.env.VITE_API_BASE_URL,
  VITE_SUPABASE_URL: 'REMOVED_FOR_SECURITY',
  VITE_SUPABASE_ANON_KEY: 'REMOVED_FOR_SECURITY',
  finalUrl: 'BACKEND_PROXY_ONLY',
  finalKey: 'BACKEND_PROXY_ONLY'
})

// 보안 설정
const hasValidConfig = true // 백엔드 프록시 사용
const bypassAuth = false
const isDemoModeOnly = false

console.log('🔧 Supabase 설정:', { 
  url: 'BACKEND_PROXY_ONLY', 
  hasValidConfig: hasValidConfig,
  bypassAuth,
  enableDemo: import.meta.env.VITE_ENABLE_DEMO_MODE === 'true'
})

// 🚫 Supabase 직접 클라이언트 제거 - 보안을 위해 null로 설정
export const supabase = null

// 설정 플래그들 export
export const isSupabaseEnabled = false // 직접 연결 비활성화
export const isAuthBypass = bypassAuth
export const isDemoMode = import.meta.env.VITE_ENABLE_DEMO_MODE === 'true'

// 데이터베이스 테이블 타입 정의
export const TABLES = {
  USERS: 'users',
  REFERRAL_CODES: 'referral_codes',
  REFERRAL_REWARDS: 'referral_rewards',
  COUPONS: 'coupons',
  COUPON_USAGES: 'coupon_usages',
  TRADE_RECORDS: 'trade_records',
  AI_LEARNING_DATA: 'ai_learning_data',
  AI_STRATEGY_PERFORMANCE: 'ai_strategy_performance'
}

// 회원 등급 상수
export const MEMBERSHIP_TYPES = {
  GUEST: 'guest',
  FREE: 'free',
  PREMIUM: 'premium',
  LIFETIME: 'lifetime'
}

// 거래 타입 상수
export const TRADE_TYPES = {
  DEMO: 'demo',
  REAL: 'real'
}

// 쿠폰 타입 상수
export const COUPON_TYPES = {
  SUBSCRIPTION_DISCOUNT: 'subscription_discount',
  COMMISSION_DISCOUNT: 'commission_discount',
  FREE_TRIAL_EXTENSION: 'free_trial_extension',
  PREMIUM_UPGRADE: 'premium_upgrade',
  LIFETIME_DISCOUNT: 'lifetime_discount'
}

// 할인 타입 상수
export const DISCOUNT_TYPES = {
  PERCENTAGE: 'percentage',
  FIXED_AMOUNT: 'fixed_amount',
  FREE_PERIOD: 'free_period'
}

// 🔒 보안 강화: 모든 DB 요청을 백엔드 프록시로 변경
export const supabaseHelpers = {
  // 사용자 프로필 조회 - 백엔드 프록시 사용
  async getUserProfile(userId) {
    try {
      const response = await apiService.request(`/api/users/profile/${userId}`)
      return response.data
    } catch (error) {
      console.error('❌ 사용자 프로필 조회 실패:', error)
      throw error
    }
  },

  // 사용자 프로필 업데이트 - 백엔드 프록시 사용
  async updateUserProfile(userId, updates) {
    try {
      const response = await apiService.request(`/api/users/profile/${userId}`, {
        method: 'PUT',
        data: updates
      })
      return response.data
    } catch (error) {
      console.error('❌ 사용자 프로필 업데이트 실패:', error)
      throw error
    }
  },

  // 사용자의 초대 코드 조회 - 백엔드 프록시 사용
  async getUserReferralCode(userId) {
    try {
      const response = await apiService.request(`/api/users/${userId}/referral-code`)
      return response.data
    } catch (error) {
      console.error('❌ 초대 코드 조회 실패:', error)
      throw error
    }
  },

  // 거래 기록 생성 - 백엔드 프록시 사용
  async createTradeRecord(userId, tradeData) {
    try {
      const response = await apiService.request('/api/trades', {
        method: 'POST',
        data: {
          user_id: userId,
          ...tradeData
        }
      })
      return response.data
    } catch (error) {
      console.error('❌ 거래 기록 생성 실패:', error)
      throw error
    }
  },

  // 한국투자증권 API 키 저장 - 백엔드 프록시 사용
  async saveKISApiKeys(userId, apiKeyData) {
    try {
      const response = await apiService.request('/api/kis/save-settings', {
        method: 'POST',
        data: {
          userId,
          ...apiKeyData
        }
      })
      return response.data
    } catch (error) {
      console.error('❌ KIS API 키 저장 실패:', error)
      throw error
    }
  },

  // 한국투자증권 API 키 조회 - 백엔드 프록시 사용
  async getKISApiKeys(userId) {
    try {
      const response = await apiService.request('/api/kis/load-settings', {
        method: 'GET',
        params: { userId }
      })
      return response.data
    } catch (error) {
      console.error('❌ KIS API 키 조회 실패:', error)
      throw error
    }
  },

  // OpenAI API 키 저장 - 백엔드 프록시 사용
  async saveOpenAISettings(userId, openaiData) {
    try {
      const response = await apiService.request('/api/openai/save-settings', {
        method: 'POST',
        data: {
          userId,
          ...openaiData
        }
      })
      return response.data
    } catch (error) {
      console.error('❌ OpenAI 설정 저장 실패:', error)
      throw error
    }
  },

  // OpenAI 설정 조회 - 백엔드 프록시 사용
  async getOpenAISettings(userId) {
    try {
      const response = await apiService.request('/api/openai/load-settings', {
        method: 'GET',
        params: { userId }
      })
      return response.data
    } catch (error) {
      console.error('❌ OpenAI 설정 조회 실패:', error)
      throw error
    }
  },

  // AI 학습 데이터 저장 - 백엔드 프록시 사용
  async saveAILearningData(userId, learningData) {
    try {
      const response = await apiService.request('/api/ai/learning-data', {
        method: 'POST',
        data: {
          user_id: userId,
          ...learningData
        }
      })
      return response.data
    } catch (error) {
      console.error('❌ AI 학습 데이터 저장 실패:', error)
      throw error
    }
  },

  // AI 전략 성과 업데이트 - 백엔드 프록시 사용
  async updateAIStrategyPerformance(userId, performanceData) {
    try {
      const response = await apiService.request('/api/ai/strategy-performance', {
        method: 'POST',
        data: {
          user_id: userId,
          ...performanceData
        }
      })
      return response.data
    } catch (error) {
      console.error('❌ AI 전략 성과 업데이트 실패:', error)
      throw error
    }
  },

  // AI 전략 성과 조회 - 백엔드 프록시 사용
  async getAIStrategyPerformance(userId, strategyName = 'christmas_ai_v1', strategyType = null) {
    try {
      const response = await apiService.request('/api/ai/strategy-performance', {
        method: 'GET',
        params: {
          userId,
          strategyName,
          strategyType
        }
      })
      return response.data
    } catch (error) {
      console.error('❌ AI 전략 성과 조회 실패:', error)
      throw error
    }
  }
}

// 🔒 보안 강화: 인증 시스템도 백엔드 프록시로 변경
export const authHelpers = {
  // 회원가입 - 백엔드 프록시 사용
  async signUp(email, password, userData = {}) {
    try {
      const response = await apiService.request('/api/auth/signup', {
        method: 'POST',
        data: {
          email,
          password,
          userData
        }
      })
      return response.data
    } catch (error) {
      console.error('❌ 회원가입 실패:', error)
      throw error
    }
  },

  // 로그인 - 백엔드 프록시 사용
  async signIn(email, password) {
    try {
      const response = await apiService.request('/api/auth/signin', {
        method: 'POST',
        data: {
          email,
          password
        }
      })
      return response.data
    } catch (error) {
      console.error('❌ 로그인 실패:', error)
      throw error
    }
  },

  // 로그아웃 - 백엔드 프록시 사용
  async signOut() {
    try {
      const response = await apiService.request('/api/auth/signout', {
        method: 'POST'
      })
      return response.data
    } catch (error) {
      console.error('❌ 로그아웃 실패:', error)
      throw error
    }
  },

  // 세션 확인 - 백엔드 프록시 사용
  async getSession() {
    try {
      const response = await apiService.request('/api/auth/session')
      return response.data
    } catch (error) {
      console.error('❌ 세션 확인 실패:', error)
      throw error
    }
  }
}

export default null // Supabase 직접 클라이언트 제거 