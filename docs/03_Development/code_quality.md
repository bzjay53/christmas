# 🎄 Christmas Trading 코드 품질 가이드라인 (2025-05-30)

## 📋 **코드 품질 기준**

### **전체 품질 목표**
```
🎯 목표:
├── 🧪 테스트 커버리지: 80% 이상
├── 🐛 Critical Bugs: 0개
├── 🔒 보안 취약점: 0개
├── 📊 성능 기준: API 응답 < 200ms
└── 📝 코드 가독성: SonarQube Grade A
```

## 🌐 **Frontend 코드 품질 (React + TypeScript)**

### **📁 파일 구조 규칙**
```typescript
web-dashboard/src/
├── components/              # 재사용 가능한 컴포넌트
│   ├── common/             # 공통 컴포넌트
│   ├── ui/                 # UI 기본 컴포넌트
│   └── feature/            # 기능별 컴포넌트
├── pages/                  # 페이지 컴포넌트
├── hooks/                  # 커스텀 훅
├── services/               # API 서비스
├── utils/                  # 유틸리티 함수
├── types/                  # TypeScript 타입 정의
└── constants/              # 상수 정의

// 파일명 규칙
- 컴포넌트: PascalCase (UserProfile.tsx)
- 훅: camelCase + use 접두사 (useAuth.ts)
- 유틸: camelCase (formatDate.ts)
- 타입: PascalCase + Type 접미사 (UserType.ts)
```

### **🎨 컴포넌트 작성 규칙**
```typescript
// ✅ 좋은 예시
interface UserProfileProps {
  userId: string;
  onUpdate?: (user: User) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  userId, 
  onUpdate 
}) => {
  const { user, loading, error } = useUser(userId);
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage error={error} />;
  if (!user) return <NotFound />;

  return (
    <div className="user-profile">
      <h1>{user.name}</h1>
      {/* 컴포넌트 내용 */}
    </div>
  );
};

// ❌ 나쁜 예시
export default function component(props: any) {
  // props 타입 지정 없음
  // 컴포넌트명 소문자
  // 에러 처리 없음
}
```

### **🔗 API 서비스 패턴**
```typescript
// services/api/userService.ts
export class UserService {
  private static baseURL = process.env.VITE_API_BASE_URL;

  static async getUser(id: string): Promise<User> {
    try {
      const response = await axios.get(`${this.baseURL}/users/${id}`);
      return response.data;
    } catch (error) {
      throw new ApiError('Failed to fetch user', error);
    }
  }

  static async updateUser(id: string, data: Partial<User>): Promise<User> {
    // 유효성 검사
    if (!id) throw new ValidationError('User ID is required');
    
    try {
      const response = await axios.put(`${this.baseURL}/users/${id}`, data);
      return response.data;
    } catch (error) {
      throw new ApiError('Failed to update user', error);
    }
  }
}
```

### **🎭 상태 관리 (Zustand) 패턴**
```typescript
// stores/authStore.ts
interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: localStorage.getItem('token'),
  loading: false,

  login: async (email: string, password: string) => {
    set({ loading: true });
    try {
      const { user, token } = await AuthService.login(email, password);
      localStorage.setItem('token', token);
      set({ user, token, loading: false });
    } catch (error) {
      set({ loading: false });
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    set({ user: null, token: null });
  }
}));
```

## 🖥️ **Backend 코드 품질 (Node.js + Express)**

### **📁 Backend 구조 규칙**
```javascript
backend/
├── routes/                 # API 라우터
│   ├── auth.js            # 인증 관련
│   ├── users.js           # 사용자 관리
│   └── trading.js         # 거래 관련
├── controllers/           # 비즈니스 로직
├── services/              # 외부 서비스 연동
├── middleware/            # Express 미들웨어
├── models/                # 데이터 모델
├── utils/                 # 유틸리티 함수
├── config/                # 설정 파일
└── tests/                 # 테스트 파일

// 파일명 규칙
- 라우터: camelCase + 복수형 (users.js)
- 컨트롤러: camelCase + Controller (userController.js)
- 서비스: camelCase + Service (authService.js)
- 미들웨어: camelCase (validation.js)
```

### **🛣️ API 라우터 패턴**
```javascript
// routes/users.js
const express = require('express');
const { body, param } = require('express-validator');
const { auth, adminOnly } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const userController = require('../controllers/userController');

const router = express.Router();

// GET /api/users/:id
router.get('/:id', 
  param('id').isUUID(),
  validate,
  auth,
  userController.getUser
);

// PUT /api/users/:id
router.put('/:id',
  param('id').isUUID(),
  body('email').optional().isEmail(),
  body('name').optional().isLength({ min: 2 }),
  validate,
  auth,
  userController.updateUser
);

// DELETE /api/users/:id (관리자 전용)
router.delete('/:id',
  param('id').isUUID(),
  validate,
  auth,
  adminOnly,
  userController.deleteUser
);

module.exports = router;
```

### **🎮 컨트롤러 패턴**
```javascript
// controllers/userController.js
const userService = require('../services/userService');
const { ApiError } = require('../utils/errors');

class UserController {
  static async getUser(req, res, next) {
    try {
      const { id } = req.params;
      
      // 권한 확인
      if (req.user.id !== id && !req.user.isAdmin) {
        throw new ApiError('Forbidden', 403);
      }

      const user = await userService.getUserById(id);
      
      if (!user) {
        throw new ApiError('User not found', 404);
      }

      res.json({
        success: true,
        data: user
      });
    } catch (error) {
      next(error);
    }
  }

  static async updateUser(req, res, next) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // 권한 확인
      if (req.user.id !== id && !req.user.isAdmin) {
        throw new ApiError('Forbidden', 403);
      }

      const updatedUser = await userService.updateUser(id, updateData);
      
      res.json({
        success: true,
        data: updatedUser,
        message: 'User updated successfully'
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = UserController;
```

### **🔧 서비스 계층 패턴**
```javascript
// services/userService.js
const { supabase } = require('../config/database');
const { DatabaseError } = require('../utils/errors');

class UserService {
  static async getUserById(id) {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id, email, first_name, last_name, membership_type, created_at')
        .eq('id', id)
        .single();

      if (error) {
        throw new DatabaseError('Failed to fetch user', error);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  static async updateUser(id, updateData) {
    try {
      // 입력 데이터 정제
      const cleanData = this.sanitizeUserData(updateData);
      
      const { data, error } = await supabase
        .from('users')
        .update(cleanData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw new DatabaseError('Failed to update user', error);
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  static sanitizeUserData(data) {
    const allowedFields = ['email', 'first_name', 'last_name'];
    return Object.keys(data)
      .filter(key => allowedFields.includes(key))
      .reduce((obj, key) => {
        obj[key] = data[key];
        return obj;
      }, {});
  }
}

module.exports = UserService;
```

## 🔒 **보안 코딩 가이드라인**

### **인증 및 권한 관리**
```javascript
// ✅ 좋은 예시: JWT 토큰 검증
const jwt = require('jsonwebtoken');

const auth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token.' });
  }
};

// ✅ 비밀번호 해싱
const bcrypt = require('bcryptjs');

const hashPassword = async (password) => {
  const saltRounds = 12; // 충분한 솔트 라운드
  return await bcrypt.hash(password, saltRounds);
};
```

### **입력 검증 및 SQL 인젝션 방지**
```javascript
// ✅ 입력 검증
const { body, validationResult } = require('express-validator');

const validateUserInput = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  
  body('password')
    .isLength({ min: 8 })
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain uppercase, lowercase, number and special character'),
  
  (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    next();
  }
];

// ✅ SQL 인젝션 방지 (Supabase 사용 시)
const getUserByEmail = async (email) => {
  // Supabase 클라이언트는 자동으로 SQL 인젝션 방지
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email) // 파라미터화된 쿼리
    .single();
    
  return { data, error };
};
```

## 🧪 **테스트 작성 가이드라인**

### **단위 테스트 (Jest)**
```javascript
// tests/services/userService.test.js
const UserService = require('../../services/userService');
const { supabase } = require('../../config/database');

// Mock Supabase
jest.mock('../../config/database');

describe('UserService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getUserById', () => {
    it('should return user when user exists', async () => {
      // Arrange
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      };
      
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: mockUser,
              error: null
            })
          })
        })
      });

      // Act
      const result = await UserService.getUserById('123');

      // Assert
      expect(result).toEqual(mockUser);
      expect(supabase.from).toHaveBeenCalledWith('users');
    });

    it('should throw error when user not found', async () => {
      // Arrange
      supabase.from.mockReturnValue({
        select: jest.fn().mockReturnValue({
          eq: jest.fn().mockReturnValue({
            single: jest.fn().mockResolvedValue({
              data: null,
              error: { message: 'Not found' }
            })
          })
        })
      });

      // Act & Assert
      await expect(UserService.getUserById('999'))
        .rejects
        .toThrow('Failed to fetch user');
    });
  });
});
```

### **API 통합 테스트**
```javascript
// tests/routes/users.test.js
const request = require('supertest');
const app = require('../../server');

describe('Users API', () => {
  let authToken;

  beforeAll(async () => {
    // 테스트용 사용자 로그인
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'admin@christmas.com',
        password: 'password'
      });
    
    authToken = response.body.token;
  });

  describe('GET /api/users/:id', () => {
    it('should return user data for valid ID', async () => {
      const response = await request(app)
        .get('/api/users/123')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        success: true,
        data: {
          id: '123',
          email: expect.any(String),
          first_name: expect.any(String)
        }
      });
    });

    it('should return 401 for unauthenticated request', async () => {
      await request(app)
        .get('/api/users/123')
        .expect(401);
    });
  });
});
```

## 📊 **코드 품질 메트릭**

### **측정 지표**
```
📈 코드 복잡도:
├── Cyclomatic Complexity < 10
├── Function Length < 50 lines
├── File Length < 500 lines
└── Nested Depth < 4 levels

📋 코드 커버리지:
├── Line Coverage > 80%
├── Branch Coverage > 70%
├── Function Coverage > 90%
└── Statement Coverage > 85%

🐛 코드 품질:
├── No Critical Issues
├── No Security Hotspots
├── Tech Debt < 30 minutes
└── Maintainability Rating A
```

### **정적 분석 도구 (계획)**
```json
// .eslintrc.js (Frontend)
{
  "extends": [
    "@typescript-eslint/recommended",
    "react-app",
    "react-app/jest"
  ],
  "rules": {
    "no-console": "warn",
    "no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "react-hooks/exhaustive-deps": "warn"
  }
}

// .eslintrc.js (Backend)
{
  "extends": ["eslint:recommended", "node"],
  "rules": {
    "no-console": "off",
    "no-unused-vars": "error",
    "prefer-const": "error",
    "no-var": "error"
  }
}
```

## 📝 **코드 리뷰 체크리스트**

### **일반 사항**
- [ ] 코드가 요구사항을 충족하는가?
- [ ] 네이밍이 명확하고 일관성이 있는가?
- [ ] 중복 코드가 없는가?
- [ ] 적절한 주석이 있는가?
- [ ] 에러 처리가 적절한가?

### **보안 사항**
- [ ] 입력 검증이 적절한가?
- [ ] 권한 검사가 있는가?
- [ ] 민감한 정보가 하드코딩되지 않았는가?
- [ ] SQL 인젝션 방지가 되어 있는가?
- [ ] XSS 방지가 되어 있는가?

### **성능 사항**
- [ ] 불필요한 API 호출이 없는가?
- [ ] 메모리 누수 가능성이 없는가?
- [ ] 데이터베이스 쿼리가 최적화되었는가?
- [ ] 적절한 캐싱이 적용되었는가?

### **테스트 사항**
- [ ] 단위 테스트가 작성되었는가?
- [ ] 테스트 커버리지가 충분한가?
- [ ] Edge case가 고려되었는가?
- [ ] 모든 테스트가 통과하는가?

## 🎯 **다음 개선 계획**

### **즉시 적용 (이번 세션)**
- [ ] ESLint/Prettier 설정 파일 생성
- [ ] 기본 테스트 프레임워크 설정
- [ ] 코드 포맷팅 통일

### **단기 목표 (1주 내)**
- [ ] 전체 코드베이스 린팅 적용
- [ ] 핵심 모듈 단위 테스트 작성
- [ ] 코드 리뷰 프로세스 도입

### **장기 목표 (1개월 내)**
- [ ] SonarQube 도입
- [ ] 자동화된 코드 품질 게이트
- [ ] 성능 모니터링 구현

**📝 업데이트**: 2025-05-30 | **관리자**: Dev Team | **다음 리뷰**: 2025-06-06 