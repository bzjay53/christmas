/**
 * 사용자 관련 API 라우트
 */
const express = require('express');
const router = express.Router();

// 사용자 프로필 조회
router.get('/profile/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    // 임시 사용자 데이터 (실제로는 Supabase에서 조회)
    const userProfile = {
      id: userId,
      first_name: 'Christmas',
      last_name: 'User',
      email: 'user@christmas.com',
      membership_type: 'premium',
      created_at: new Date().toISOString(),
      total_trades: 156,
      success_rate: 87.5,
      total_profit: 2450000
    };
    
    res.json({
      success: true,
      data: userProfile
    });
  } catch (error) {
    console.error('사용자 프로필 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '사용자 프로필을 조회할 수 없습니다.'
    });
  }
});

// 사용자 거래 기록 조회
router.get('/trades/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const { limit = 20 } = req.query;
    
    // 임시 거래 데이터
    const trades = [
      {
        id: 1,
        symbol: 'AAPL',
        action: 'BUY',
        quantity: 50,
        price: 182.30,
        profit_amount: 145.00,
        created_at: new Date(Date.now() - 3600000).toISOString()
      },
      {
        id: 2,
        symbol: 'TSLA',
        action: 'SELL',
        quantity: 25,
        price: 245.80,
        profit_amount: -150.00,
        created_at: new Date(Date.now() - 7200000).toISOString()
      }
    ];
    
    res.json({
      success: true,
      data: trades.slice(0, parseInt(limit))
    });
  } catch (error) {
    console.error('거래 기록 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '거래 기록을 조회할 수 없습니다.'
    });
  }
});

// 포트폴리오 데이터 조회
router.get('/portfolio/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    
    const portfolio = {
      total_value: 10000000,
      total_profit: 2450000,
      profit_rate: 24.5,
      positions: [
        { symbol: 'AAPL', quantity: 50, current_value: 925000, profit_rate: 1.59 },
        { symbol: 'TSLA', quantity: 25, current_value: 614500, profit_rate: -2.38 },
        { symbol: 'NVDA', quantity: 30, current_value: 2671500, profit_rate: 8.53 }
      ]
    };
    
    res.json({
      success: true,
      data: portfolio
    });
  } catch (error) {
    console.error('포트폴리오 조회 오류:', error);
    res.status(500).json({
      success: false,
      error: '포트폴리오 데이터를 조회할 수 없습니다.'
    });
  }
});

module.exports = router; 