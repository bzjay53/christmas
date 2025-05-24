/**
 * Christmas Trading Authentication Middleware
 * JWT 토큰 검증 및 사용자 인증 미들웨어
 */
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// JWT 토큰 검증 미들웨어
const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Access Denied',
        message: '인증 토큰이 필요합니다.'
      });
    }
    
    const token = authHeader.substring(7); // 'Bearer ' 제거
    
    if (!token) {
      return res.status(401).json({
        error: 'Access Denied',
        message: '유효한 토큰이 필요합니다.'
      });
    }
    
    // JWT 토큰 검증
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 사용자 조회
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return res.status(401).json({
        error: 'Invalid Token',
        message: '사용자를 찾을 수 없습니다.'
      });
    }
    
    // 계정 활성화 확인
    if (!user.isActive) {
      return res.status(401).json({
        error: 'Account Disabled',
        message: '비활성화된 계정입니다.'
      });
    }
    
    // 계정 잠금 확인
    if (user.lockUntil && user.lockUntil > Date.now()) {
      return res.status(401).json({
        error: 'Account Locked',
        message: '잠긴 계정입니다. 잠시 후 다시 시도해주세요.'
      });
    }
    
    // 요청 객체에 사용자 정보 추가
    req.user = user;
    req.userId = user._id;
    
    next();
    
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Invalid Token',
        message: '유효하지 않은 토큰입니다.'
      });
    }
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token Expired',
        message: '토큰이 만료되었습니다. 다시 로그인해주세요.'
      });
    }
    
    console.error('Authentication Error:', error);
    res.status(500).json({
      error: 'Server Error',
      message: '인증 처리 중 오류가 발생했습니다.'
    });
  }
};

// 관리자 권한 확인 미들웨어
const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return res.status(403).json({
      error: 'Access Forbidden',
      message: '관리자 권한이 필요합니다.'
    });
  }
  next();
};

// 회원 등급 확인 미들웨어
const requireMembership = (allowedTypes = []) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication Required',
        message: '로그인이 필요합니다.'
      });
    }
    
    if (allowedTypes.length === 0) {
      return next(); // 모든 회원 허용
    }
    
    if (!allowedTypes.includes(req.user.membershipType)) {
      return res.status(403).json({
        error: 'Membership Required',
        message: `${allowedTypes.join(' 또는 ')} 회원만 이용 가능합니다.`,
        currentMembership: req.user.membershipType,
        requiredMembership: allowedTypes
      });
    }
    
    next();
  };
};

// 거래 권한 확인 미들웨어
const requireTradingPermission = (tradeType = 'demo') => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        error: 'Authentication Required',
        message: '로그인이 필요합니다.'
      });
    }
    
    const permission = req.user.canMakeTrade(tradeType);
    
    if (!permission.allowed) {
      return res.status(403).json({
        error: 'Trading Permission Denied',
        message: permission.reason,
        upgradeRequired: permission.upgradeRequired || false,
        currentMembership: req.user.membershipType
      });
    }
    
    next();
  };
};

// 이메일 인증 확인 미들웨어
const requireEmailVerification = (req, res, next) => {
  if (!req.user || !req.user.isEmailVerified) {
    return res.status(403).json({
      error: 'Email Verification Required',
      message: '이메일 인증이 필요합니다.',
      action: 'verify_email'
    });
  }
  next();
};

// 소유자 확인 미들웨어 (리소스 소유자만 접근 가능)
const requireOwnership = (resourceField = 'userId') => {
  return (req, res, next) => {
    const resourceUserId = req.params[resourceField] || req.body[resourceField];
    
    if (!resourceUserId) {
      return res.status(400).json({
        error: 'Bad Request',
        message: '리소스 소유자 정보가 필요합니다.'
      });
    }
    
    // 관리자는 모든 리소스 접근 가능
    if (req.user.isAdmin) {
      return next();
    }
    
    // 본인의 리소스만 접근 가능
    if (req.user._id.toString() !== resourceUserId.toString()) {
      return res.status(403).json({
        error: 'Access Forbidden',
        message: '본인의 리소스만 접근할 수 있습니다.'
      });
    }
    
    next();
  };
};

// API 키 유효성 확인 미들웨어
const validateApiKeys = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Authentication Required',
      message: '로그인이 필요합니다.'
    });
  }
  
  const { exchange } = req.body;
  
  if (!exchange) {
    return res.status(400).json({
      error: 'Bad Request',
      message: '거래소 정보가 필요합니다.'
    });
  }
  
  const apiKeys = req.user.apiKeys[exchange];
  
  if (!apiKeys || !apiKeys.apiKey || !apiKeys.secretKey) {
    return res.status(400).json({
      error: 'API Keys Required',
      message: `${exchange} API 키가 설정되지 않았습니다.`,
      action: 'setup_api_keys'
    });
  }
  
  next();
};

// 레이트 리밋 체크 (특정 사용자)
const checkUserRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();
  
  return (req, res, next) => {
    if (!req.user) {
      return next();
    }
    
    const userId = req.user._id.toString();
    const now = Date.now();
    const windowStart = now - windowMs;
    
    // 사용자별 요청 기록 가져오기
    let requests = userRequests.get(userId) || [];
    
    // 윈도우 범위 밖의 요청 제거
    requests = requests.filter(timestamp => timestamp > windowStart);
    
    // 요청 한도 확인
    if (requests.length >= maxRequests) {
      return res.status(429).json({
        error: 'Too Many Requests',
        message: '요청 한도를 초과했습니다. 잠시 후 다시 시도해주세요.',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
    
    // 현재 요청 추가
    requests.push(now);
    userRequests.set(userId, requests);
    
    next();
  };
};

// 조건부 인증 미들웨어 (선택적 인증)
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(); // 토큰이 없어도 계속 진행
    }
    
    const token = authHeader.substring(7);
    
    if (!token) {
      return next();
    }
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId).select('-password');
      
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
      }
    } catch (jwtError) {
      // JWT 오류는 무시하고 계속 진행
      console.log('Optional auth JWT error:', jwtError.message);
    }
    
    next();
    
  } catch (error) {
    console.error('Optional Auth Error:', error);
    next(); // 오류가 있어도 계속 진행
  }
};

module.exports = {
  authenticate,
  requireAdmin,
  requireMembership,
  requireTradingPermission,
  requireEmailVerification,
  requireOwnership,
  validateApiKeys,
  checkUserRateLimit,
  optionalAuth
}; 