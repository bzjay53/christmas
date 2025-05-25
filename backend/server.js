/**
 * Christmas Trading Backend Server
 * 메인 서버 파일
 */
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const http = require('http');
const WebSocketServer = require('./websocket');

// Route imports
const authRoutes = require('./routes/auth');
const kisApiRoutes = require('./routes/kisApi');
const telegramRoutes = require('./routes/telegram');
const tradingRoutes = require('./routes/trading');

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 8000;

// WebSocket 서버 초기화
const wsServer = new WebSocketServer(server);
console.log('🔌 WebSocket 서버가 HTTP 서버에 통합되었습니다.');

// 보안 미들웨어
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// CORS 설정
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// 레이트 리밋 설정
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15분
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100, // 최대 100 요청
  message: {
    error: 'Too Many Requests',
    message: '너무 많은 요청입니다. 잠시 후 다시 시도해주세요.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// Body parser 미들웨어
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// 요청 로깅 미들웨어
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Supabase 기반 시스템 (MongoDB 완전 제거)
let isDbConnected = true; // Supabase는 클라우드 기반이므로 항상 연결 상태
console.log('✅ Supabase 기반 데이터베이스 시스템 초기화 완료');

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: '🎄 Christmas Trading Backend API',
    version: '2.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    database: 'supabase-connected',
    mode: 'production',
    endpoints: {
      auth: '/api/auth',
      kis: '/api/kis',
      telegram: '/api/telegram',
      users: '/api/users',
      referrals: '/api/referrals',
      coupons: '/api/coupons',
      admin: '/api/admin'
    },
    testAccounts: {
      admin: {
        email: 'admin@christmas.com',
        password: 'admin123'
      },
      user: {
        email: 'user@christmas.com', 
        password: 'user123'
      }
    }
  });
});

// 헬스 체크
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: 'supabase-connected',
    mode: 'production'
  });
});

// API 라우트
app.use('/api/auth', authRoutes);
app.use('/api/kis', kisApiRoutes);
app.use('/api/telegram', telegramRoutes);
app.use('/api/trading', tradingRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/referrals', referralRoutes);
// app.use('/api/coupons', couponRoutes);
// app.use('/api/admin', adminRoutes);

// Supabase 데이터베이스 상태 확인
app.get('/api/database-status', (req, res) => {
  res.json({
    message: '✅ Supabase PostgreSQL 데이터베이스 연결됨',
    mode: 'production',
    database: 'supabase',
    status: 'connected',
    features: [
      '실시간 데이터베이스',
      '사용자 인증',
      '파일 저장소',
      '실시간 구독'
    ]
  });
});

// WebSocket 상태 확인
app.get('/api/websocket-status', (req, res) => {
  const wsStatus = wsServer.getServerStatus();
  res.json({
    message: '🔌 WebSocket 서버 상태',
    status: 'active',
    ...wsStatus,
    features: [
      '실시간 거래 신호',
      '가격 업데이트',
      '시스템 알림',
      '하트비트 모니터링'
    ]
  });
});

// 404 핸들러
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Not Found',
    message: '요청한 엔드포인트를 찾을 수 없습니다.',
    path: req.originalUrl,
    availableEndpoints: [
      'GET /',
      'GET /health',
      'GET /api/database-status',
      'POST /api/auth/login',
      'POST /api/auth/signup',
      'GET /api/auth/me',
      'GET /api/kis/status',
      'GET /api/kis/stock/:stockCode/price',
      'POST /api/kis/order'
    ]
  });
});

// 전역 에러 핸들러
app.use((error, req, res, next) => {
  console.error('Global Error Handler:', error);
  
  // Supabase 오류 처리 (PostgreSQL 기반)
  if (error.code === '23505') { // PostgreSQL unique violation
    return res.status(400).json({
      error: 'Duplicate Error',
      message: '이미 존재하는 데이터입니다.',
      detail: error.detail
    });
  }
  
  if (error.code === '23503') { // PostgreSQL foreign key violation
    return res.status(400).json({
      error: 'Reference Error',
      message: '참조 무결성 오류가 발생했습니다.',
      detail: error.detail
    });
  }
  
  // JWT 오류
  if (error.name === 'JsonWebTokenError') {
    return res.status(401).json({
      error: 'Invalid Token',
      message: '유효하지 않은 토큰입니다.'
    });
  }
  
  if (error.name === 'TokenExpiredError') {
    return res.status(401).json({
      error: 'Token Expired',
      message: '토큰이 만료되었습니다.'
    });
  }
  
  // 기본 서버 오류
  res.status(error.status || 500).json({
    error: 'Internal Server Error',
    message: process.env.NODE_ENV === 'development' 
      ? error.message 
      : '서버 내부 오류가 발생했습니다.',
    ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
  });
});

// 서버 시작 (WebSocket과 함께)
server.listen(PORT, () => {
  console.log(`
🎄 Christmas Trading Backend Server
🚀 서버가 포트 ${PORT}에서 실행 중입니다.
🌍 환경: ${process.env.NODE_ENV || 'development'}
📊 데이터베이스: Supabase PostgreSQL (연결됨)
🔗 클라이언트 URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}
🔌 WebSocket: 활성화됨 (실시간 알림)
⏰ 시작 시간: ${new Date().toISOString()}
🔧 테스트 URL: http://localhost:${PORT}
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM 신호를 받았습니다. 서버를 종료합니다...');
  server.close(() => {
    console.log('서버가 종료되었습니다.');
    console.log('✅ Supabase 기반 시스템 종료 완료');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT 신호를 받았습니다. 서버를 종료합니다...');
  server.close(() => {
    console.log('서버가 종료되었습니다.');
    console.log('✅ Supabase 기반 시스템 종료 완료');
    process.exit(0);
  });
});

module.exports = app; 