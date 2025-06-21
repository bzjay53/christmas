# KIS API 실거래 연동 가이드

## 📌 개요
Christmas Trading 시스템과 한국투자증권(KIS) API를 연동하여 실제 주식 자동매매를 구현하는 가이드입니다.

## 🔑 1단계: KIS API 키 발급

### 1.1 한국투자증권 계좌 개설
1. [한국투자증권 홈페이지](https://securities.koreainvestment.com) 접속
2. 비대면 계좌 개설 (신분증, 핸드폰 인증 필요)
3. 주식계좌 개설 완료 (보통 1-2일 소요)

### 1.2 KIS API 신청
1. **KIS Developers** 접속: https://apiportal.koreainvestment.com
2. **"회원가입"** 후 **"APP 생성"** 선택
3. 필수 정보 입력:
   ```
   앱 이름: Christmas Trading Bot
   서비스 구분: 개인투자자
   사용 목적: 자동매매 프로그램
   ```

### 1.3 API 키 정보 확인
승인 후 다음 정보를 확인:
```
APP Key: P-xxxxxxxxxxxxxxxxxxxxxx
APP Secret: xxxxxxxxxxxxxxxxxxxxxx
계좌번호: 50123456-01
```

## 🔧 2단계: 시스템 환경 설정

### 2.1 환경 변수 설정
```bash
# web-dashboard/.env
VITE_KIS_REAL_APP_KEY=P-xxxxxxxxxxxxxxxxxxxxxx
VITE_KIS_REAL_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxx
VITE_KIS_DEMO_APP_KEY=DEMO-xxxxxxxxxxxxxxxxxxxxxx
VITE_KIS_DEMO_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxx
VITE_KIS_ACCOUNT_NUMBER=50123456-01
VITE_KIS_MOCK_MODE=true

# backend/.env
KIS_REAL_APP_KEY=P-xxxxxxxxxxxxxxxxxxxxxx
KIS_REAL_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxx
KIS_DEMO_APP_KEY=DEMO-xxxxxxxxxxxxxxxxxxxxxx
KIS_DEMO_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxx
KIS_ACCOUNT_NUMBER=50123456-01
KIS_MOCK_MODE=true
```

### 2.2 KIS API 클라이언트 모듈 구현

#### 2.2.1 백엔드 KIS 클라이언트 (backend/services/kisApi.js)
```javascript
/**
 * 한국투자증권 KIS API 클라이언트
 */
const axios = require('axios');

class KISApiClient {
  constructor() {
    this.baseURL = process.env.KIS_MOCK_MODE === 'true' 
      ? 'https://openapivts.koreainvestment.com:29443'  // 모의투자
      : 'https://openapi.koreainvestment.com:9443';      // 실전투자
    
    this.appKey = process.env.KIS_MOCK_MODE === 'true'
      ? process.env.KIS_DEMO_APP_KEY
      : process.env.KIS_REAL_APP_KEY;
      
    this.appSecret = process.env.KIS_MOCK_MODE === 'true'
      ? process.env.KIS_DEMO_APP_SECRET
      : process.env.KIS_REAL_APP_SECRET;
      
    this.accessToken = null;
    this.tokenExpiry = null;
  }

  // OAuth 토큰 발급
  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry > Date.now()) {
      return this.accessToken;
    }

    try {
      const response = await axios.post(`${this.baseURL}/oauth2/tokenP`, {
        grant_type: "client_credentials",
        appkey: this.appKey,
        appsecret: this.appSecret
      }, {
        headers: {
          'Content-Type': 'application/json'
        }
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = Date.now() + (response.data.expires_in * 1000);
      
      console.log('✅ KIS API 토큰 발급 성공');
      return this.accessToken;
    } catch (error) {
      console.error('❌ KIS API 토큰 발급 실패:', error);
      throw error;
    }
  }

  // 계좌 잔고 조회
  async getAccountBalance(accountNumber) {
    const token = await this.getAccessToken();
    
    try {
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
        }
      });

      return response.data;
    } catch (error) {
      console.error('❌ 계좌 잔고 조회 실패:', error);
      throw error;
    }
  }

  // 주식 현재가 조회
  async getCurrentPrice(stockCode) {
    const token = await this.getAccessToken();
    
    try {
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
        }
      });

      return response.data;
    } catch (error) {
      console.error(`❌ ${stockCode} 현재가 조회 실패:`, error);
      throw error;
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
        }
      });

      console.log(`✅ ${orderType === 'buy' ? '매수' : '매도'} 주문 완료:`, response.data);
      return response.data;
    } catch (error) {
      console.error(`❌ 주문 실행 실패 (${stockCode}):`, error);
      throw error;
    }
  }

  // 체결 내역 조회
  async getOrderHistory(accountNumber, startDate, endDate) {
    const token = await this.getAccessToken();
    
    try {
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
        }
      });

      return response.data;
    } catch (error) {
      console.error('❌ 체결 내역 조회 실패:', error);
      throw error;
    }
  }
}

module.exports = KISApiClient;
```

#### 2.2.2 프론트엔드 KIS 설정 UI 컴포넌트
Dashboard에 KIS API 설정 섹션을 추가하겠습니다.

## 🧪 3단계: 테스트 환경 구축

### 3.1 모의투자 계좌 설정
1. KIS Developers에서 **"모의투자 신청"**
2. 모의투자 전용 APP Key 발급 받기
3. 가상 자금 1억원으로 테스트

### 3.2 API 연동 테스트 시나리오
```javascript
// 테스트 시나리오 예시
async function testKISIntegration() {
  const kis = new KISApiClient();
  
  // 1. 토큰 발급 테스트
  const token = await kis.getAccessToken();
  console.log('토큰 발급:', token);
  
  // 2. 계좌 잔고 조회
  const balance = await kis.getAccountBalance('50123456-01');
  console.log('계좌 잔고:', balance);
  
  // 3. 삼성전자 현재가 조회
  const price = await kis.getCurrentPrice('005930');
  console.log('삼성전자 현재가:', price);
  
  // 4. 모의 매수 주문 (1주)
  const order = await kis.placeOrder({
    accountNumber: '50123456-01',
    stockCode: '005930',
    orderType: 'buy',
    quantity: 1,
    price: null // 시장가
  });
  console.log('매수 주문:', order);
}
```

## 🛡️ 4단계: 보안 및 리스크 관리

### 4.1 API 키 보안
- ✅ 환경 변수로 안전하게 저장
- ✅ GitHub에 절대 업로드하지 않기
- ✅ 프로덕션/개발 환경 분리
- ✅ 정기적인 키 갱신

### 4.2 거래 리스크 관리
```javascript
// 리스크 관리 설정
const RISK_SETTINGS = {
  MAX_DAILY_LOSS: -100000,      // 일일 최대 손실 10만원
  MAX_POSITION_SIZE: 1000000,   // 개별 종목 최대 투자금 100만원
  MAX_DAILY_TRADES: 50,         // 일일 최대 거래 횟수
  STOP_LOSS_RATIO: 0.03,        // 손절매 비율 3%
  TAKE_PROFIT_RATIO: 0.05       // 익절 비율 5%
};
```

### 4.3 오류 처리 및 로깅
```javascript
// 거래 로깅 시스템
async function logTrade(tradeData) {
  await supabase
    .from('trade_records')
    .insert({
      user_id: tradeData.userId,
      symbol: tradeData.symbol,
      side: tradeData.side,
      quantity: tradeData.quantity,
      price: tradeData.price,
      amount: tradeData.amount,
      kis_order_id: tradeData.kisOrderId,
      status: tradeData.status,
      error_message: tradeData.error
    });
}
```

## 🚀 5단계: 자동매매 전략 통합

### 5.1 전략별 KIS API 연동
```javascript
// 전략별 주문 실행
class TradingStrategy {
  constructor(strategyType) {
    this.type = strategyType; // 'aggressive', 'neutral', 'defensive'
    this.kis = new KISApiClient();
  }

  async executeSignal(signal) {
    const { symbol, action, confidence, price } = signal;
    
    // 전략별 포지션 크기 결정
    const positionSize = this.calculatePositionSize(confidence);
    
    if (action === 'BUY') {
      return await this.kis.placeOrder({
        accountNumber: process.env.KIS_ACCOUNT_NUMBER,
        stockCode: symbol,
        orderType: 'buy',
        quantity: positionSize,
        price: price
      });
    } else if (action === 'SELL') {
      return await this.kis.placeOrder({
        accountNumber: process.env.KIS_ACCOUNT_NUMBER,
        stockCode: symbol,
        orderType: 'sell',
        quantity: positionSize,
        price: price
      });
    }
  }
}
```

## 📊 6단계: 실시간 모니터링

### 6.1 WebSocket을 통한 실시간 데이터
```javascript
// KIS WebSocket 연결 (호가, 체결 실시간 수신)
class KISWebSocket {
  constructor() {
    this.ws = null;
    this.subscriptions = new Map();
  }

  connect() {
    this.ws = new WebSocket('ws://ops.koreainvestment.com:21000');
    
    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.handleRealtimeData(data);
    };
  }

  // 실시간 호가 구독
  subscribePrice(stockCode) {
    const message = {
      header: {
        approval_key: this.approvalKey,
        custtype: 'P',
        tr_type: '1',
        content_type: 'utf-8'
      },
      body: {
        input: {
          tr_id: 'H0STCNT0',
          tr_key: stockCode
        }
      }
    };
    
    this.ws.send(JSON.stringify(message));
  }
}
```

## ✅ 7단계: 프로덕션 배포

### 7.1 배포 전 체크리스트
- [ ] 모의투자에서 최소 1주일 안정성 테스트
- [ ] 모든 에러 케이스 처리 확인
- [ ] 리스크 관리 시스템 동작 확인
- [ ] 로깅 시스템 정상 작동 확인
- [ ] 실시간 알림 시스템 테스트

### 7.2 실전 투자 전환
```bash
# 환경 변수 변경 (모의투자 → 실전투자)
KIS_MOCK_MODE=false
KIS_REAL_APP_KEY=P-xxxxxxxxxxxxxxxxxxxxxx
KIS_REAL_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxx
```

### 7.3 모니터링 및 알림
- 📱 텔레그램 실시간 거래 알림
- 📧 이메일 일일 거래 보고서
- 📊 Grafana 대시보드 모니터링
- 🚨 손실 한도 도달 시 자동 중단

## 🔄 8단계: 지속적인 개선

### 8.1 성과 분석
- 전략별 수익률 비교
- 시장 상황별 성과 분석
- 리스크 대비 수익률 최적화

### 8.2 전략 고도화
- AI 모델 학습 데이터 누적
- 시장 변동성에 따른 전략 조정
- 백테스팅 결과 반영

---

**⚠️ 중요 주의사항**
- 실전 투자 전 반드시 모의투자에서 충분한 테스트 필요
- 투자 리스크 관리는 본인 책임
- KIS API 사용량 제한 확인 필수 