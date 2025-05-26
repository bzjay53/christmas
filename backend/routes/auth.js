/**
 * Christmas Trading Authentication Routes
 * 사용자 인증 관련 API 엔드포인트
 */
const express = require('express');
const supabaseAuth = require('../services/supabaseAuth');
const { authenticate } = require('../middleware/auth');

const router = express.Router();

// 회원가입
router.post('/signup', async (req, res) => {
  try {
    const { firstName, lastName, email, password, referralCode } = req.body;

    // 입력 검증
    if (!firstName || !lastName || !email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: '모든 필수 필드를 입력해주세요.'
      });
    }

    // Supabase를 통한 회원가입
    const user = await supabaseAuth.signup({
      firstName,
      lastName,
      email,
      password,
      referralCode
    });

    res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      user
    });

  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({
      error: 'Server Error',
      message: error.message || '회원가입 처리 중 오류가 발생했습니다.'
    });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 입력 검증
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: '이메일과 비밀번호를 입력해주세요.'
      });
    }

    // Supabase를 통한 로그인
    const result = await supabaseAuth.login(email, password);

    res.json({
      message: '로그인 성공',
      token: result.token,
      user: result.user
    });

  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(401).json({
      error: 'Invalid Credentials',
      message: error.message || '로그인 처리 중 오류가 발생했습니다.'
    });
  }
});

// 로그아웃
router.post('/logout', authenticate, async (req, res) => {
  try {
    // 클라이언트에서 토큰 제거하도록 응답
    res.json({
      message: '로그아웃되었습니다.'
    });
  } catch (error) {
    console.error('로그아웃 오류:', error);
    res.status(500).json({
      error: 'Server Error',
      message: '로그아웃 처리 중 오류가 발생했습니다.'
    });
  }
});

// 사용자 정보 조회
router.get('/me', authenticate, async (req, res) => {
  try {
    res.json({
      user: req.user
    });
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    res.status(500).json({
      error: 'Server Error',
      message: '사용자 정보 조회 중 오류가 발생했습니다.'
    });
  }
});

// 토큰 검증
router.get('/verify', authenticate, async (req, res) => {
  try {
    res.json({
      message: '토큰이 유효합니다.',
      user: req.user
    });
  } catch (error) {
    res.status(401).json({
      error: 'Invalid Token',
      message: '유효하지 않은 토큰입니다.'
    });
  }
});

module.exports = router; 