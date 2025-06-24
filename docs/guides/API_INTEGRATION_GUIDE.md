# 🏦 한국투자증권 API 연동 가이드

## 📅 **작성일**: 2025-06-24 UTC

---

## 🎯 **연동 목표**

### **핵심 미션**
Mock 데이터를 **한국투자증권 OpenAPI**로 완전 교체하여 실제 시장 데이터 기반 거래 시스템 구축

### **API 선택 근거**
- **한국투자증권 OpenAPI**: 개인투자자 무료 제공
- **실시간 시세**: 1초 단위 업데이트 지원
- **주문 처리**: 실제 매수/매도 가능
- **계좌 연동**: 잔고/보유종목 실시간 조회

---

## 🔧 **API 설정 및 인증**

### **1단계: API 키 발급**
```bash
# 한국투자증권 홈페이지에서 신청
# 1. 계좌 개설 (모의투자 계좌도 가능)
# 2. OpenAPI 신청서 작성
# 3. APP KEY, APP SECRET 발급받기
```

### **2단계: 환경 변수 설정**
```env
# .env 파일에 추가
KOREA_INVESTMENT_APP_KEY=your_app_key_here
KOREA_INVESTMENT_APP_SECRET=your_app_secret_here
KOREA_INVESTMENT_ACCOUNT_NO=your_account_number
KOREA_INVESTMENT_ACCOUNT_TYPE=01  # 실전투자계좌: 01, 모의투자계좌: 02
```

### **3단계: 인증 토큰 발급**
```javascript
// src/lib/koreaInvestmentAPI.ts
export class KoreaInvestmentAPI {
  private accessToken: string = '';
  private baseURL = 'https://openapi.koreainvestment.com:9443';
  
  async authenticate() {
    const response = await fetch(`${this.baseURL}/oauth2/tokenP`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'client_credentials',
        appkey: process.env.KOREA_INVESTMENT_APP_KEY,
        appsecret: process.env.KOREA_INVESTMENT_APP_SECRET
      })
    });
    
    const data = await response.json();
    this.accessToken = data.access_token;
    return this.accessToken;
  }
}
```

---

## 📊 **실시간 시세 조회**

### **주식 현재가 조회**
```javascript
async getCurrentPrice(stockCode: string) {
  const response = await fetch(
    `${this.baseURL}/uapi/domestic-stock/v1/quotations/inquire-price`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${this.accessToken}`,
      'appkey': process.env.KOREA_INVESTMENT_APP_KEY,
      'appsecret': process.env.KOREA_INVESTMENT_APP_SECRET,
      'tr_id': 'FHKST01010100',
      'custtype': 'P'
    },
    params: {
      'FID_COND_MRKT_DIV_CODE': 'J',
      'FID_INPUT_ISCD': stockCode  // 예: '005930' (삼성전자)
    }
  });
  
  const data = await response.json();
  return {
    symbol: stockCode,
    current_price: parseInt(data.output.stck_prpr),
    price_change: parseInt(data.output.prdy_vrss),
    price_change_percent: parseFloat(data.output.prdy_ctrt),
    volume: parseInt(data.output.acml_vol),
    last_updated: new Date().toISOString()
  };
}
```

### **실시간 시세 WebSocket**
```javascript
async subscribeRealTimePrice(stockCodes: string[], callback: Function) {
  const ws = new WebSocket('ws://ops.koreainvestment.com:21000');
  
  ws.onopen = () => {
    // 실시간 시세 구독 요청
    stockCodes.forEach(code => {
      ws.send(JSON.stringify({
        header: {
          approval_key: this.accessToken,
          custtype: 'P',
          tr_type: '1',  // 등록
          content_type: 'utf-8'
        },
        body: {
          input: {
            tr_id: 'H0STCNT0',
            tr_key: code
          }
        }
      }));
    });
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    callback(data);
  };
}
```

---

## 💱 **주문 처리 시스템**

### **매수 주문**
```javascript
async placeBuyOrder(stockCode: string, quantity: number, price?: number) {
  const orderData = {
    CANO: process.env.KOREA_INVESTMENT_ACCOUNT_NO,
    ACNT_PRDT_CD: process.env.KOREA_INVESTMENT_ACCOUNT_TYPE,
    PDNO: stockCode,
    ORD_DVSN: price ? '00' : '01',  // 00: 지정가, 01: 시장가
    ORD_QTY: quantity.toString(),
    ORD_UNPR: price ? price.toString() : '0'
  };
  
  const response = await fetch(
    `${this.baseURL}/uapi/domestic-stock/v1/trading/order-cash`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.accessToken}`,
      'appkey': process.env.KOREA_INVESTMENT_APP_KEY,
      'appsecret': process.env.KOREA_INVESTMENT_APP_SECRET,
      'tr_id': 'TTTC0802U',  // 현금 매수 주문
      'custtype': 'P'
    },
    body: JSON.stringify(orderData)
  });
  
  const result = await response.json();
  return {
    success: result.rt_cd === '0',
    orderNumber: result.output?.KRX_FWDG_ORD_ORGNO,
    message: result.msg1
  };
}
```

### **매도 주문**
```javascript
async placeSellOrder(stockCode: string, quantity: number, price?: number) {
  // 매수와 유사하지만 tr_id가 'TTTC0801U' (현금 매도)
  const orderData = {
    CANO: process.env.KOREA_INVESTMENT_ACCOUNT_NO,
    ACNT_PRDT_CD: process.env.KOREA_INVESTMENT_ACCOUNT_TYPE,
    PDNO: stockCode,
    ORD_DVSN: price ? '00' : '01',
    ORD_QTY: quantity.toString(),
    ORD_UNPR: price ? price.toString() : '0'
  };
  
  const response = await fetch(
    `${this.baseURL}/uapi/domestic-stock/v1/trading/order-cash`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${this.accessToken}`,
      'appkey': process.env.KOREA_INVESTMENT_APP_KEY,
      'appsecret': process.env.KOREA_INVESTMENT_APP_SECRET,
      'tr_id': 'TTTC0801U',  // 현금 매도 주문
      'custtype': 'P'
    },
    body: JSON.stringify(orderData)
  });
  
  return await response.json();
}
```

---

## 💰 **계좌 정보 조회**

### **잔고 조회**
```javascript
async getAccountBalance() {
  const response = await fetch(
    `${this.baseURL}/uapi/domestic-stock/v1/trading/inquire-balance`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${this.accessToken}`,
      'appkey': process.env.KOREA_INVESTMENT_APP_KEY,
      'appsecret': process.env.KOREA_INVESTMENT_APP_SECRET,
      'tr_id': 'TTTC8434R',
      'custtype': 'P'
    },
    params: {
      'CANO': process.env.KOREA_INVESTMENT_ACCOUNT_NO,
      'ACNT_PRDT_CD': process.env.KOREA_INVESTMENT_ACCOUNT_TYPE,
      'AFHR_FLPR_YN': 'N',
      'OFL_YN': '',
      'INQR_DVSN': '02',
      'UNPR_DVSN': '01',
      'FUND_STTL_ICLD_YN': 'N',
      'FNCG_AMT_AUTO_RDPT_YN': 'N',
      'PRCS_DVSN': '01',
      'CTX_AREA_FK100': '',
      'CTX_AREA_NK100': ''
    }
  });
  
  const data = await response.json();
  return {
    totalAsset: parseInt(data.output2[0].tot_evlu_amt),
    availableCash: parseInt(data.output2[0].nxdy_excc_amt),
    holdings: data.output1.map(item => ({
      symbol: item.pdno,
      name: item.prdt_name,
      quantity: parseInt(item.hldg_qty),
      avgPrice: parseInt(item.pchs_avg_pric),
      currentPrice: parseInt(item.prpr),
      profitLoss: parseInt(item.evlu_pfls_amt)
    }))
  };
}
```

---

## 🔄 **기존 Mock 데이터 교체**

### **stocksService.ts 수정**
```javascript
// src/lib/stocksService.ts
import { KoreaInvestmentAPI } from './koreaInvestmentAPI';

const api = new KoreaInvestmentAPI();

// 기존 Mock 데이터 제거하고 실제 API 호출로 교체
export const getAllStocks = async (): Promise<{ data: Stock[] | null; error: any }> => {
  try {
    await api.authenticate();
    
    // 주요 종목들 실시간 조회
    const stockCodes = ['005930', '000660', '035420', '005380', '006400'];
    const stocks = await Promise.all(
      stockCodes.map(code => api.getCurrentPrice(code))
    );
    
    return { data: stocks, error: null };
  } catch (error) {
    console.error('❌ 한국투자증권 API 오류:', error);
    // 실패시 Mock 데이터 Fallback
    return { data: mockStocks, error: null };
  }
};

// 실시간 데이터 구독으로 교체
export const startDataSimulation = (callback: (stocks: Stock[]) => void) => {
  const stockCodes = ['005930', '000660', '035420'];
  
  api.subscribeRealTimePrice(stockCodes, (data) => {
    // 실시간 데이터를 콜백으로 전달
    callback(data);
  });
};
```

---

## 🛡️ **에러 처리 및 안전장치**

### **API 호출 실패 대응**
```javascript
class APIFailsafeHandler {
  private retryCount = 0;
  private maxRetries = 3;
  
  async executeWithRetry(apiCall: Function) {
    try {
      return await apiCall();
    } catch (error) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.warn(`⚠️ API 호출 실패, 재시도 ${this.retryCount}/${this.maxRetries}`);
        await this.delay(1000 * this.retryCount);
        return this.executeWithRetry(apiCall);
      } else {
        console.error('❌ API 호출 최종 실패, Mock 데이터로 대체');
        return this.fallbackToMock();
      }
    }
  }
  
  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
  
  private fallbackToMock() {
    // Mock 데이터 반환
    return mockStocks;
  }
}
```

### **Rate Limiting 방지**
```javascript
class RateLimiter {
  private lastCall = 0;
  private minInterval = 100; // 100ms 최소 간격
  
  async throttle(apiCall: Function) {
    const now = Date.now();
    const timeSinceLastCall = now - this.lastCall;
    
    if (timeSinceLastCall < this.minInterval) {
      await this.delay(this.minInterval - timeSinceLastCall);
    }
    
    this.lastCall = Date.now();
    return apiCall();
  }
}
```

---

## 📋 **구현 체크리스트**

### **Phase 1: 기본 연동 (1일)**
- [ ] API 키 발급 및 환경 설정
- [ ] 인증 토큰 발급 테스트
- [ ] 현재가 조회 API 테스트
- [ ] Mock 데이터와 실제 데이터 비교

### **Phase 2: 실시간 연동 (1일)**
- [ ] WebSocket 실시간 시세 구독
- [ ] 차트 데이터 실시간 업데이트
- [ ] 에러 처리 및 Fallback 로직

### **Phase 3: 주문 시스템 (2일)**
- [ ] 매수/매도 주문 API 연동
- [ ] 계좌 잔고 조회 연동
- [ ] 주문 체결 확인 시스템

### **Phase 4: 통합 테스트 (1일)**
- [ ] 전체 시스템 통합 테스트
- [ ] 성능 최적화
- [ ] 에러 로그 모니터링

---

## 🚨 **주의사항**

### **보안**
- API 키 절대 클라이언트에 노출 금지
- 모든 API 호출은 백엔드 서버 경유
- HTTPS 통신 필수

### **성능**
- API 호출 빈도 제한 준수
- 캐싱 전략 적용
- 불필요한 요청 최소화

### **에러 처리**
- 시장 휴장 시간 고려
- 네트워크 장애 대응
- API 한도 초과 처리

---

**🎯 목표: 3일 내 완전한 실제 데이터 기반 시스템 전환**  
**🔄 현재 상태: Mock 데이터 → 한국투자증권 실시간 데이터**  
**🚀 다음 단계: API 키 설정 및 첫 번째 API 호출 테스트**

*API 연동 가이드 완성: 2025-06-24 UTC*