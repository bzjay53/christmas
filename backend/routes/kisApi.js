/**
 * KIS API 라우트
 * 한국투자증권 API 연동 엔드포인트
 */
const express = require('express');
const { getKISApiClient } = require('../services/kisApi');
const router = express.Router();

// KIS API 클라이언트 인스턴스
const kisApi = getKISApiClient();

// KIS API 연결 상태 확인
router.get('/status', async (req, res) => {
  try {
    const status = await kisApi.checkConnection();
    res.json({
      success: true,
      data: status
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 계좌 잔고 조회
router.get('/account/:accountNumber/balance', async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const balance = await kisApi.getAccountBalance(accountNumber);
    
    res.json({
      success: true,
      data: balance
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 주식 현재가 조회
router.get('/stock/:stockCode/price', async (req, res) => {
  try {
    const { stockCode } = req.params;
    const priceData = await kisApi.getCurrentPrice(stockCode);
    
    res.json({
      success: true,
      data: priceData
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 종목 검색
router.get('/search/:keyword', async (req, res) => {
  try {
    const { keyword } = req.params;
    const searchResults = await kisApi.searchStock(keyword);
    
    res.json({
      success: true,
      data: searchResults
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 주문 실행 (매수/매도)
router.post('/order', async (req, res) => {
  try {
    const orderData = req.body;
    
    // 주문 데이터 검증
    const validation = kisApi.validateOrder(orderData);
    if (!validation.valid) {
      return res.status(400).json({
        success: false,
        error: '주문 데이터 검증 실패',
        details: validation.errors
      });
    }
    
    const orderResult = await kisApi.placeOrder(orderData);
    
    res.json({
      success: true,
      data: orderResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 체결 내역 조회
router.get('/account/:accountNumber/history', async (req, res) => {
  try {
    const { accountNumber } = req.params;
    const { startDate, endDate } = req.query;
    
    // 기본값 설정 (오늘 날짜)
    const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const start = startDate || today;
    const end = endDate || today;
    
    const history = await kisApi.getOrderHistory(accountNumber, start, end);
    
    res.json({
      success: true,
      data: history
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// OAuth 토큰 발급 테스트
router.post('/token/test', async (req, res) => {
  try {
    const token = await kisApi.getAccessToken();
    
    res.json({
      success: true,
      data: {
        hasToken: !!token,
        tokenLength: token ? token.length : 0,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 모의주문 테스트 (삼성전자 1주 시장가 매수)
router.post('/test/mock-order', async (req, res) => {
  try {
    const mockOrderData = {
      accountNumber: process.env.KIS_ACCOUNT_NUMBER || '50123456-01',
      stockCode: '005930', // 삼성전자
      orderType: 'buy',
      quantity: 1,
      price: null // 시장가
    };
    
    // 모의투자 모드에서만 실행
    if (process.env.KIS_MOCK_MODE !== 'true') {
      return res.status(400).json({
        success: false,
        error: '테스트 주문은 모의투자 모드에서만 가능합니다.'
      });
    }
    
    const orderResult = await kisApi.placeOrder(mockOrderData);
    
    res.json({
      success: true,
      message: '모의 주문 테스트 완료',
      data: orderResult
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// KIS API 설정 로드
router.get('/load-settings', async (req, res) => {
  try {
    // 임시 설정 데이터 (실제로는 Supabase users 테이블에서 조회)
    const settings = {
      kis_real_app_key: '',
      kis_real_app_secret: '',
      kis_real_account: '',
      kis_demo_app_key: '',
      kis_demo_app_secret: '',
      kis_demo_account: '',
      kis_mock_mode: true
    };
    
    res.json({
      success: true,
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// KIS API 설정 저장
router.post('/save-settings', async (req, res) => {
  try {
    const settings = req.body;
    
    // 여기서 실제로는 Supabase users 테이블에 저장
    console.log('KIS 설정 저장:', settings);
    
    res.json({
      success: true,
      message: 'KIS API 설정이 저장되었습니다.',
      data: settings
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 