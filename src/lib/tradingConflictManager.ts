// 🚫 동시 거래 방지 시스템 (Concurrent Trading Prevention System)
// docs/specifications/RISK_MANAGEMENT_SPEC.md 기준 구현

export interface TradeRequest {
  userId: string;
  stockCode: string;
  orderType: 'buy' | 'sell';
  quantity: number;
  price?: number;
  timestamp: number;
}

export interface TradeConflict {
  conflictType: 'same_stock' | 'cluster_risk' | 'timing_collision';
  affectedUsers: string[];
  stockCode: string;
  message: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

export interface AlternativeStock {
  symbol: string;
  name: string;
  similarity: number;
  reason: string;
}

class TradingConflictManager {
  private activeOrders: Map<string, TradeRequest[]> = new Map(); // stockCode -> TradeRequest[]
  private userTimings: Map<string, number[]> = new Map(); // userId -> timestamps[]
  private readonly TIMING_WINDOW_MS = 5000; // 5초 내 동시 주문 감지
  private readonly MAX_SAME_STOCK_USERS = 3; // 동일 종목 최대 사용자 수
  private readonly CLUSTER_THRESHOLD = 0.7; // 클러스터링 임계값

  // 1. 거래 충돌 감지 및 분석
  async detectTradeConflict(tradeRequest: TradeRequest): Promise<TradeConflict | null> {
    const { stockCode, userId, timestamp } = tradeRequest;

    console.log(`🔍 거래 충돌 감지 시작: ${userId} -> ${stockCode}`);

    // 1-1. 동일 종목 거래자 수 체크
    const sameStockOrders = this.activeOrders.get(stockCode) || [];
    const uniqueUsers = new Set(sameStockOrders.map(order => order.userId));
    
    if (uniqueUsers.size >= this.MAX_SAME_STOCK_USERS && !uniqueUsers.has(userId)) {
      return {
        conflictType: 'same_stock',
        affectedUsers: Array.from(uniqueUsers),
        stockCode,
        message: `${stockCode} 종목에 이미 ${uniqueUsers.size}명이 거래 중입니다. 동시 거래 제한.`,
        severity: 'high'
      };
    }

    // 1-2. 타이밍 충돌 감지
    const recentOrders = sameStockOrders.filter(
      order => Math.abs(order.timestamp - timestamp) <= this.TIMING_WINDOW_MS
    );

    if (recentOrders.length >= 2) {
      return {
        conflictType: 'timing_collision',
        affectedUsers: recentOrders.map(order => order.userId),
        stockCode,
        message: `${this.TIMING_WINDOW_MS/1000}초 내 동시 주문 감지. 시장 조작 방지를 위해 거래를 분산합니다.`,
        severity: 'medium'
      };
    }

    // 1-3. AI 클러스터링 위험 감지
    const clusterRisk = await this.detectAIClusterRisk(tradeRequest);
    if (clusterRisk) {
      return clusterRisk;
    }

    console.log(`✅ 거래 충돌 없음: ${userId} -> ${stockCode}`);
    return null;
  }

  // 2. AI 클러스터링 위험 감지
  private async detectAIClusterRisk(tradeRequest: TradeRequest): Promise<TradeConflict | null> {
    // AI 지표 유사성 분석 (RSI, MACD, Bollinger Bands)
    const { stockCode, userId } = tradeRequest;
    
    // 실제 환경에서는 각 사용자의 AI 전략 파라미터를 비교
    // 현재는 시뮬레이션으로 랜덤 유사도 계산
    const aiSimilarity = Math.random();
    
    if (aiSimilarity > this.CLUSTER_THRESHOLD) {
      console.log(`⚠️ AI 클러스터링 위험 감지: ${stockCode} (유사도: ${aiSimilarity.toFixed(2)})`);
      
      return {
        conflictType: 'cluster_risk',
        affectedUsers: [userId],
        stockCode,
        message: `AI 전략이 다른 사용자와 ${(aiSimilarity * 100).toFixed(1)}% 유사합니다. 개별화된 대안을 제안합니다.`,
        severity: 'medium'
      };
    }

    return null;
  }

  // 3. 대안 종목 추천
  async getAlternativeStocks(stockCode: string, count: number = 3): Promise<AlternativeStock[]> {
    // 실제 환경에서는 섹터, 시가총액, 변동성 등을 고려한 유사 종목 추천
    const alternativeStocks: AlternativeStock[] = [
      {
        symbol: '000660',
        name: 'SK하이닉스',
        similarity: 0.85,
        reason: '반도체 섹터, 유사한 변동성'
      },
      {
        symbol: '035420',
        name: 'NAVER',
        similarity: 0.75,
        reason: '대형주, 기술주'
      },
      {
        symbol: '005380',
        name: '현대차',
        similarity: 0.70,
        reason: '제조업, 유사한 시가총액'
      },
      {
        symbol: '006400',
        name: '삼성SDI',
        similarity: 0.68,
        reason: '삼성 계열, 배터리 관련주'
      }
    ];

    // 요청한 종목 제외하고 반환
    return alternativeStocks
      .filter(stock => stock.symbol !== stockCode)
      .slice(0, count);
  }

  // 4. 거래 요청 등록
  async registerTradeRequest(tradeRequest: TradeRequest): Promise<void> {
    const { stockCode, userId, timestamp } = tradeRequest;

    // 주식별 주문 목록에 추가
    if (!this.activeOrders.has(stockCode)) {
      this.activeOrders.set(stockCode, []);
    }
    this.activeOrders.get(stockCode)!.push(tradeRequest);

    // 사용자별 타이밍 기록
    if (!this.userTimings.has(userId)) {
      this.userTimings.set(userId, []);
    }
    this.userTimings.get(userId)!.push(timestamp);

    console.log(`📝 거래 요청 등록: ${userId} -> ${stockCode} (${this.activeOrders.get(stockCode)!.length}건)`);
  }

  // 5. 거래 완료 후 정리
  async completeTradeRequest(userId: string, stockCode: string): Promise<void> {
    const orders = this.activeOrders.get(stockCode) || [];
    const filteredOrders = orders.filter(order => order.userId !== userId);
    
    if (filteredOrders.length === 0) {
      this.activeOrders.delete(stockCode);
    } else {
      this.activeOrders.set(stockCode, filteredOrders);
    }

    console.log(`✅ 거래 완료 처리: ${userId} -> ${stockCode}`);
  }

  // 6. 시간 분산 추천
  getOptimalTradingDelay(stockCode: string): number {
    const orders = this.activeOrders.get(stockCode) || [];
    const baseDelay = 2000; // 기본 2초 지연
    const additionalDelay = orders.length * 1000; // 주문 건수당 1초 추가
    
    return baseDelay + additionalDelay + Math.random() * 1000; // 랜덤 요소 추가
  }

  // 7. 현재 활성 거래 현황
  getActiveTradeStatus(): { stockCode: string; userCount: number; recentOrders: number }[] {
    const status: { stockCode: string; userCount: number; recentOrders: number }[] = [];
    const now = Date.now();

    for (const [stockCode, orders] of this.activeOrders) {
      const uniqueUsers = new Set(orders.map(order => order.userId)).size;
      const recentOrders = orders.filter(
        order => now - order.timestamp <= this.TIMING_WINDOW_MS
      ).length;

      status.push({
        stockCode,
        userCount: uniqueUsers,
        recentOrders
      });
    }

    return status.sort((a, b) => b.userCount - a.userCount);
  }

  // 8. 정리 작업 (주기적 실행)
  cleanup(): void {
    const now = Date.now();
    const OLD_ORDER_THRESHOLD = 300000; // 5분 이상 된 주문 제거

    for (const [stockCode, orders] of this.activeOrders) {
      const activeOrders = orders.filter(
        order => now - order.timestamp <= OLD_ORDER_THRESHOLD
      );

      if (activeOrders.length === 0) {
        this.activeOrders.delete(stockCode);
      } else {
        this.activeOrders.set(stockCode, activeOrders);
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

    console.log('🧹 거래 충돌 관리자 정리 완료');
  }
}

// 싱글톤 인스턴스
export const tradingConflictManager = new TradingConflictManager();

// 5분마다 정리 작업 실행
setInterval(() => {
  tradingConflictManager.cleanup();
}, 300000);

export default TradingConflictManager;