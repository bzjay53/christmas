# 🔐 Christmas Trading - 사용자 인증 시스템 명세서

## 📋 문서 정보
- **문서명**: 사용자 인증 시스템 명세서 (User Authentication Specification)
- **작성일**: 2025-06-24
- **버전**: v1.0
- **우선순위**: CRITICAL
- **상태**: 활성화 (Active)

## 🎯 목적
Christmas Trading 플랫폼의 사용자 인증, 권한 관리, 보안 시스템에 대한 종합적인 명세를 정의합니다.

## 🏗️ 인증 시스템 아키텍처

### 1. 전체 인증 구조
```
인증 시스템 아키텍처:
┌─────────────────────────────────────────────────────────────┐
│                    Frontend Layer                          │
├─────────────────────────────────────────────────────────────┤
│  React Components  │  Auth Context  │  Protected Routes    │
│  - 로그인 페이지    │  - 인증 상태   │  - 권한별 라우팅     │
│  - 회원가입 폼     │  - 토큰 관리   │  - 역할 기반 접근   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Authentication Layer                    │
├─────────────────────────────────────────────────────────────┤
│   Supabase Auth    │  JWT Tokens    │  Session Management  │
│   - OAuth 제공자   │  - Access Token│  - 자동 갱신        │
│   - 이메일 인증    │  - Refresh Token│ - 보안 세션 관리   │
│   - 비밀번호 관리  │  - 토큰 검증   │  - 다중 기기 지원   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                    Database Layer                          │
├─────────────────────────────────────────────────────────────┤
│    User Profiles   │   Permissions  │   Trading Accounts   │
│    - 기본 정보     │   - 역할 관리  │   - 계좌 연동 정보   │
│    - 선호 설정     │   - 기능 권한  │   - 거래 이력       │
│    - KYC 정보      │   - 데이터 접근│   - 리스크 레벨     │
└─────────────────────────────────────────────────────────────┘
```

## 🔑 인증 방식 및 구현

### 2. 지원하는 인증 방법
```typescript
// Supabase 인증 제공자
const authProviders = {
  email: {
    name: "이메일/비밀번호",
    enabled: true,
    twoFactor: true  // 2FA 지원
  },
  google: {
    name: "Google OAuth",
    enabled: true,
    clientId: process.env.GOOGLE_CLIENT_ID
  },
  github: {
    name: "GitHub OAuth", 
    enabled: true,
    scope: "user:email"
  },
  apple: {
    name: "Apple ID",
    enabled: false  // 향후 구현 예정
  }
};
```

### 3. 사용자 등급 및 권한 시스템
```typescript
// 사용자 역할 정의
enum UserRole {
  GUEST = "guest",           // 임시 사용자 (모의투자만)
  BASIC = "basic",          // 기본 사용자 (제한적 기능)
  PREMIUM = "premium",      // 프리미엄 사용자 (전체 기능)
  VIP = "vip",             // VIP 사용자 (고급 기능)
  ADMIN = "admin"          // 관리자 (시스템 관리)
}

// 권한 매트릭스
interface UserPermissions {
  trading: {
    mockTrading: boolean;      // 모의투자 권한
    realTrading: boolean;      // 실제 거래 권한
    maxOrderAmount: number;    // 최대 주문 금액
    aiRecommendation: boolean; // AI 추천 서비스
  };
  features: {
    backtest: boolean;         // 백테스팅 기능
    portfolioAnalysis: boolean;// 포트폴리오 분석
    realTimeData: boolean;     // 실시간 데이터
    advancedCharts: boolean;   // 고급 차트
  };
  limits: {
    dailyTrades: number;       // 일일 거래 횟수
    monthlyVolume: number;     // 월간 거래량 한도
    apiCalls: number;          // API 호출 한도
  };
}
```

### 4. 회원가입 및 KYC 프로세스
```typescript
// 회원가입 단계
interface RegistrationFlow {
  step1: {
    name: "기본 정보";
    fields: ["email", "password", "name", "phone"];
    validation: "실시간 중복 검사";
  };
  step2: {
    name: "이메일 인증";
    process: "Supabase 이메일 발송";
    timeout: "24시간";
  };
  step3: {
    name: "프로필 설정";
    fields: ["birthDate", "investmentExperience", "riskTolerance"];
    optional: true;
  };
  step4: {
    name: "KYC 인증";
    documents: ["idCard", "bankAccount"];
    required: "실제 거래 시";
  };
}

// KYC (Know Your Customer) 정보
interface KYCData {
  personalInfo: {
    fullName: string;
    birthDate: Date;
    nationality: string;
    address: {
      country: string;
      city: string;
      postalCode: string;
      streetAddress: string;
    };
  };
  financialInfo: {
    employmentStatus: string;
    annualIncome: number;
    investmentExperience: "beginner" | "intermediate" | "advanced";
    riskTolerance: "conservative" | "moderate" | "aggressive";
  };
  verification: {
    idVerificationStatus: "pending" | "verified" | "rejected";
    bankAccountVerified: boolean;
    documentSubmittedAt: Date;
    verifiedAt?: Date;
  };
}
```

## 🛡️ 보안 구현

### 5. 토큰 기반 인증
```typescript
// JWT 토큰 구조
interface JWTPayload {
  sub: string;              // 사용자 ID
  email: string;           // 이메일
  role: UserRole;          // 사용자 역할
  permissions: string[];   // 권한 목록
  iat: number;            // 토큰 발급 시간
  exp: number;            // 토큰 만료 시간
  aud: string;            // 대상 서비스
  iss: string;            // 발급자
}

// 토큰 검증 및 갱신
class AuthTokenManager {
  async validateToken(token: string): Promise<boolean> {
    try {
      const payload = jwt.verify(token, JWT_SECRET);
      return this.checkTokenExpiry(payload) && this.validatePermissions(payload);
    } catch (error) {
      return false;
    }
  }

  async refreshToken(refreshToken: string): Promise<string> {
    // Refresh Token을 통한 Access Token 갱신
    const newToken = await supabase.auth.refreshSession();
    return newToken.access_token;
  }
}
```

### 6. 세션 관리 및 보안
```typescript
// 세션 보안 설정
const sessionConfig = {
  maxAge: 24 * 60 * 60 * 1000,    // 24시간
  secure: true,                    // HTTPS only
  httpOnly: true,                  // XSS 방지
  sameSite: 'strict',             // CSRF 방지
  domain: 'christmas-trading.com'  // 도메인 제한
};

// 다중 기기 세션 관리
interface UserSession {
  sessionId: string;
  userId: string;
  deviceInfo: {
    deviceType: 'desktop' | 'mobile' | 'tablet';
    browser: string;
    ipAddress: string;
    location?: string;
  };
  createdAt: Date;
  lastActivity: Date;
  isActive: boolean;
}
```

### 7. 비밀번호 보안 정책
```typescript
// 비밀번호 정책
const passwordPolicy = {
  minLength: 8,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: true,
  prohibitCommonPasswords: true,
  maxAge: 90,                    // 90일마다 변경 권장
  historyCheck: 5               // 최근 5개 비밀번호 재사용 금지
};

// 비밀번호 해싱 (Supabase 내장)
const hashPassword = async (password: string): Promise<string> => {
  // Supabase는 bcrypt를 사용하여 자동 해싱
  return supabase.auth.signUp({ email, password });
};
```

## 🔐 2단계 인증 (2FA)

### 8. TOTP 기반 2FA
```typescript
// 2FA 설정
interface TwoFactorAuth {
  enabled: boolean;
  method: 'totp' | 'sms' | 'email';
  secret?: string;              // TOTP 시크릿 키
  backupCodes: string[];        // 백업 코드 (10개)
  lastUsed?: Date;
}

// 2FA 검증 과정
class TwoFactorManager {
  async enableTOTP(userId: string): Promise<{ secret: string; qrCode: string }> {
    const secret = generateTOTPSecret();
    const qrCode = generateQRCode(secret, userId);
    
    await this.storeTempSecret(userId, secret);
    return { secret, qrCode };
  }

  async verifyTOTP(userId: string, token: string): Promise<boolean> {
    const secret = await this.getUserSecret(userId);
    return verifyTOTPToken(secret, token);
  }

  async generateBackupCodes(userId: string): Promise<string[]> {
    const codes = Array.from({ length: 10 }, () => 
      crypto.randomBytes(4).toString('hex').toUpperCase()
    );
    await this.storeBackupCodes(userId, codes);
    return codes;
  }
}
```

## 🎭 권한 기반 접근 제어 (RBAC)

### 9. 역할 기반 라우팅
```typescript
// Protected Route 컴포넌트
const ProtectedRoute: React.FC<{
  children: React.ReactNode;
  requiredRole?: UserRole;
  requiredPermissions?: string[];
}> = ({ children, requiredRole, requiredPermissions }) => {
  const { user, hasPermission } = useAuth();

  if (!user) {
    return <Navigate to="/login" />;
  }

  if (requiredRole && user.role !== requiredRole) {
    return <AccessDenied />;
  }

  if (requiredPermissions && !hasPermission(requiredPermissions)) {
    return <AccessDenied />;
  }

  return <>{children}</>;
};

// 사용 예시
const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/dashboard" element={
      <ProtectedRoute requiredRole={UserRole.BASIC}>
        <Dashboard />
      </ProtectedRoute>
    } />
    <Route path="/premium" element={
      <ProtectedRoute requiredRole={UserRole.PREMIUM}>
        <PremiumFeatures />
      </ProtectedRoute>
    } />
    <Route path="/admin" element={
      <ProtectedRoute requiredRole={UserRole.ADMIN}>
        <AdminPanel />
      </ProtectedRoute>
    } />
  </Routes>
);
```

### 10. 동적 권한 검사
```typescript
// 권한 검사 훅
const usePermission = () => {
  const { user } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!user) return false;
    return user.permissions.includes(permission);
  };

  const canTrade = (amount: number): boolean => {
    if (!hasPermission('trading.real')) return false;
    return amount <= user.limits.maxOrderAmount;
  };

  const canAccessFeature = (feature: string): boolean => {
    const featurePermissions = {
      'backtest': 'features.backtest',
      'ai-recommendation': 'trading.aiRecommendation',
      'real-time-data': 'features.realTimeData'
    };
    
    return hasPermission(featurePermissions[feature]);
  };

  return { hasPermission, canTrade, canAccessFeature };
};
```

## 🚨 보안 모니터링 및 감사

### 11. 보안 이벤트 로깅
```typescript
// 보안 이벤트 타입
enum SecurityEventType {
  LOGIN_SUCCESS = "login_success",
  LOGIN_FAILURE = "login_failure",
  PASSWORD_CHANGE = "password_change",
  PERMISSION_DENIED = "permission_denied",
  SUSPICIOUS_ACTIVITY = "suspicious_activity",
  ACCOUNT_LOCKOUT = "account_lockout"
}

// 보안 로그 인터페이스
interface SecurityLog {
  eventType: SecurityEventType;
  userId?: string;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  details: Record<string, any>;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
}

// 보안 모니터링 시스템
class SecurityMonitor {
  async logSecurityEvent(event: SecurityLog): Promise<void> {
    await supabase.from('security_logs').insert(event);
    
    if (event.riskLevel === 'critical') {
      await this.alertAdministrators(event);
    }
  }

  async detectSuspiciousActivity(userId: string): Promise<boolean> {
    const recentLogs = await this.getRecentLogs(userId, 24); // 24시간 이내
    
    // 의심스러운 패턴 감지
    const failureCount = recentLogs.filter(log => 
      log.eventType === SecurityEventType.LOGIN_FAILURE
    ).length;
    
    const uniqueIPs = new Set(recentLogs.map(log => log.ipAddress)).size;
    
    return failureCount > 5 || uniqueIPs > 3;
  }
}
```

### 12. 계정 보안 기능
```typescript
// 계정 잠금 정책
const accountLockoutPolicy = {
  maxFailedAttempts: 5,          // 최대 실패 횟수
  lockoutDuration: 15 * 60 * 1000, // 15분 잠금
  progressiveLockout: true,      // 점진적 잠금 시간 증가
  notifyUser: true              // 잠금 시 이메일 알림
};

// 이상 로그인 감지
interface AnomalyDetection {
  newDeviceLogin: boolean;       // 새 기기에서 로그인
  unusualLocation: boolean;      // 비정상적 위치
  rapidFailedAttempts: boolean;  // 빠른 연속 실패
  offHoursAccess: boolean;      // 비정상 시간대 접근
}
```

## 📱 사용자 경험 및 인터페이스

### 13. 인증 UI 컴포넌트
```typescript
// 로그인 컴포넌트
const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const { login, loginWith2FA } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const result = await login(email, password);
    
    if (result.requires2FA) {
      setShowTwoFactor(true);
    } else if (result.success) {
      navigate('/dashboard');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      {/* 로그인 폼 UI */}
    </form>
  );
};

// 회원가입 컴포넌트
const SignupForm: React.FC = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<RegistrationData>({});
  const { signup } = useAuth();

  return (
    <div className="signup-container">
      {step === 1 && <BasicInfoStep />}
      {step === 2 && <EmailVerificationStep />}
      {step === 3 && <ProfileSetupStep />}
      {step === 4 && <KYCUploadStep />}
    </div>
  );
};
```

## 🔧 기술 구현 사항

### 14. Supabase 인증 설정
```typescript
// Supabase 클라이언트 설정
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true,
      flowType: 'pkce'  // PKCE 보안 플로우
    }
  }
);

// RLS (Row Level Security) 정책
-- users 테이블 RLS 정책
CREATE POLICY "Users can view own profile" ON profiles
FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
FOR UPDATE USING (auth.uid() = id);
```

### 15. 환경별 인증 설정
```env
# 개발 환경
VITE_SUPABASE_URL=https://project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_JWT_SECRET=your_jwt_secret

# OAuth 제공자
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# 보안 설정
JWT_SECRET=your_jwt_secret
ENCRYPTION_KEY=your_encryption_key
SESSION_SECRET=your_session_secret
```

## 📊 성능 및 확장성

### 16. 인증 성능 최적화
- **토큰 캐싱**: 메모리 기반 토큰 저장
- **세션 풀링**: 데이터베이스 연결 최적화
- **비동기 검증**: 백그라운드 권한 검사
- **CDN 활용**: 정적 인증 리소스 캐싱

### 17. 확장성 고려사항
- **수평적 확장**: 마이크로서비스 아키텍처 지원
- **캐시 전략**: Redis 기반 세션 스토어
- **API 게이트웨이**: 인증/인가 중앙 집중
- **모니터링**: 실시간 보안 이벤트 추적

---

## 📝 변경 이력
- **v1.0** (2025-06-24): 초기 사용자 인증 시스템 명세서 작성
- Supabase 인증 시스템 설계 완료
- 역할 기반 접근 제어 구현
- 2단계 인증 시스템 계획 수립

## 🔗 관련 문서
- [거래 시스템 명세서](TRADING_SYSTEM_SPEC.md)
- [위험 관리 명세서](RISK_MANAGEMENT_SPEC.md)
- [API 통합 가이드](../guides/API_INTEGRATION_GUIDE.md)
- [문서 맵](../DOCUMENT_MAP.md)

---
*이 문서는 Christmas Trading 프로젝트의 사용자 인증 시스템 핵심 명세서입니다.*