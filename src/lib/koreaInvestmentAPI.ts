// 🏦 한국투자증권 OpenAPI 연동 모듈
// docs/guides/API_INTEGRATION_GUIDE.md 기준으로 구현

export interface StockData {
  symbol: string;
  name: string;
  current_price: number;
  price_change: number;
  price_change_percent: number;
  volume: number;
  last_updated: string;
}

export interface OrderRequest {
  stockCode: string;
  orderType: 'buy' | 'sell';
  quantity: number;
  price?: number; // 지정가 주문시 사용, 생략시 시장가
}

export interface OrderResult {
  success: boolean;
  orderNumber?: string;
  message: string;
  errorCode?: string;
}

export interface AccountBalance {
  totalAsset: number;
  availableCash: number;
  holdings: {
    symbol: string;
    name: string;
    quantity: number;
    avgPrice: number;
    currentPrice: number;
    profitLoss: number;
  }[];
}

export class KoreaInvestmentAPI {
  private accessToken: string = '';
  private baseURL = 'https://openapi.koreainvestment.com:9443';
  private isProduction = false; // 모의투자: false, 실전투자: true
  
  constructor(isProduction: boolean = false) {
    this.isProduction = isProduction;
    // 모의투자 환경
    if (!isProduction) {
      this.baseURL = 'https://openapivts.koreainvestment.com:29443';
    }
  }

  // 1단계: 인증 토큰 발급
  async authenticate(): Promise<string> {
    try {
      console.log('🔐 한국투자증권 API 인증 시작...');
      
      const response = await fetch(`${this.baseURL}/oauth2/tokenP`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          grant_type: 'client_credentials',
          appkey: import.meta.env.VITE_KOREA_INVESTMENT_APP_KEY || '',
          appsecret: import.meta.env.VITE_KOREA_INVESTMENT_APP_SECRET || ''
        })
      });

      if (!response.ok) {
        throw new Error(`인증 실패: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.access_token) {
        this.accessToken = data.access_token;
        console.log('✅ 한국투자증권 API 인증 성공');
        return this.accessToken;
      } else {
        throw new Error(`토큰 발급 실패: ${data.msg1 || '알 수 없는 오류'}`);
      }
    } catch (error) {
      console.error('❌ 한국투자증권 API 인증 실패:', error);
      throw error;
    }
  }

  // 2단계: 주식 현재가 조회
  async getCurrentPrice(stockCode: string): Promise<StockData> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      console.log(`📊 ${stockCode} 현재가 조회 중...`);

      const url = new URL(`${this.baseURL}/uapi/domestic-stock/v1/quotations/inquire-price`);
      url.searchParams.set('FID_COND_MRKT_DIV_CODE', 'J');
      url.searchParams.set('FID_INPUT_ISCD', stockCode);

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'appkey': import.meta.env.VITE_KOREA_INVESTMENT_APP_KEY || '',
          'appsecret': import.meta.env.VITE_KOREA_INVESTMENT_APP_SECRET || '',
          'tr_id': 'FHKST01010100',
          'custtype': 'P'
        }
      });

      if (!response.ok) {
        throw new Error(`시세 조회 실패: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (data.rt_cd !== '0') {
        throw new Error(`API 오류: ${data.msg1}`);
      }

      const output = data.output;
      return {
        symbol: stockCode,
        name: output.hts_kor_isnm || stockCode,
        current_price: parseInt(output.stck_prpr) || 0,
        price_change: parseInt(output.prdy_vrss) || 0,
        price_change_percent: parseFloat(output.prdy_ctrt) || 0,
        volume: parseInt(output.acml_vol) || 0,
        last_updated: new Date().toISOString()
      };
    } catch (error) {
      console.error(`❌ ${stockCode} 시세 조회 실패:`, error);
      throw error;
    }
  }

  // 3단계: 여러 종목 동시 조회
  async getMultipleStocks(stockCodes: string[]): Promise<StockData[]> {
    try {
      console.log(`📊 ${stockCodes.length}개 종목 시세 조회 시작...`);
      
      const promises = stockCodes.map(async (code, index) => {
        // API 호출 간격 조정 (Rate Limiting 방지)
        await new Promise(resolve => setTimeout(resolve, index * 100));
        return this.getCurrentPrice(code);
      });

      const results = await Promise.allSettled(promises);
      
      const successfulResults = results
        .filter((result): result is PromiseFulfilledResult<StockData> => 
          result.status === 'fulfilled'
        )
        .map(result => result.value);

      const failedCount = results.length - successfulResults.length;
      
      if (failedCount > 0) {
        console.warn(`⚠️ ${failedCount}개 종목 조회 실패`);
      }

      console.log(`✅ ${successfulResults.length}개 종목 시세 조회 완료`);
      return successfulResults;
    } catch (error) {
      console.error('❌ 다중 종목 조회 실패:', error);
      throw error;
    }
  }

  // 4단계: 매수 주문 (모의투자)
  async placeBuyOrder(orderRequest: OrderRequest): Promise<OrderResult> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      console.log(`💰 매수 주문: ${orderRequest.stockCode} ${orderRequest.quantity}주`);

      const orderData = {
        CANO: import.meta.env.VITE_KOREA_INVESTMENT_ACCOUNT_NO || '',
        ACNT_PRDT_CD: import.meta.env.VITE_KOREA_INVESTMENT_ACCOUNT_TYPE || '01',
        PDNO: orderRequest.stockCode,
        ORD_DVSN: orderRequest.price ? '00' : '01', // 00: 지정가, 01: 시장가
        ORD_QTY: orderRequest.quantity.toString(),
        ORD_UNPR: orderRequest.price ? orderRequest.price.toString() : '0'
      };

      const response = await fetch(`${this.baseURL}/uapi/domestic-stock/v1/trading/order-cash`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
          'appkey': import.meta.env.VITE_KOREA_INVESTMENT_APP_KEY || '',
          'appsecret': import.meta.env.VITE_KOREA_INVESTMENT_APP_SECRET || '',
          'tr_id': 'VTTC0802U', // 모의투자 매수 (실전: TTTC0802U)
          'custtype': 'P'
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      return {
        success: result.rt_cd === '0',
        orderNumber: result.output?.odno,
        message: result.msg1 || '주문 처리 완료',
        errorCode: result.rt_cd !== '0' ? result.rt_cd : undefined
      };
    } catch (error) {
      console.error('❌ 매수 주문 실패:', error);
      return {
        success: false,
        message: `주문 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
    }
  }

  // 5단계: 매도 주문 (모의투자)
  async placeSellOrder(orderRequest: OrderRequest): Promise<OrderResult> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      console.log(`💸 매도 주문: ${orderRequest.stockCode} ${orderRequest.quantity}주`);

      const orderData = {
        CANO: import.meta.env.VITE_KOREA_INVESTMENT_ACCOUNT_NO || '',
        ACNT_PRDT_CD: import.meta.env.VITE_KOREA_INVESTMENT_ACCOUNT_TYPE || '01',
        PDNO: orderRequest.stockCode,
        ORD_DVSN: orderRequest.price ? '00' : '01',
        ORD_QTY: orderRequest.quantity.toString(),
        ORD_UNPR: orderRequest.price ? orderRequest.price.toString() : '0'
      };

      const response = await fetch(`${this.baseURL}/uapi/domestic-stock/v1/trading/order-cash`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.accessToken}`,
          'appkey': import.meta.env.VITE_KOREA_INVESTMENT_APP_KEY || '',
          'appsecret': import.meta.env.VITE_KOREA_INVESTMENT_APP_SECRET || '',
          'tr_id': 'VTTC0801U', // 모의투자 매도 (실전: TTTC0801U)
          'custtype': 'P'
        },
        body: JSON.stringify(orderData)
      });

      const result = await response.json();

      return {
        success: result.rt_cd === '0',
        orderNumber: result.output?.odno,
        message: result.msg1 || '주문 처리 완료',
        errorCode: result.rt_cd !== '0' ? result.rt_cd : undefined
      };
    } catch (error) {
      console.error('❌ 매도 주문 실패:', error);
      return {
        success: false,
        message: `주문 실패: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
      };
    }
  }

  // 6단계: 계좌 잔고 조회 (모의투자)
  async getAccountBalance(): Promise<AccountBalance> {
    try {
      if (!this.accessToken) {
        await this.authenticate();
      }

      console.log('💰 계좌 잔고 조회 중...');

      const url = new URL(`${this.baseURL}/uapi/domestic-stock/v1/trading/inquire-balance`);
      url.searchParams.set('CANO', import.meta.env.VITE_KOREA_INVESTMENT_ACCOUNT_NO || '');
      url.searchParams.set('ACNT_PRDT_CD', import.meta.env.VITE_KOREA_INVESTMENT_ACCOUNT_TYPE || '01');
      url.searchParams.set('AFHR_FLPR_YN', 'N');
      url.searchParams.set('OFL_YN', '');
      url.searchParams.set('INQR_DVSN', '02');
      url.searchParams.set('UNPR_DVSN', '01');
      url.searchParams.set('FUND_STTL_ICLD_YN', 'N');
      url.searchParams.set('FNCG_AMT_AUTO_RDPT_YN', 'N');
      url.searchParams.set('PRCS_DVSN', '01');
      url.searchParams.set('CTX_AREA_FK100', '');
      url.searchParams.set('CTX_AREA_NK100', '');

      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'appkey': import.meta.env.VITE_KOREA_INVESTMENT_APP_KEY || '',
          'appsecret': import.meta.env.VITE_KOREA_INVESTMENT_APP_SECRET || '',
          'tr_id': 'VTTC8434R', // 모의투자 잔고조회 (실전: TTTC8434R)
          'custtype': 'P'
        }
      });

      const data = await response.json();

      if (data.rt_cd !== '0') {
        throw new Error(`잔고 조회 실패: ${data.msg1}`);
      }

      const summary = data.output2?.[0] || {};
      const holdings = (data.output1 || []).map((item: any) => ({
        symbol: item.pdno,
        name: item.prdt_name,
        quantity: parseInt(item.hldg_qty) || 0,
        avgPrice: parseInt(item.pchs_avg_pric) || 0,
        currentPrice: parseInt(item.prpr) || 0,
        profitLoss: parseInt(item.evlu_pfls_amt) || 0
      }));

      return {
        totalAsset: parseInt(summary.tot_evlu_amt) || 0,
        availableCash: parseInt(summary.nxdy_excc_amt) || 0,
        holdings
      };
    } catch (error) {
      console.error('❌ 계좌 조회 실패:', error);
      throw error;
    }
  }

  // 7단계: API 연결 테스트
  async testConnection(): Promise<boolean> {
    try {
      console.log('🔍 한국투자증권 API 연결 테스트 시작...');
      
      // 1. 인증 테스트
      await this.authenticate();
      
      // 2. 간단한 시세 조회 테스트 (삼성전자)
      const testStock = await this.getCurrentPrice('005930');
      
      if (testStock.current_price > 0) {
        console.log('✅ API 연결 테스트 성공:', testStock);
        return true;
      } else {
        console.warn('⚠️ API 연결은 되지만 데이터가 이상함');
        return false;
      }
    } catch (error) {
      console.error('❌ API 연결 테스트 실패:', error);
      return false;
    }
  }
}

// 기본 인스턴스 생성 (모의투자)
export const koreaInvestmentAPI = new KoreaInvestmentAPI(false);

export default KoreaInvestmentAPI;