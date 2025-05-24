// Christmas Trading: 매매 전략 엔진
// RSI, MACD, 볼린저 밴드 기반 + AI 학습 시스템

import { OpenAIServiceFactory } from './openaiService.js'

// 기술적 지표 계산 함수들
export class TechnicalIndicators {
  // RSI 계산 (상대강도지수)
  static calculateRSI(prices, period = 14) {
    if (prices.length < period + 1) return null
    
    let gains = 0
    let losses = 0
    
    // 첫 번째 기간의 평균 계산
    for (let i = 1; i <= period; i++) {
      const change = prices[i] - prices[i - 1]
      if (change > 0) gains += change
      else losses -= change
    }
    
    let avgGain = gains / period
    let avgLoss = losses / period
    
    // 이후 기간의 RSI 계산 (Smoothed moving average)
    const rsiValues = []
    for (let i = period + 1; i < prices.length; i++) {
      const change = prices[i] - prices[i - 1]
      const gain = change > 0 ? change : 0
      const loss = change < 0 ? -change : 0
      
      avgGain = (avgGain * (period - 1) + gain) / period
      avgLoss = (avgLoss * (period - 1) + loss) / period
      
      const rs = avgGain / avgLoss
      const rsi = 100 - (100 / (1 + rs))
      
      rsiValues.push({
        timestamp: i,
        value: rsi,
        signal: rsi > 70 ? 'overbought' : rsi < 30 ? 'oversold' : 'neutral'
      })
    }
    
    return rsiValues
  }

  // MACD 계산 (이동평균수렴확산)
  static calculateMACD(prices, fast = 12, slow = 26, signal = 9) {
    if (prices.length < slow + signal) return null
    
    // EMA 계산 함수
    const calculateEMA = (data, period) => {
      const multiplier = 2 / (period + 1)
      let ema = data[0]
      const emaValues = [ema]
      
      for (let i = 1; i < data.length; i++) {
        ema = (data[i] * multiplier) + (ema * (1 - multiplier))
        emaValues.push(ema)
      }
      
      return emaValues
    }
    
    const fastEMA = calculateEMA(prices, fast)
    const slowEMA = calculateEMA(prices, slow)
    
    // MACD Line 계산
    const macdLine = []
    for (let i = 0; i < Math.min(fastEMA.length, slowEMA.length); i++) {
      macdLine.push(fastEMA[i] - slowEMA[i])
    }
    
    // Signal Line 계산
    const signalLine = calculateEMA(macdLine, signal)
    
    // Histogram 계산
    const macdValues = []
    for (let i = signal - 1; i < macdLine.length; i++) {
      const histogram = macdLine[i] - signalLine[i]
      const macdCurrent = macdLine[i]
      const signalCurrent = signalLine[i]
      
      macdValues.push({
        timestamp: i,
        macd: macdCurrent,
        signal: signalCurrent,
        histogram: histogram,
        trend: macdCurrent > signalCurrent ? 'bullish' : 'bearish',
        momentum: histogram > 0 ? 'positive' : 'negative'
      })
    }
    
    return macdValues
  }

  // 볼린저 밴드 계산
  static calculateBollingerBands(prices, period = 20, stdDev = 2) {
    if (prices.length < period) return null
    
    const bollingerValues = []
    
    for (let i = period - 1; i < prices.length; i++) {
      const slice = prices.slice(i - period + 1, i + 1)
      const sma = slice.reduce((sum, price) => sum + price, 0) / period
      
      // 표준편차 계산
      const variance = slice.reduce((sum, price) => sum + Math.pow(price - sma, 2), 0) / period
      const standardDeviation = Math.sqrt(variance)
      
      const upperBand = sma + (standardDeviation * stdDev)
      const lowerBand = sma - (standardDeviation * stdDev)
      const currentPrice = prices[i]
      
      // 밴드 내 위치 계산 (0-1 범위)
      const bandPosition = (currentPrice - lowerBand) / (upperBand - lowerBand)
      
      bollingerValues.push({
        timestamp: i,
        price: currentPrice,
        sma: sma,
        upperBand: upperBand,
        lowerBand: lowerBand,
        bandWidth: (upperBand - lowerBand) / sma, // 변동성 지표
        bandPosition: bandPosition,
        signal: bandPosition > 0.8 ? 'near_upper' : 
               bandPosition < 0.2 ? 'near_lower' : 'middle'
      })
    }
    
    return bollingerValues
  }

  // 통합 지표 분석
  static analyzeAllIndicators(prices, options = {}) {
    const {
      rsiPeriod = 14,
      macdFast = 12,
      macdSlow = 26,
      macdSignal = 9,
      bbPeriod = 20,
      bbStdDev = 2
    } = options
    
    const rsi = this.calculateRSI(prices, rsiPeriod)
    const macd = this.calculateMACD(prices, macdFast, macdSlow, macdSignal)
    const bb = this.calculateBollingerBands(prices, bbPeriod, bbStdDev)
    
    return { rsi, macd, bb }
  }
}

// Christmas AI 매매 전략 클래스
export class ChristmasAIStrategy {
  constructor(options = {}) {
    this.strategyType = options.strategyType || 'traditional' // 'traditional' or 'ai_learning'
    this.riskTolerance = options.riskTolerance || 0.5
    this.learningEnabled = options.learningEnabled || false
    this.indicators = options.indicators || {
      rsi: { enabled: true, period: 14, overbought: 70, oversold: 30 },
      macd: { enabled: true, fast: 12, slow: 26, signal: 9 },
      bb: { enabled: true, period: 20, stdDev: 2 }
    }
    
    // OpenAI 설정
    this.openaiApiKey = options.openaiApiKey || null
    this.openaiModel = options.openaiModel || 'gpt-4o-mini'
    this.strategyLevel = options.strategyLevel || 'basic'
    
    // 성과 추적
    this.performanceHistory = []
    this.lastAnalysisTime = null
    this.analysisCount = 0
  }

  // 전통적 매매 신호 생성
  generateTraditionalSignal(marketData) {
    const { prices, volume, timestamp } = marketData
    const indicators = TechnicalIndicators.analyzeAllIndicators(prices, this.indicators)
    
    if (!indicators.rsi || !indicators.macd || !indicators.bb) {
      return { action: 'hold', confidence: 0, reasoning: 'Insufficient data' }
    }
    
    // 최신 지표 값들 추출
    const latestRSI = indicators.rsi[indicators.rsi.length - 1]
    const latestMACD = indicators.macd[indicators.macd.length - 1]
    const latestBB = indicators.bb[indicators.bb.length - 1]
    
    // 매수 신호 조건
    const buyConditions = [
      latestRSI.signal === 'oversold', // RSI 과매도
      latestMACD.trend === 'bullish' && latestMACD.momentum === 'positive', // MACD 상승 모멘텀
      latestBB.signal === 'near_lower' && latestBB.bandPosition < 0.3 // 볼린저 밴드 하단 근처
    ]
    
    // 매도 신호 조건
    const sellConditions = [
      latestRSI.signal === 'overbought', // RSI 과매수
      latestMACD.trend === 'bearish' && latestMACD.momentum === 'negative', // MACD 하락 모멘텀
      latestBB.signal === 'near_upper' && latestBB.bandPosition > 0.7 // 볼린저 밴드 상단 근처
    ]
    
    const buyScore = buyConditions.filter(Boolean).length
    const sellScore = sellConditions.filter(Boolean).length
    
    // 신호 결정 및 신뢰도 계산
    let action = 'hold'
    let confidence = 0
    let reasoning = ''
    
    if (buyScore >= 2) {
      action = 'buy'
      confidence = Math.min(buyScore / 3 * 0.8, 0.9) // 최대 90% 신뢰도
      reasoning = `매수 신호: ${buyConditions.filter(Boolean).length}/3 조건 만족 (RSI: ${latestRSI.value.toFixed(2)}, MACD 추세: ${latestMACD.trend})`
    } else if (sellScore >= 2) {
      action = 'sell'
      confidence = Math.min(sellScore / 3 * 0.8, 0.9)
      reasoning = `매도 신호: ${sellConditions.filter(Boolean).length}/3 조건 만족 (RSI: ${latestRSI.value.toFixed(2)}, MACD 추세: ${latestMACD.trend})`
    } else {
      reasoning = `관망: 명확한 신호 부재 (매수 ${buyScore}/3, 매도 ${sellScore}/3)`
      confidence = 0.3
    }
    
    return {
      action,
      confidence,
      reasoning,
      indicators: {
        rsi: latestRSI,
        macd: latestMACD,
        bb: latestBB
      },
      metadata: {
        strategyType: 'traditional',
        timestamp: new Date().toISOString(),
        buyScore,
        sellScore
      }
    }
  }

  // AI 학습 기반 신호 생성 (실제 OpenAI 연동)
  async generateAISignal(marketData, userApiKey = null) {
    // 기존 전통적 신호를 기반으로 시작
    const traditionalSignal = this.generateTraditionalSignal(marketData)
    
    // AI 학습이 비활성화되어 있거나 API 키가 없으면 전통적 신호 반환
    if (!this.learningEnabled || !userApiKey) {
      return {
        ...traditionalSignal,
        metadata: {
          ...traditionalSignal.metadata,
          strategyType: 'traditional_only',
          aiStatus: 'disabled'
        }
      }
    }

    try {
      // OpenAI 서비스 인스턴스 생성
      const openaiService = OpenAIServiceFactory.getInstance(userApiKey, this.openaiModel)
      
      // API 키 유효성 검증 (첫 번째 호출시만)
      if (this.analysisCount === 0) {
        const validation = await openaiService.validateApiKey()
        if (!validation.valid) {
          console.warn('OpenAI API 키 검증 실패:', validation.error)
          return {
            ...traditionalSignal,
            reasoning: `⚠️ OpenAI API 키 오류: ${validation.suggestion}. 전통적 지표 사용.`,
            metadata: {
              ...traditionalSignal.metadata,
              strategyType: 'traditional_fallback',
              aiError: validation.error
            }
          }
        }
      }

      // 시장 데이터 분석을 위한 지표 계산
      const { prices, volume } = marketData
      const indicators = TechnicalIndicators.analyzeAllIndicators(prices, this.indicators)
      
      if (!indicators.rsi || !indicators.macd || !indicators.bb) {
        throw new Error('기술적 지표 계산 실패')
      }

      const latestIndicators = {
        rsi: indicators.rsi[indicators.rsi.length - 1],
        macd: indicators.macd[indicators.macd.length - 1],
        bb: indicators.bb[indicators.bb.length - 1]
      }

      // 사용자 설정 및 과거 성과 데이터 준비
      const userSettings = {
        riskTolerance: this.riskTolerance,
        strategyLevel: this.strategyLevel,
        previousPerformance: this.getRecentPerformance()
      }

      // OpenAI API를 통한 고차원 분석
      const aiSignal = await openaiService.analyzeMarketData(
        marketData,
        latestIndicators,
        traditionalSignal,
        userSettings
      )

      // 분석 횟수 증가
      this.analysisCount++
      this.lastAnalysisTime = new Date()

      // 사용량 추정 정보 추가
      const usageEstimate = openaiService.estimateUsage(JSON.stringify(marketData).length)
      aiSignal.metadata.usage = usageEstimate

      return aiSignal

    } catch (error) {
      console.error('AI 신호 생성 오류:', error)
      
      return {
        ...traditionalSignal,
        reasoning: `⚠️ AI 분석 실패 (${error.message}). 전통적 지표 신호 사용: ${traditionalSignal.reasoning}`,
        metadata: {
          ...traditionalSignal.metadata,
          strategyType: 'traditional_fallback',
          aiError: error.message,
          timestamp: new Date().toISOString()
        }
      }
    }
  }

  // 통합 신호 생성 (전략 타입에 따라 자동 선택)
  async generateSignal(marketData, userApiKey = null) {
    switch (this.strategyType) {
      case 'traditional':
        return this.generateTraditionalSignal(marketData)
      
      case 'ai_learning':
        return await this.generateAISignal(marketData, userApiKey)
      
      case 'hybrid':
        // 하이브리드 모드: 시장 상황에 따라 자동 선택
        return await this.generateHybridSignal(marketData, userApiKey)
      
      default:
        return this.generateTraditionalSignal(marketData)
    }
  }

  // 하이브리드 신호 생성 (시장 상황 기반 자동 전환)
  async generateHybridSignal(marketData, userApiKey) {
    const { prices, volume } = marketData
    
    // 시장 변동성 계산
    const recentPrices = prices.slice(-20)
    const returns = recentPrices.slice(1).map((price, i) => 
      (price - recentPrices[i]) / recentPrices[i]
    )
    const volatility = Math.sqrt(
      returns.reduce((sum, ret) => sum + ret * ret, 0) / returns.length
    )

    // 거래량 이상 감지
    const recentVolume = volume.slice(-10)
    const avgVolume = recentVolume.reduce((sum, v) => sum + v, 0) / recentVolume.length
    const volumeRatio = volume[volume.length - 1] / avgVolume

    // 전략 선택 로직
    let selectedStrategy = 'traditional'
    let reason = ''

    if (volatility > 0.05) { // 고변동성
      selectedStrategy = 'traditional'
      reason = '고변동성 시장 - 안정적인 전통 지표 우선'
    } else if (volumeRatio > 1.5) { // 거래량 급증
      selectedStrategy = 'ai_learning'
      reason = '거래량 이상 - AI 패턴 분석 우선'
    } else if (this.getRecentPerformance()?.aiWinRate > 0.7) { // AI 성과 우수
      selectedStrategy = 'ai_learning'
      reason = 'AI 전략 성과 우수 - AI 분석 우선'
    } else {
      selectedStrategy = 'traditional'
      reason = '일반 시장 상황 - 전통 지표 우선'
    }

    // 선택된 전략으로 신호 생성
    const originalStrategyType = this.strategyType
    this.strategyType = selectedStrategy

    let signal
    if (selectedStrategy === 'ai_learning') {
      signal = await this.generateAISignal(marketData, userApiKey)
    } else {
      signal = this.generateTraditionalSignal(marketData)
    }

    // 원래 전략 타입 복원
    this.strategyType = originalStrategyType

    // 하이브리드 메타데이터 추가
    signal.metadata = {
      ...signal.metadata,
      strategyType: 'hybrid',
      selectedStrategy,
      selectionReason: reason,
      marketConditions: {
        volatility: volatility.toFixed(4),
        volumeRatio: volumeRatio.toFixed(2)
      }
    }

    return signal
  }

  // AI 조정 팩터 계산 (기존 코드 개선)
  calculateAIAdjustment(signal, marketData) {
    // 간단한 AI 시뮬레이션: 변동성과 거래량 고려
    const { volume } = marketData
    const recentVolume = volume.slice(-10)
    const avgVolume = recentVolume.reduce((sum, v) => sum + v, 0) / recentVolume.length
    const currentVolume = volume[volume.length - 1]
    
    // 거래량 이상 감지
    const volumeRatio = currentVolume / avgVolume
    let confidenceMultiplier = 1.0
    let reasoning = ''
    
    if (volumeRatio > 1.5) {
      confidenceMultiplier = 1.2
      reasoning = '높은 거래량으로 신호 강화'
    } else if (volumeRatio < 0.5) {
      confidenceMultiplier = 0.8
      reasoning = '낮은 거래량으로 신호 약화'
    } else {
      reasoning = '정상 거래량 범위'
    }
    
    return {
      confidenceMultiplier,
      volumeRatio,
      reasoning
    }
  }

  // 최근 성과 데이터 조회
  getRecentPerformance() {
    if (this.performanceHistory.length === 0) return null

    const recentTrades = this.performanceHistory.slice(-30) // 최근 30건
    const aiTrades = recentTrades.filter(trade => trade.strategyType === 'ai_learning')
    const traditionalTrades = recentTrades.filter(trade => trade.strategyType === 'traditional')

    const calculateStats = (trades) => {
      if (trades.length === 0) return null
      
      const successfulTrades = trades.filter(trade => trade.success)
      const winRate = successfulTrades.length / trades.length
      const avgReturn = trades.reduce((sum, trade) => sum + (trade.profitLoss || 0), 0) / trades.length
      const maxDrawdown = Math.max(...trades.map(trade => Math.abs(trade.profitLoss || 0)))
      
      return { winRate, avgReturn, maxDrawdown, totalTrades: trades.length }
    }

    return {
      aiWinRate: calculateStats(aiTrades)?.winRate || 0,
      traditionalWinRate: calculateStats(traditionalTrades)?.winRate || 0,
      totalTrades: recentTrades.length,
      ...calculateStats(recentTrades)
    }
  }

  // 성과 기록 추가
  addPerformanceRecord(trade) {
    this.performanceHistory.push({
      ...trade,
      timestamp: new Date().toISOString()
    })

    // 최대 100건까지만 유지
    if (this.performanceHistory.length > 100) {
      this.performanceHistory = this.performanceHistory.slice(-100)
    }
  }

  // 전략 성과 평가
  evaluatePerformance(trades) {
    if (!trades || trades.length === 0) {
      return {
        totalTrades: 0,
        winRate: 0,
        totalReturn: 0,
        sharpeRatio: 0,
        maxDrawdown: 0
      }
    }
    
    const successfulTrades = trades.filter(trade => trade.success)
    const winRate = successfulTrades.length / trades.length
    const totalReturn = trades.reduce((sum, trade) => sum + (trade.profit_loss || 0), 0)
    
    // 일일 수익률 계산 (간단화)
    const dailyReturns = trades.map(trade => (trade.profit_loss || 0) / 100000) // 가정: 10만원 기준
    const avgDailyReturn = dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length
    const dailyReturnStd = Math.sqrt(
      dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - avgDailyReturn, 2), 0) / dailyReturns.length
    )
    
    const sharpeRatio = dailyReturnStd > 0 ? (avgDailyReturn * Math.sqrt(252)) / (dailyReturnStd * Math.sqrt(252)) : 0
    
    // 최대 낙폭 계산
    let peak = 0
    let maxDrawdown = 0
    let runningPnL = 0
    
    for (const trade of trades) {
      runningPnL += trade.profit_loss || 0
      if (runningPnL > peak) peak = runningPnL
      const drawdown = (peak - runningPnL) / Math.max(peak, 1)
      if (drawdown > maxDrawdown) maxDrawdown = drawdown
    }
    
    return {
      totalTrades: trades.length,
      winningTrades: successfulTrades.length,
      winRate: winRate * 100,
      totalReturn,
      avgDailyReturn: avgDailyReturn * 100,
      sharpeRatio,
      maxDrawdown: maxDrawdown * 100
    }
  }

  // 전략 상태 정보
  getStrategyStatus() {
    return {
      strategyType: this.strategyType,
      learningEnabled: this.learningEnabled,
      analysisCount: this.analysisCount,
      lastAnalysisTime: this.lastAnalysisTime,
      performanceRecords: this.performanceHistory.length,
      openaiModel: this.openaiModel,
      riskTolerance: this.riskTolerance,
      strategyLevel: this.strategyLevel
    }
  }
}

// 전략 팩토리
export class StrategyFactory {
  static createStrategy(type, options = {}) {
    switch (type) {
      case 'traditional':
        return new ChristmasAIStrategy({
          ...options,
          strategyType: 'traditional',
          learningEnabled: false
        })
      
      case 'ai_learning':
        return new ChristmasAIStrategy({
          ...options,
          strategyType: 'ai_learning',
          learningEnabled: true
        })
      
      default:
        throw new Error(`Unknown strategy type: ${type}`)
    }
  }
  
  static getAvailableStrategies() {
    return [
      {
        id: 'traditional',
        name: '전통적 지표 전략',
        description: 'RSI, MACD, 볼린저 밴드 기반 검증된 매매 전략',
        features: ['기술적 지표 조합', '빠른 신호 생성', '안정적 성능'],
        risk: 'low',
        complexity: 'simple'
      },
      {
        id: 'ai_learning',
        name: 'Christmas AI 자체학습',
        description: 'OpenAI 기반 고차원 패턴 학습 및 진화하는 매매 전략',
        features: ['AI 패턴 인식', '실시간 학습', '개인화 최적화', '고차원 분석'],
        risk: 'medium',
        complexity: 'advanced'
      }
    ]
  }
}

export default { TechnicalIndicators, ChristmasAIStrategy, StrategyFactory } 