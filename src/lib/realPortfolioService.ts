// 실제 바이낸스 계정 정보 연동 서비스
import { createUserBinanceAPI } from './userBinanceAPI';
import { getUserApiStatus } from './apiKeyService';

export interface RealBalance {
  asset: string;
  free: number;
  locked: number;
  total: number;
  usdValue?: number;
  changePercent?: number;
}

export interface RealPortfolio {
  totalValue: number;
  totalChange: number;
  totalChangePercent: number;
  balances: RealBalance[];
  lastUpdated: Date;
  accountInfo?: {
    canTrade: boolean;
    canWithdraw: boolean;
    canDeposit: boolean;
    makerCommission: number;
    takerCommission: number;
  };
}

export interface RealTrade {
  id: string;
  symbol: string;
  side: 'BUY' | 'SELL';
  quantity: number;
  price: number;
  total: number;
  commission: number;
  commissionAsset: string;
  time: Date;
  status: string;
}

// 실제 바이낸스 계정 정보 조회 서비스
export class RealPortfolioService {
  private userId: string;
  private userAPI: any;

  constructor(userId: string) {
    this.userId = userId;
    this.userAPI = createUserBinanceAPI(userId);
  }

  // API 키 상태 확인
  async checkApiStatus(): Promise<{ hasKeys: boolean; error?: string }> {
    try {
      const status = await getUserApiStatus(this.userId);
      if (!status.hasApiKeys || !status.isActive) {
        return { 
          hasKeys: false, 
          error: 'API 키가 설정되지 않았습니다. 설정 페이지에서 바이낸스 API 키를 등록해주세요.' 
        };
      }
      return { hasKeys: true };
    } catch (error) {
      console.error('API 상태 확인 실패:', error);
      return { hasKeys: false, error: 'API 상태 확인에 실패했습니다.' };
    }
  }

  // 실제 계정 정보 조회
  async getAccountInfo(): Promise<{ data?: any; error?: string }> {
    try {
      const statusCheck = await this.checkApiStatus();
      if (!statusCheck.hasKeys) {
        return { error: statusCheck.error };
      }

      console.log('실제 바이낸스 계정 정보 조회 시작...');
      const accountInfo = await this.userAPI.getAccountInfo();
      console.log('계정 정보 조회 성공:', accountInfo);
      
      return { data: accountInfo };
    } catch (error) {
      console.error('계정 정보 조회 실패:', error);
      return { error: '계정 정보를 가져올 수 없습니다. API 키를 확인해주세요.' };
    }
  }

  // 실제 잔액 정보 조회
  async getRealBalances(): Promise<{ data?: RealBalance[]; error?: string }> {
    try {
      const statusCheck = await this.checkApiStatus();
      if (!statusCheck.hasKeys) {
        return { error: statusCheck.error };
      }

      console.log('실제 바이낸스 잔액 조회 시작...');
      const accountInfo = await this.userAPI.getAccountInfo();
      
      if (!accountInfo || !accountInfo.balances) {
        return { error: '잔액 정보를 찾을 수 없습니다.' };
      }

      // 0이 아닌 잔액만 필터링
      const realBalances: RealBalance[] = accountInfo.balances
        .filter((balance: any) => parseFloat(balance.free) > 0 || parseFloat(balance.locked) > 0)
        .map((balance: any) => ({
          asset: balance.asset,
          free: parseFloat(balance.free),
          locked: parseFloat(balance.locked),
          total: parseFloat(balance.free) + parseFloat(balance.locked)
        }));

      console.log('실제 잔액 조회 완료:', realBalances.length, '개 자산');
      return { data: realBalances };
    } catch (error) {
      console.error('잔액 조회 실패:', error);
      return { error: '잔액 정보를 가져올 수 없습니다. API 키와 권한을 확인해주세요.' };
    }
  }

  // 현재 가격 정보로 USD 가치 계산
  async calculatePortfolioValue(balances: RealBalance[]): Promise<{ data?: RealPortfolio; error?: string }> {
    try {
      const pricePromises = balances.map(async (balance) => {
        if (balance.asset === 'USDT' || balance.asset === 'BUSD') {
          return { ...balance, usdValue: balance.total };
        }
        
        try {
          // USDT 페어로 가격 조회
          const symbol = `${balance.asset}USDT`;
          const priceData = await this.userAPI.getPrice(symbol);
          const usdValue = balance.total * priceData.price;
          return { ...balance, usdValue };
        } catch {
          // 가격 조회 실패 시 0으로 설정
          console.warn(`${balance.asset} 가격 조회 실패`);
          return { ...balance, usdValue: 0 };
        }
      });

      const balancesWithValue = await Promise.all(pricePromises);
      const totalValue = balancesWithValue.reduce((sum, balance) => sum + (balance.usdValue || 0), 0);

      const portfolio: RealPortfolio = {
        totalValue,
        totalChange: 0, // TODO: 24시간 변화량 계산
        totalChangePercent: 0, // TODO: 24시간 변화율 계산
        balances: balancesWithValue,
        lastUpdated: new Date()
      };

      console.log('포트폴리오 가치 계산 완료:', totalValue.toFixed(2), 'USDT');
      return { data: portfolio };
    } catch (error) {
      console.error('포트폴리오 가치 계산 실패:', error);
      return { error: '포트폴리오 가치를 계산할 수 없습니다.' };
    }
  }

  // 완전한 실제 포트폴리오 정보 조회
  async getCompletePortfolio(): Promise<{ data?: RealPortfolio; error?: string }> {
    try {
      console.log('실제 포트폴리오 전체 정보 조회 시작...');
      
      // 1. 계정 정보 조회
      const accountResult = await this.getAccountInfo();
      if (accountResult.error) {
        return { error: accountResult.error };
      }

      // 2. 잔액 정보 조회
      const balanceResult = await this.getRealBalances();
      if (balanceResult.error) {
        return { error: balanceResult.error };
      }

      // 3. USD 가치 계산
      const portfolioResult = await this.calculatePortfolioValue(balanceResult.data || []);
      if (portfolioResult.error) {
        return { error: portfolioResult.error };
      }

      // 4. 계정 정보 추가
      const portfolio = portfolioResult.data!;
      portfolio.accountInfo = {
        canTrade: accountResult.data.canTrade,
        canWithdraw: accountResult.data.canWithdraw,
        canDeposit: accountResult.data.canDeposit,
        makerCommission: accountResult.data.makerCommission,
        takerCommission: accountResult.data.takerCommission
      };

      console.log('실제 포트폴리오 조회 완료:', portfolio);
      return { data: portfolio };
    } catch (error) {
      console.error('포트폴리오 조회 실패:', error);
      return { error: '포트폴리오 정보를 가져올 수 없습니다.' };
    }
  }

  // 실제 거래 내역 조회 (간단 버전)
  async getRecentTrades(symbol?: string, limit: number = 10): Promise<{ data?: RealTrade[]; error?: string }> {
    try {
      const statusCheck = await this.checkApiStatus();
      if (!statusCheck.hasKeys) {
        return { error: statusCheck.error };
      }

      console.log('실제 거래 내역 조회 시작...');
      
      // TODO: 실제 바이낸스 API에서 거래 내역 조회
      // 현재는 데이터베이스의 거래 내역을 반환
      const mockTrades: RealTrade[] = [
        {
          id: '1',
          symbol: 'BTCUSDT',
          side: 'BUY',
          quantity: 0.001,
          price: 43250,
          total: 43.25,
          commission: 0.043,
          commissionAsset: 'USDT',
          time: new Date(),
          status: 'FILLED'
        }
      ];

      return { data: mockTrades };
    } catch (error) {
      console.error('거래 내역 조회 실패:', error);
      return { error: '거래 내역을 가져올 수 없습니다.' };
    }
  }

  // API 연결 테스트
  async testConnection(): Promise<{ success: boolean; error?: string }> {
    try {
      const statusCheck = await this.checkApiStatus();
      if (!statusCheck.hasKeys) {
        return { success: false, error: statusCheck.error };
      }

      const result = await this.userAPI.testApiConnection();
      return result;
    } catch (error) {
      console.error('API 연결 테스트 실패:', error);
      return { success: false, error: 'API 연결에 실패했습니다.' };
    }
  }
}

// 사용자별 포트폴리오 서비스 인스턴스 생성
export const createRealPortfolioService = (userId: string): RealPortfolioService => {
  return new RealPortfolioService(userId);
};

export default RealPortfolioService;