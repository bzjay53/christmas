// Christmas Trading: OpenAI API 연동 서비스
// GPT-4 기반 고차원 매매 분석 시스템

class OpenAIService {
  constructor(apiKey, model = 'gpt-4o-mini') {
    this.apiKey = apiKey
    this.model = model
    this.baseURL = 'https://api.openai.com/v1'
    this.maxRetries = 3
    this.retryDelay = 1000 // 1초
  }

  // API 키 유효성 검증
  async validateApiKey() {
    try {
      const response = await this.makeRequest('/models', 'GET')
      return { valid: true, models: response.data }
    } catch (error) {
      return { 
        valid: false, 
        error: error.message,
        suggestion: 'OpenAI API 키를 확인해주세요. sk-proj-로 시작하는 키가 필요합니다.'
      }
    }
  }

  // 시장 데이터를 텍스트로 변환
  formatMarketDataForAI(marketData, indicators, traditionalSignal) {
    const { prices, volume, symbol, timestamp } = marketData
    const { rsi, macd, bb } = indicators
    
    const currentPrice = prices[prices.length - 1]
    const priceChange = prices.length > 1 ? 
      ((currentPrice - prices[prices.length - 2]) / prices[prices.length - 2] * 100).toFixed(2) : 0
    
    const avgVolume = volume.slice(-10).reduce((sum, v) => sum + v, 0) / 10
    const volumeRatio = (volume[volume.length - 1] / avgVolume).toFixed(2)
    
    return `
📊 시장 분석 데이터 (${symbol})
시간: ${new Date(timestamp).toLocaleString('ko-KR')}
현재가: ${currentPrice.toLocaleString()}원 (${priceChange > 0 ? '+' : ''}${priceChange}%)

🔍 기술적 지표:
• RSI(14): ${rsi.value.toFixed(2)} (${rsi.signal === 'overbought' ? '과매수' : rsi.signal === 'oversold' ? '과매도' : '중립'})
• MACD: ${macd.macd.toFixed(4)} (추세: ${macd.trend === 'bullish' ? '상승' : '하락'}, 모멘텀: ${macd.momentum === 'positive' ? '양수' : '음수'})
• 볼린저밴드: ${(bb.bandPosition * 100).toFixed(1)}% 위치 (${bb.signal === 'near_upper' ? '상단근처' : bb.signal === 'near_lower' ? '하단근처' : '중간'})
• 거래량: 평균 대비 ${volumeRatio}배

📈 전통적 신호 분석:
• 신호: ${traditionalSignal.action === 'buy' ? '매수' : traditionalSignal.action === 'sell' ? '매도' : '관망'}
• 신뢰도: ${(traditionalSignal.confidence * 100).toFixed(1)}%
• 근거: ${traditionalSignal.reasoning}

🎯 최근 가격 움직임:
${prices.slice(-5).map((price, idx) => `${idx === 4 ? '현재' : `${4-idx}분전`}: ${price.toLocaleString()}원`).join('\n')}
`
  }

  // AI 매매 분석 요청
  async analyzeMarketData(marketData, indicators, traditionalSignal, userSettings = {}) {
    const {
      riskTolerance = 0.5,
      strategyLevel = 'basic',
      previousPerformance = null
    } = userSettings

    const marketAnalysis = this.formatMarketDataForAI(marketData, indicators, traditionalSignal)
    
    const systemPrompt = this.buildSystemPrompt(riskTolerance, strategyLevel)
    const userPrompt = this.buildUserPrompt(marketAnalysis, previousPerformance)

    try {
      const response = await this.makeRequest('/chat/completions', 'POST', {
        model: this.model,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3, // 일관성을 위해 낮은 온도
        max_tokens: 1000,
        response_format: { type: 'json_object' }
      })

      const aiResponse = JSON.parse(response.choices[0].message.content)
      return this.processAIResponse(aiResponse, traditionalSignal)

    } catch (error) {
      console.error('OpenAI API 오류:', error)
      return this.fallbackResponse(traditionalSignal, error)
    }
  }

  // 시스템 프롬프트 구성
  buildSystemPrompt(riskTolerance, strategyLevel) {
    const riskProfile = riskTolerance < 0.3 ? '보수적' : 
                      riskTolerance > 0.7 ? '공격적' : '균형적'
    
    const strategyDescription = {
      basic: 'RSI, MACD, 볼린저밴드 기본 지표 중심 분석',
      intermediate: '복합 지표 + 거래량 패턴 분석',
      advanced: '다중 시간프레임 + 시장 상황 인식',
      expert: '고차원 패턴 인식 + 자율 학습 적용'
    }

    return `당신은 Christmas AI 매매 전문가입니다. 한국 주식시장의 전문적인 기술적 분석을 수행합니다.

🎯 분석 방침:
- 위험 성향: ${riskProfile} (${riskTolerance})
- 전략 수준: ${strategyLevel} (${strategyDescription[strategyLevel]})
- 기존 지표를 기반으로 고차원 패턴 인식
- 거래량, 시장 상황, 변동성을 종합 고려

📋 응답 형식 (JSON):
{
  "action": "buy|sell|hold",
  "confidence": 0.0-1.0,
  "reasoning": "상세한 분석 근거",
  "riskLevel": "low|medium|high",
  "positionSize": 0.1-1.0,
  "stopLoss": "손절 가격 또는 비율",
  "takeProfit": "익절 가격 또는 비율",
  "timeHorizon": "단기|중기|장기",
  "marketCondition": "상승|하락|횡보|변동성높음",
  "additionalFactors": ["추가 고려사항들"],
  "aiConfidenceBoost": -0.3 to +0.3
}

⚠️ 주의사항:
- 전통적 지표 신호를 존중하되, 고차원 분석으로 개선
- 과도한 신뢰도 상승은 지양 (최대 ±30%)
- 리스크 관리를 최우선으로 고려
- 한국 시장 특성 (오전 9시-오후 3시30분) 반영`
  }

  // 사용자 프롬프트 구성
  buildUserPrompt(marketAnalysis, previousPerformance) {
    let prompt = `${marketAnalysis}

🤖 AI 고차원 분석 요청:
전통적 지표 분석을 기반으로 다음 요소들을 추가 고려하여 매매 신호를 개선해주세요:

1. 거래량 패턴 이상 징후
2. 가격 움직임의 숨겨진 패턴
3. 시장 전체 상황과의 연관성
4. 변동성 변화 추이
5. 시간대별 특성 (한국 시장)`

    if (previousPerformance) {
      prompt += `

📊 과거 성과 데이터:
- 최근 승률: ${previousPerformance.winRate}%
- 평균 수익률: ${previousPerformance.avgReturn}%
- 최대 낙폭: ${previousPerformance.maxDrawdown}%
- 총 거래 수: ${previousPerformance.totalTrades}건

이 성과 데이터를 참고하여 전략을 조정해주세요.`
    }

    return prompt
  }

  // AI 응답 처리
  processAIResponse(aiResponse, traditionalSignal) {
    try {
      // AI 신뢰도 조정 적용
      const adjustedConfidence = Math.max(0.1, Math.min(0.95, 
        traditionalSignal.confidence + (aiResponse.aiConfidenceBoost || 0)
      ))

      // 포지션 크기 계산 (리스크 기반)
      const basePositionSize = aiResponse.positionSize || 0.3
      const riskAdjustedSize = aiResponse.riskLevel === 'high' ? 
        basePositionSize * 0.5 : 
        aiResponse.riskLevel === 'low' ? 
        basePositionSize * 1.2 : basePositionSize

      return {
        action: aiResponse.action || traditionalSignal.action,
        confidence: adjustedConfidence,
        reasoning: `🤖 AI 분석: ${aiResponse.reasoning}\n\n📊 전통적 분석: ${traditionalSignal.reasoning}`,
        riskLevel: aiResponse.riskLevel || 'medium',
        positionSize: Math.min(1.0, riskAdjustedSize),
        stopLoss: aiResponse.stopLoss,
        takeProfit: aiResponse.takeProfit,
        timeHorizon: aiResponse.timeHorizon || '단기',
        marketCondition: aiResponse.marketCondition || '분석중',
        additionalFactors: aiResponse.additionalFactors || [],
        metadata: {
          strategyType: 'ai_learning',
          aiModel: this.model,
          timestamp: new Date().toISOString(),
          traditionalSignal: traditionalSignal,
          aiEnhancement: {
            confidenceBoost: aiResponse.aiConfidenceBoost || 0,
            riskAssessment: aiResponse.riskLevel,
            marketInsights: aiResponse.additionalFactors
          }
        }
      }
    } catch (error) {
      console.error('AI 응답 처리 오류:', error)
      return this.fallbackResponse(traditionalSignal, error)
    }
  }

  // 폴백 응답 (AI 실패시)
  fallbackResponse(traditionalSignal, error) {
    return {
      ...traditionalSignal,
      reasoning: `⚠️ AI 분석 실패 (${error.message}). 전통적 지표 신호 사용: ${traditionalSignal.reasoning}`,
      riskLevel: 'medium',
      positionSize: 0.3,
      timeHorizon: '단기',
      marketCondition: '분석불가',
      metadata: {
        strategyType: 'traditional_fallback',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  // HTTP 요청 처리 (재시도 로직 포함)
  async makeRequest(endpoint, method = 'GET', data = null, retryCount = 0) {
    const url = `${this.baseURL}${endpoint}`
    
    const options = {
      method,
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      }
    }

    if (data && method !== 'GET') {
      options.body = JSON.stringify(data)
    }

    try {
      const response = await fetch(url, options)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(`OpenAI API 오류 (${response.status}): ${errorData.error?.message || response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      if (retryCount < this.maxRetries && this.shouldRetry(error)) {
        console.warn(`OpenAI API 재시도 ${retryCount + 1}/${this.maxRetries}:`, error.message)
        await this.delay(this.retryDelay * Math.pow(2, retryCount)) // 지수 백오프
        return this.makeRequest(endpoint, method, data, retryCount + 1)
      }
      throw error
    }
  }

  // 재시도 여부 판단
  shouldRetry(error) {
    // 네트워크 오류, 서버 오류, 레이트 리밋 등에서 재시도
    return error.message.includes('fetch') || 
           error.message.includes('500') || 
           error.message.includes('502') || 
           error.message.includes('503') || 
           error.message.includes('rate limit')
  }

  // 지연 함수
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // 사용량 및 비용 추정
  estimateUsage(marketDataSize) {
    const baseTokens = 800 // 기본 프롬프트 토큰
    const dataTokens = Math.ceil(marketDataSize / 4) // 대략적인 토큰 계산
    const totalTokens = baseTokens + dataTokens
    
    const costPer1kTokens = {
      'gpt-4o-mini': 0.00015, // $0.15 per 1K tokens
      'gpt-4o': 0.005,       // $5.00 per 1K tokens  
      'gpt-4-turbo': 0.003   // $3.00 per 1K tokens
    }
    
    const estimatedCost = (totalTokens / 1000) * (costPer1kTokens[this.model] || 0.001)
    
    return {
      estimatedTokens: totalTokens,
      estimatedCostUSD: estimatedCost,
      estimatedCostKRW: Math.ceil(estimatedCost * 1300) // 대략적인 환율
    }
  }
}

// 싱글톤 팩토리
class OpenAIServiceFactory {
  static instances = new Map()
  
  static getInstance(apiKey, model = 'gpt-4o-mini') {
    const key = `${apiKey.slice(0, 10)}_${model}`
    
    if (!this.instances.has(key)) {
      this.instances.set(key, new OpenAIService(apiKey, model))
    }
    
    return this.instances.get(key)
  }
  
  static clearInstances() {
    this.instances.clear()
  }
}

export { OpenAIService, OpenAIServiceFactory }
export default OpenAIService 