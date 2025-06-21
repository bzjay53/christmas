# 🎄 Christmas Trading 보안 가이드라인 (2025-05-30)

## 🔒 **보안 전략 개요**

### **보안 원칙**
```
🛡️ Defense in Depth (다층 방어)
├── 🌐 Network Security (네트워크 보안)
├── 🖥️ Application Security (애플리케이션 보안)
├── 🗄️ Data Security (데이터 보안)
└── 👤 Identity & Access Management (신원 및 접근 관리)
```

### **보안 위험 등급**
```
🔴 Critical: 즉시 해결 필요 (24시간 이내)
🟡 High: 긴급 해결 필요 (1주 이내)
🟠 Medium: 계획적 해결 (1개월 이내)
🟢 Low: 모니터링 및 개선 (분기별)
```

## 🔐 **인증 및 권한 관리**

### **JWT 토큰 보안**
```javascript
// ✅ 안전한 JWT 구현
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

class AuthSecurity {
  // 강력한 JWT Secret 생성
  static generateJWTSecret() {
    return crypto.randomBytes(64).toString('hex');
  }

  // 토큰 생성 (짧은 만료 시간)
  static generateAccessToken(payload) {
    return jwt.sign(payload, process.env.JWT_SECRET, {
      expiresIn: '15m', // 15분
      issuer: 'christmas-trading',
      audience: 'christmas-users'
    });
  }

  // 리프레시 토큰 생성
  static generateRefreshToken(payload) {
    return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, {
      expiresIn: '7d', // 7일
      issuer: 'christmas-trading',
      audience: 'christmas-users'
    });
  }

  // 토큰 검증 미들웨어
  static verifyToken(req, res, next) {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
          success: false,
          error: 'Access token required'
        });
      }

      const token = authHeader.substring(7);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // 토큰 블랙리스트 확인
      if (await this.isTokenBlacklisted(token)) {
        return res.status(401).json({
          success: false,
          error: 'Token has been revoked'
        });
      }

      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          error: 'Token expired'
        });
      }
      
      return res.status(401).json({
        success: false,
        error: 'Invalid token'
      });
    }
  }
}
```

### **비밀번호 보안**
```javascript
// ✅ 안전한 비밀번호 처리
const bcrypt = require('bcryptjs');
const zxcvbn = require('zxcvbn');

class PasswordSecurity {
  // 비밀번호 강도 검증
  static validatePasswordStrength(password) {
    const result = zxcvbn(password);
    
    if (result.score < 3) {
      throw new Error(`Weak password. ${result.feedback.suggestions.join(' ')}`);
    }
    
    // 추가 규칙 검증
    const rules = [
      { test: /.{8,}/, message: 'Password must be at least 8 characters long' },
      { test: /[a-z]/, message: 'Password must contain lowercase letters' },
      { test: /[A-Z]/, message: 'Password must contain uppercase letters' },
      { test: /\d/, message: 'Password must contain numbers' },
      { test: /[!@#$%^&*(),.?":{}|<>]/, message: 'Password must contain special characters' }
    ];

    for (const rule of rules) {
      if (!rule.test.test(password)) {
        throw new Error(rule.message);
      }
    }

    return true;
  }

  // 안전한 해싱
  static async hashPassword(password) {
    this.validatePasswordStrength(password);
    
    const saltRounds = 12; // 높은 솔트 라운드
    return await bcrypt.hash(password, saltRounds);
  }

  // 비밀번호 검증
  static async verifyPassword(password, hashedPassword) {
    return await bcrypt.compare(password, hashedPassword);
  }

  // 비밀번호 변경 이력 관리
  static async checkPasswordHistory(userId, newPassword) {
    const { data: history } = await supabase
      .from('password_history')
      .select('password_hash')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(5);

    for (const record of history) {
      if (await bcrypt.compare(newPassword, record.password_hash)) {
        throw new Error('Cannot reuse recent passwords');
      }
    }
  }
}
```

### **다중 인증 (MFA)**
```javascript
// ✅ TOTP 기반 2FA 구현
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');

class MFASecurity {
  // 2FA 설정 생성
  static async generateMFASecret(userId, email) {
    const secret = speakeasy.generateSecret({
      name: `Christmas Trading (${email})`,
      issuer: 'Christmas Trading',
      length: 32
    });

    // 데이터베이스에 임시 저장
    await supabase
      .from('mfa_setup')
      .upsert({
        user_id: userId,
        secret: secret.base32,
        verified: false
      });

    // QR 코드 생성
    const qrCodeUrl = await QRCode.toDataURL(secret.otpauth_url);
    
    return {
      secret: secret.base32,
      qrCode: qrCodeUrl,
      manualEntryKey: secret.base32
    };
  }

  // 2FA 토큰 검증
  static verifyMFAToken(secret, token) {
    return speakeasy.totp.verify({
      secret: secret,
      encoding: 'base32',
      token: token,
      window: 2 // 시간 허용 범위
    });
  }

  // 2FA 미들웨어
  static requireMFA(req, res, next) {
    if (req.user.mfa_enabled && !req.user.mfa_verified) {
      return res.status(403).json({
        success: false,
        error: 'MFA verification required',
        mfa_required: true
      });
    }
    next();
  }
}
```

## 🛡️ **입력 검증 및 데이터 보안**

### **입력 검증 및 새니타이제이션**
```javascript
// ✅ 포괄적 입력 검증
const { body, param, query, validationResult } = require('express-validator');
const DOMPurify = require('isomorphic-dompurify');
const validator = require('validator');

class InputValidation {
  // 공통 검증 규칙
  static commonValidations = {
    email: body('email')
      .isEmail()
      .normalizeEmail()
      .custom(async (email) => {
        // 일회용 이메일 도메인 차단
        const disposableEmailDomains = ['10minutemail.com', 'tempmail.org'];
        const domain = email.split('@')[1];
        if (disposableEmailDomains.includes(domain)) {
          throw new Error('Disposable email addresses are not allowed');
        }
        return true;
      }),

    password: body('password')
      .isLength({ min: 8, max: 128 })
      .custom((password) => {
        return PasswordSecurity.validatePasswordStrength(password);
      }),

    name: body(['first_name', 'last_name'])
      .isLength({ min: 1, max: 50 })
      .matches(/^[a-zA-Z\s\-']+$/)
      .custom((name) => {
        // XSS 방지를 위한 HTML 태그 제거
        const cleaned = DOMPurify.sanitize(name, { ALLOWED_TAGS: [] });
        if (cleaned !== name) {
          throw new Error('Invalid characters in name');
        }
        return true;
      }),

    uuid: param('id').isUUID(4),

    amount: body('amount')
      .isFloat({ min: 0.01, max: 1000000 })
      .custom((amount) => {
        // 소수점 2자리까지만 허용
        if (!/^\d+(\.\d{1,2})?$/.test(amount.toString())) {
          throw new Error('Amount must have at most 2 decimal places');
        }
        return true;
      })
  };

  // SQL 인젝션 방지
  static preventSQLInjection(input) {
    const sqlKeywords = [
      'SELECT', 'INSERT', 'UPDATE', 'DELETE', 'DROP', 'CREATE',
      'ALTER', 'EXEC', 'UNION', 'SCRIPT', 'JAVASCRIPT'
    ];
    
    const upperInput = input.toUpperCase();
    for (const keyword of sqlKeywords) {
      if (upperInput.includes(keyword)) {
        throw new Error('Potentially malicious input detected');
      }
    }
    return true;
  }

  // XSS 방지
  static sanitizeHTML(input) {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: [],
      ALLOWED_ATTR: []
    });
  }

  // 검증 결과 처리
  static handleValidationErrors(req, res, next) {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }
    next();
  }
}
```

### **데이터 암호화**
```javascript
// ✅ 민감한 데이터 암호화
const crypto = require('crypto');

class DataEncryption {
  static algorithm = 'aes-256-gcm';
  static keyLength = 32;
  static ivLength = 16;
  static tagLength = 16;

  // 암호화 키 생성
  static generateKey() {
    return crypto.randomBytes(this.keyLength);
  }

  // 데이터 암호화
  static encrypt(text, key) {
    const iv = crypto.randomBytes(this.ivLength);
    const cipher = crypto.createCipher(this.algorithm, key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const tag = cipher.getAuthTag();
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: tag.toString('hex')
    };
  }

  // 데이터 복호화
  static decrypt(encryptedData, key) {
    const decipher = crypto.createDecipher(
      this.algorithm,
      key,
      Buffer.from(encryptedData.iv, 'hex')
    );
    
    decipher.setAuthTag(Buffer.from(encryptedData.tag, 'hex'));
    
    let decrypted = decipher.update(encryptedData.encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }

  // PII 데이터 암호화 (개인정보)
  static encryptPII(data) {
    const key = process.env.PII_ENCRYPTION_KEY;
    if (!key) {
      throw new Error('PII encryption key not configured');
    }
    
    return this.encrypt(JSON.stringify(data), key);
  }

  // PII 데이터 복호화
  static decryptPII(encryptedData) {
    const key = process.env.PII_ENCRYPTION_KEY;
    const decrypted = this.decrypt(encryptedData, key);
    return JSON.parse(decrypted);
  }
}
```

## 🌐 **네트워크 및 API 보안**

### **Rate Limiting 및 DDoS 방지**
```javascript
// ✅ 고급 Rate Limiting
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const RedisStore = require('rate-limit-redis');
const redis = require('redis');

class NetworkSecurity {
  static redisClient = redis.createClient({
    host: process.env.REDIS_HOST,
    port: process.env.REDIS_PORT
  });

  // 일반 API Rate Limiting
  static generalRateLimit = rateLimit({
    store: new RedisStore({
      client: this.redisClient
    }),
    windowMs: 15 * 60 * 1000, // 15분
    max: 100, // 요청 제한
    message: {
      success: false,
      error: 'Too many requests, please try again later'
    },
    standardHeaders: true,
    legacyHeaders: false
  });

  // 로그인 Rate Limiting (더 엄격)
  static authRateLimit = rateLimit({
    store: new RedisStore({
      client: this.redisClient
    }),
    windowMs: 15 * 60 * 1000, // 15분
    max: 5, // 로그인 시도 제한
    skipSuccessfulRequests: true,
    message: {
      success: false,
      error: 'Too many login attempts, please try again later'
    }
  });

  // 점진적 속도 제한
  static speedLimiter = slowDown({
    windowMs: 15 * 60 * 1000, // 15분
    delayAfter: 50, // 50번째 요청부터 지연
    delayMs: 500, // 500ms 지연
    maxDelayMs: 20000 // 최대 20초 지연
  });

  // IP 기반 차단
  static async blockSuspiciousIP(ip, reason) {
    await this.redisClient.setex(`blocked:${ip}`, 3600, reason); // 1시간 차단
  }

  // IP 차단 확인 미들웨어
  static async checkBlockedIP(req, res, next) {
    const ip = req.ip || req.connection.remoteAddress;
    const blocked = await this.redisClient.get(`blocked:${ip}`);
    
    if (blocked) {
      return res.status(403).json({
        success: false,
        error: 'IP address temporarily blocked'
      });
    }
    
    next();
  }
}
```

### **CORS 및 보안 헤더**
```javascript
// ✅ 보안 헤더 설정
const helmet = require('helmet');
const cors = require('cors');

class SecurityHeaders {
  // CORS 설정
  static corsOptions = {
    origin: function (origin, callback) {
      const allowedOrigins = [
        'https://christmas-protocol.netlify.app',
        'http://localhost:3000', // 개발 환경
        'http://localhost:5173'  // Vite 개발 서버
      ];
      
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    optionsSuccessStatus: 200,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
  };

  // Helmet 보안 헤더
  static helmetConfig = helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
        fontSrc: ["'self'", "https://fonts.gstatic.com"],
        imgSrc: ["'self'", "data:", "https:"],
        scriptSrc: ["'self'"],
        connectSrc: ["'self'", "https://qehzzsxzjijfzqkysazc.supabase.co"],
        frameSrc: ["'none'"],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: []
      }
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true
    },
    noSniff: true,
    xssFilter: true,
    referrerPolicy: { policy: "strict-origin-when-cross-origin" }
  });

  // 추가 보안 헤더
  static additionalHeaders(req, res, next) {
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  }
}
```

## 🗄️ **데이터베이스 보안**

### **Supabase 보안 설정**
```sql
-- ✅ Row Level Security (RLS) 정책
-- 사용자는 자신의 데이터만 접근 가능
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- AI 학습 데이터 보안
CREATE POLICY "Users can view own AI data" ON ai_learning_data
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert AI data" ON ai_learning_data
  FOR INSERT WITH CHECK (auth.role() = 'service_role');

-- 관리자만 모든 데이터 접근 가능
CREATE POLICY "Admins can view all data" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE id = auth.uid() 
      AND is_admin = true
    )
  );

-- 민감한 컬럼 암호화
ALTER TABLE users 
ADD COLUMN encrypted_ssn TEXT,
ADD COLUMN encrypted_phone TEXT;

-- 감사 로그 테이블
CREATE TABLE audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id),
  action TEXT NOT NULL,
  table_name TEXT NOT NULL,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 감사 로그 트리거
CREATE OR REPLACE FUNCTION audit_trigger_function()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO audit_logs (
    user_id, action, table_name, old_values, new_values, ip_address
  ) VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    CASE WHEN TG_OP = 'DELETE' THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT', 'UPDATE') THEN to_jsonb(NEW) ELSE NULL END,
    inet_client_addr()
  );
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- 중요 테이블에 감사 트리거 적용
CREATE TRIGGER users_audit_trigger
  AFTER INSERT OR UPDATE OR DELETE ON users
  FOR EACH ROW EXECUTE FUNCTION audit_trigger_function();
```

### **데이터 백업 및 복구**
```javascript
// ✅ 자동화된 백업 시스템
const cron = require('node-cron');
const { exec } = require('child_process');
const AWS = require('aws-sdk');

class BackupSecurity {
  static s3 = new AWS.S3({
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION
  });

  // 일일 백업 (매일 새벽 2시)
  static scheduleBackups() {
    cron.schedule('0 2 * * *', async () => {
      try {
        await this.createDatabaseBackup();
        await this.uploadBackupToS3();
        await this.cleanOldBackups();
        console.log('Daily backup completed successfully');
      } catch (error) {
        console.error('Backup failed:', error);
        await this.notifyBackupFailure(error);
      }
    });
  }

  // 데이터베이스 백업 생성
  static async createDatabaseBackup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = `backup-${timestamp}.sql`;
    
    return new Promise((resolve, reject) => {
      exec(
        `pg_dump ${process.env.DATABASE_URL} > ${backupFile}`,
        (error, stdout, stderr) => {
          if (error) {
            reject(error);
          } else {
            resolve(backupFile);
          }
        }
      );
    });
  }

  // S3에 백업 업로드
  static async uploadBackupToS3(backupFile) {
    const fileContent = require('fs').readFileSync(backupFile);
    
    const params = {
      Bucket: process.env.BACKUP_S3_BUCKET,
      Key: `database-backups/${backupFile}`,
      Body: fileContent,
      ServerSideEncryption: 'AES256'
    };

    return this.s3.upload(params).promise();
  }

  // 오래된 백업 정리 (30일 이상)
  static async cleanOldBackups() {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const params = {
      Bucket: process.env.BACKUP_S3_BUCKET,
      Prefix: 'database-backups/'
    };

    const objects = await this.s3.listObjectsV2(params).promise();
    
    for (const object of objects.Contents) {
      if (object.LastModified < thirtyDaysAgo) {
        await this.s3.deleteObject({
          Bucket: process.env.BACKUP_S3_BUCKET,
          Key: object.Key
        }).promise();
      }
    }
  }
}
```

## 🚨 **보안 모니터링 및 사고 대응**

### **보안 이벤트 모니터링**
```javascript
// ✅ 보안 이벤트 감지 및 알림
const winston = require('winston');
const nodemailer = require('nodemailer');

class SecurityMonitoring {
  static logger = winston.createLogger({
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

  // 의심스러운 활동 감지
  static async detectSuspiciousActivity(req, user) {
    const suspiciousPatterns = [
      // 비정상적인 로그인 시간
      this.checkUnusualLoginTime(user),
      // 새로운 디바이스/위치
      this.checkNewDevice(req, user),
      // 비정상적인 API 호출 패턴
      this.checkAPIAbusePattern(req, user),
      // 권한 상승 시도
      this.checkPrivilegeEscalation(req, user)
    ];

    const alerts = await Promise.all(suspiciousPatterns);
    const triggeredAlerts = alerts.filter(alert => alert.triggered);

    if (triggeredAlerts.length > 0) {
      await this.handleSecurityAlert(triggeredAlerts, req, user);
    }
  }

  // 보안 알림 처리
  static async handleSecurityAlert(alerts, req, user) {
    const alertData = {
      user_id: user.id,
      ip_address: req.ip,
      user_agent: req.get('User-Agent'),
      alerts: alerts,
      timestamp: new Date().toISOString()
    };

    // 로그 기록
    this.logger.warn('Security alert triggered', alertData);

    // 데이터베이스에 기록
    await supabase.from('security_alerts').insert(alertData);

    // 심각한 경우 즉시 알림
    if (alerts.some(alert => alert.severity === 'critical')) {
      await this.sendImmediateAlert(alertData);
      
      // 계정 임시 잠금
      if (alerts.some(alert => alert.action === 'lock_account')) {
        await this.lockUserAccount(user.id, 'Suspicious activity detected');
      }
    }
  }

  // 즉시 알림 발송
  static async sendImmediateAlert(alertData) {
    const transporter = nodemailer.createTransporter({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const mailOptions = {
      from: process.env.SECURITY_EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: '🚨 Christmas Trading Security Alert',
      html: `
        <h2>Security Alert Triggered</h2>
        <p><strong>User ID:</strong> ${alertData.user_id}</p>
        <p><strong>IP Address:</strong> ${alertData.ip_address}</p>
        <p><strong>Time:</strong> ${alertData.timestamp}</p>
        <h3>Alerts:</h3>
        <ul>
          ${alertData.alerts.map(alert => `<li>${alert.message}</li>`).join('')}
        </ul>
      `
    };

    await transporter.sendMail(mailOptions);
  }

  // 계정 잠금
  static async lockUserAccount(userId, reason) {
    await supabase
      .from('users')
      .update({
        is_locked: true,
        lock_reason: reason,
        locked_at: new Date().toISOString()
      })
      .eq('id', userId);

    // 모든 활성 세션 무효화
    await supabase
      .from('user_sessions')
      .update({ is_active: false })
      .eq('user_id', userId);
  }
}
```

### **사고 대응 절차**
```javascript
// ✅ 보안 사고 대응 플레이북
class IncidentResponse {
  // 사고 등급 분류
  static classifyIncident(incident) {
    const classifications = {
      P1: { // Critical
        criteria: ['data_breach', 'system_compromise', 'financial_fraud'],
        response_time: '15 minutes',
        escalation: 'immediate'
      },
      P2: { // High
        criteria: ['unauthorized_access', 'privilege_escalation', 'ddos_attack'],
        response_time: '1 hour',
        escalation: '2 hours'
      },
      P3: { // Medium
        criteria: ['suspicious_activity', 'failed_login_attempts', 'policy_violation'],
        response_time: '4 hours',
        escalation: '24 hours'
      },
      P4: { // Low
        criteria: ['minor_policy_violation', 'informational_alert'],
        response_time: '24 hours',
        escalation: '72 hours'
      }
    };

    for (const [priority, config] of Object.entries(classifications)) {
      if (config.criteria.some(criteria => incident.type.includes(criteria))) {
        return { priority, ...config };
      }
    }

    return classifications.P4; // Default to low priority
  }

  // 자동 대응 조치
  static async executeAutomaticResponse(incident) {
    const responses = {
      'brute_force_attack': async () => {
        await NetworkSecurity.blockSuspiciousIP(incident.ip_address, 'Brute force attack');
        await this.notifySecurityTeam(incident);
      },
      
      'sql_injection_attempt': async () => {
        await NetworkSecurity.blockSuspiciousIP(incident.ip_address, 'SQL injection attempt');
        await this.quarantineRequest(incident);
        await this.notifySecurityTeam(incident);
      },
      
      'unusual_data_access': async () => {
        await SecurityMonitoring.lockUserAccount(incident.user_id, 'Unusual data access pattern');
        await this.notifyUser(incident.user_id, 'Account temporarily locked for security');
        await this.notifySecurityTeam(incident);
      },
      
      'privilege_escalation': async () => {
        await SecurityMonitoring.lockUserAccount(incident.user_id, 'Privilege escalation attempt');
        await this.revokeAllSessions(incident.user_id);
        await this.notifySecurityTeam(incident);
      }
    };

    const responseAction = responses[incident.type];
    if (responseAction) {
      await responseAction();
    }
  }

  // 포렌식 데이터 수집
  static async collectForensicData(incident) {
    const forensicData = {
      incident_id: incident.id,
      timestamp: new Date().toISOString(),
      system_state: await this.captureSystemState(),
      network_logs: await this.extractNetworkLogs(incident.timeframe),
      database_logs: await this.extractDatabaseLogs(incident.timeframe),
      application_logs: await this.extractApplicationLogs(incident.timeframe),
      user_activity: await this.extractUserActivity(incident.user_id, incident.timeframe)
    };

    // 포렌식 데이터를 안전한 저장소에 보관
    await this.storeForensicData(forensicData);
    
    return forensicData;
  }
}
```

---

## 📝 **보안 체크리스트**

### **일일 보안 점검**
- [ ] 보안 로그 검토
- [ ] 실패한 로그인 시도 분석
- [ ] 시스템 리소스 사용량 확인
- [ ] 백업 상태 확인

### **주간 보안 점검**
- [ ] 보안 패치 업데이트 확인
- [ ] 사용자 권한 검토
- [ ] 네트워크 트래픽 분석
- [ ] 취약점 스캔 실행

### **월간 보안 점검**
- [ ] 전체 시스템 보안 감사
- [ ] 사고 대응 절차 테스트
- [ ] 직원 보안 교육
- [ ] 보안 정책 업데이트

### **분기별 보안 점검**
- [ ] 침투 테스트 실행
- [ ] 재해 복구 계획 테스트
- [ ] 보안 아키텍처 검토
- [ ] 컴플라이언스 감사

---

## 🎯 **다음 액션 아이템**

### **즉시 실행 (이번 세션)**
- [ ] 기본 보안 헤더 설정
- [ ] Rate Limiting 구현
- [ ] 입력 검증 강화

### **단기 목표 (1주 내)**
- [ ] MFA 시스템 구현
- [ ] 보안 모니터링 설정
- [ ] 자동 백업 시스템 구축

### **장기 목표 (1개월 내)**
- [ ] 전체 보안 감사 실행
- [ ] 침투 테스트 수행
- [ ] 보안 인증 획득 (ISO 27001 등)

**📝 업데이트**: 2025-05-30 | **관리자**: Security Team | **다음 리뷰**: 2025-06-06 