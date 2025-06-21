# 🎄 Christmas Trading Code Quality Guidelines (Updated 2025-05-26)

## 📋 코드 품질 관리 개요

### 🎯 품질 목표
- **가독성**: 명확하고 이해하기 쉬운 코드 작성
- **유지보수성**: 변경과 확장이 용이한 구조
- **일관성**: 프로젝트 전반에 걸친 일관된 코딩 스타일
- **안정성**: 버그가 적고 예측 가능한 동작
- **성능**: 효율적이고 최적화된 코드

### 🏗️ 품질 관리 체계
```
Code Quality Framework
├── 📝 Coding Standards      # 코딩 표준
├── 🔍 Code Review Process   # 코드 리뷰 프로세스
├── 🧪 Testing Strategy      # 테스트 전략
├── 📊 Quality Metrics       # 품질 메트릭
└── 🔧 Automation Tools      # 자동화 도구
```

## 📝 코딩 표준

### 🎨 Frontend (React/JavaScript) 표준

#### 📁 파일 및 폴더 명명 규칙
```javascript
// 컴포넌트 파일: PascalCase
Dashboard.jsx
UserProfile.jsx
PaymentService.jsx

// 유틸리티 파일: camelCase
apiService.js
dateUtils.js
validationHelpers.js

// 상수 파일: UPPER_SNAKE_CASE
API_CONSTANTS.js
ERROR_MESSAGES.js

// 폴더: kebab-case
components/
user-management/
payment-services/
```

#### 🔧 변수 및 함수 명명 규칙
```javascript
// 변수: camelCase
const userName = 'john_doe';
const isAuthenticated = true;
const userAccountBalance = 1000.50;

// 함수: camelCase (동사로 시작)
function getUserData() { }
function validateUserInput() { }
function calculateTotalAmount() { }

// 상수: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT = 5000;

// 컴포넌트: PascalCase
function UserDashboard() { }
function PaymentModal() { }
```

#### 🎯 React 컴포넌트 구조
```javascript
// 1. Imports (외부 라이브러리 → 내부 모듈)
import React, { useState, useEffect } from 'react';
import { Button, TextField } from '@mui/material';
import { useAuthStore } from '../stores/authStore';
import { validateEmail } from '../utils/validation';

// 2. 타입 정의 (TypeScript 사용 시)
interface UserProfileProps {
  userId: string;
  onUpdate: (data: UserData) => void;
}

// 3. 컴포넌트 정의
function UserProfile({ userId, onUpdate }) {
  // 3.1 State 선언
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(false);
  
  // 3.2 Store 사용
  const { user, updateUser } = useAuthStore();
  
  // 3.3 Effects
  useEffect(() => {
    fetchUserData();
  }, [userId]);
  
  // 3.4 Event Handlers
  const handleSubmit = async (event) => {
    event.preventDefault();
    // 처리 로직
  };
  
  // 3.5 Helper Functions
  const validateForm = () => {
    // 검증 로직
  };
  
  // 3.6 Early Return (조건부 렌더링)
  if (loading) {
    return <div>Loading...</div>;
  }
  
  // 3.7 Main Render
  return (
    <div className="user-profile">
      {/* JSX 내용 */}
    </div>
  );
}

// 4. Export
export default UserProfile;
```

### 🖥️ Backend (Node.js/Express) 표준

#### 📁 파일 구조 및 명명
```javascript
// 라우터 파일: kebab-case
user-routes.js
payment-routes.js
auth-routes.js

// 서비스 파일: camelCase + Service
userService.js
paymentService.js
authService.js

// 미들웨어: camelCase + Middleware
authMiddleware.js
validationMiddleware.js
errorMiddleware.js

// 모델: PascalCase
User.js
Payment.js
Transaction.js
```

#### 🔧 Express 라우터 구조
```javascript
// routes/user-routes.js
const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const authMiddleware = require('../middleware/authMiddleware');
const { validateUserInput } = require('../middleware/validationMiddleware');

// 1. 미들웨어 적용
router.use(authMiddleware);

// 2. 라우트 정의 (RESTful 패턴)
router.get('/', getAllUsers);           // GET /users
router.get('/:id', getUserById);        // GET /users/:id
router.post('/', validateUserInput, createUser);  // POST /users
router.put('/:id', validateUserInput, updateUser); // PUT /users/:id
router.delete('/:id', deleteUser);      // DELETE /users/:id

// 3. 컨트롤러 함수
async function getAllUsers(req, res, next) {
  try {
    const users = await userService.getAllUsers();
    res.status(200).json({
      success: true,
      data: users,
      message: 'Users retrieved successfully'
    });
  } catch (error) {
    next(error);
  }
}

module.exports = router;
```

#### 🔒 에러 처리 패턴
```javascript
// utils/errorHandler.js
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

// 사용 예시
const createUser = async (userData) => {
  if (!userData.email) {
    throw new AppError('Email is required', 400);
  }
  
  const existingUser = await User.findByEmail(userData.email);
  if (existingUser) {
    throw new AppError('User already exists', 409);
  }
  
  return await User.create(userData);
};
```

## 🔍 코드 리뷰 프로세스

### 📋 리뷰 체크리스트

#### ✅ 기능성 검토
- [ ] 요구사항이 정확히 구현되었는가?
- [ ] 엣지 케이스가 적절히 처리되었는가?
- [ ] 에러 처리가 충분한가?
- [ ] 성능에 문제가 없는가?

#### ✅ 코드 품질 검토
- [ ] 코딩 표준을 준수하는가?
- [ ] 변수/함수명이 명확한가?
- [ ] 중복 코드가 없는가?
- [ ] 주석이 적절한가?

#### ✅ 보안 검토
- [ ] 입력 검증이 적절한가?
- [ ] 민감한 정보가 노출되지 않는가?
- [ ] 인증/권한 처리가 올바른가?
- [ ] SQL 인젝션 등 취약점이 없는가?

#### ✅ 테스트 검토
- [ ] 단위 테스트가 작성되었는가?
- [ ] 테스트 커버리지가 충분한가?
- [ ] 통합 테스트가 필요한가?

### 🔄 리뷰 프로세스
```
1. 개발자: Pull Request 생성
   ↓
2. 자동화: Lint, Test, Build 검사
   ↓
3. 리뷰어: 코드 검토 및 피드백
   ↓
4. 개발자: 피드백 반영 및 수정
   ↓
5. 승인자: 최종 승인 및 머지
```

## 🧪 테스트 전략

### 🔬 테스트 피라미드
```
        /\
       /  \
      / E2E \     ← 적은 수의 End-to-End 테스트
     /______\
    /        \
   /Integration\ ← 중간 수의 통합 테스트
  /__________\
 /            \
/  Unit Tests  \ ← 많은 수의 단위 테스트
/______________\
```

### 🎯 Frontend 테스트
```javascript
// components/__tests__/UserProfile.test.jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import UserProfile from '../UserProfile';

describe('UserProfile Component', () => {
  // 1. 렌더링 테스트
  test('renders user profile correctly', () => {
    render(<UserProfile userId="123" />);
    expect(screen.getByText('User Profile')).toBeInTheDocument();
  });
  
  // 2. 상호작용 테스트
  test('handles form submission', async () => {
    const mockOnUpdate = vi.fn();
    render(<UserProfile userId="123" onUpdate={mockOnUpdate} />);
    
    fireEvent.click(screen.getByRole('button', { name: 'Update' }));
    
    await waitFor(() => {
      expect(mockOnUpdate).toHaveBeenCalledWith(expect.any(Object));
    });
  });
  
  // 3. 에러 상태 테스트
  test('displays error message on failure', async () => {
    // Mock API failure
    vi.mocked(fetch).mockRejectedValueOnce(new Error('API Error'));
    
    render(<UserProfile userId="123" />);
    
    await waitFor(() => {
      expect(screen.getByText('Error loading user data')).toBeInTheDocument();
    });
  });
});
```

### 🖥️ Backend 테스트
```javascript
// services/__tests__/userService.test.js
const request = require('supertest');
const app = require('../../app');
const userService = require('../userService');

describe('User Service', () => {
  // 1. 성공 케이스 테스트
  describe('createUser', () => {
    test('should create user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        name: 'Test User'
      };
      
      const result = await userService.createUser(userData);
      
      expect(result).toHaveProperty('id');
      expect(result.email).toBe(userData.email);
    });
    
    // 2. 실패 케이스 테스트
    test('should throw error for duplicate email', async () => {
      const userData = {
        email: 'existing@example.com',
        name: 'Test User'
      };
      
      await expect(userService.createUser(userData))
        .rejects
        .toThrow('User already exists');
    });
  });
});

// API 엔드포인트 테스트
describe('POST /api/users', () => {
  test('should create user and return 201', async () => {
    const response = await request(app)
      .post('/api/users')
      .send({
        email: 'newuser@example.com',
        name: 'New User'
      })
      .expect(201);
      
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveProperty('id');
  });
});
```

## 📊 품질 메트릭

### 📈 측정 지표
```javascript
// 코드 복잡도 (Cyclomatic Complexity)
// 목표: 함수당 10 이하
function calculateUserScore(user) {  // 복잡도: 3
  if (!user) return 0;              // +1
  if (user.premium) return 100;     // +1
  return user.points || 50;         // +1
}

// 코드 커버리지
// 목표: 80% 이상
{
  "coverage": {
    "statements": 85.2,
    "branches": 78.9,
    "functions": 92.1,
    "lines": 84.7
  }
}

// 기술 부채 (SonarQube 메트릭)
{
  "technicalDebt": "2h 30m",
  "codeSmells": 15,
  "bugs": 2,
  "vulnerabilities": 0
}
```

### 🎯 품질 게이트
```yaml
# 품질 기준 (통과 조건)
quality_gates:
  coverage:
    minimum: 80%
  complexity:
    maximum: 10
  duplication:
    maximum: 3%
  maintainability:
    minimum: "A"
  reliability:
    minimum: "A"
  security:
    minimum: "A"
```

## 🔧 자동화 도구

### 🔍 Linting 설정
```javascript
// .eslintrc.js
module.exports = {
  extends: [
    'eslint:recommended',
    '@typescript-eslint/recommended',
    'plugin:react/recommended',
    'plugin:react-hooks/recommended'
  ],
  rules: {
    // 코드 스타일
    'indent': ['error', 2],
    'quotes': ['error', 'single'],
    'semi': ['error', 'always'],
    
    // React 규칙
    'react/prop-types': 'error',
    'react/no-unused-state': 'error',
    'react-hooks/rules-of-hooks': 'error',
    
    // 보안 규칙
    'no-eval': 'error',
    'no-implied-eval': 'error',
    'no-new-func': 'error'
  }
};
```

### 🎨 Prettier 설정
```json
{
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "semi": true,
  "singleQuote": true,
  "quoteProps": "as-needed",
  "trailingComma": "es5",
  "bracketSpacing": true,
  "arrowParens": "avoid"
}
```

### 🔒 Husky Git Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged",
      "pre-push": "npm run test",
      "commit-msg": "commitlint -E HUSKY_GIT_PARAMS"
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

## 📝 문서화 표준

### 📋 코드 주석 가이드라인
```javascript
/**
 * 사용자 데이터를 검증하고 정규화합니다.
 * 
 * @param {Object} userData - 검증할 사용자 데이터
 * @param {string} userData.email - 사용자 이메일 (필수)
 * @param {string} userData.name - 사용자 이름 (필수)
 * @param {number} [userData.age] - 사용자 나이 (선택)
 * @returns {Promise<Object>} 정규화된 사용자 데이터
 * @throws {ValidationError} 유효하지 않은 데이터인 경우
 * 
 * @example
 * const userData = await validateUserData({
 *   email: 'user@example.com',
 *   name: 'John Doe',
 *   age: 30
 * });
 */
async function validateUserData(userData) {
  // 구현 내용
}

// 복잡한 로직에 대한 설명 주석
function calculateComplexScore(data) {
  // 1. 기본 점수 계산 (가중치 적용)
  const baseScore = data.points * WEIGHT_FACTOR;
  
  // 2. 보너스 점수 추가 (프리미엄 사용자)
  const bonusScore = data.isPremium ? baseScore * 0.2 : 0;
  
  // 3. 최종 점수 (최대값 제한)
  return Math.min(baseScore + bonusScore, MAX_SCORE);
}
```

### 📚 README 템플릿
```markdown
# Component/Module Name

## 개요
간단한 설명과 목적

## 사용법
```javascript
import Component from './Component';

// 기본 사용법
<Component prop1="value1" prop2="value2" />
```

## Props/Parameters
| 이름 | 타입 | 필수 | 기본값 | 설명 |
|------|------|------|--------|------|
| prop1 | string | ✓ | - | 설명 |
| prop2 | number | ✗ | 0 | 설명 |

## 예제
실제 사용 예제

## 주의사항
특별히 주의해야 할 점들
```

## 🚨 일반적인 안티패턴

### ❌ 피해야 할 패턴들
```javascript
// 1. 매직 넘버 사용
if (user.age > 18) { } // ❌
const ADULT_AGE = 18;
if (user.age > ADULT_AGE) { } // ✅

// 2. 깊은 중첩
if (user) {
  if (user.profile) {
    if (user.profile.settings) {
      // ❌ 너무 깊은 중첩
    }
  }
}

// 옵셔널 체이닝 사용
if (user?.profile?.settings) { } // ✅

// 3. 긴 함수
function processUserData(user) {
  // 100줄 이상의 코드 ❌
}

// 작은 함수로 분리 ✅
function validateUser(user) { }
function normalizeUser(user) { }
function saveUser(user) { }

// 4. 불명확한 변수명
const d = new Date(); // ❌
const currentDate = new Date(); // ✅

const u = getUser(); // ❌
const currentUser = getUser(); // ✅
```

## 📋 체크리스트

### ✅ 개발 전 체크리스트
- [ ] 요구사항 명확히 이해
- [ ] 설계 문서 검토
- [ ] 코딩 표준 확인
- [ ] 테스트 계획 수립

### ✅ 개발 중 체크리스트
- [ ] 코딩 표준 준수
- [ ] 적절한 주석 작성
- [ ] 단위 테스트 작성
- [ ] 코드 리뷰 요청

### ✅ 개발 후 체크리스트
- [ ] 모든 테스트 통과
- [ ] 코드 커버리지 확인
- [ ] 문서 업데이트
- [ ] 배포 준비 완료

---
**📅 최종 업데이트**: 2025-05-26 23:45  
**👤 작성자**: PM AI Assistant  
**🔄 버전**: v1.0  
**📊 상태**: 완료  
**📞 참조**: Project_Structure_Map_Updated.md, Dependency_Management_Updated.md 