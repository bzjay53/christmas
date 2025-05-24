/**
 * Christmas Trading Authentication Routes
 * 사용자 인증 관련 API 엔드포인트
 */
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
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

    // 이메일 중복 확인
    const existingUser = await User.findByEmail(email);
    if (existingUser) {
      return res.status(400).json({
        error: 'Email Already Exists',
        message: '이미 사용 중인 이메일입니다.'
      });
    }

    // 사용자 생성
    const userData = {
      firstName,
      lastName,
      email,
      password,
      membershipType: 'free'
    };

    // 초대 코드가 있는 경우 검증
    if (referralCode) {
      const ReferralCode = require('../models/ReferralCode');
      const validCode = await ReferralCode.findValidCode(referralCode);
      
      if (validCode) {
        userData.referredBy = referralCode;
      }
    }

    const user = new User(userData);
    await user.save();

    // 초대 보상 처리
    if (referralCode) {
      try {
        const ReferralReward = require('../models/ReferralReward');
        const reward = new ReferralReward({
          inviterId: validCode.userId,
          inviteeId: user._id,
          referralCode: referralCode
        });
        await reward.save();
      } catch (rewardError) {
        console.log('초대 보상 처리 중 오류:', rewardError.message);
      }
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'christmas_default_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.status(201).json({
      message: '회원가입이 완료되었습니다.',
      token,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({
      error: 'Server Error',
      message: '회원가입 처리 중 오류가 발생했습니다.'
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

    // 사용자 조회
    const user = await User.findByEmail(email);
    if (!user) {
      return res.status(401).json({
        error: 'Invalid Credentials',
        message: '이메일 또는 비밀번호가 잘못되었습니다.'
      });
    }

    // 비밀번호 확인
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      // 로그인 실패 횟수 증가
      user.loginAttempts += 1;
      if (user.loginAttempts >= 5) {
        user.lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15분 잠금
      }
      await user.save();

      return res.status(401).json({
        error: 'Invalid Credentials',
        message: '이메일 또는 비밀번호가 잘못되었습니다.'
      });
    }

    // 로그인 성공시 초기화
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    user.lastLoginAt = new Date();
    await user.save();

    // JWT 토큰 생성
    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET || 'christmas_default_secret',
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      message: '로그인 성공',
      token,
      user: user.toJSON()
    });

  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({
      error: 'Server Error',
      message: '로그인 처리 중 오류가 발생했습니다.'
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
      user: req.user.toJSON()
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
      user: req.user.toJSON()
    });
  } catch (error) {
    res.status(401).json({
      error: 'Invalid Token',
      message: '유효하지 않은 토큰입니다.'
    });
  }
});

module.exports = router; 