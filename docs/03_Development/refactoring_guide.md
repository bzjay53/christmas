# Christmas Trading 코드 리팩토링 가이드

## 📋 문서 개요
이 문서는 Christmas Trading 프로젝트의 코드 품질 향상, 유지보수성 개선, 성능 최적화를 위한 체계적인 리팩토링 전략을 정의합니다.

## 🎯 리팩토링 목표

### 🔍 주요 목적
1. **코드 품질 향상**: 가독성, 유지보수성, 확장성 개선
2. **성능 최적화**: 응답 시간 단축, 메모리 사용량 최적화
3. **보안 강화**: 취약점 제거, 보안 모범 사례 적용
4. **테스트 커버리지 증대**: 안정성 및 신뢰성 향상

### 📊 기대 효과
- **개발 생산성**: 30% 향상
- **버그 발생률**: 50% 감소
- **응답 시간**: 40% 단축
- **코드 복잡도**: 25% 감소

## 🔍 현재 코드 분석

### ❌ 발견된 문제점

#### 🖥️ 프론트엔드 (React)
1. **컴포넌트 크기**: 일부 컴포넌트가 800줄 이상으로 과도하게 큼
2. **상태 관리**: 복잡한 상태 로직이 컴포넌트에 직접 구현됨
3. **중복 코드**: API 호출 로직의 반복
4. **타입 안전성**: TypeScript 미적용으로 런타임 오류 위험

#### 🔧 백엔드 (Node.js)
1. **라우터 구조**: 단일 파일에 모든 라우트 정의
2. **에러 처리**: 일관성 없는 에러 핸들링
3. **데이터베이스**: N+1 쿼리 문제
4. **보안**: 입력 검증 부족

### ✅ 잘 구현된 부분
1. **모듈화**: 서비스 레이어 분리
2. **환경 설정**: 환경별 설정 관리
3. **API 설계**: RESTful 원칙 준수
4. **문서화**: 상세한 주석 및 문서

## 📋 리팩토링 우선순위

### 🚨 긴급 (1주 내)
- [ ] 보안 취약점 수정
- [ ] 성능 병목 지점 해결
- [ ] 크리티컬 버그 수정
- [ ] 에러 처리 표준화

### 🔥 높음 (2-3주)
- [ ] 대형 컴포넌트 분할
- [ ] TypeScript 마이그레이션
- [ ] 상태 관리 개선
- [ ] 데이터베이스 쿼리 최적화

### 📈 중간 (4-6주)
- [ ] 코드 중복 제거
- [ ] 테스트 커버리지 확대
- [ ] 성능 모니터링 구축
- [ ] 코드 스타일 통일

### 🔮 낮음 (장기)
- [ ] 아키텍처 개선
- [ ] 새로운 기술 스택 도입
- [ ] 마이크로서비스 분할
- [ ] 캐싱 전략 고도화

## 🛠️ 프론트엔드 리팩토링

### 📦 컴포넌트 분할 전략

#### Before: 대형 컴포넌트
```jsx
// KISApiSettings.jsx (800+ lines)
function KISApiSettings() {
  // 모든 로직이 하나의 컴포넌트에...
  const [settings, setSettings] = useState({...})
  const [testResults, setTestResults] = useState({...})
  // ... 수백 줄의 코드
}
```

#### After: 분할된 컴포넌트
```jsx
// components/KISApiSettings/index.jsx
function KISApiSettings() {
  return (
    <KISApiProvider>
      <KISApiTabs />
    </KISApiProvider>
  )
}

// components/KISApiSettings/KISApiTabs.jsx
function KISApiTabs() {
  return (
    <Tabs>
      <TabPanel><ApiKeySettings /></TabPanel>
      <TabPanel><ConnectionTest /></TabPanel>
      <TabPanel><TelegramSettings /></TabPanel>
    </Tabs>
  )
}

// components/KISApiSettings/ApiKeySettings.jsx
function ApiKeySettings() {
  const { settings, updateSettings } = useKISApi()
  // 특정 기능에 집중된 컴포넌트
}
```

### 🔄 상태 관리 개선

#### Before: 컴포넌트 내 상태
```jsx
function Dashboard() {
  const [user, setUser] = useState(null)
  const [portfolio, setPortfolio] = useState([])
  const [notifications, setNotifications] = useState([])
  // 복잡한 상태 로직...
}
```

#### After: Context + Reducer 패턴
```jsx
// contexts/AppContext.jsx
const AppContext = createContext()

function AppProvider({ children }) {
  const [state, dispatch] = useReducer(appReducer, initialState)
  
  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  )
}

// hooks/useApp.js
function useApp() {
  const context = useContext(AppContext)
  return {
    user: context.state.user,
    portfolio: context.state.portfolio,
    updateUser: (user) => context.dispatch({ type: 'UPDATE_USER', payload: user })
  }
}
```

### 📝 TypeScript 마이그레이션

#### 1단계: 타입 정의
```typescript
// types/api.ts
export interface KISApiSettings {
  mockMode: boolean
  demoAppKey: string
  demoAppSecret: string
  realAppKey: string
  realAppSecret: string
  accountNumber: string
}

export interface ApiResponse<T> {
  success: boolean
  data: T
  message?: string
  error?: string
}
```

#### 2단계: 컴포넌트 변환
```typescript
// components/KISApiSettings.tsx
interface KISApiSettingsProps {
  onShowNotification?: (message: string, type: 'success' | 'error' | 'warning') => void
}

const KISApiSettings: React.FC<KISApiSettingsProps> = ({ onShowNotification }) => {
  const [settings, setSettings] = useState<KISApiSettings>({
    mockMode: true,
    demoAppKey: '',
    // ...
  })
  
  const handleSave = async (): Promise<void> => {
    try {
      const response: ApiResponse<void> = await apiService.saveKisSettings(settings)
      // ...
    } catch (error) {
      // ...
    }
  }
}
```

## 🔧 백엔드 리팩토링

### 🗂️ 라우터 구조 개선

#### Before: 단일 파일
```javascript
// server.js
app.get('/api/kis/status', (req, res) => { /* ... */ })
app.post('/api/kis/token/test', (req, res) => { /* ... */ })
app.get('/api/telegram/validate', (req, res) => { /* ... */ })
// 수십 개의 라우트...
```

#### After: 모듈화된 구조
```javascript
// routes/index.js
const express = require('express')
const router = express.Router()

router.use('/kis', require('./kis'))
router.use('/telegram', require('./telegram'))
router.use('/auth', require('./auth'))

module.exports = router

// routes/kis/index.js
const router = express.Router()
const kisController = require('../../controllers/kisController')

router.get('/status', kisController.getStatus)
router.post('/token/test', kisController.testToken)

module.exports = router
```

### 🎯 컨트롤러-서비스 패턴

#### Before: 라우터에 비즈니스 로직
```javascript
app.post('/api/kis/token/test', async (req, res) => {
  try {
    const { appKey, appSecret } = req.body
    
    // 비즈니스 로직이 라우터에...
    const tokenResponse = await fetch('https://openapi.koreainvestment.com:9443/oauth2/tokenP', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ appkey: appKey, appsecret: appSecret })
    })
    
    const tokenData = await tokenResponse.json()
    res.json({ success: true, data: tokenData })
  } catch (error) {
    res.status(500).json({ success: false, error: error.message })
  }
})
```

#### After: 분리된 컨트롤러-서비스
```javascript
// controllers/kisController.js
const kisService = require('../services/kisService')
const { handleError } = require('../utils/errorHandler')

exports.testToken = async (req, res) => {
  try {
    const { appKey, appSecret } = req.body
    const result = await kisService.testToken(appKey, appSecret)
    res.json({ success: true, data: result })
  } catch (error) {
    handleError(error, res)
  }
}

// services/kisService.js
const { KISApiClient } = require('../utils/kisApiClient')

class KISService {
  async testToken(appKey, appSecret) {
    const client = new KISApiClient(appKey, appSecret)
    return await client.getAccessToken()
  }
}

module.exports = new KISService()
```

### 🛡️ 에러 처리 표준화

```javascript
// utils/errorHandler.js
class AppError extends Error {
  constructor(message, statusCode, code) {
    super(message)
    this.statusCode = statusCode
    this.code = code
    this.isOperational = true
  }
}

const handleError = (error, res) => {
  if (error.isOperational) {
    return res.status(error.statusCode).json({
      success: false,
      error: error.message,
      code: error.code
    })
  }
  
  // 예상치 못한 에러
  console.error('Unexpected error:', error)
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  })
}

// middleware/errorMiddleware.js
const errorMiddleware = (error, req, res, next) => {
  handleError(error, res)
}

module.exports = { AppError, handleError, errorMiddleware }
```

## 🗄️ 데이터베이스 최적화

### 🔍 N+1 쿼리 해결

#### Before: N+1 문제
```javascript
// 사용자별로 포트폴리오 조회 (N+1 쿼리 발생)
const users = await User.findAll()
for (const user of users) {
  user.portfolio = await Portfolio.findAll({ where: { userId: user.id } })
}
```

#### After: 조인 쿼리
```javascript
// 한 번의 쿼리로 해결
const users = await User.findAll({
  include: [{
    model: Portfolio,
    as: 'portfolio'
  }]
})
```

### 📊 인덱스 최적화

```sql
-- 자주 사용되는 쿼리 패턴 분석
-- 1. 사용자별 거래 내역 조회
CREATE INDEX idx_trades_user_date ON trades(user_id, created_at DESC);

-- 2. 종목별 가격 히스토리
CREATE INDEX idx_prices_symbol_date ON stock_prices(symbol, date DESC);

-- 3. 복합 조건 검색
CREATE INDEX idx_trades_composite ON trades(user_id, symbol, trade_type, created_at);
```

## 🧪 테스트 커버리지 확대

### 📝 단위 테스트 추가

```javascript
// tests/services/kisService.test.js
const KISService = require('../../services/kisService')
const { KISApiClient } = require('../../utils/kisApiClient')

jest.mock('../../utils/kisApiClient')

describe('KISService', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })
  
  describe('testToken', () => {
    it('should return token data for valid credentials', async () => {
      // Arrange
      const mockTokenData = { access_token: 'test-token' }
      KISApiClient.prototype.getAccessToken.mockResolvedValue(mockTokenData)
      
      // Act
      const result = await KISService.testToken('test-key', 'test-secret')
      
      // Assert
      expect(result).toEqual(mockTokenData)
      expect(KISApiClient).toHaveBeenCalledWith('test-key', 'test-secret')
    })
    
    it('should throw error for invalid credentials', async () => {
      // Arrange
      KISApiClient.prototype.getAccessToken.mockRejectedValue(new Error('Invalid credentials'))
      
      // Act & Assert
      await expect(KISService.testToken('invalid', 'invalid'))
        .rejects.toThrow('Invalid credentials')
    })
  })
})
```

### 🔄 통합 테스트

```javascript
// tests/integration/api.test.js
const request = require('supertest')
const app = require('../../server')

describe('KIS API Integration', () => {
  describe('POST /api/kis/token/test', () => {
    it('should test token with valid data', async () => {
      const response = await request(app)
        .post('/api/kis/token/test')
        .send({
          appKey: process.env.TEST_APP_KEY,
          appSecret: process.env.TEST_APP_SECRET
        })
        .expect(200)
      
      expect(response.body.success).toBe(true)
      expect(response.body.data).toHaveProperty('access_token')
    })
  })
})
```

## 📈 성능 최적화

### ⚡ 프론트엔드 최적화

#### 1. 코드 스플리팅
```jsx
// 라우트 기반 코드 스플리팅
const Dashboard = lazy(() => import('./components/Dashboard'))
const KISApiSettings = lazy(() => import('./components/KISApiSettings'))

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/settings" element={<KISApiSettings />} />
      </Routes>
    </Suspense>
  )
}
```

#### 2. 메모이제이션
```jsx
// React.memo로 불필요한 리렌더링 방지
const StockItem = React.memo(({ stock, onSelect }) => {
  return (
    <div onClick={() => onSelect(stock.id)}>
      {stock.name}: {stock.price}
    </div>
  )
})

// useMemo로 비싼 계산 캐싱
const Dashboard = () => {
  const portfolioValue = useMemo(() => {
    return portfolio.reduce((sum, item) => sum + item.value, 0)
  }, [portfolio])
}
```

### 🔧 백엔드 최적화

#### 1. 캐싱 전략
```javascript
// Redis 캐싱
const redis = require('redis')
const client = redis.createClient()

const cacheMiddleware = (duration = 300) => {
  return async (req, res, next) => {
    const key = `cache:${req.originalUrl}`
    
    try {
      const cached = await client.get(key)
      if (cached) {
        return res.json(JSON.parse(cached))
      }
      
      // 원본 res.json을 래핑
      const originalJson = res.json
      res.json = function(data) {
        client.setex(key, duration, JSON.stringify(data))
        return originalJson.call(this, data)
      }
      
      next()
    } catch (error) {
      next()
    }
  }
}

// 사용 예시
router.get('/api/stocks/:symbol/price', cacheMiddleware(60), getStockPrice)
```

#### 2. 데이터베이스 연결 풀링
```javascript
// config/database.js
const { Pool } = require('pg')

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20, // 최대 연결 수
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

module.exports = pool
```

## 📊 리팩토링 진행 상황 추적

### 📈 메트릭 정의
- **코드 복잡도**: Cyclomatic Complexity < 10
- **함수 길이**: < 50줄
- **파일 크기**: < 500줄
- **테스트 커버리지**: > 80%
- **성능**: API 응답 시간 < 2초

### 🔍 모니터링 도구
- **코드 품질**: SonarQube, ESLint
- **성능**: Lighthouse, WebPageTest
- **테스트**: Jest, Cypress
- **번들 크기**: webpack-bundle-analyzer

## 📋 리팩토링 체크리스트

### ✅ 프론트엔드
- [ ] TypeScript 마이그레이션 완료
- [ ] 컴포넌트 크기 500줄 이하로 분할
- [ ] 상태 관리 Context/Redux 적용
- [ ] 코드 스플리팅 구현
- [ ] 성능 최적화 (메모이제이션)
- [ ] 테스트 커버리지 80% 이상

### ✅ 백엔드
- [ ] 컨트롤러-서비스 패턴 적용
- [ ] 에러 처리 표준화
- [ ] 데이터베이스 쿼리 최적화
- [ ] 캐싱 전략 구현
- [ ] API 문서화 완료
- [ ] 보안 취약점 해결

### ✅ 공통
- [ ] 코드 스타일 가이드 적용
- [ ] CI/CD 파이프라인 구축
- [ ] 모니터링 시스템 구축
- [ ] 성능 벤치마크 수립

## 📚 관련 문서 링크
- [프로젝트 구조도](./47.%20프로젝트%20구조도.md)
- [테스트 전략 문서](./50.%20테스트%20전략%20문서.md)
- [성능 최적화 가이드](./55.%20성능%20최적화%20가이드.md)
- [코드 품질 가이드라인](./56.%20코드%20품질%20가이드라인.md)

## 📝 업데이트 이력
- 2024-12-25: 초기 리팩토링 가이드 생성
- 향후 업데이트 예정

---
**⚠️ 중요**: 리팩토링은 단계적으로 진행하며, 각 단계마다 충분한 테스트를 거쳐야 합니다. 