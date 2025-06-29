import { supabase } from '../lib/supabase';
import type { UserProfile } from '../contexts/AuthContext';

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
  technical_indicators?: Record<string, any>;
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

  // AI 분석 수행 (모의 구현)
  async performAIAnalysis(symbol: string, strategy: AITradingStrategy): Promise<AIAnalysis> {
    // 실제 환경에서는 여기서 AI 모델을 호출하거나 외부 API를 사용
    // 현재는 모의 데이터를 반환
    
    const mockAnalysis: AIAnalysis = {
      symbol,
      trend: this.generateRandomTrend(),
      confidence: Math.random() * 0.4 + 0.6, // 0.6-1.0 사이
      price_prediction: {
        target_price: this.getCurrentPrice(symbol) * (1 + (Math.random() - 0.5) * 0.1),
        probability: Math.random() * 0.3 + 0.7,
        timeframe: this.getTimeframeForStrategy(strategy.strategy_type)
      },
      technical_indicators: {
        rsi: Math.random() * 100,
        macd: (Math.random() - 0.5) * 10,
        moving_averages: {
          ma20: this.getCurrentPrice(symbol) * (1 + (Math.random() - 0.5) * 0.05),
          ma50: this.getCurrentPrice(symbol) * (1 + (Math.random() - 0.5) * 0.1),
          ma200: this.getCurrentPrice(symbol) * (1 + (Math.random() - 0.5) * 0.2)
        },
        support_resistance: {
          support: this.getCurrentPrice(symbol) * 0.95,
          resistance: this.getCurrentPrice(symbol) * 1.05
        }
      },
      market_sentiment: {
        fear_greed_index: Math.random() * 100,
        social_sentiment: Math.random() * 100,
        news_sentiment: Math.random() * 100
      },
      recommendations: {
        action: this.generateTradingAction(strategy.risk_level),
        risk_level: this.assessRiskLevel(strategy.risk_level),
        position_size: strategy.max_position_size * (Math.random() * 0.5 + 0.5),
        stop_loss: strategy.stop_loss_percent,
        take_profit: strategy.take_profit_percent
      }
    };

    return mockAnalysis;
  }

  // 거래 신호 생성
  async generateTradingSignal(analysis: AIAnalysis, strategy: AITradingStrategy): Promise<TradingSignal | null> {
    // 신호 생성 조건 확인
    if (analysis.confidence < strategy.min_confidence_score) {
      console.log('신뢰도 부족으로 신호 생성 건너뜀');
      return null;
    }

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
}

// 싱글톤 인스턴스 내보내기
export const aiTradingService = AITradingService.getInstance();