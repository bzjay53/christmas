/**
 * 한국투자증권 KIS API 클라이언트
 * Christmas Trading Backend Service
 */
const axios = require('axios');

class KISApiClient {
  constructor() {
    // 환경에 따른 기본 URL 설정
    this.baseURL = process.env.KIS_MOCK_MODE === 'true' 
      ? 'https://openapivts.koreainvestment.com:29443'  // 모의투자
      : 'https://openapi.koreainvestment.com:9443';      // 실전투자
    
    // API 키 설정
    this.appKey = process.env.KIS_MOCK_MODE === 'true'
      ? process.env.KIS_DEMO_APP_KEY
      : process.env.KIS_REAL_APP_KEY;
      
    this.appSecret = process.env.KIS_MOCK_MODE === 'true'
      ? process.env.KIS_DEMO_APP_SECRET
      : process.env.KIS_REAL_APP_SECRET;
      
    // 토큰 관리
    this.accessToken = null;
    this.tokenExpiry = null;
    
    console.log(`🔧 KIS API 클라이언트 초기화: ${process.env.KIS_MOCK_MODE === 'true' ? '모의투자' : '실전투자'} 모드`);
  }

  // OAuth 토큰 발급
  async getAccessToken() {
    // 기존 토큰이 유효한 경우 재사용
    if (this.accessToken && this.tokenExpiry > Date.now()) {
      return this.accessToken;
    }

    try {
      console.log('🔑 KIS API 토큰 발급 시도...');
      
      const response = await axios.post(`${this.baseURL}/oauth2/tokenP`, {
        grant_type: "client_credentials",
        appkey: this.appKey,
        appsecret: this.appSecret
      }, {
        headers: {
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10초 타임아웃
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      console.log('✅ KIS API 토큰 발급 성공');
      return this.accessToken;
    } catch (error) {
      console.error('❌ KIS API 토큰 발급 실패:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw new Error(`KIS API 토큰 발급 실패: ${error.message}`);
    }
  }

  // 계좌 잔고 조회
  async getAccountBalance(accountNumber) {
    const token = await this.getAccessToken();
    
    try {
      console.log(`💰 계좌 잔고 조회: ${accountNumber}`);
      
      const response = await axios.get(`${this.baseURL}/uapi/domestic-stock/v1/trading/inquire-balance`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'appkey': this.appKey,
          'appsecret': this.appSecret,
          'tr_id': process.env.KIS_MOCK_MODE === 'true' ? 'VTTC8434R' : 'TTTC8434R'
        },
        params: {
          CANO: accountNumber.split('-')[0],
          ACNT_PRDT_CD: accountNumber.split('-')[1],
          AFHR_FLPR_YN: 'N',
          OFL_YN: '',
          INQR_DVSN: '02',
          UNPR_DVSN: '01',
          FUND_STTL_ICLD_YN: 'N',
          FNCG_AMT_AUTO_RDPT_YN: 'N',
          PRCS_DVSN: '01',
          CTX_AREA_FK100: '',
          CTX_AREA_NK100: ''
        },
        timeout: 10000
      });

      console.log('✅ 계좌 잔고 조회 성공');
      return response.data;
    } catch (error) {
      console.error('❌ 계좌 잔고 조회 실패:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw new Error(`계좌 잔고 조회 실패: ${error.message}`);
    }
  }

  // 주식 현재가 조회
  async getCurrentPrice(stockCode) {
    const token = await this.getAccessToken();
    
    try {
      console.log(`📈 주식 현재가 조회: ${stockCode}`);
      
      const response = await axios.get(`${this.baseURL}/uapi/domestic-stock/v1/quotations/inquire-price`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'appkey': this.appKey,
          'appsecret': this.appSecret,
          'tr_id': 'FHKST01010100'
        },
        params: {
          FID_COND_MRKT_DIV_CODE: 'J',
          FID_INPUT_ISCD: stockCode
        },
        timeout: 10000
      });

      console.log(`✅ ${stockCode} 현재가 조회 성공: ${response.data.output.stck_prpr}원`);
      return response.data;
    } catch (error) {
      console.error(`❌ ${stockCode} 현재가 조회 실패:`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw new Error(`주식 현재가 조회 실패 (${stockCode}): ${error.message}`);
    }
  }

  // 주식 주문 (매수/매도)
  async placeOrder(orderData) {
    const token = await this.getAccessToken();
    const { accountNumber, stockCode, orderType, quantity, price } = orderData;
    
    // 주문 구분 코드
    const trId = process.env.KIS_MOCK_MODE === 'true' 
      ? (orderType === 'buy' ? 'VTTC0802U' : 'VTTC0801U')  // 모의투자
      : (orderType === 'buy' ? 'TTTC0802U' : 'TTTC0801U'); // 실전투자

    try {
      console.log(`📝 주문 실행: ${orderType === 'buy' ? '매수' : '매도'} ${stockCode} ${quantity}주 ${price ? price + '원' : '시장가'}`);
      
      const response = await axios.post(`${this.baseURL}/uapi/domestic-stock/v1/trading/order-cash`, {
        CANO: accountNumber.split('-')[0],
        ACNT_PRDT_CD: accountNumber.split('-')[1],
        PDNO: stockCode,
        ORD_DVSN: price ? '00' : '01', // 00: 지정가, 01: 시장가
        ORD_QTY: quantity.toString(),
        ORD_UNPR: price ? price.toString() : '0'
      }, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'appkey': this.appKey,
          'appsecret': this.appSecret,
          'tr_id': trId,
          'custtype': 'P',
          'Content-Type': 'application/json'
        },
        timeout: 10000
      });

      console.log(`✅ ${orderType === 'buy' ? '매수' : '매도'} 주문 완료: 주문번호 ${response.data.output.ODNO}`);
      return response.data;
    } catch (error) {
      console.error(`❌ 주문 실행 실패 (${stockCode}):`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw new Error(`주문 실행 실패 (${stockCode}): ${error.message}`);
    }
  }

  // 체결 내역 조회
  async getOrderHistory(accountNumber, startDate, endDate) {
    const token = await this.getAccessToken();
    
    try {
      console.log(`📋 체결 내역 조회: ${startDate} ~ ${endDate}`);
      
      const response = await axios.get(`${this.baseURL}/uapi/domestic-stock/v1/trading/inquire-daily-ccld`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'appkey': this.appKey,
          'appsecret': this.appSecret,
          'tr_id': process.env.KIS_MOCK_MODE === 'true' ? 'VTTC8001R' : 'TTTC8001R'
        },
        params: {
          CANO: accountNumber.split('-')[0],
          ACNT_PRDT_CD: accountNumber.split('-')[1],
          INQR_STRT_DT: startDate,
          INQR_END_DT: endDate,
          SLL_BUY_DVSN_CD: '00', // 00: 전체, 01: 매도, 02: 매수
          INQR_DVSN: '00',
          PDNO: '',
          CCLD_DVSN: '00',
          ORD_GNO_BRNO: '',
          ODNO: '',
          INQR_DVSN_3: '00',
          INQR_DVSN_1: '',
          CTX_AREA_FK100: '',
          CTX_AREA_NK100: ''
        },
        timeout: 10000
      });

      console.log('✅ 체결 내역 조회 성공');
      return response.data;
    } catch (error) {
      console.error('❌ 체결 내역 조회 실패:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw new Error(`체결 내역 조회 실패: ${error.message}`);
    }
  }

  // 주식 종목 검색
  async searchStock(keyword) {
    const token = await this.getAccessToken();
    
    try {
      console.log(`🔍 종목 검색: ${keyword}`);
      
      const response = await axios.get(`${this.baseURL}/uapi/domestic-stock/v1/quotations/search-stock-info`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'appkey': this.appKey,
          'appsecret': this.appSecret,
          'tr_id': 'CTPF1702R'
        },
        params: {
          PRDT_TYPE_CD: '300',
          MICR_NO: keyword
        },
        timeout: 10000
      });

      console.log(`✅ 종목 검색 완료: ${response.data.output.length}개 결과`);
      return response.data;
    } catch (error) {
      console.error(`❌ 종목 검색 실패 (${keyword}):`, {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      throw new Error(`종목 검색 실패: ${error.message}`);
    }
  }

  // API 연결 상태 확인
  async checkConnection() {
    try {
      const token = await this.getAccessToken();
      return {
        connected: true,
        mode: process.env.KIS_MOCK_MODE === 'true' ? 'mock' : 'real',
        hasToken: !!token,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        connected: false,
        mode: process.env.KIS_MOCK_MODE === 'true' ? 'mock' : 'real',
        hasToken: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }
  }

  // 리스크 관리 체크
  validateOrder(orderData, userSettings = {}) {
    const { quantity, price, stockCode } = orderData;
    const maxPositionSize = userSettings.maxPositionSize || 1000000; // 기본 100만원
    const maxDailyTrades = userSettings.maxDailyTrades || 50;
    
    const orderAmount = quantity * (price || 0);
    
    // 검증 규칙
    const validations = [];
    
    if (orderAmount > maxPositionSize) {
      validations.push(`주문금액(${orderAmount}원)이 최대 허용금액(${maxPositionSize}원)을 초과합니다.`);
    }
    
    if (quantity <= 0) {
      validations.push('주문수량은 0보다 커야 합니다.');
    }
    
    if (price && price <= 0) {
      validations.push('주문가격은 0보다 커야 합니다.');
    }
    
    if (!stockCode || stockCode.length !== 6) {
      validations.push('유효하지 않은 종목코드입니다.');
    }
    
    return {
      valid: validations.length === 0,
      errors: validations
    };
  }
}

// 싱글톤 인스턴스
let kisApiInstance = null;

function getKISApiClient() {
  if (!kisApiInstance) {
    kisApiInstance = new KISApiClient();
  }
  return kisApiInstance;
}

module.exports = {
  KISApiClient,
  getKISApiClient
}; 