# 🎯 Christmas Trading 코드 품질 가이드라인

## 📋 개요

이 문서는 Christmas Trading 프로젝트의 코드 품질을 보장하고 일관된 개발 표준을 유지하기 위한 가이드라인입니다.

## 🏗️ 전체 아키텍처 원칙

### 🎯 설계 원칙
1. **SOLID 원칙** 준수
2. **DRY (Don't Repeat Yourself)** 원칙
3. **KISS (Keep It Simple, Stupid)** 원칙
4. **관심사의 분리 (Separation of Concerns)**
5. **의존성 주입 (Dependency Injection)**

### 📁 프로젝트 구조 표준
```
christmas/
├── backend/                 # Node.js 백엔드
│   ├── src/
│   │   ├── routes/         # API 라우트 (단일 책임)
│   │   ├── services/       # 비즈니스 로직
│   │   ├── middleware/     # 미들웨어 함수
│   │   ├── utils/          # 유틸리티 함수
│   │   └── models/         # 데이터 모델
│   ├── tests/              # 테스트 파일
│   └── docs/               # API 문서
├── web-dashboard/          # React 프론트엔드
│   ├── src/
│   │   ├── components/     # 재사용 가능한 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── stores/         # Zustand 상태 관리
│   │   ├── services/       # API 서비스
│   │   └── utils/          # 유틸리티 함수
│   └── tests/              # 테스트 파일
```

## 🔧 백엔드 코드 품질 기준 (Node.js)

### 📝 코딩 스타일

#### 1. 네이밍 컨벤션
```javascript
// ✅ 좋은 예
const userAuthService = require('./services/userAuth');
const MAX_LOGIN_ATTEMPTS = 5;

class UserAuthenticationService {
  async authenticateUser(credentials) {
    // 구현
  }
}

// ❌ 나쁜 예
const uas = require('./services/userAuth');
const max = 5;

class UAS {
  async auth(creds) {
    // 구현
  }
}
```

#### 2. 함수 작성 원칙
```javascript
// ✅ 좋은 예: 단일 책임, 명확한 이름
async function validateUserCredentials(email, password) {
  if (!email || !password) {
    throw new Error('이메일과 비밀번호는 필수입니다.');
  }
  
  const user = await findUserByEmail(email);
  if (!user) {
    throw new Error('사용자를 찾을 수 없습니다.');
  }
  
  return await bcrypt.compare(password, user.password);
}

// ❌ 나쁜 예: 여러 책임, 불명확한 이름
async function check(e, p) {
  const u = await db.findOne({email: e});
  if (!u) return false;
  if (await bcrypt.compare(p, u.password)) {
    u.lastLogin = new Date();
    await u.save();
    return true;
  }
  return false;
}
```

#### 3. 에러 처리 표준
```javascript
// ✅ 좋은 예: 구체적인 에러 처리
class AuthenticationError extends Error {
  constructor(message, code = 'AUTH_ERROR') {
    super(message);
    this.name = 'AuthenticationError';
    this.code = code;
  }
}

async function loginUser(email, password) {
  try {
    const user = await validateUserCredentials(email, password);
    return await generateJWTToken(user);
  } catch (error) {
    console.error('로그인 실패:', error);
    
    if (error instanceof ValidationError) {
      throw new AuthenticationError('입력 데이터가 유효하지 않습니다.', 'INVALID_INPUT');
    }
    
    throw new AuthenticationError('로그인에 실패했습니다.', 'LOGIN_FAILED');
  }
}

// ❌ 나쁜 예: 일반적인 에러 처리
async function loginUser(email, password) {
  try {
    // 로직
  } catch (error) {
    console.log(error);
    throw error;
  }
}
```

### 🔒 보안 코딩 표준

#### 1. 입력 검증
```javascript
// ✅ 좋은 예: express-validator 사용
const { body, validationResult } = require('express-validator');

const validateSignup = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('유효한 이메일을 입력해주세요.'),
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('비밀번호는 8자 이상, 대소문자, 숫자, 특수문자를 포함해야 합니다.'),
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];
```

#### 2. SQL 인젝션 방지
```javascript
// ✅ 좋은 예: Supabase 클라이언트 사용
async function getUserById(userId) {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
    
  if (error) throw error;
  return data;
}

// ❌ 나쁜 예: 직접 쿼리 문자열 조작
async function getUserById(userId) {
  const query = `SELECT * FROM users WHERE id = ${userId}`;
  // SQL 인젝션 위험
}
```

### 📊 성능 최적화 기준

#### 1. 비동기 처리
```javascript
// ✅ 좋은 예: 병렬 처리
async function getUserDashboardData(userId) {
  const [user, coupons, referrals] = await Promise.all([
    getUserProfile(userId),
    getUserCoupons(userId),
    getUserReferrals(userId)
  ]);
  
  return { user, coupons, referrals };
}

// ❌ 나쁜 예: 순차 처리
async function getUserDashboardData(userId) {
  const user = await getUserProfile(userId);
  const coupons = await getUserCoupons(userId);
  const referrals = await getUserReferrals(userId);
  
  return { user, coupons, referrals };
}
```

#### 2. 메모리 관리
```javascript
// ✅ 좋은 예: 스트림 사용
const fs = require('fs');
const csv = require('csv-parser');

function processLargeCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // 데이터 처리
        if (results.length < 1000) { // 메모리 제한
          results.push(processRow(data));
        }
      })
      .on('end', () => resolve(results))
      .on('error', reject);
  });
}
```

## 🌐 프론트엔드 코드 품질 기준 (React)

### 📝 컴포넌트 작성 원칙

#### 1. 함수형 컴포넌트 우선
```jsx
// ✅ 좋은 예: 함수형 컴포넌트 + Hooks
import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

const LoginForm = () => {
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const { login, isAuthenticated } = useAuthStore();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      await login(credentials);
    } catch (error) {
      console.error('로그인 실패:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* JSX */}
    </form>
  );
};

export default LoginForm;
```

#### 2. Props 타입 검증 (TypeScript 권장)
```jsx
// ✅ 좋은 예: PropTypes 또는 TypeScript
import PropTypes from 'prop-types';

const UserCard = ({ user, onEdit, isEditable = false }) => {
  return (
    <div className="user-card">
      <h3>{user.name}</h3>
      <p>{user.email}</p>
      {isEditable && (
        <button onClick={() => onEdit(user.id)}>
          편집
        </button>
      )}
    </div>
  );
};

UserCard.propTypes = {
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
  }).isRequired,
  onEdit: PropTypes.func.isRequired,
  isEditable: PropTypes.bool,
};

export default UserCard;
```

### 🎨 스타일링 표준 (TailwindCSS)

#### 1. 클래스 네이밍 컨벤션
```jsx
// ✅ 좋은 예: 의미있는 클래스 조합
const Button = ({ variant = 'primary', size = 'md', children, ...props }) => {
  const baseClasses = 'font-medium rounded-lg transition-colors duration-200';
  
  const variantClasses = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-900',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  const className = `${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`;
  
  return (
    <button className={className} {...props}>
      {children}
    </button>
  );
};
```

#### 2. 반응형 디자인
```jsx
// ✅ 좋은 예: 모바일 우선 반응형
const DashboardLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm px-4 py-3 md:px-6 lg:px-8">
        {/* 네비게이션 */}
      </nav>
      
      <main className="container mx-auto px-4 py-6 md:px-6 lg:px-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          <aside className="md:col-span-1">
            {/* 사이드바 */}
          </aside>
          
          <section className="md:col-span-2 lg:col-span-3">
            {children}
          </section>
        </div>
      </main>
    </div>
  );
};
```

### 🔄 상태 관리 (Zustand)

#### 1. 스토어 구조화
```javascript
// ✅ 좋은 예: 명확한 스토어 분리
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

const useAuthStore = create(
  devtools(
    (set, get) => ({
      // State
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // Actions
      login: async (credentials) => {
        set({ isLoading: true, error: null });
        
        try {
          const response = await authAPI.login(credentials);
          set({ 
            user: response.user, 
            isAuthenticated: true, 
            isLoading: false 
          });
        } catch (error) {
          set({ 
            error: error.message, 
            isLoading: false 
          });
          throw error;
        }
      },

      logout: () => {
        set({ 
          user: null, 
          isAuthenticated: false, 
          error: null 
        });
      },

      clearError: () => set({ error: null }),
    }),
    { name: 'auth-store' }
  )
);

export default useAuthStore;
```

## 🧪 테스트 품질 기준

### 🔧 백엔드 테스트 (Jest)

#### 1. 단위 테스트
```javascript
// ✅ 좋은 예: 명확한 테스트 케이스
describe('UserAuthService', () => {
  let authService;
  
  beforeEach(() => {
    authService = new UserAuthService();
  });

  describe('validateCredentials', () => {
    it('유효한 자격 증명으로 true를 반환해야 함', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'validPassword123!';
      
      // Act
      const result = await authService.validateCredentials(email, password);
      
      // Assert
      expect(result).toBe(true);
    });

    it('잘못된 비밀번호로 false를 반환해야 함', async () => {
      // Arrange
      const email = 'test@example.com';
      const password = 'wrongPassword';
      
      // Act
      const result = await authService.validateCredentials(email, password);
      
      // Assert
      expect(result).toBe(false);
    });

    it('존재하지 않는 사용자로 에러를 발생시켜야 함', async () => {
      // Arrange
      const email = 'nonexistent@example.com';
      const password = 'anyPassword';
      
      // Act & Assert
      await expect(
        authService.validateCredentials(email, password)
      ).rejects.toThrow('사용자를 찾을 수 없습니다.');
    });
  });
});
```

### 🌐 프론트엔드 테스트 (React Testing Library)

#### 1. 컴포넌트 테스트
```jsx
// ✅ 좋은 예: 사용자 중심 테스트
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import LoginForm from '../LoginForm';

describe('LoginForm', () => {
  it('사용자가 로그인 폼을 제출할 수 있어야 함', async () => {
    // Arrange
    const mockLogin = jest.fn();
    const user = userEvent.setup();
    
    render(<LoginForm onLogin={mockLogin} />);
    
    // Act
    await user.type(screen.getByLabelText(/이메일/i), 'test@example.com');
    await user.type(screen.getByLabelText(/비밀번호/i), 'password123');
    await user.click(screen.getByRole('button', { name: /로그인/i }));
    
    // Assert
    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      });
    });
  });

  it('필수 필드가 비어있을 때 에러 메시지를 표시해야 함', async () => {
    // Arrange
    const user = userEvent.setup();
    render(<LoginForm />);
    
    // Act
    await user.click(screen.getByRole('button', { name: /로그인/i }));
    
    // Assert
    expect(screen.getByText(/이메일을 입력해주세요/i)).toBeInTheDocument();
    expect(screen.getByText(/비밀번호를 입력해주세요/i)).toBeInTheDocument();
  });
});
```

## 📊 코드 품질 메트릭

### 🎯 품질 목표

| 메트릭 | 목표 | 측정 도구 |
|--------|------|-----------|
| **코드 커버리지** | > 80% | Jest Coverage |
| **복잡도** | < 10 (함수당) | ESLint Complexity |
| **중복 코드** | < 5% | SonarQube |
| **기술 부채** | < 30분 | SonarQube |
| **버그 밀도** | < 1% | SonarQube |

### 🔍 정적 분석 도구

#### 1. ESLint 설정
```json
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "plugin:react/recommended",
    "plugin:react-hooks/recommended"
  ],
  "rules": {
    "complexity": ["error", 10],
    "max-lines-per-function": ["error", 50],
    "no-console": "warn",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

#### 2. Prettier 설정
```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false
}
```

## 🔄 코드 리뷰 프로세스

### 📋 리뷰 체크리스트

#### 🔧 기능성
- [ ] 요구사항을 정확히 구현했는가?
- [ ] 에지 케이스를 고려했는가?
- [ ] 에러 처리가 적절한가?

#### 🎨 코드 품질
- [ ] 코딩 컨벤션을 준수했는가?
- [ ] 함수/클래스가 단일 책임을 가지는가?
- [ ] 변수/함수명이 명확한가?

#### 🔒 보안
- [ ] 입력 검증이 적절한가?
- [ ] 민감한 정보가 노출되지 않는가?
- [ ] 인증/권한 검사가 적절한가?

#### 📊 성능
- [ ] 불필요한 연산이 없는가?
- [ ] 메모리 누수 가능성이 없는가?
- [ ] 데이터베이스 쿼리가 최적화되었는가?

### 🚀 자동화 도구

#### 1. Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm test"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx}": [
      "eslint --fix",
      "prettier --write",
      "git add"
    ]
  }
}
```

#### 2. CI/CD 파이프라인
```yaml
# .github/workflows/quality-check.yml
name: Code Quality Check

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Run linting
        run: npm run lint
      
      - name: Run tests
        run: npm test -- --coverage
      
      - name: SonarQube Scan
        uses: sonarqube-quality-gate-action@master
```

---
**📅 최종 업데이트**: 2025-05-26 19:50  
**👤 작성자**: PM AI Assistant  
**🔄 버전**: v1.0  
**📊 상태**: 활성 - 개발팀 준수 필요  
**📞 담당자**: 개발팀 + 코드 리뷰어 