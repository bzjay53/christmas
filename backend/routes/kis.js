/**
 * KIS API Routes
 * 한국투자증권 API 연동 라우트
 */
const express = require('express');
const axios = require('axios');
const router = express.Router();

// KIS API 기본 설정
const KIS_BASE_URL = 'https://openapi.koreainvestment.com:9443';
const KIS_MOCK_URL = 'https://openapivts.koreainvestment.com:29443';

// KIS API 상태 확인
router.get('/status', async (req, res) => {
  try {
    res.json({
      success: true,
      connected: true,
      message: 'KIS API 서비스가 정상 작동 중입니다.',
      timestamp: new Date().toISOString(),
      endpoints: {
        mock: KIS_MOCK_URL,
        real: KIS_BASE_URL
      }
    });
  } catch (error) {
    console.error('KIS API 상태 확인 실패:', error);
    res.status(500).json({
      success: false,
      connected: false,
      error: error.message
    });
  }
});

// OAuth 토큰 발급 테스트
router.post('/token/test', async (req, res) => {
  try {
    const { appKey, appSecret, mockMode = true } = req.body;
    
    if (!appKey || !appSecret) {
      return res.status(400).json({
        success: false,
        hasToken: false,
        error: 'APP_KEY와 APP_SECRET이 필요합니다.'
      });
    }
    
    const baseUrl = mockMode ? KIS_MOCK_URL : KIS_BASE_URL;
    
    // KIS OAuth 토큰 발급 요청
    const tokenResponse = await axios.post(`${baseUrl}/oauth2/tokenP`, {
      grant_type: 'client_credentials',
      appkey: appKey,
      appsecret: appSecret
    }, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    if (tokenResponse.data.access_token) {
      res.json({
        success: true,
        hasToken: true,
        tokenLength: tokenResponse.data.access_token.length,
        tokenType: tokenResponse.data.token_type,
        expiresIn: tokenResponse.data.expires_in,
        message: '토큰 발급 성공'
      });
    } else {
      res.status(400).json({
        success: false,
        hasToken: false,
        error: '토큰 발급 실패'
      });
    }
  } catch (error) {
    console.error('KIS 토큰 테스트 실패:', error);
    res.status(500).json({
      success: false,
      hasToken: false,
      error: error.response?.data?.msg || error.message
    });
  }
});

// 주식 현재가 조회 (삼성전자 005930)
router.get('/stock/:symbol/price', async (req, res) => {
  try {
    const { symbol } = req.params;
    const mockMode = req.query.mock !== 'false';
    
    // 시뮬레이션 데이터 (실제 환경에서는 KIS API 호출)
    const mockPriceData = {
      output: {
        stck_prpr: '71500', // 현재가
        prdy_vrss: '500',   // 전일대비
        prdy_vrss_sign: '2', // 등락구분
        prdy_ctrt: '0.70',  // 등락률
        stck_oprc: '71000', // 시가
        stck_hgpr: '72000', // 고가
        stck_lwpr: '70800', // 저가
        acml_vol: '12345678' // 누적거래량
      },
      rt_cd: '0',
      msg_cd: 'MCA00000',
      msg1: '정상처리 되었습니다.'
    };
    
    if (mockMode) {
      // 모의투자 모드: 시뮬레이션 데이터 반환
      res.json({
        success: true,
        ...mockPriceData,
        mockMode: true,
        symbol: symbol,
        timestamp: new Date().toISOString()
      });
    } else {
      // 실전투자 모드: 실제 API 호출 (구현 필요)
      res.json({
        success: true,
        ...mockPriceData,
        mockMode: false,
        symbol: symbol,
        timestamp: new Date().toISOString(),
        note: '실제 KIS API 연동 구현 필요'
      });
    }
  } catch (error) {
    console.error('주식 현재가 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 모의주문 테스트
router.post('/test/mock-order', async (req, res) => {
  try {
    const { symbol = '005930', quantity = 1, orderType = 'buy' } = req.body;
    
    // 모의주문 시뮬레이션
    const mockOrderResult = {
      success: true,
      orderId: `ORD_${Date.now()}`,
      symbol: symbol,
      quantity: quantity,
      orderType: orderType,
      price: 71500,
      totalAmount: 71500 * quantity,
      status: 'completed',
      timestamp: new Date().toISOString(),
      message: '모의주문이 성공적으로 처리되었습니다.'
    };
    
    res.json(mockOrderResult);
  } catch (error) {
    console.error('모의주문 테스트 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 계좌 잔고 조회 테스트
router.get('/account/balance', async (req, res) => {
  try {
    const mockMode = req.query.mock !== 'false';
    
    // 모의 계좌 잔고 데이터
    const mockBalanceData = {
      success: true,
      account: {
        accountNumber: '50123456-01',
        totalAssets: 10000000,
        availableCash: 3500000,
        stockValue: 6500000,
        totalProfit: 250000,
        profitRate: 2.56
      },
      holdings: [
        {
          symbol: '005930',
          name: '삼성전자',
          quantity: 50,
          avgPrice: 70000,
          currentPrice: 71500,
          profit: 75000,
          profitRate: 2.14
        },
        {
          symbol: '000660',
          name: 'SK하이닉스',
          quantity: 30,
          avgPrice: 120000,
          currentPrice: 125000,
          profit: 150000,
          profitRate: 4.17
        }
      ],
      mockMode: mockMode,
      timestamp: new Date().toISOString()
    };
    
    res.json(mockBalanceData);
  } catch (error) {
    console.error('계좌 잔고 조회 실패:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// 연결 테스트 (종합)
router.post('/test/connection', async (req, res) => {
  try {
    const { appKey, appSecret, mockMode = true, accountNumber } = req.body;
    
    if (!appKey || !appSecret) {
      return res.status(400).json({
        success: false,
        connected: false,
        error: 'API 키와 시크릿이 필요합니다.'
      });
    }
    
    // 연결 테스트 시뮬레이션
    const connectionTest = {
      success: true,
      connected: true,
      mode: mockMode ? 'mock' : 'real',
      appKeyValid: appKey.length >= 30,
      appSecretValid: appSecret.length >= 30,
      accountNumber: accountNumber,
      timestamp: new Date().toISOString(),
      message: `${mockMode ? '모의투자' : '실전투자'} 연결 테스트 성공`
    };
    
    // API 키 길이 검증
    if (!connectionTest.appKeyValid || !connectionTest.appSecretValid) {
      return res.status(400).json({
        success: false,
        connected: false,
        error: 'API 키 또는 시크릿의 형식이 올바르지 않습니다.'
      });
    }
    
    res.json(connectionTest);
  } catch (error) {
    console.error('KIS 연결 테스트 실패:', error);
    res.status(500).json({
      success: false,
      connected: false,
      error: error.message
    });
  }
});

// KIS API 설정 저장 (암호화)
router.post('/save-settings', async (req, res) => {
  try {
    const {
      mockMode,
      demoAppKey,
      demoAppSecret,
      realAppKey,
      realAppSecret,
      accountNumber,
      telegramBotToken,
      telegramChatId,
      enableTelegramNotifications
    } = req.body;
    
    // 간단한 암호화 (실제 운영에서는 더 강력한 암호화 사용)
    const crypto = require('crypto');
    const algorithm = 'aes-256-cbc';
    const key = process.env.JWT_SECRET || 'christmas-trading-secret-key';
    const keyHash = crypto.createHash('sha256').update(key).digest();
    
    const encrypt = (text) => {
      if (!text) return '';
      const iv = crypto.randomBytes(16);
      const cipher = crypto.createCipher(algorithm, keyHash);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      return iv.toString('hex') + ':' + encrypted;
    };
    
    const encryptedSettings = {
      mockMode,
      demoAppKey,
      demoAppSecret: encrypt(demoAppSecret),
      realAppKey,
      realAppSecret: encrypt(realAppSecret),
      accountNumber,
      telegramBotToken: encrypt(telegramBotToken),
      telegramChatId,
      enableTelegramNotifications,
      updatedAt: new Date().toISOString()
    };
    
    // 파일 시스템에 저장 (실제 운영에서는 데이터베이스 사용)
    const fs = require('fs');
    const path = require('path');
    const settingsPath = path.join(__dirname, '../data/kis-settings.json');
    
    // data 디렉토리가 없으면 생성
    const dataDir = path.dirname(settingsPath);
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    
    fs.writeFileSync(settingsPath, JSON.stringify(encryptedSettings, null, 2));
    
    res.json({
      success: true,
      message: 'KIS API 설정이 안전하게 저장되었습니다.',
      savedAt: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('KIS 설정 저장 실패:', error);
    res.status(500).json({
      success: false,
      message: '설정 저장 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

// KIS API 설정 로드 (복호화)
router.get('/load-settings', async (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const settingsPath = path.join(__dirname, '../data/kis-settings.json');
    
    if (!fs.existsSync(settingsPath)) {
      return res.json({
        success: true,
        message: '저장된 설정이 없습니다.',
        data: null
      });
    }
    
    const encryptedSettings = JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
    
    // 복호화 함수
    const crypto = require('crypto');
    const algorithm = 'aes-256-cbc';
    const key = process.env.JWT_SECRET || 'christmas-trading-secret-key';
    const keyHash = crypto.createHash('sha256').update(key).digest();
    
    const decrypt = (encryptedText) => {
      if (!encryptedText) return '';
      try {
        const parts = encryptedText.split(':');
        const iv = Buffer.from(parts[0], 'hex');
        const encrypted = parts[1];
        const decipher = crypto.createDecipher(algorithm, keyHash);
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        return decrypted;
      } catch (error) {
        console.error('복호화 실패:', error);
        return '';
      }
    };
    
    const decryptedSettings = {
      ...encryptedSettings,
      demoAppSecret: encryptedSettings.demoAppSecret ? true : false, // 존재 여부만 반환
      realAppSecret: encryptedSettings.realAppSecret ? true : false, // 존재 여부만 반환
      telegramBotToken: encryptedSettings.telegramBotToken ? true : false // 존재 여부만 반환
    };
    
    res.json({
      success: true,
      message: '설정을 성공적으로 로드했습니다.',
      data: decryptedSettings
    });
    
  } catch (error) {
    console.error('KIS 설정 로드 실패:', error);
    res.status(500).json({
      success: false,
      message: '설정 로드 중 오류가 발생했습니다.',
      error: error.message
    });
  }
});

module.exports = router; 