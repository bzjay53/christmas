// 🚫 동시 거래 방지 시스템 (Concurrent Trading Prevention System)
// 바이낸스 암호화폐 거래용 충돌 방지 시스템

export interface CryptoTradeRequest {
  userId: string;
  symbol: string; // 예: BTCUSDT, ETHUSDT
  orderType: 'buy' | 'sell';
  quantity: number;
  price?: number;
  timestamp: number;
  strategy?: string;
  userTier: 'free' | 'basic' | 'premium' | 'vip';
}

export interface TradeConflict {
  conflictType: 'same_symbol' | 'cluster_risk' | 'timing_collision' | 'market_impact' | 'whale_alert';
  affectedUsers: string[];
  symbol: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  recommendedAction: 'delay' | 'reduce_size' | 'alternative_symbol' | 'cancel';
}

export interface AlternativeCrypto {
  symbol: string;
  name: string;
  similarity: number;
  reason: string;
  marketCap: number;
  volatility: number;
}

class CryptoTradingConflictManager {
  private activeOrders: Map<string, CryptoTradeRequest[]> = new Map(); // symbol -> CryptoTradeRequest[]
  private userTimings: Map<string, number[]> = new Map(); // userId -> timestamps[]
  private readonly TIMING_WINDOW_MS = 3000; // 3초 내 동시 주문 감지 (암호화폐는 더 빠름)
  private readonly MAX_SAME_SYMBOL_USERS = 5; // 동일 심볼 최대 사용자 수
  private readonly CLUSTER_THRESHOLD = 0.8; // 클러스터링 임계값
  private readonly WHALE_THRESHOLD = 50000; // 고액 거래 기준 (USDT)
  private readonly MARKET_IMPACT_THRESHOLD = 10000; // 시장 영향도 기준

  // 1. 암호화폐 거래 충돌 감지 및 분석
  async detectTradeConflict(tradeRequest: CryptoTradeRequest): Promise<TradeConflict | null> {
    const { symbol, userId, timestamp, quantity, price, userTier } = tradeRequest;

    console.log(`🔍 암호화폐 거래 충돌 감지 시작: ${userId} -> ${symbol}`);

    // 1-1. 동일 심볼 거래자 수 체크
    const sameSymbolOrders = this.activeOrders.get(symbol) || [];
    const uniqueUsers = new Set(sameSymbolOrders.map(order => order.userId));
    
    // 티어별 동시 거래 제한
    const tierLimits = { free: 2, basic: 3, premium: 5, vip: 10 };
    const maxUsers = tierLimits[userTier] || tierLimits.free;
    
    if (uniqueUsers.size >= maxUsers && !uniqueUsers.has(userId)) {
      return {
        conflictType: 'same_symbol',
        affectedUsers: Array.from(uniqueUsers),
        symbol,
        message: `${symbol} 심볼에 이미 ${uniqueUsers.size}명이 거래 중입니다. ${userTier} 티어 제한: ${maxUsers}명`,
        severity: 'high',
        recommendedAction: 'alternative_symbol'
      };
    }

    // 1-2. 타이밍 충돌 감지
    const recentOrders = sameSymbolOrders.filter(
      order => Math.abs(order.timestamp - timestamp) <= this.TIMING_WINDOW_MS
    );

    if (recentOrders.length >= 3) {
      return {
        conflictType: 'timing_collision',
        affectedUsers: recentOrders.map(order => order.userId),
        symbol,
        message: `${this.TIMING_WINDOW_MS/1000}초 내 ${recentOrders.length}개 동시 주문 감지. 가격 조작 방지를 위해 거래를 분산합니다.`,
        severity: 'medium',
        recommendedAction: 'delay'
      };
    }

    // 1-3. 고액 거래 (Whale) 감지
    const tradeValue = quantity * (price || 0);
    if (tradeValue > this.WHALE_THRESHOLD) {
      return {
        conflictType: 'whale_alert',
        affectedUsers: [userId],
        symbol,
        message: `고액 거래 감지: $${tradeValue.toLocaleString()}. 시장 영향도를 고려하여 분할 주문을 권장합니다.`,
        severity: 'high',
        recommendedAction: 'reduce_size'
      };
    }

    // 1-4. 시장 영향도 분석
    const marketImpact = await this.analyzeMarketImpact(tradeRequest);
    if (marketImpact) {
      return marketImpact;
    }

    // 1-5. AI 클러스터링 위험 감지
    const clusterRisk = await this.detectAIClusterRisk(tradeRequest);
    if (clusterRisk) {
      return clusterRisk;
    }

    console.log(`✅ 거래 충돌 없음: ${userId} -> ${symbol}`);
    return null;
  }

  // 2. 시장 영향도 분석
  private async analyzeMarketImpact(tradeRequest: CryptoTradeRequest): Promise<TradeConflict | null> {
    const { symbol, quantity, price, userId } = tradeRequest;
    const tradeValue = quantity * (price || 0);
    
    // 24시간 거래량 대비 분석 (실제로는 Binance API에서 가져와야 함)
    const mockDailyVolume = this.getMockDailyVolume(symbol);
    const impactPercentage = (tradeValue / mockDailyVolume) * 100;
    
    if (impactPercentage > 0.1) { // 일일 거래량의 0.1% 이상
      return {
        conflictType: 'market_impact',
        affectedUsers: [userId],
        symbol,
        message: `거래량이 일일 볼륨의 ${impactPercentage.toFixed(2)}%입니다. 시장에 영향을 줄 수 있어 분할 주문을 권장합니다.`,
        severity: impactPercentage > 1 ? 'critical' : 'high',
        recommendedAction: 'reduce_size'
      };
    }
    
    return null;
  }

  // 3. AI 클러스터링 위험 감지 (암호화폐용)
  private async detectAIClusterRisk(tradeRequest: CryptoTradeRequest): Promise<TradeConflict | null> {
    const { symbol, userId, strategy } = tradeRequest;
    
    // 동일 심볼에서 활성화된 AI 전략들 분석
    const sameSymbolOrders = this.activeOrders.get(symbol) || [];
    const aiStrategies = sameSymbolOrders
      .filter(order => order.strategy && order.userId !== userId)
      .map(order => order.strategy);
    
    if (aiStrategies.length === 0) return null;
    
    // AI 전략 유사성 분석 (실제로는 더 정교한 알고리즘 필요)
    const strategySimilarity = this.calculateStrategySimilarity(strategy, aiStrategies);
    
    if (strategySimilarity > this.CLUSTER_THRESHOLD) {
      console.log(`⚠️ AI 클러스터링 위험 감지: ${symbol} (유사도: ${strategySimilarity.toFixed(2)})`);
      
      return {
        conflictType: 'cluster_risk',
        affectedUsers: [userId],
        symbol,
        message: `AI 전략이 다른 ${aiStrategies.length}명과 ${(strategySimilarity * 100).toFixed(1)}% 유사합니다. 개별화된 전략을 권장합니다.`,
        severity: 'medium',
        recommendedAction: 'alternative_symbol'
      };
    }

    return null;
  }

  // 4. 대안 암호화폐 추천
  async getAlternativeCryptos(symbol: string, count: number = 3): Promise<AlternativeCrypto[]> {
    // 암호화폐 카테고리별 유사 코인 추천
    const cryptoAlternatives: Record<string, AlternativeCrypto[]> = {
      'BTCUSDT': [
        { symbol: 'ETHUSDT', name: 'Ethereum', similarity: 0.85, reason: '대형 알트코인, 높은 유동성', marketCap: 400000000000, volatility: 0.65 },
        { symbol: 'LTCUSDT', name: 'Litecoin', similarity: 0.75, reason: '비트코인 포크, 유사한 기능', marketCap: 8000000000, volatility: 0.70 },
        { symbol: 'BCHUSDT', name: 'Bitcoin Cash', similarity: 0.80, reason: '비트코인 하드포크', marketCap: 12000000000, volatility: 0.75 }
      ],
      'ETHUSDT': [
        { symbol: 'BTCUSDT', name: 'Bitcoin', similarity: 0.85, reason: '최고 시가총액, 안정적 유동성', marketCap: 800000000000, volatility: 0.60 },
        { symbol: 'BNBUSDT', name: 'Binance Coin', similarity: 0.70, reason: '대형 거래소 토큰, 유틸리티', marketCap: 45000000000, volatility: 0.68 },
        { symbol: 'ADAUSDT', name: 'Cardano', similarity: 0.65, reason: '스마트 컨트랙트 플랫폼', marketCap: 15000000000, volatility: 0.80 }
      ],
      'BNBUSDT': [
        { symbol: 'ETHUSDT', name: 'Ethereum', similarity: 0.70, reason: '대형 플랫폼 토큰', marketCap: 400000000000, volatility: 0.65 },
        { symbol: 'ADAUSDT', name: 'Cardano', similarity: 0.68, reason: '스마트 컨트랙트, 유사 시총', marketCap: 15000000000, volatility: 0.80 },
        { symbol: 'MATICUSDT', name: 'Polygon', similarity: 0.65, reason: '이더리움 Layer 2', marketCap: 8000000000, volatility: 0.85 }
      ]
    };

    const alternatives = cryptoAlternatives[symbol] || [
      { symbol: 'BTCUSDT', name: 'Bitcoin', similarity: 0.80, reason: '기본 대안 - 가장 안정적', marketCap: 800000000000, volatility: 0.60 },
      { symbol: 'ETHUSDT', name: 'Ethereum', similarity: 0.75, reason: '기본 대안 - 높은 유동성', marketCap: 400000000000, volatility: 0.65 }
    ];

    return alternatives
      .filter(crypto => crypto.symbol !== symbol)
      .slice(0, count);
  }

  // 5. 헬퍼 메서드들
  private getMockDailyVolume(symbol: string): number {
    // 실제로는 Binance API에서 24시간 거래량을 가져와야 함
    const mockVolumes: Record<string, number> = {
      'BTCUSDT': 2000000000, // $2B
      'ETHUSDT': 1500000000, // $1.5B  
      'BNBUSDT': 800000000,  // $800M
      'ADAUSDT': 500000000,  // $500M
      'SOLUSDT': 600000000,  // $600M
    };
    return mockVolumes[symbol] || 100000000; // 기본값 $100M
  }

  private calculateStrategySimilarity(strategy: string | undefined, otherStrategies: (string | undefined)[]): number {
    if (!strategy) return 0;
    
    // 간단한 전략 유사성 계산 (실제로는 더 정교한 알고리즘 필요)
    const similarCount = otherStrategies.filter(s => s === strategy).length;
    return similarCount / (otherStrategies.length || 1);
  }

  // 6. 거래 요청 등록
  async registerCryptoTradeRequest(tradeRequest: CryptoTradeRequest): Promise<void> {
    const { symbol, userId, timestamp } = tradeRequest;

    // 심볼별 주문 목록에 추가
    if (!this.activeOrders.has(symbol)) {
      this.activeOrders.set(symbol, []);
    }
    this.activeOrders.get(symbol)!.push(tradeRequest);

    // 사용자별 타이밍 기록
    if (!this.userTimings.has(userId)) {
      this.userTimings.set(userId, []);
    }
    this.userTimings.get(userId)!.push(timestamp);

    console.log(`📝 암호화폐 거래 요청 등록: ${userId} -> ${symbol} (${this.activeOrders.get(symbol)!.length}건)`);
  }

  // 7. 거래 완료 후 정리
  async completeCryptoTradeRequest(userId: string, symbol: string): Promise<void> {
    const orders = this.activeOrders.get(symbol) || [];
    const filteredOrders = orders.filter(order => order.userId !== userId);
    
    if (filteredOrders.length === 0) {
      this.activeOrders.delete(symbol);
    } else {
      this.activeOrders.set(symbol, filteredOrders);
    }

    console.log(`✅ 암호화폐 거래 완료 처리: ${userId} -> ${symbol}`);
  }

  // 8. 최적 거래 시점 추천
  getOptimalTradingDelay(symbol: string): number {
    const orders = this.activeOrders.get(symbol) || [];
    const baseDelay = 1000; // 기본 1초 지연 (암호화폐는 더 빠름)
    const additionalDelay = orders.length * 500; // 주문 건수당 0.5초 추가
    const randomJitter = Math.random() * 500; // 랜덤 지터
    
    return baseDelay + additionalDelay + randomJitter;
  }

  // 9. 현재 활성 거래 현황
  getActiveCryptoTradeStatus(): { symbol: string; userCount: number; recentOrders: number; totalVolume: number }[] {
    const status: { symbol: string; userCount: number; recentOrders: number; totalVolume: number }[] = [];
    const now = Date.now();

    for (const [symbol, orders] of this.activeOrders) {
      const uniqueUsers = new Set(orders.map(order => order.userId)).size;
      const recentOrders = orders.filter(
        order => now - order.timestamp <= this.TIMING_WINDOW_MS
      ).length;
      
      const totalVolume = orders.reduce((sum, order) => 
        sum + (order.quantity * (order.price || 0)), 0
      );

      status.push({
        symbol,
        userCount: uniqueUsers,
        recentOrders,
        totalVolume
      });
    }

    return status.sort((a, b) => b.totalVolume - a.totalVolume);
  }

  // 10. 정리 작업 (주기적 실행)
  cleanup(): void {
    const now = Date.now();
    const OLD_ORDER_THRESHOLD = 180000; // 3분 이상 된 주문 제거 (암호화폐는 더 빠른 정리)

    for (const [symbol, orders] of this.activeOrders) {
      const activeOrders = orders.filter(
        order => now - order.timestamp <= OLD_ORDER_THRESHOLD
      );

      if (activeOrders.length === 0) {
        this.activeOrders.delete(symbol);
      } else {
        this.activeOrders.set(symbol, activeOrders);
      }
    }

    // 사용자 타이밍 기록도 정리
    for (const [userId, timings] of this.userTimings) {
      const recentTimings = timings.filter(
        timestamp => now - timestamp <= OLD_ORDER_THRESHOLD
      );

      if (recentTimings.length === 0) {
        this.userTimings.delete(userId);
      } else {
        this.userTimings.set(userId, recentTimings);
      }
    }

    console.log('🧹 암호화폐 거래 충돌 관리자 정리 완료');
  }

  // 11. 리스크 레벨별 거래 제한 확인
  checkTierLimitations(userTier: 'free' | 'basic' | 'premium' | 'vip', tradeValue: number): {
    allowed: boolean;
    reason?: string;
    maxAllowed?: number;
  } {
    const tierLimits = {
      free: { maxTradeValue: 1000, maxDailyTrades: 5 },
      basic: { maxTradeValue: 10000, maxDailyTrades: 20 },
      premium: { maxTradeValue: 100000, maxDailyTrades: 100 },
      vip: { maxTradeValue: 1000000, maxDailyTrades: 1000 }
    };

    const limits = tierLimits[userTier];
    
    if (tradeValue > limits.maxTradeValue) {
      return {
        allowed: false,
        reason: `${userTier} 티어 최대 거래금액 초과`,
        maxAllowed: limits.maxTradeValue
      };
    }

    return { allowed: true };
  }

  // 12. 실시간 시장 위험도 평가
  assessMarketRisk(symbol: string): {
    riskLevel: 'low' | 'medium' | 'high' | 'extreme';
    factors: string[];
    recommendation: string;
  } {
    const orders = this.activeOrders.get(symbol) || [];
    const totalUsers = new Set(orders.map(o => o.userId)).size;
    const totalVolume = orders.reduce((sum, order) => 
      sum + (order.quantity * (order.price || 0)), 0
    );

    const factors: string[] = [];
    let riskLevel: 'low' | 'medium' | 'high' | 'extreme' = 'low';

    if (totalUsers > 10) {
      factors.push('높은 사용자 집중도');
      riskLevel = 'medium';
    }

    if (totalVolume > this.WHALE_THRESHOLD * 5) {
      factors.push('고액 거래량 집중');
      riskLevel = 'high';
    }

    if (totalUsers > 20 && totalVolume > this.WHALE_THRESHOLD * 10) {
      factors.push('극도로 높은 시장 압력');
      riskLevel = 'extreme';
    }

    const recommendations = {
      low: '정상 거래 가능',
      medium: '거래량 분산 권장',
      high: '시점 분산 및 분할 주문 강력 권장',
      extreme: '거래 연기 또는 대안 심볼 고려'
    };

    return {
      riskLevel,
      factors,
      recommendation: recommendations[riskLevel]
    };
  }
}

// 싱글톤 인스턴스
export const cryptoTradingConflictManager = new CryptoTradingConflictManager();

// 3분마다 정리 작업 실행 (암호화폐는 더 빠른 주기)
setInterval(() => {
  cryptoTradingConflictManager.cleanup();
}, 180000);

export default CryptoTradingConflictManager;