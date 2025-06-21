# 🔒 보안 가이드라인 (Christmas Trading)

## 📋 개요

### 🎯 보안 목표
- **데이터 보호**: 사용자 개인정보 및 거래 데이터 보안
- **인증/인가**: 안전한 사용자 인증 및 권한 관리
- **API 보안**: 백엔드 API 엔드포인트 보호
- **인프라 보안**: 서버 및 네트워크 보안
- **컴플라이언스**: 금융 서비스 관련 규정 준수

### 🏗️ 보안 아키텍처
```
Frontend (HTTPS) → API Gateway → Backend (JWT) → Database (RLS)
                      ↓
                 Rate Limiting
                      ↓
                 WAF Protection
```

## 🔐 인증 및 인가

### 🎫 JWT 토큰 관리
```javascript
// 토큰 구조
{
  "header": {
    "alg": "HS256",
    "typ": "JWT"
  },
  "payload": {
    "sub": "user_id",
    "email": "user@example.com",
    "role": "user",
    "iat": 1640995200,
    "exp": 1641081600
  }
}
```

### 🔑 토큰 보안 정책
- **만료 시간**: 1시간 (Access Token), 7일 (Refresh Token)
- **저장 방식**: HttpOnly Cookie (권장) 또는 Secure LocalStorage
- **갱신 정책**: 자동 갱신 (Refresh Token 사용)
- **폐기 정책**: 로그아웃 시 즉시 무효화

### 👤 사용자 권한 관리
```sql
-- Supabase RLS (Row Level Security) 정책
CREATE POLICY "Users can only access their own data" ON users
FOR ALL USING (auth.uid() = id);

CREATE POLICY "Users can only access their own trading data" ON trading_signals
FOR ALL USING (auth.uid() = user_id);
```

## 🛡️ API 보안

### 🚦 Rate Limiting
```javascript
// Express Rate Limiting 설정
const rateLimit = require('express-rate-limit');

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100, // 최대 100 요청
  message: 'Too many requests from this IP',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', apiLimiter);
```

### 🔒 CORS 설정
```javascript
// CORS 보안 설정
const cors = require('cors');

app.use(cors({
  origin: [
    'https://christmas-protocol.netlify.app',
    'http://localhost:3000' // 개발 환경만
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

### 🛡️ 헬멧 보안 헤더
```javascript
// Helmet.js 보안 헤더 설정
const helmet = require('helmet');

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
}));
```

## 🔐 데이터 보안

### 🗄️ 데이터베이스 보안
```sql
-- 민감한 데이터 암호화
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL, -- bcrypt 해시
  kis_account_encrypted TEXT, -- AES 암호화
  created_at TIMESTAMP DEFAULT NOW()
);

-- 감사 로그 테이블
CREATE TABLE audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  resource TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

### 🔑 암호화 정책
```javascript
// 비밀번호 해싱 (bcrypt)
const bcrypt = require('bcrypt');
const saltRounds = 12;

const hashPassword = async (password) => {
  return await bcrypt.hash(password, saltRounds);
};

// 민감한 데이터 암호화 (AES-256)
const crypto = require('crypto');
const algorithm = 'aes-256-gcm';

const encrypt = (text, key) => {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipher(algorithm, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return {
    encrypted,
    iv: iv.toString('hex'),
    tag: cipher.getAuthTag().toString('hex')
  };
};
```

## 🌐 네트워크 보안

### 🔒 HTTPS 강제
```javascript
// HTTPS 리다이렉트 미들웨어
const enforceHTTPS = (req, res, next) => {
  if (!req.secure && req.get('x-forwarded-proto') !== 'https') {
    return res.redirect(301, `https://${req.get('host')}${req.url}`);
  }
  next();
};

app.use(enforceHTTPS);
```

### 🛡️ 방화벽 설정 (서버)
```bash
# UFW 방화벽 설정
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 8000/tcp  # API 포트
sudo ufw enable

# 특정 IP만 SSH 접근 허용
sudo ufw allow from YOUR_IP_ADDRESS to any port 22
```

### 🔐 SSH 보안
```bash
# SSH 설정 강화 (/etc/ssh/sshd_config)
Port 22
PermitRootLogin no
PasswordAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
ClientAliveInterval 300
ClientAliveCountMax 2
```

## 🔍 보안 모니터링

### 📊 로깅 정책
```javascript
// 보안 이벤트 로깅
const winston = require('winston');

const securityLogger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'security.log' }),
    new winston.transports.Console()
  ]
});

// 로그인 시도 기록
const logLoginAttempt = (email, success, ip, userAgent) => {
  securityLogger.info('Login attempt', {
    email,
    success,
    ip,
    userAgent,
    timestamp: new Date().toISOString()
  });
};
```

### 🚨 침입 탐지
```javascript
// 의심스러운 활동 탐지
const detectSuspiciousActivity = (req, res, next) => {
  const suspiciousPatterns = [
    /(\<script\>)/i,  // XSS 시도
    /(union.*select)/i,  // SQL Injection 시도
    /(\.\.\/)/,  // Path Traversal 시도
  ];

  const userInput = JSON.stringify(req.body) + req.url;
  
  for (const pattern of suspiciousPatterns) {
    if (pattern.test(userInput)) {
      securityLogger.warn('Suspicious activity detected', {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        input: userInput,
        pattern: pattern.toString()
      });
      return res.status(400).json({ error: 'Invalid request' });
    }
  }
  
  next();
};
```

## 🔐 환경변수 보안

### 🗝️ 민감한 정보 관리
```bash
# .env 파일 보안 (절대 Git에 커밋하지 않음)
# 강력한 비밀키 사용
JWT_SECRET=very-long-random-string-at-least-32-characters
SUPABASE_SERVICE_KEY=supabase-service-role-key
KIS_API_SECRET=kis-api-secret-key

# 암호화 키 (별도 관리)
ENCRYPTION_KEY=32-byte-encryption-key
```

### 🔒 프로덕션 환경 보안
```yaml
# Docker Secrets 사용 (권장)
version: '3.8'
services:
  backend:
    image: christmas-backend
    secrets:
      - jwt_secret
      - supabase_key
      - encryption_key
    environment:
      - JWT_SECRET_FILE=/run/secrets/jwt_secret
      - SUPABASE_SERVICE_KEY_FILE=/run/secrets/supabase_key

secrets:
  jwt_secret:
    external: true
  supabase_key:
    external: true
```

## 🧪 보안 테스트

### 🔍 취약점 스캔
```bash
# npm audit (의존성 취약점 검사)
npm audit
npm audit fix

# OWASP ZAP (웹 애플리케이션 보안 테스트)
docker run -t owasp/zap2docker-stable zap-baseline.py \
  -t https://christmas-protocol.netlify.app

# Snyk (코드 보안 스캔)
npx snyk test
npx snyk monitor
```

### 🛡️ 침투 테스트 체크리스트
- [ ] SQL Injection 테스트
- [ ] XSS (Cross-Site Scripting) 테스트
- [ ] CSRF (Cross-Site Request Forgery) 테스트
- [ ] 인증 우회 시도
- [ ] 권한 상승 테스트
- [ ] 세션 하이재킹 테스트
- [ ] API 엔드포인트 무차별 대입 공격

## 📋 보안 체크리스트

### ✅ 개발 단계
- [ ] 모든 사용자 입력 검증 및 살균
- [ ] SQL Injection 방지 (Parameterized Queries)
- [ ] XSS 방지 (Output Encoding)
- [ ] CSRF 토큰 구현
- [ ] 적절한 에러 메시지 (정보 노출 방지)
- [ ] 보안 헤더 설정

### ✅ 배포 단계
- [ ] HTTPS 강제 적용
- [ ] 환경변수 보안 설정
- [ ] 방화벽 규칙 적용
- [ ] SSH 키 기반 인증
- [ ] 정기적인 보안 업데이트
- [ ] 백업 암호화

### ✅ 운영 단계
- [ ] 보안 로그 모니터링
- [ ] 정기적인 취약점 스캔
- [ ] 침투 테스트 수행
- [ ] 보안 인시던트 대응 계획
- [ ] 직원 보안 교육
- [ ] 컴플라이언스 감사

## 🚨 보안 인시던트 대응

### 📞 대응 절차
1. **탐지**: 보안 이벤트 감지
2. **격리**: 영향 범위 제한
3. **분석**: 공격 벡터 및 피해 범위 분석
4. **복구**: 시스템 복구 및 보안 강화
5. **보고**: 관련 기관 및 사용자 통지

### 🔒 긴급 대응 명령어
```bash
# 의심스러운 IP 차단
sudo ufw deny from SUSPICIOUS_IP

# 서비스 긴급 중단
docker-compose down

# 로그 백업
cp /var/log/security.log /backup/security-$(date +%Y%m%d).log

# 데이터베이스 백업
pg_dump christmas_trading > backup-$(date +%Y%m%d).sql
```

## 📚 보안 교육 및 인식

### 🎓 개발팀 교육 내용
- OWASP Top 10 취약점
- 안전한 코딩 관행
- 암호화 및 해싱 기법
- 인증 및 세션 관리
- 보안 테스트 방법론

### 📖 참고 자료
- [OWASP Web Security Testing Guide](https://owasp.org/www-project-web-security-testing-guide/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [CIS Controls](https://www.cisecurity.org/controls/)

---
**📅 작성일**: 2025-05-27 01:25  
**👤 작성자**: PM AI Assistant  
**🔄 버전**: v1.0  
**📊 상태**: 보안 정책 수립 완료 