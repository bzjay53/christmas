# 🎄 Christmas Trading 테스트 전략 (2025-05-30)

## 🧪 **테스트 전략 개요**

### **테스트 피라미드**
```
                    🔺 E2E Tests (10%)
                   /   \
                  /     \
                 /       \
                /         \
               /           \
              🔺 Integration Tests (20%)
             /               \
            /                 \
           /                   \
          /                     \
         /                       \
        🔺 Unit Tests (70%)
       /                         \
      /_________________________\
```

### **테스트 커버리지 목표**
```
🎯 전체 목표: 80% 이상
├── 📱 Frontend: 75% 이상
├── 🖥️ Backend: 85% 이상
├── 🔗 API Integration: 90% 이상
└── 🌐 E2E Critical Path: 100%
```

## 🧪 **Unit Tests (단위 테스트)**

### **Frontend Unit Tests (React + TypeScript)**
```typescript
// 테스트 대상: 컴포넌트, 훅, 유틸리티 함수
// 도구: Vitest + React Testing Library

// 예시: 컴포넌트 테스트
// tests/components/UserProfile.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { UserProfile } from '../components/UserProfile';
import { useUser } from '../hooks/useUser';

// Mock 커스텀 훅
jest.mock('../hooks/useUser');

describe('UserProfile', () => {
  it('should display loading spinner when loading', () => {
    (useUser as jest.Mock).mockReturnValue({
      user: null,
      loading: true,
      error: null
    });

    render(<UserProfile userId="123" />);
    
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  it('should display user data when loaded', async () => {
    const mockUser = {
      id: '123',
      name: 'Test User',
      email: 'test@example.com'
    };

    (useUser as jest.Mock).mockReturnValue({
      user: mockUser,
      loading: false,
      error: null
    });

    render(<UserProfile userId="123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });
  });

  it('should display error message when error occurs', () => {
    (useUser as jest.Mock).mockReturnValue({
      user: null,
      loading: false,
      error: new Error('Failed to load user')
    });

    render(<UserProfile userId="123" />);
    
    expect(screen.getByText(/Failed to load user/)).toBeInTheDocument();
  });
});
```

### **Backend Unit Tests (Node.js + Jest)**
```javascript
// 테스트 대상: 서비스, 유틸리티, 미들웨어
// 도구: Jest + Supertest

// 예시: 서비스 테스트
// tests/services/authService.test.js
const AuthService = require('../../services/authService');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

jest.mock('bcryptjs');
jest.mock('jsonwebtoken');

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('hashPassword', () => {
    it('should hash password with correct salt rounds', async () => {
      const password = 'testPassword123';
      const hashedPassword = 'hashedPassword';
      
      bcrypt.hash.mockResolvedValue(hashedPassword);

      const result = await AuthService.hashPassword(password);

      expect(bcrypt.hash).toHaveBeenCalledWith(password, 12);
      expect(result).toBe(hashedPassword);
    });
  });

  describe('generateToken', () => {
    it('should generate JWT token with user data', () => {
      const userData = { id: '123', email: 'test@example.com' };
      const token = 'generated.jwt.token';
      
      jwt.sign.mockReturnValue(token);

      const result = AuthService.generateToken(userData);

      expect(jwt.sign).toHaveBeenCalledWith(
        userData,
        process.env.JWT_SECRET,
        { expiresIn: '24h' }
      );
      expect(result).toBe(token);
    });
  });

  describe('verifyPassword', () => {
    it('should return true for correct password', async () => {
      const password = 'testPassword123';
      const hashedPassword = 'hashedPassword';
      
      bcrypt.compare.mockResolvedValue(true);

      const result = await AuthService.verifyPassword(password, hashedPassword);

      expect(bcrypt.compare).toHaveBeenCalledWith(password, hashedPassword);
      expect(result).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'wrongPassword';
      const hashedPassword = 'hashedPassword';
      
      bcrypt.compare.mockResolvedValue(false);

      const result = await AuthService.verifyPassword(password, hashedPassword);

      expect(result).toBe(false);
    });
  });
});
```

## 🔗 **Integration Tests (통합 테스트)**

### **API Integration Tests**
```javascript
// 테스트 대상: API 엔드포인트, 데이터베이스 연동
// 도구: Jest + Supertest + Test Database

// 예시: API 통합 테스트
// tests/integration/auth.test.js
const request = require('supertest');
const app = require('../../server');
const { supabase } = require('../../config/database');

describe('Auth API Integration', () => {
  beforeEach(async () => {
    // 테스트 데이터베이스 초기화
    await supabase.from('users').delete().neq('id', '');
  });

  afterAll(async () => {
    // 테스트 데이터 정리
    await supabase.from('users').delete().neq('id', '');
  });

  describe('POST /api/auth/register', () => {
    it('should register new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'TestPassword123!',
        first_name: 'Test',
        last_name: 'User'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            email: userData.email,
            first_name: userData.first_name,
            last_name: userData.last_name
          },
          token: expect.any(String)
        }
      });

      // 데이터베이스에 사용자가 생성되었는지 확인
      const { data: user } = await supabase
        .from('users')
        .select('*')
        .eq('email', userData.email)
        .single();

      expect(user).toBeTruthy();
      expect(user.email).toBe(userData.email);
    });

    it('should return error for duplicate email', async () => {
      const userData = {
        email: 'duplicate@example.com',
        password: 'TestPassword123!',
        first_name: 'Test',
        last_name: 'User'
      };

      // 첫 번째 사용자 생성
      await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(201);

      // 동일한 이메일로 두 번째 사용자 생성 시도
      const response = await request(app)
        .post('/api/auth/register')
        .send(userData)
        .expect(400);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('already exists')
      });
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // 테스트용 사용자 생성
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'login@example.com',
          password: 'TestPassword123!',
          first_name: 'Login',
          last_name: 'Test'
        });
    });

    it('should login with correct credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'TestPassword123!'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          user: {
            email: 'login@example.com'
          },
          token: expect.any(String)
        }
      });
    });

    it('should return error for incorrect password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'login@example.com',
          password: 'WrongPassword123!'
        })
        .expect(401);

      expect(response.body).toMatchObject({
        success: false,
        error: expect.stringContaining('Invalid credentials')
      });
    });
  });
});
```

### **Database Integration Tests**
```javascript
// 테스트 대상: 데이터베이스 스키마, 제약조건, 트리거
// 도구: Jest + Supabase Test Client

// 예시: 데이터베이스 통합 테스트
// tests/integration/database.test.js
const { supabase } = require('../../config/database');

describe('Database Integration', () => {
  describe('Users Table', () => {
    afterEach(async () => {
      // 테스트 데이터 정리
      await supabase.from('users').delete().neq('id', '');
    });

    it('should enforce unique email constraint', async () => {
      const userData = {
        email: 'unique@example.com',
        password: 'hashedPassword',
        first_name: 'Test',
        last_name: 'User'
      };

      // 첫 번째 사용자 생성
      const { error: firstError } = await supabase
        .from('users')
        .insert(userData);

      expect(firstError).toBeNull();

      // 동일한 이메일로 두 번째 사용자 생성 시도
      const { error: secondError } = await supabase
        .from('users')
        .insert(userData);

      expect(secondError).toBeTruthy();
      expect(secondError.message).toContain('duplicate key');
    });

    it('should auto-generate UUID for id field', async () => {
      const userData = {
        email: 'uuid@example.com',
        password: 'hashedPassword',
        first_name: 'UUID',
        last_name: 'Test'
      };

      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/);
    });

    it('should set default values correctly', async () => {
      const userData = {
        email: 'defaults@example.com',
        password: 'hashedPassword',
        first_name: 'Defaults',
        last_name: 'Test'
      };

      const { data, error } = await supabase
        .from('users')
        .insert(userData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.membership_type).toBe('free');
      expect(data.is_active).toBe(true);
      expect(data.created_at).toBeTruthy();
    });
  });

  describe('AI Learning Data Table', () => {
    it('should store AI learning data with proper relationships', async () => {
      // 먼저 사용자 생성
      const { data: user } = await supabase
        .from('users')
        .insert({
          email: 'ai@example.com',
          password: 'hashedPassword',
          first_name: 'AI',
          last_name: 'User'
        })
        .select()
        .single();

      // AI 학습 데이터 생성
      const learningData = {
        user_id: user.id,
        strategy_type: 'momentum',
        market_data: { price: 100, volume: 1000 },
        prediction: { direction: 'up', confidence: 0.85 },
        actual_result: { direction: 'up', profit: 5.2 }
      };

      const { data, error } = await supabase
        .from('ai_learning_data')
        .insert(learningData)
        .select()
        .single();

      expect(error).toBeNull();
      expect(data.user_id).toBe(user.id);
      expect(data.strategy_type).toBe('momentum');
      expect(data.market_data).toEqual(learningData.market_data);
    });
  });
});
```

## 🌐 **E2E Tests (End-to-End 테스트)**

### **Critical User Journeys**
```typescript
// 테스트 대상: 전체 사용자 플로우
// 도구: Playwright

// 예시: E2E 테스트
// tests/e2e/user-journey.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Christmas Trading User Journey', () => {
  test('complete user registration and trading flow', async ({ page }) => {
    // 1. 홈페이지 접속
    await page.goto('https://christmas-protocol.netlify.app');
    await expect(page).toHaveTitle(/Christmas Trading/);

    // 2. 회원가입
    await page.click('text=Sign Up');
    await page.fill('[data-testid=email-input]', 'e2e@example.com');
    await page.fill('[data-testid=password-input]', 'TestPassword123!');
    await page.fill('[data-testid=first-name-input]', 'E2E');
    await page.fill('[data-testid=last-name-input]', 'Test');
    await page.click('[data-testid=register-button]');

    // 3. 대시보드 접속 확인
    await expect(page).toHaveURL(/.*dashboard/);
    await expect(page.locator('[data-testid=welcome-message]')).toContainText('Welcome, E2E');

    // 4. AI 거래 설정
    await page.click('[data-testid=ai-trading-tab]');
    await page.selectOption('[data-testid=strategy-select]', 'momentum');
    await page.fill('[data-testid=investment-amount]', '10000');
    await page.click('[data-testid=enable-ai-trading]');

    // 5. 거래 시작 확인
    await expect(page.locator('[data-testid=trading-status]')).toContainText('Active');
    await expect(page.locator('[data-testid=strategy-display]')).toContainText('Momentum');

    // 6. 포트폴리오 확인
    await page.click('[data-testid=portfolio-tab]');
    await expect(page.locator('[data-testid=total-balance]')).toBeVisible();
    await expect(page.locator('[data-testid=ai-performance]')).toBeVisible();

    // 7. 로그아웃
    await page.click('[data-testid=user-menu]');
    await page.click('[data-testid=logout-button]');
    await expect(page).toHaveURL(/.*login/);
  });

  test('admin user management flow', async ({ page }) => {
    // 관리자 로그인
    await page.goto('https://christmas-protocol.netlify.app/login');
    await page.fill('[data-testid=email-input]', 'admin@christmas.com');
    await page.fill('[data-testid=password-input]', 'password');
    await page.click('[data-testid=login-button]');

    // 관리자 대시보드 접속
    await expect(page).toHaveURL(/.*admin/);
    await expect(page.locator('[data-testid=admin-panel]')).toBeVisible();

    // 사용자 관리
    await page.click('[data-testid=user-management-tab]');
    await expect(page.locator('[data-testid=users-table]')).toBeVisible();

    // 사용자 검색
    await page.fill('[data-testid=user-search]', 'e2e@example.com');
    await page.click('[data-testid=search-button]');
    await expect(page.locator('[data-testid=user-row]')).toContainText('e2e@example.com');

    // AI 성능 모니터링
    await page.click('[data-testid=ai-monitoring-tab]');
    await expect(page.locator('[data-testid=ai-performance-chart]')).toBeVisible();
    await expect(page.locator('[data-testid=strategy-metrics]')).toBeVisible();
  });
});
```

### **Performance Tests**
```typescript
// 성능 테스트
// tests/e2e/performance.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Performance Tests', () => {
  test('page load performance', async ({ page }) => {
    const startTime = Date.now();
    
    await page.goto('https://christmas-protocol.netlify.app');
    await page.waitForLoadState('networkidle');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(3000); // 3초 이내 로드
  });

  test('API response performance', async ({ page }) => {
    await page.goto('https://christmas-protocol.netlify.app/login');
    
    // 로그인 API 성능 측정
    const [response] = await Promise.all([
      page.waitForResponse(resp => resp.url().includes('/api/auth/login')),
      page.fill('[data-testid=email-input]', 'admin@christmas.com'),
      page.fill('[data-testid=password-input]', 'password'),
      page.click('[data-testid=login-button]')
    ]);

    expect(response.status()).toBe(200);
    
    // API 응답 시간 확인 (200ms 이내)
    const timing = await response.timing();
    expect(timing.responseEnd - timing.requestStart).toBeLessThan(200);
  });
});
```

## 📊 **테스트 자동화 및 CI/CD 통합**

### **GitHub Actions 테스트 워크플로우**
```yaml
# .github/workflows/test.yml
name: Test Suite

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../web-dashboard && npm ci
      
      - name: Run backend unit tests
        run: |
          cd backend
          npm run test:unit -- --coverage
      
      - name: Run frontend unit tests
        run: |
          cd web-dashboard
          npm run test:unit -- --coverage
      
      - name: Upload coverage reports
        uses: codecov/codecov-action@v3

  integration-tests:
    runs-on: ubuntu-latest
    needs: unit-tests
    services:
      postgres:
        image: postgres:13
        env:
          POSTGRES_PASSWORD: postgres
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: cd backend && npm ci
      
      - name: Run integration tests
        run: |
          cd backend
          npm run test:integration
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test

  e2e-tests:
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests]
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          cache: 'npm'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Install Playwright
        run: npx playwright install --with-deps
      
      - name: Run E2E tests
        run: npx playwright test
      
      - name: Upload test results
        uses: actions/upload-artifact@v3
        if: failure()
        with:
          name: playwright-report
          path: playwright-report/
```

## 📋 **테스트 데이터 관리**

### **Test Fixtures**
```javascript
// tests/fixtures/users.js
const testUsers = {
  admin: {
    email: 'admin@christmas.com',
    password: 'password',
    first_name: 'Admin',
    last_name: 'User',
    membership_type: 'premium',
    is_admin: true
  },
  
  regularUser: {
    email: 'user@christmas.com',
    password: 'password',
    first_name: 'Regular',
    last_name: 'User',
    membership_type: 'free',
    is_admin: false
  },
  
  premiumUser: {
    email: 'premium@christmas.com',
    password: 'password',
    first_name: 'Premium',
    last_name: 'User',
    membership_type: 'premium',
    is_admin: false
  }
};

module.exports = testUsers;
```

### **Database Seeding**
```javascript
// tests/helpers/seedDatabase.js
const { supabase } = require('../../config/database');
const testUsers = require('../fixtures/users');

async function seedTestDatabase() {
  // 기존 테스트 데이터 정리
  await supabase.from('users').delete().neq('id', '');
  
  // 테스트 사용자 생성
  for (const user of Object.values(testUsers)) {
    await supabase.from('users').insert(user);
  }
  
  console.log('Test database seeded successfully');
}

async function cleanTestDatabase() {
  await supabase.from('users').delete().neq('id', '');
  console.log('Test database cleaned successfully');
}

module.exports = {
  seedTestDatabase,
  cleanTestDatabase
};
```

## 🎯 **테스트 실행 및 보고**

### **테스트 스크립트 (package.json)**
```json
{
  "scripts": {
    "test": "npm run test:unit && npm run test:integration",
    "test:unit": "jest --testPathPattern=unit",
    "test:integration": "jest --testPathPattern=integration",
    "test:e2e": "playwright test",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage",
    "test:ci": "jest --ci --coverage --watchAll=false"
  }
}
```

### **테스트 보고서 생성**
```javascript
// jest.config.js
module.exports = {
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/reportWebVitals.ts'
  ],
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts']
};
```

---

## 📝 **다음 액션 아이템**

### **즉시 실행 (이번 세션)**
- [ ] Jest 설정 파일 생성
- [ ] 기본 단위 테스트 작성
- [ ] 테스트 데이터베이스 설정

### **단기 목표 (1주 내)**
- [ ] 핵심 API 통합 테스트 작성
- [ ] Playwright E2E 테스트 설정
- [ ] GitHub Actions 테스트 워크플로우 구성

### **장기 목표 (1개월 내)**
- [ ] 전체 테스트 커버리지 80% 달성
- [ ] 성능 테스트 자동화
- [ ] 테스트 보고서 대시보드 구축

**📝 업데이트**: 2025-05-30 | **관리자**: QA Team | **다음 리뷰**: 2025-06-06 