import { supabase } from '../lib/supabase';
import type { UserProfile } from '../contexts/AuthContext';
import { cryptoTradingConflictManager, type CryptoTradeRequest } from '../lib/tradingConflictManager';

// AI 분석용 타입 정의
interface TechnicalIndicators {
  rsi: number;
  macd: number;
  moving_averages: {
    ma20: number;
    ma50: number;
    ma200: number;
  };
  support_resistance: {
    support: number;
    resistance: number;
  };
  bollinger_bands?: {
    upper: number;
    middle: number;
    lower: number;
    squeeze: boolean;
  };
  momentum?: number;
  volatility?: number;
}

interface MarketSentiment {
  fear_greed_index: number;
  social_sentiment: number;
  news_sentiment: number;
  whale_activity?: string;
  funding_rate?: number;
  open_interest?: number;
}

interface StrategyAnalysis {
  trend: 'bullish' | 'bearish' | 'neutral';
  targetPrice: number;
  probability: number;
  reasoning: string;
}

// AI 매매 전략 타입 정의
export interface AITradingStrategy {
  id: string;
  user_id: string;
  strategy_name: string;
  symbol: string;
  strategy_type: 'scalping' | 'short_term' | 'medium_term' | 'long_term';
  risk_level: 'aggressive' | 'neutral' | 'defensive';
  max_position_size: number;
  stop_loss_percent: number;
  take_profit_percent: number;
  is_active: boolean;
  daily_trade_limit: number;
  min_confidence_score: number;
  created_at: string;
  updated_at: string;
}

// 거래 신호 타입 정의
export interface TradingSignal {
  id: string;
  symbol: string;
  signal_type: 'buy' | 'sell' | 'hold';
  confidence_score: number;
  price_target?: number;
  stop_loss?: number;
  strategy_type?: 'scalping' | 'short_term' | 'medium_term' | 'long_term';
  technical_indicators?: Record<string, unknown>;
  market_sentiment?: string;
  analysis_summary?: string;
  is_active: boolean;
  expires_at?: string;
  created_at: string;
}

// AI 분석 결과 타입
export interface AIAnalysis {
  symbol: string;
  trend: 'bullish' | 'bearish' | 'neutral';
  confidence: number;
  price_prediction: {
    target_price: number;
    probability: number;
    timeframe: string;
  };
  technical_indicators: {
    rsi: number;
    macd: number;
    moving_averages: {
      ma20: number;
      ma50: number;
      ma200: number;
    };
    support_resistance: {
      support: number;
      resistance: number;
    };
  };
  market_sentiment: {
    fear_greed_index: number;
    social_sentiment: number;
    news_sentiment: number;
  };
  recommendations: {
    action: 'buy' | 'sell' | 'hold';
    risk_level: 'low' | 'medium' | 'high';
    position_size: number;
    stop_loss: number;
    take_profit: number;
  };
}

// AI 트레이딩 서비스 클래스
export class AITradingService {
  private static instance: AITradingService;
  
  public static getInstance(): AITradingService {
    if (!AITradingService.instance) {
      AITradingService.instance = new AITradingService();
    }
    return AITradingService.instance;
  }

  // 사용자의 AI 매매 전략 조회
  async getUserStrategies(userId: string): Promise<AITradingStrategy[]> {
    try {
      const { data, error } = await supabase
        .from('ai_trading_strategies')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('전략 조회 실패:', error);
      return [];
    }
  }

  // AI 매매 전략 생성
  async createStrategy(strategy: Omit<AITradingStrategy, 'id' | 'created_at' | 'updated_at'>): Promise<AITradingStrategy | null> {
    try {
      const { data, error } = await supabase
        .from('ai_trading_strategies')
        .insert([strategy])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('전략 생성 실패:', error);
      return null;
    }
  }

  // AI 분석 수행 (고도화된 구현)
  async performAIAnalysis(symbol: string, strategy: AITradingStrategy): Promise<AIAnalysis> {
    try {
      // 1. 현재 시장 데이터 수집
      const currentPrice = this.getCurrentPrice(symbol);
      // const marketData = await this.getMarketIndicators(symbol);
      
      // 2. 기술적 지표 계산
      const technicalIndicators = this.calculateTechnicalIndicators(symbol, currentPrice);
      
      // 3. 시장 센티먼트 분석
      const marketSentiment = await this.analyzeMarketSentiment(symbol);
      
      // 4. 전략별 맞춤 분석
      const strategyAnalysis = this.analyzeByStrategy(strategy, technicalIndicators, marketSentiment);
      
      // 5. 리스크 조정된 추천 생성
      const recommendations = this.generateRiskAdjustedRecommendations(
        strategy, 
        strategyAnalysis, 
        technicalIndicators
      );
      
      // 6. 신뢰도 계산 (여러 지표 종합)
      const confidence = this.calculateConfidenceScore(
        technicalIndicators,
        marketSentiment,
        strategyAnalysis
      );

      const analysis: AIAnalysis = {
        symbol,
        trend: strategyAnalysis.trend,
        confidence,
        price_prediction: {
          target_price: strategyAnalysis.targetPrice,
          probability: strategyAnalysis.probability,
          timeframe: this.getTimeframeForStrategy(strategy.strategy_type)
        },
        technical_indicators: technicalIndicators,
        market_sentiment: marketSentiment,
        recommendations
      };

      console.log(`🤖 AI 분석 완료: ${symbol} (신뢰도: ${(confidence * 100).toFixed(1)}%)`);
      return analysis;

    } catch (error) {
      console.error('AI 분석 실패:', error);
      // 오류 시 기본 분석 반환
      return this.getFallbackAnalysis(symbol, strategy);
    }
  }

  // 거래 신호 생성 (충돌 방지 시스템 통합)
  async generateTradingSignal(analysis: AIAnalysis, strategy: AITradingStrategy, userProfile: UserProfile): Promise<TradingSignal | null> {
    // 신호 생성 조건 확인
    if (analysis.confidence < strategy.min_confidence_score) {
      console.log('신뢰도 부족으로 신호 생성 건너뜀');
      return null;
    }

    // 거래 요청 생성
    const tradeRequest: CryptoTradeRequest = {
      userId: strategy.user_id,
      symbol: analysis.symbol,
      orderType: analysis.recommendations.action === 'buy' ? 'buy' : 'sell',
      quantity: analysis.recommendations.position_size,
      price: analysis.price_prediction.target_price,
      timestamp: Date.now(),
      strategy: strategy.strategy_name,
      userTier: userProfile.subscription_tier
    };

    // 거래 충돌 검사
    const conflict = await cryptoTradingConflictManager.detectTradeConflict(tradeRequest);
    
    if (conflict) {
      console.log(`⚠️ 거래 충돌 감지: ${conflict.message}`);
      
      // 충돌 해결 방안 적용
      if (conflict.recommendedAction === 'delay') {
        const delay = cryptoTradingConflictManager.getOptimalTradingDelay(analysis.symbol);
        console.log(`⏰ 거래 지연: ${delay}ms 후 재시도`);
        // 실제로는 여기서 지연 처리 로직 구현
        return null;
      } else if (conflict.recommendedAction === 'alternative_symbol') {
        const alternatives = await cryptoTradingConflictManager.getAlternativeCryptos(analysis.symbol, 1);
        if (alternatives.length > 0) {
          console.log(`🔄 대안 심볼 제안: ${alternatives[0].symbol}`);
          // 대안 심볼로 분석 재실행 (실제로는 더 정교한 처리 필요)
        }
        return null;
      } else if (conflict.recommendedAction === 'reduce_size') {
        tradeRequest.quantity = tradeRequest.quantity * 0.5; // 50% 감소
        console.log(`📉 거래량 50% 감소: ${tradeRequest.quantity}`);
      }
    }

    // 거래 요청 등록
    await cryptoTradingConflictManager.registerCryptoTradeRequest(tradeRequest);

    const signal: Omit<TradingSignal, 'id' | 'created_at'> = {
      symbol: analysis.symbol,
      signal_type: analysis.recommendations.action,
      confidence_score: analysis.confidence,
      price_target: analysis.price_prediction.target_price,
      stop_loss: analysis.recommendations.stop_loss,
      strategy_type: strategy.strategy_type,
      technical_indicators: analysis.technical_indicators,
      market_sentiment: analysis.market_sentiment.fear_greed_index.toString(),
      analysis_summary: this.generateAnalysisSummary(analysis),
      is_active: true,
      expires_at: this.calculateExpiryTime(strategy.strategy_type)
    };

    try {
      const { data, error } = await supabase
        .from('trading_signals')
        .insert([signal])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('신호 생성 실패:', error);
      // 실패 시 거래 요청 정리
      await cryptoTradingConflictManager.completeCryptoTradeRequest(strategy.user_id, analysis.symbol);
      return null;
    }
  }

  // 활성 거래 신호 조회
  async getActiveSignals(symbol?: string): Promise<TradingSignal[]> {
    try {
      let query = supabase
        .from('trading_signals')
        .select('*')
        .eq('is_active', true)
        .gt('expires_at', new Date().toISOString())
        .order('created_at', { ascending: false });

      if (symbol) {
        query = query.eq('symbol', symbol);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('신호 조회 실패:', error);
      return [];
    }
  }

  // 구독 티어별 권한 확인
  async checkTradingPermissions(userProfile: UserProfile, action: string): Promise<boolean> {
    const permissions = {
      free: ['mockTrading'],
      basic: ['mockTrading', 'realTrading', 'basicAI'],
      premium: ['mockTrading', 'realTrading', 'basicAI', 'advancedAI', 'autoTrading'],
      vip: ['all']
    };

    const userPermissions = permissions[userProfile.subscription_tier] || permissions.free;
    return userPermissions.includes(action) || userPermissions.includes('all');
  }

  // 일일 거래 제한 확인
  async checkDailyTradeLimit(userId: string, tier: string): Promise<{ allowed: boolean; remaining: number }> {
    const limits = {
      free: 5,
      basic: 20,
      premium: 100,
      vip: 1000
    };

    const limit = limits[tier as keyof typeof limits] || limits.free;

    try {
      const { count, error } = await supabase
        .from('trades')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('created_at', new Date().toISOString().split('T')[0] + 'T00:00:00.000Z');

      if (error) throw error;

      const usedTrades = count || 0;
      const remaining = Math.max(0, limit - usedTrades);

      return {
        allowed: remaining > 0,
        remaining
      };
    } catch (error) {
      console.error('일일 제한 확인 실패:', error);
      return { allowed: false, remaining: 0 };
    }
  }

  // 헬퍼 메서드들
  private generateRandomTrend(): 'bullish' | 'bearish' | 'neutral' {
    const trends = ['bullish', 'bearish', 'neutral'] as const;
    return trends[Math.floor(Math.random() * trends.length)];
  }

  private getCurrentPrice(symbol: string): number {
    // 실제로는 실시간 가격 데이터를 가져와야 함
    const mockPrices: Record<string, number> = {
      'BTCUSDT': 43250,
      'ETHUSDT': 2580,
      'BNBUSDT': 315
    };
    return mockPrices[symbol] || 100;
  }

  private getTimeframeForStrategy(strategyType: string): string {
    const timeframes = {
      scalping: '5-15 minutes',
      short_term: '1-4 hours',
      medium_term: '1-7 days',
      long_term: '1-4 weeks'
    };
    return timeframes[strategyType as keyof typeof timeframes] || '1 hour';
  }

  private generateTradingAction(riskLevel: string): 'buy' | 'sell' | 'hold' {
    const actions = ['buy', 'sell', 'hold'] as const;
    
    // 리스크 레벨에 따른 가중치 적용
    if (riskLevel === 'aggressive') {
      return Math.random() > 0.3 ? (Math.random() > 0.5 ? 'buy' : 'sell') : 'hold';
    } else if (riskLevel === 'defensive') {
      return Math.random() > 0.7 ? (Math.random() > 0.5 ? 'buy' : 'sell') : 'hold';
    } else {
      return actions[Math.floor(Math.random() * actions.length)];
    }
  }

  private assessRiskLevel(strategyRisk: string): 'low' | 'medium' | 'high' {
    const riskMapping = {
      defensive: 'low' as const,
      neutral: 'medium' as const,
      aggressive: 'high' as const
    };
    return riskMapping[strategyRisk as keyof typeof riskMapping] || 'medium';
  }

  private generateAnalysisSummary(analysis: AIAnalysis): string {
    const trend = analysis.trend === 'bullish' ? '상승' : analysis.trend === 'bearish' ? '하락' : '보합';
    const confidence = Math.round(analysis.confidence * 100);
    
    return `${analysis.symbol} ${trend} 추세 예상 (신뢰도: ${confidence}%). ` +
           `RSI: ${analysis.technical_indicators.rsi.toFixed(1)}, ` +
           `MACD: ${analysis.technical_indicators.macd.toFixed(2)}, ` +
           `목표가: $${analysis.price_prediction.target_price.toFixed(2)}`;
  }

  private calculateExpiryTime(strategyType: string): string {
    const now = new Date();
    const expiryMinutes = {
      scalping: 15,
      short_term: 240, // 4 hours
      medium_term: 1440, // 24 hours
      long_term: 10080 // 7 days
    };

    const minutes = expiryMinutes[strategyType as keyof typeof expiryMinutes] || 60;
    now.setMinutes(now.getMinutes() + minutes);
    
    return now.toISOString();
  }

  // 고도화된 AI 분석 헬퍼 메서드들

  // 시장 지표 수집
  private async getMarketIndicators(_symbol: string): Promise<unknown> {
    // 실제로는 바이낸스 API나 외부 데이터 소스에서 수집
    return {
      volume24h: Math.random() * 1000000000,
      volumeChange: (Math.random() - 0.5) * 100,
      priceChange24h: (Math.random() - 0.5) * 10,
      marketCap: Math.random() * 100000000000,
      dominance: Math.random() * 100
    };
  }

  // 기술적 지표 계산 (고도화)
  private calculateTechnicalIndicators(symbol: string, currentPrice: number): TechnicalIndicators {
    // 실제로는 과거 가격 데이터를 기반으로 정확한 계산 필요
    const rsi = this.calculateRSI(symbol);
    const macd = this.calculateMACD(symbol);
    const bollinger = this.calculateBollingerBands(currentPrice);
    
    return {
      rsi,
      macd,
      moving_averages: {
        ma20: currentPrice * (1 + (Math.random() - 0.5) * 0.02),
        ma50: currentPrice * (1 + (Math.random() - 0.5) * 0.05),
        ma200: currentPrice * (1 + (Math.random() - 0.5) * 0.1)
      },
      support_resistance: {
        support: currentPrice * (0.95 + Math.random() * 0.03),
        resistance: currentPrice * (1.02 + Math.random() * 0.03)
      },
      bollinger_bands: bollinger,
      momentum: this.calculateMomentum(symbol),
      volatility: this.calculateVolatility(symbol)
    };
  }

  // RSI 계산 (개선된 버전)
  private calculateRSI(symbol: string): number {
    // 실제로는 14일 평균 상승/하락을 계산
    const base = 30 + Math.random() * 40; // 30-70 범위
    const symbolWeight = symbol.includes('BTC') ? 5 : symbol.includes('ETH') ? 3 : 0;
    return Math.min(100, Math.max(0, base + symbolWeight + (Math.random() - 0.5) * 20));
  }

  // MACD 계산 (개선된 버전)
  private calculateMACD(symbol: string): number {
    // 실제로는 12일 EMA - 26일 EMA
    const trend = Math.random() - 0.5; // -0.5 ~ 0.5
    const volatility = symbol.includes('BTC') ? 2 : symbol.includes('ETH') ? 1.5 : 3;
    return trend * volatility;
  }

  // 볼린저 밴드 계산
  private calculateBollingerBands(currentPrice: number): { upper: number; middle: number; lower: number; squeeze: boolean; } {
    const stdDev = currentPrice * 0.02; // 2% 표준편차
    return {
      upper: currentPrice + (stdDev * 2),
      middle: currentPrice,
      lower: currentPrice - (stdDev * 2),
      squeeze: Math.random() < 0.3 // 30% 확률로 squeeze 상태
    };
  }

  // 모멘텀 계산
  private calculateMomentum(_symbol: string): number {
    // 실제로는 현재가 / N일 전 가격
    return 0.95 + Math.random() * 0.1; // 0.95 ~ 1.05
  }

  // 변동성 계산
  private calculateVolatility(symbol: string): number {
    const baseVol = symbol.includes('BTC') ? 0.03 : symbol.includes('ETH') ? 0.04 : 0.06;
    return baseVol + Math.random() * 0.02;
  }

  // 시장 센티먼트 분석
  private async analyzeMarketSentiment(_symbol: string): Promise<MarketSentiment> {
    // 실제로는 뉴스, 소셜미디어, 온체인 데이터 분석
    const fearGreed = this.calculateFearGreedIndex();
    
    return {
      fear_greed_index: fearGreed,
      social_sentiment: 40 + Math.random() * 40, // 40-80 범위
      news_sentiment: 30 + Math.random() * 50,   // 30-80 범위
      whale_activity: Math.random() < 0.2 ? 'high' : 'normal',
      funding_rate: (Math.random() - 0.5) * 0.1, // -5% ~ +5%
      open_interest: Math.random() * 1000000000
    };
  }

  // 공포탐욕지수 계산
  private calculateFearGreedIndex(): number {
    // 실제로는 여러 지표 종합
    const base = 50;
    const marketTrend = (Math.random() - 0.5) * 40; // -20 ~ +20
    const volatilityFactor = Math.random() * 20; // 0 ~ 20
    
    return Math.min(100, Math.max(0, base + marketTrend - volatilityFactor));
  }

  // 전략별 맞춤 분석
  private analyzeByStrategy(strategy: AITradingStrategy, technicalIndicators: TechnicalIndicators, marketSentiment: MarketSentiment): StrategyAnalysis {
    const currentPrice = this.getCurrentPrice(strategy.symbol);
    
    switch (strategy.strategy_type) {
      case 'scalping':
        return this.analyzeScalpingStrategy(currentPrice, technicalIndicators, marketSentiment);
      case 'short_term':
        return this.analyzeShortTermStrategy(currentPrice, technicalIndicators, marketSentiment);
      case 'medium_term':
        return this.analyzeMediumTermStrategy(currentPrice, technicalIndicators, marketSentiment);
      case 'long_term':
        return this.analyzeLongTermStrategy(currentPrice, technicalIndicators, marketSentiment);
      default:
        return this.analyzeDefaultStrategy(currentPrice, technicalIndicators);
    }
  }

  // 스캘핑 전략 분석
  private analyzeScalpingStrategy(currentPrice: number, tech: TechnicalIndicators, _sentiment: MarketSentiment): StrategyAnalysis {
    const shortTermTrend = tech.rsi > 70 ? 'bearish' : tech.rsi < 30 ? 'bullish' : 'neutral';
    const targetPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.02); // ±1%
    
    return {
      trend: shortTermTrend,
      targetPrice,
      probability: 0.6 + Math.random() * 0.3,
      reasoning: '스캘핑: 단기 기술적 지표 중심 분석'
    };
  }

  // 단기 전략 분석
  private analyzeShortTermStrategy(currentPrice: number, tech: TechnicalIndicators, _sentiment: MarketSentiment): StrategyAnalysis {
    const trendSignal = tech.macd > 0 ? 'bullish' : 'bearish';
    const targetPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.05); // ±2.5%
    
    return {
      trend: trendSignal,
      targetPrice,
      probability: 0.65 + Math.random() * 0.25,
      reasoning: '단기: MACD와 이동평균 기반 분석'
    };
  }

  // 중기 전략 분석
  private analyzeMediumTermStrategy(currentPrice: number, tech: TechnicalIndicators, _sentiment: MarketSentiment): StrategyAnalysis {
    const ma20 = tech.moving_averages.ma20;
    const ma50 = tech.moving_averages.ma50;
    const trend = currentPrice > ma20 && ma20 > ma50 ? 'bullish' : 'bearish';
    const targetPrice = currentPrice * (1 + (Math.random() - 0.5) * 0.1); // ±5%
    
    return {
      trend,
      targetPrice,
      probability: 0.7 + Math.random() * 0.2,
      reasoning: '중기: 이동평균과 센티먼트 종합 분석'
    };
  }

  // 장기 전략 분석
  private analyzeLongTermStrategy(currentPrice: number, tech: TechnicalIndicators, sentiment: MarketSentiment): StrategyAnalysis {
    const ma200 = tech.moving_averages.ma200;
    const longTermTrend = currentPrice > ma200 ? 'bullish' : 'bearish';
    const fearGreed = sentiment.fear_greed_index;
    
    // 공포탐욕지수를 활용한 장기 전망
    const sentimentAdjustment = fearGreed < 30 ? 0.1 : fearGreed > 70 ? -0.05 : 0;
    const targetPrice = currentPrice * (1 + sentimentAdjustment + (Math.random() - 0.5) * 0.15);
    
    return {
      trend: longTermTrend,
      targetPrice,
      probability: 0.75 + Math.random() * 0.15,
      reasoning: `장기: 200일 이평선(${longTermTrend}) + 공포탐욕지수(${fearGreed})`
    };
  }

  // 기본 전략 분석
  private analyzeDefaultStrategy(currentPrice: number, _tech: TechnicalIndicators): StrategyAnalysis {
    return {
      trend: 'neutral' as const,
      targetPrice: currentPrice,
      probability: 0.5,
      reasoning: '기본: 중립적 시장 상황'
    };
  }

  // 리스크 조정된 추천 생성
  private generateRiskAdjustedRecommendations(strategy: AITradingStrategy, analysis: StrategyAnalysis, tech: TechnicalIndicators): { action: 'buy' | 'sell' | 'hold'; risk_level: 'low' | 'medium' | 'high'; position_size: number; stop_loss: number; take_profit: number; } {
    const baseAction: 'buy' | 'sell' | 'hold' = analysis.trend === 'bullish' ? 'buy' : analysis.trend === 'bearish' ? 'sell' : 'hold';
    const riskMultiplier = strategy.risk_level === 'aggressive' ? 1.2 : 
                          strategy.risk_level === 'defensive' ? 0.8 : 1.0;
    
    // 변동성 기반 포지션 크기 조정
    const volatilityAdjustment = Math.min(1.5, Math.max(0.5, 1 / (tech.volatility || 1)));
    const adjustedPositionSize = strategy.max_position_size * riskMultiplier * volatilityAdjustment;
    
    return {
      action: baseAction,
      risk_level: this.assessRiskLevel(strategy.risk_level),
      position_size: Math.min(strategy.max_position_size, adjustedPositionSize),
      stop_loss: strategy.stop_loss_percent * riskMultiplier,
      take_profit: strategy.take_profit_percent * riskMultiplier
    };
  }

  // 신뢰도 점수 계산
  private calculateConfidenceScore(tech: TechnicalIndicators, sentiment: MarketSentiment, analysis: StrategyAnalysis): number {
    let confidence = 0.5; // 기본 50%
    
    // 기술적 지표 신뢰도 (30%)
    if (tech.rsi > 70 || tech.rsi < 30) confidence += 0.15; // 과매도/과매수
    if (Math.abs(tech.macd) > 1) confidence += 0.1; // 강한 MACD 신호
    if (tech.bollinger_bands?.squeeze) confidence -= 0.05; // 변동성 축소 시 불확실성
    
    // 센티먼트 신뢰도 (20%)
    const fearGreed = sentiment.fear_greed_index;
    if (fearGreed < 20 || fearGreed > 80) confidence += 0.1; // 극단적 센티먼트
    if (sentiment.whale_activity === 'high') confidence += 0.05; // 고래 활동
    
    // 전략 일관성 (30%)
    if (analysis.probability > 0.8) confidence += 0.15;
    if (analysis.probability < 0.6) confidence -= 0.1;
    
    // 시장 조건 (20%)
    if ((tech.volatility || 0) < 0.05) confidence += 0.1; // 낮은 변동성
    if ((tech.momentum || 1) > 1.02 || (tech.momentum || 1) < 0.98) confidence += 0.05; // 모멘텀
    
    return Math.min(1.0, Math.max(0.3, confidence));
  }

  // 오류 시 기본 분석 반환
  private getFallbackAnalysis(symbol: string, strategy: AITradingStrategy): AIAnalysis {
    const currentPrice = this.getCurrentPrice(symbol);
    
    return {
      symbol,
      trend: 'neutral',
      confidence: 0.5,
      price_prediction: {
        target_price: currentPrice,
        probability: 0.5,
        timeframe: this.getTimeframeForStrategy(strategy.strategy_type)
      },
      technical_indicators: {
        rsi: 50,
        macd: 0,
        moving_averages: {
          ma20: currentPrice,
          ma50: currentPrice,
          ma200: currentPrice
        },
        support_resistance: {
          support: currentPrice * 0.98,
          resistance: currentPrice * 1.02
        }
      },
      market_sentiment: {
        fear_greed_index: 50,
        social_sentiment: 50,
        news_sentiment: 50
      },
      recommendations: {
        action: 'hold',
        risk_level: 'medium',
        position_size: strategy.max_position_size * 0.5,
        stop_loss: strategy.stop_loss_percent,
        take_profit: strategy.take_profit_percent
      }
    };
  }
}

// 싱글톤 인스턴스 내보내기
export const aiTradingService = AITradingService.getInstance();