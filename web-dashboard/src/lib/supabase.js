import { createClient } from '@supabase/supabase-js'

// Supabase 설정
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'YOUR_SUPABASE_URL'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'YOUR_SUPABASE_ANON_KEY'

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
})

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

// 유틸리티 함수들
export const supabaseHelpers = {
  // 사용자 프로필 조회
  async getUserProfile(userId) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select('*')
      .eq('id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  // 사용자 프로필 업데이트
  async updateUserProfile(userId, updates) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .update(updates)
      .eq('id', userId)
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 사용자의 초대 코드 조회
  async getUserReferralCode(userId) {
    const { data, error } = await supabase
      .from(TABLES.REFERRAL_CODES)
      .select('*')
      .eq('user_id', userId)
      .single()
    
    if (error) throw error
    return data
  },

  // 초대 코드로 사용자 찾기
  async findUserByReferralCode(code) {
    const { data, error } = await supabase
      .from(TABLES.REFERRAL_CODES)
      .select(`
        *,
        users:user_id (
          id,
          first_name,
          last_name,
          email,
          membership_type
        )
      `)
      .eq('code', code)
      .eq('is_active', true)
      .single()
    
    if (error) throw error
    return data
  },

  // 초대 보상 내역 조회
  async getReferralRewards(userId) {
    const { data, error } = await supabase
      .from(TABLES.REFERRAL_REWARDS)
      .select(`
        *,
        inviter:inviter_id (first_name, last_name, email),
        invitee:invitee_id (first_name, last_name, email)
      `)
      .or(`inviter_id.eq.${userId},invitee_id.eq.${userId}`)
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  // 활성 쿠폰 목록 조회
  async getActiveCoupons() {
    const { data, error } = await supabase
      .from(TABLES.COUPONS)
      .select('*')
      .eq('is_active', true)
      .eq('is_public', true)
      .lte('start_date', new Date().toISOString())
      .gte('end_date', new Date().toISOString())
      .order('priority', { ascending: false })
    
    if (error) throw error
    return data
  },

  // 쿠폰 사용
  async useCoupon(couponId, userId, originalAmount) {
    // 먼저 쿠폰 정보 조회
    const { data: coupon, error: couponError } = await supabase
      .from(TABLES.COUPONS)
      .select('*')
      .eq('id', couponId)
      .single()
    
    if (couponError) throw couponError

    // 할인 금액 계산 (간단한 로직)
    let discountAmount = 0
    if (coupon.discount_type === DISCOUNT_TYPES.PERCENTAGE) {
      discountAmount = originalAmount * (coupon.discount_value / 100)
    } else if (coupon.discount_type === DISCOUNT_TYPES.FIXED_AMOUNT) {
      discountAmount = Math.min(coupon.discount_value, originalAmount)
    }

    const finalAmount = Math.max(0, originalAmount - discountAmount)

    // 쿠폰 사용 기록 생성
    const { data, error } = await supabase
      .from(TABLES.COUPON_USAGES)
      .insert({
        coupon_id: couponId,
        user_id: userId,
        original_amount: originalAmount,
        discount_amount: discountAmount,
        final_amount: finalAmount,
        status: 'applied'
      })
      .select()
      .single()
    
    if (error) throw error

    // 쿠폰 사용 횟수 증가
    await supabase
      .from(TABLES.COUPONS)
      .update({ 
        used_count: coupon.used_count + 1,
        total_savings: coupon.total_savings + discountAmount
      })
      .eq('id', couponId)

    return data
  },

  // 사용자 거래 기록 조회
  async getUserTrades(userId, tradeType = null, limit = 50) {
    let query = supabase
      .from(TABLES.TRADE_RECORDS)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit)
    
    if (tradeType) {
      query = query.eq('trade_type', tradeType)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data
  },

  // 거래 기록 생성
  async createTradeRecord(userId, tradeData) {
    const { data, error } = await supabase
      .from(TABLES.TRADE_RECORDS)
      .insert({
        user_id: userId,
        ...tradeData
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // 일일 거래 횟수 확인 및 업데이트
  async checkAndUpdateDailyTradeCount(userId) {
    const { data: user, error } = await supabase
      .from(TABLES.USERS)
      .select('daily_trade_count, daily_trade_reset_date, membership_type, free_trial_end_date')
      .eq('id', userId)
      .single()
    
    if (error) throw error

    const today = new Date().toISOString().split('T')[0]
    let newTradeCount = user.daily_trade_count

    // 날짜가 바뀌었으면 카운트 리셋
    if (user.daily_trade_reset_date !== today) {
      newTradeCount = 0
      await supabase
        .from(TABLES.USERS)
        .update({
          daily_trade_count: 0,
          daily_trade_reset_date: today
        })
        .eq('id', userId)
    }

    // 거래 가능 여부 체크
    const canTrade = this.checkTradingPermission(user, newTradeCount)
    
    return {
      canTrade: canTrade.allowed,
      reason: canTrade.reason,
      currentCount: newTradeCount,
      membershipType: user.membership_type
    }
  },

  // 거래 권한 체크
  checkTradingPermission(user, currentTradeCount) {
    const now = new Date()
    const trialEndDate = user.free_trial_end_date ? new Date(user.free_trial_end_date) : null
    
    // 회원 타입별 권한 체크
    switch (user.membership_type) {
      case MEMBERSHIP_TYPES.LIFETIME:
        return { canTrade: true, reason: 'lifetime_member' }
      
      case MEMBERSHIP_TYPES.PREMIUM:
        return { canTrade: true, reason: 'premium_member' }
      
      case MEMBERSHIP_TYPES.FREE:
        if (trialEndDate && now <= trialEndDate) {
          if (currentTradeCount >= 3) {
            return { 
              canTrade: false, 
              reason: 'daily_limit_exceeded',
              message: '무료 체험 중 일일 거래 한도(3회)를 초과했습니다.'
            }
          }
          return { canTrade: true, reason: 'free_trial' }
        } else {
          return { 
            canTrade: false, 
            reason: 'trial_expired',
            message: '무료 체험이 만료되었습니다. 프리미엄으로 업그레이드하세요.'
          }
        }
      
      case MEMBERSHIP_TYPES.GUEST:
      default:
        return { 
          canTrade: false, 
          reason: 'not_authenticated',
          message: '로그인이 필요합니다.'
        }
    }
  },

  // 한국투자증권 API 키 저장
  async saveKISApiKeys(userId, apiKeyData) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .update({
        kis_real_app_key: apiKeyData.realAppKey || null,
        kis_real_app_secret: apiKeyData.realAppSecret || null,
        kis_real_account: apiKeyData.realAccount || null,
        kis_demo_app_key: apiKeyData.demoAppKey || null,
        kis_demo_app_secret: apiKeyData.demoAppSecret || null,
        kis_demo_account: apiKeyData.demoAccount || null,
        kis_mock_mode: apiKeyData.mockMode !== undefined ? apiKeyData.mockMode : true,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('kis_real_app_key, kis_demo_app_key, kis_mock_mode')
      .single()
    
    if (error) throw error
    return data
  },

  // 한국투자증권 API 키 조회
  async getKISApiKeys(userId) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select(`
        kis_real_app_key,
        kis_real_app_secret,
        kis_real_account,
        kis_demo_app_key,
        kis_demo_app_secret,
        kis_demo_account,
        kis_mock_mode
      `)
      .eq('id', userId)
      .single()
    
    if (error) throw error
    
    // 보안을 위해 키 마스킹
    if (data) {
      const maskKey = (key) => {
        if (!key) return ''
        return key.slice(0, 4) + '*'.repeat(Math.max(0, key.length - 8)) + key.slice(-4)
      }
      
      return {
        ...data,
        kis_real_app_key: maskKey(data.kis_real_app_key),
        kis_real_app_secret: maskKey(data.kis_real_app_secret),
        kis_demo_app_key: maskKey(data.kis_demo_app_key),
        kis_demo_app_secret: maskKey(data.kis_demo_app_secret)
      }
    }
    
    return data
  },

  // 텔레그램 설정 저장
  async saveTelegramSettings(userId, telegramData) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .update({
        telegram_chat_id: telegramData.chatId || null,
        telegram_username: telegramData.username || null,
        notification_telegram: telegramData.enabled !== undefined ? telegramData.enabled : false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('telegram_chat_id, telegram_username, notification_telegram')
      .single()
    
    if (error) throw error
    return data
  },

  // OpenAI API 키 저장
  async saveOpenAISettings(userId, openaiData) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .update({
        openai_api_key: openaiData.apiKey || null,
        openai_model: openaiData.model || 'gpt-4o-mini',
        ai_learning_enabled: openaiData.learningEnabled !== undefined ? openaiData.learningEnabled : false,
        ai_strategy_level: openaiData.strategyLevel || 'basic',
        ai_risk_tolerance: openaiData.riskTolerance || 0.5,
        ai_learning_data_consent: openaiData.dataConsent !== undefined ? openaiData.dataConsent : false,
        selected_strategy: openaiData.selectedStrategy || 'traditional',
        strategy_auto_switch: openaiData.strategyAutoSwitch !== undefined ? openaiData.strategyAutoSwitch : false,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)
      .select('openai_api_key, openai_model, ai_learning_enabled, ai_strategy_level, ai_risk_tolerance, selected_strategy, strategy_auto_switch')
      .single()
    
    if (error) throw error
    return data
  },

  // OpenAI API 키 조회 (마스킹 처리)
  async getOpenAISettings(userId) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select(`
        openai_api_key,
        openai_model,
        ai_learning_enabled,
        ai_strategy_level,
        ai_risk_tolerance,
        ai_learning_data_consent,
        selected_strategy,
        strategy_auto_switch
      `)
      .eq('id', userId)
      .single()
    
    if (error) throw error
    
    // 보안을 위해 키 마스킹
    if (data && data.openai_api_key) {
      const maskKey = (key) => {
        if (!key) return ''
        return key.slice(0, 7) + '*'.repeat(Math.max(0, key.length - 14)) + key.slice(-7)
      }
      
      return {
        ...data,
        openai_api_key: maskKey(data.openai_api_key)
      }
    }
    
    return data
  },

  // AI 학습 데이터 저장 (전략 타입 포함)
  async saveAILearningData(userId, learningData) {
    const { data, error } = await supabase
      .from(TABLES.AI_LEARNING_DATA)
      .insert({
        user_id: userId,
        symbol: learningData.symbol,
        timeframe: learningData.timeframe || '1m',
        market_data: learningData.marketData,
        action: learningData.action,
        confidence_score: learningData.confidenceScore,
        reasoning: learningData.reasoning,
        entry_price: learningData.entryPrice,
        exit_price: learningData.exitPrice,
        profit_loss: learningData.profitLoss,
        success: learningData.success,
        model_version: learningData.modelVersion || 'v1.0',
        strategy_name: learningData.strategyName || 'christmas_ai_v1',
        strategy_type: learningData.strategyType || 'traditional',
        learning_phase: learningData.learningPhase || 'training',
        feedback_score: learningData.feedbackScore,
        user_feedback: learningData.userFeedback
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // AI 학습 데이터 조회 (전략 타입 필터 추가)
  async getAILearningData(userId, options = {}) {
    let query = supabase
      .from(TABLES.AI_LEARNING_DATA)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
    
    if (options.symbol) {
      query = query.eq('symbol', options.symbol)
    }
    
    if (options.timeframe) {
      query = query.eq('timeframe', options.timeframe)
    }
    
    if (options.learningPhase) {
      query = query.eq('learning_phase', options.learningPhase)
    }
    
    if (options.strategyType) {
      query = query.eq('strategy_type', options.strategyType)
    }
    
    if (options.limit) {
      query = query.limit(options.limit)
    }
    
    const { data, error } = await query
    if (error) throw error
    return data
  },

  // AI 전략 성과 업데이트 (전략 타입 포함)
  async updateAIStrategyPerformance(userId, performanceData) {
    const { data, error } = await supabase
      .from(TABLES.AI_STRATEGY_PERFORMANCE)
      .upsert({
        user_id: userId,
        strategy_name: performanceData.strategyName || 'christmas_ai_v1',
        strategy_version: performanceData.strategyVersion || 'v1.0',
        strategy_type: performanceData.strategyType || 'traditional',
        total_trades: performanceData.totalTrades || 0,
        winning_trades: performanceData.winningTrades || 0,
        losing_trades: performanceData.losingTrades || 0,
        win_rate: performanceData.winRate || 0.0,
        total_profit_loss: performanceData.totalProfitLoss || 0.0,
        max_drawdown: performanceData.maxDrawdown || 0.0,
        sharpe_ratio: performanceData.sharpeRatio || 0.0,
        daily_return: performanceData.dailyReturn || 0.0,
        weekly_return: performanceData.weeklyReturn || 0.0,
        monthly_return: performanceData.monthlyReturn || 0.0,
        learning_iterations: performanceData.learningIterations || 0,
        model_accuracy: performanceData.modelAccuracy || 0.0,
        prediction_confidence: performanceData.predictionConfidence || 0.0,
        max_position_size: performanceData.maxPositionSize || 0.1,
        current_drawdown: performanceData.currentDrawdown || 0.0,
        risk_adjusted_return: performanceData.riskAdjustedReturn || 0.0,
        evaluation_period_start: performanceData.evaluationPeriodStart,
        evaluation_period_end: performanceData.evaluationPeriodEnd,
        last_updated: new Date().toISOString()
      }, {
        onConflict: 'user_id,strategy_name,strategy_version,strategy_type'
      })
      .select()
      .single()
    
    if (error) throw error
    return data
  },

  // AI 전략 성과 조회 (전략 타입별)
  async getAIStrategyPerformance(userId, strategyName = 'christmas_ai_v1', strategyType = null) {
    let query = supabase
      .from(TABLES.AI_STRATEGY_PERFORMANCE)
      .select('*')
      .eq('user_id', userId)
      .eq('strategy_name', strategyName)
      .order('created_at', { ascending: false })
    
    if (strategyType) {
      query = query.eq('strategy_type', strategyType)
    }
    
    const { data, error } = await query.limit(1).single()
    
    if (error && error.code !== 'PGRST116') throw error // PGRST116 = no rows found
    return data
  },

  // 전략별 성과 비교 조회
  async getStrategyComparison(userId) {
    const { data, error } = await supabase
      .from(TABLES.AI_STRATEGY_PERFORMANCE)
      .select('*')
      .eq('user_id', userId)
      .in('strategy_type', ['traditional', 'ai_learning'])
      .order('strategy_type', { ascending: true })
    
    if (error) throw error
    
    // 전략별로 그룹화
    const comparison = {
      traditional: null,
      ai_learning: null
    }
    
    data.forEach(item => {
      if (item.strategy_type === 'traditional') {
        comparison.traditional = item
      } else if (item.strategy_type === 'ai_learning') {
        comparison.ai_learning = item
      }
    })
    
    return comparison
  },

  // 사용자의 모든 API 설정 조회 (기존 함수 확장)
  async getUserApiSettings(userId) {
    const { data, error } = await supabase
      .from(TABLES.USERS)
      .select(`
        kis_real_app_key,
        kis_real_app_secret,
        kis_real_account,
        kis_demo_app_key,
        kis_demo_app_secret,
        kis_demo_account,
        kis_mock_mode,
        telegram_chat_id,
        telegram_username,
        notification_telegram,
        notification_email,
        notification_push,
        openai_api_key,
        openai_model,
        ai_learning_enabled,
        ai_strategy_level,
        ai_risk_tolerance,
        ai_learning_data_consent,
        selected_strategy,
        strategy_auto_switch
      `)
      .eq('id', userId)
      .single()
    
    if (error) throw error
    
    // 키 마스킹 처리
    if (data) {
      const maskKey = (key) => {
        if (!key) return ''
        return key.slice(0, 4) + '*'.repeat(Math.max(0, key.length - 8)) + key.slice(-4)
      }

      const maskOpenAIKey = (key) => {
        if (!key) return ''
        return key.slice(0, 7) + '*'.repeat(Math.max(0, key.length - 14)) + key.slice(-7)
      }
      
      return {
        ...data,
        kis_real_app_key: maskKey(data.kis_real_app_key),
        kis_real_app_secret: maskKey(data.kis_real_app_secret),
        kis_demo_app_key: maskKey(data.kis_demo_app_key),
        kis_demo_app_secret: maskKey(data.kis_demo_app_secret),
        openai_api_key: maskOpenAIKey(data.openai_api_key)
      }
    }
    
    return data
  },

  // AI 학습 통계 조회 (전략별 분리)
  async getAILearningStats(userId, strategyType = null) {
    let query = supabase
      .from(TABLES.AI_LEARNING_DATA)
      .select(`
        learning_phase,
        success,
        profit_loss,
        confidence_score,
        strategy_type,
        created_at
      `)
      .eq('user_id', userId)
    
    if (strategyType) {
      query = query.eq('strategy_type', strategyType)
    }
    
    const { data, error } = await query
    
    if (error) throw error
    
    // 통계 계산
    const stats = {
      totalRecords: data.length,
      trainingRecords: data.filter(d => d.learning_phase === 'training').length,
      validationRecords: data.filter(d => d.learning_phase === 'validation').length,
      productionRecords: data.filter(d => d.learning_phase === 'production').length,
      successfulTrades: data.filter(d => d.success === true).length,
      totalProfitLoss: data.reduce((sum, d) => sum + (d.profit_loss || 0), 0),
      avgConfidence: data.length > 0 ? data.reduce((sum, d) => sum + (d.confidence_score || 0), 0) / data.length : 0,
      lastLearningDate: data.length > 0 ? data[0].created_at : null,
      // 전략별 분석
      byStrategy: {
        traditional: data.filter(d => d.strategy_type === 'traditional').length,
        ai_learning: data.filter(d => d.strategy_type === 'ai_learning').length,
        hybrid: data.filter(d => d.strategy_type === 'hybrid').length
      }
    }
    
    return stats
  }
}

export default supabase 