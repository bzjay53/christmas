# 🛠️ Christmas Trading 개발 가이드라인

## 📋 개요
이 문서는 Christmas Trading 프로젝트의 개발 표준, 코딩 규칙, 워크플로우를 정의합니다.

## 🏗️ 프로젝트 구조

### 디렉토리 구조
```
christmas/
├── frontend/                 # React 프론트엔드
│   ├── src/
│   │   ├── components/      # 재사용 가능한 컴포넌트
│   │   ├── pages/          # 페이지 컴포넌트
│   │   ├── hooks/          # 커스텀 훅
│   │   ├── store/          # Zustand 상태 관리
│   │   ├── utils/          # 유틸리티 함수
│   │   └── styles/         # 스타일 파일
│   ├── public/             # 정적 파일
│   └── package.json
├── backend/                  # Node.js 백엔드
│   ├── routes/             # API 라우트
│   ├── middleware/         # 미들웨어
│   ├── services/           # 비즈니스 로직
│   ├── utils/              # 유틸리티 함수
│   ├── server.js           # 메인 서버 파일
│   └── package.json
├── docs/                    # 프로젝트 문서
├── scripts/                 # 유틸리티 스크립트
└── README.md
```

## 💻 개발 환경 설정

### 필수 도구
- **Node.js**: v18.0.0 이상
- **npm**: v8.0.0 이상
- **Git**: 최신 버전
- **Docker**: 배포용 (선택사항)
- **VS Code**: 권장 에디터

### VS Code 확장 프로그램
```json
{
  "recommendations": [
    "esbenp.prettier-vscode",
    "ms-vscode.vscode-eslint",
    "bradlc.vscode-tailwindcss",
    "ms-vscode.vscode-json",
    "ms-vscode.vscode-typescript-next"
  ]
}
```

### 환경 설정
```bash
# 프로젝트 클론
git clone [repository-url]
cd christmas

# 백엔드 설정
cd backend
npm install
cp env.txt .env
# .env 파일에서 실제 키 값 설정

# 프론트엔드 설정
cd ../frontend
npm install

# 개발 서버 실행
npm run dev
```

## 📝 코딩 표준

### JavaScript/TypeScript 규칙

#### 1. 네이밍 컨벤션
```javascript
// 변수, 함수: camelCase
const userName = 'john';
const getUserProfile = () => {};

// 상수: UPPER_SNAKE_CASE
const API_BASE_URL = 'https://api.example.com';
const MAX_RETRY_COUNT = 3;

// 클래스, 컴포넌트: PascalCase
class UserService {}
const UserProfile = () => {};

// 파일명: kebab-case
user-profile.js
api-client.js
```

#### 2. 함수 작성 규칙
```javascript
// ✅ 좋은 예
const calculateTotalPrice = (items, discountRate = 0) => {
  if (!Array.isArray(items)) {
    throw new Error('Items must be an array');
  }
  
  const subtotal = items.reduce((sum, item) => sum + item.price, 0);
  return subtotal * (1 - discountRate);
};

// ❌ 나쁜 예
const calc = (i, d) => i.reduce((s, x) => s + x.p, 0) * (1 - d);
```

#### 3. 에러 처리
```javascript
// ✅ 좋은 예
const fetchUserData = async (userId) => {
  try {
    const response = await api.get(`/users/${userId}`);
    return { success: true, data: response.data };
  } catch (error) {
    console.error('Failed to fetch user data:', error);
    return { success: false, error: error.message };
  }
};

// ❌ 나쁜 예
const fetchUserData = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};
```

### React 컴포넌트 규칙

#### 1. 컴포넌트 구조
```jsx
// ✅ 좋은 예
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const UserProfile = ({ userId, onUpdate }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUser();
  }, [userId]);

  const fetchUser = async () => {
    try {
      setLoading(true);
      const userData = await userService.getUser(userId);
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!user) return <div>User not found</div>;

  return (
    <div className="user-profile">
      <h2>{user.name}</h2>
      <p>{user.email}</p>
    </div>
  );
};

UserProfile.propTypes = {
  userId: PropTypes.string.isRequired,
  onUpdate: PropTypes.func
};

export default UserProfile;
```

#### 2. 훅 사용 규칙
```javascript
// ✅ 커스텀 훅 예제
const useUserData = (userId) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!userId) return;

    const fetchUser = async () => {
      try {
        setLoading(true);
        setError(null);
        const userData = await userService.getUser(userId);
        setUser(userData);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [userId]);

  return { user, loading, error };
};
```

### CSS/TailwindCSS 규칙

#### 1. 클래스 순서
```jsx
// ✅ 좋은 예 (레이아웃 → 스타일링 → 상태)
<div className="flex items-center justify-between p-4 bg-white border rounded-lg shadow-md hover:shadow-lg">
  
// ❌ 나쁜 예
<div className="hover:shadow-lg bg-white flex rounded-lg p-4 shadow-md border items-center justify-between">
```

#### 2. 반응형 디자인
```jsx
// ✅ 모바일 우선 접근법
<div className="w-full md:w-1/2 lg:w-1/3 p-2 md:p-4">
  <div className="text-sm md:text-base lg:text-lg">
    Content
  </div>
</div>
```

## 🔄 Git 워크플로우

### 브랜치 전략
```
main                    # 프로덕션 브랜치
├── develop            # 개발 브랜치
├── feature/user-auth  # 기능 브랜치
├── feature/trading    # 기능 브랜치
├── hotfix/critical-bug # 핫픽스 브랜치
└── release/v1.0.0     # 릴리즈 브랜치
```

### 커밋 메시지 규칙
```bash
# 형식: <type>(<scope>): <subject>

# 타입
feat: 새로운 기능 추가
fix: 버그 수정
docs: 문서 수정
style: 코드 포맷팅, 세미콜론 누락 등
refactor: 코드 리팩토링
test: 테스트 코드 추가
chore: 빌드 업무 수정, 패키지 매니저 수정

# 예시
feat(auth): 사용자 로그인 기능 추가
fix(api): 회원가입 시 이메일 중복 검사 오류 수정
docs(readme): 설치 가이드 업데이트
refactor(components): UserProfile 컴포넌트 최적화
```

### Pull Request 규칙
```markdown
## 📋 변경 사항
- 사용자 인증 시스템 구현
- JWT 토큰 기반 로그인/로그아웃
- 비밀번호 해싱 적용

## 🧪 테스트
- [ ] 로그인 기능 테스트
- [ ] 로그아웃 기능 테스트
- [ ] 토큰 만료 처리 테스트

## 📸 스크린샷
(UI 변경 시 스크린샷 첨부)

## 🔗 관련 이슈
Closes #123
```

## 🧪 테스트 가이드라인

### 단위 테스트
```javascript
// utils/validation.test.js
import { validateEmail, validatePassword } from './validation';

describe('Validation Utils', () => {
  describe('validateEmail', () => {
    test('should return true for valid email', () => {
      expect(validateEmail('user@example.com')).toBe(true);
    });

    test('should return false for invalid email', () => {
      expect(validateEmail('invalid-email')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    test('should return true for strong password', () => {
      expect(validatePassword('StrongPass123!')).toBe(true);
    });

    test('should return false for weak password', () => {
      expect(validatePassword('123')).toBe(false);
    });
  });
});
```

### API 테스트
```javascript
// tests/api/auth.test.js
describe('Auth API', () => {
  test('POST /api/auth/signup should create new user', async () => {
    const userData = {
      email: 'test@example.com',
      password: 'TestPass123!',
      firstName: 'Test',
      lastName: 'User'
    };

    const response = await request(app)
      .post('/api/auth/signup')
      .send(userData)
      .expect(201);

    expect(response.body).toHaveProperty('token');
    expect(response.body.user.email).toBe(userData.email);
  });
});
```

## 📊 성능 가이드라인

### 프론트엔드 최적화
```javascript
// ✅ 컴포넌트 메모이제이션
const UserList = React.memo(({ users, onUserClick }) => {
  return (
    <div>
      {users.map(user => (
        <UserItem 
          key={user.id} 
          user={user} 
          onClick={onUserClick}
        />
      ))}
    </div>
  );
});

// ✅ 콜백 메모이제이션
const UserProfile = ({ userId }) => {
  const handleUpdate = useCallback((data) => {
    updateUser(userId, data);
  }, [userId]);

  return <UserForm onSubmit={handleUpdate} />;
};

// ✅ 지연 로딩
const LazyComponent = React.lazy(() => import('./HeavyComponent'));
```

### 백엔드 최적화
```javascript
// ✅ 데이터베이스 쿼리 최적화
const getUsersWithOrders = async () => {
  // 한 번의 쿼리로 필요한 데이터 모두 가져오기
  const { data, error } = await supabase
    .from('users')
    .select(`
      id, email, first_name, last_name,
      trading_orders (
        id, order_type, quantity, price, created_at
      )
    `)
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  return { data, error };
};

// ✅ 캐싱 적용
const cache = new Map();

const getCachedUserData = async (userId) => {
  const cacheKey = `user_${userId}`;
  
  if (cache.has(cacheKey)) {
    return cache.get(cacheKey);
  }

  const userData = await fetchUserData(userId);
  cache.set(cacheKey, userData);
  
  // 5분 후 캐시 만료
  setTimeout(() => cache.delete(cacheKey), 5 * 60 * 1000);
  
  return userData;
};
```

## 🔒 보안 가이드라인

### 입력 검증
```javascript
// ✅ 서버 사이드 검증
const validateSignupData = (data) => {
  const errors = {};

  if (!data.email || !isValidEmail(data.email)) {
    errors.email = 'Valid email is required';
  }

  if (!data.password || data.password.length < 8) {
    errors.password = 'Password must be at least 8 characters';
  }

  if (!data.firstName || data.firstName.trim().length < 2) {
    errors.firstName = 'First name must be at least 2 characters';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};
```

### 환경변수 관리
```javascript
// ✅ 환경변수 검증
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_KEY',
  'JWT_SECRET'
];

const validateEnvironment = () => {
  const missing = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
};
```

## 📚 문서화 규칙

### 코드 주석
```javascript
/**
 * 사용자의 거래 주문을 생성합니다.
 * 
 * @param {string} userId - 사용자 ID
 * @param {Object} orderData - 주문 데이터
 * @param {string} orderData.stockCode - 주식 코드
 * @param {number} orderData.quantity - 주문 수량
 * @param {number} orderData.price - 주문 가격
 * @param {'buy'|'sell'} orderData.type - 주문 타입
 * @returns {Promise<Object>} 생성된 주문 정보
 * @throws {Error} 잘못된 입력 데이터 또는 서버 오류
 */
const createTradingOrder = async (userId, orderData) => {
  // 구현 내용...
};
```

### API 문서화
```javascript
/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: 사용자 회원가입
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *               - firstName
 *               - lastName
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 minLength: 8
 *     responses:
 *       201:
 *         description: 회원가입 성공
 *       400:
 *         description: 잘못된 요청 데이터
 */
```

## 🚀 배포 가이드라인

### 배포 전 체크리스트
- [ ] 모든 테스트 통과
- [ ] 코드 리뷰 완료
- [ ] 환경변수 설정 확인
- [ ] 보안 검사 완료
- [ ] 성능 테스트 완료
- [ ] 문서 업데이트 완료

### 배포 단계
1. **개발 환경 테스트**
2. **스테이징 환경 배포**
3. **스테이징 환경 테스트**
4. **프로덕션 환경 배포**
5. **프로덕션 환경 모니터링**

## 📞 지원 및 문의

### 개발 관련 문의
- **PM**: 프로젝트 관리 및 전체 방향성
- **Tech Lead**: 기술적 의사결정 및 아키텍처
- **DevOps**: 배포 및 인프라 관련

### 유용한 리소스
- [프로젝트 RAG 지식 베이스](./RAG_Knowledge_Base.md)
- [API 문서](./API_Documentation.md)
- [데이터베이스 스키마](./Database_Schema.md)
- [문제 해결 가이드](./Troubleshooting_Guide.md)

---
**마지막 업데이트**: 2025-05-26 17:45
**담당자**: PM
**다음 검토 예정**: 2025-06-01 