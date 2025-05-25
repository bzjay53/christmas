/**
 * Christmas Trading Backend Server
 * 메인 서버 파일
 */
require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

// Route imports
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 8000;

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

// MongoDB 연결 (실패해도 서버는 계속 실행)
let isDbConnected = false;
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/christmas_trading', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => {
  console.log('✅ MongoDB 연결 성공');
  isDbConnected = true;
})
.catch((error) => {
  console.error('❌ MongoDB 연결 실패:', error.message);
  console.log('🔄 데이터베이스 없이 서버를 시작합니다. (시뮬레이션 모드)');
  isDbConnected = false;
});

// 기본 라우트
app.get('/', (req, res) => {
  res.json({
    message: '🎄 Christmas Trading Backend API',
    version: '2.0.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    database: isDbConnected ? 'connected' : 'disconnected',
    mode: isDbConnected ? 'production' : 'simulation',
    endpoints: {
      auth: '/api/auth',
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
    database: isDbConnected ? 'connected' : 'disconnected',
    mode: isDbConnected ? 'production' : 'simulation'
  });
});

// API 라우트
app.use('/api/auth', authRoutes);
// app.use('/api/users', userRoutes);
// app.use('/api/referrals', referralRoutes);
// app.use('/api/coupons', couponRoutes);
// app.use('/api/admin', adminRoutes);

// 데이터베이스 없을 때 시뮬레이션 모드 안내
app.get('/api/simulation', (req, res) => {
  if (isDbConnected) {
    return res.json({
      message: '데이터베이스가 연결되어 있습니다.',
      mode: 'production'
    });
  }

  res.json({
    message: '🔄 시뮬레이션 모드로 실행 중입니다.',
    mode: 'simulation',
    notice: 'MongoDB를 설치하고 연결하면 실제 데이터베이스를 사용할 수 있습니다.',
    mongodbInstall: {
      windows: 'https://docs.mongodb.com/manual/tutorial/install-mongodb-on-windows/',
      mac: 'brew install mongodb/brew/mongodb-community',
      linux: 'sudo apt-get install mongodb'
    }
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
      'GET /api/simulation',
      'POST /api/auth/login',
      'POST /api/auth/signup',
      'GET /api/auth/me'
    ]
  });
});

// 전역 에러 핸들러
app.use((error, req, res, next) => {
  console.error('Global Error Handler:', error);
  
  // Mongoose 유효성 검사 오류
  if (error.name === 'ValidationError') {
    const errors = Object.values(error.errors).map(err => err.message);
    return res.status(400).json({
      error: 'Validation Error',
      message: '입력 데이터가 유효하지 않습니다.',
      details: errors
    });
  }
  
  // Mongoose 중복 키 오류
  if (error.code === 11000) {
    const field = Object.keys(error.keyValue)[0];
    return res.status(400).json({
      error: 'Duplicate Error',
      message: `${field}이(가) 이미 존재합니다.`,
      field: field
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

// 서버 시작
const server = app.listen(PORT, () => {
  console.log(`
🎄 Christmas Trading Backend Server
🚀 서버가 포트 ${PORT}에서 실행 중입니다.
🌍 환경: ${process.env.NODE_ENV || 'development'}
📊 데이터베이스: ${isDbConnected ? '연결됨' : '연결 안됨 (시뮬레이션 모드)'}
🔗 클라이언트 URL: ${process.env.CLIENT_URL || 'http://localhost:3000'}
⏰ 시작 시간: ${new Date().toISOString()}
🔧 테스트 URL: http://localhost:${PORT}
  `);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM 신호를 받았습니다. 서버를 종료합니다...');
  server.close(() => {
    console.log('서버가 종료되었습니다.');
    if (isDbConnected) {
      mongoose.connection.close(false, () => {
        console.log('MongoDB 연결이 종료되었습니다.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT 신호를 받았습니다. 서버를 종료합니다...');
  server.close(() => {
    console.log('서버가 종료되었습니다.');
    if (isDbConnected) {
      mongoose.connection.close(false, () => {
        console.log('MongoDB 연결이 종료되었습니다.');
        process.exit(0);
      });
    } else {
      process.exit(0);
    }
  });
});

module.exports = app; 