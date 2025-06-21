# 🔄 리팩토링 가이드 (Christmas Trading)

## 📋 개요

### 🎯 리팩토링 목표
- **코드 품질 향상**: 가독성, 유지보수성 개선
- **성능 최적화**: 불필요한 코드 제거 및 효율성 증대
- **기술 부채 해결**: 레거시 코드 현대화
- **확장성 확보**: 미래 기능 추가를 위한 구조 개선

### 🏗️ 리팩토링 원칙
- **점진적 개선**: 한 번에 하나씩 단계적 개선
- **테스트 우선**: 리팩토링 전후 테스트 보장
- **기능 보존**: 외부 동작 변경 없이 내부 구조 개선
- **문서화**: 변경 사항 및 이유 명확히 기록

## 🎨 프론트엔드 리팩토링

### 📦 컴포넌트 구조 개선

#### 현재 문제점
```javascript
// 문제: 거대한 단일 컴포넌트
const Dashboard = () => {
  // 500+ 줄의 코드
  // 여러 책임이 혼재
  // 재사용성 부족
};
```

#### 개선 방안
```javascript
// 해결: 컴포넌트 분할 및 책임 분리
const Dashboard = () => {
  return (
    <DashboardLayout>
      <DashboardHeader />
      <DashboardStats />
      <TradingSignalsSection />
      <PortfolioSection />
      <AnalyticsSection />
    </DashboardLayout>
  );
};

// 각 섹션별 독립적인 컴포넌트
const TradingSignalsSection = () => {
  const { signals, loading } = useTradingSignals();
  
  if (loading) return <LoadingSpinner />;
  
  return (
    <Section title="거래 신호">
      {signals.map(signal => (
        <TradingSignalCard key={signal.id} signal={signal} />
      ))}
    </Section>
  );
};
```

### 🔄 상태 관리 리팩토링

#### 현재 문제점
```javascript
// 문제: 전역 상태 남용
const useGlobalStore = create((set) => ({
  user: null,
  signals: [],
  portfolio: {},
  analytics: {},
  theme: 'light',
  notifications: [],
  // ... 모든 상태가 하나의 스토어에
}));
```

#### 개선 방안
```javascript
// 해결: 도메인별 상태 분리
const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false })
}));

const useTradingStore = create((set) => ({
  signals: [],
  portfolio: {},
  setSignals: (signals) => set({ signals }),
  updatePortfolio: (portfolio) => set({ portfolio })
}));

const useUIStore = create((set) => ({
  theme: 'light',
  sidebarOpen: false,
  toggleTheme: () => set((state) => ({ 
    theme: state.theme === 'light' ? 'dark' : 'light' 
  }))
}));
```

### 🎯 커스텀 훅 최적화

#### 현재 문제점
```javascript
// 문제: 로직이 컴포넌트에 직접 구현
const Dashboard = () => {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(false);
  
  useEffect(() => {
    const fetchSignals = async () => {
      setLoading(true);
      try {
        const response = await api.get('/signals');
        setSignals(response.data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchSignals();
  }, []);
  
  // 컴포넌트가 복잡해짐
};
```

#### 개선 방안
```javascript
// 해결: 커스텀 훅으로 로직 분리
const useTradingSignals = () => {
  const [signals, setSignals] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const fetchSignals = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get('/signals');
      setSignals(response.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    fetchSignals();
  }, [fetchSignals]);
  
  return { signals, loading, error, refetch: fetchSignals };
};

// 컴포넌트는 단순해짐
const Dashboard = () => {
  const { signals, loading, error } = useTradingSignals();
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorMessage message={error} />;
  
  return <SignalsList signals={signals} />;
};
```

## 🖥️ 백엔드 리팩토링

### 🏗️ 아키텍처 개선

#### 현재 문제점
```javascript
// 문제: 모든 로직이 라우터에 직접 구현
app.get('/api/signals', async (req, res) => {
  try {
    // 인증 로직
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'No token' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // 비즈니스 로직
    const signals = await supabase
      .from('trading_signals')
      .select('*')
      .eq('user_id', decoded.sub)
      .order('created_at', { ascending: false });
    
    // 데이터 변환
    const formattedSignals = signals.data.map(signal => ({
      id: signal.id,
      symbol: signal.symbol,
      action: signal.action,
      price: parseFloat(signal.price),
      timestamp: new Date(signal.created_at).toISOString()
    }));
    
    res.json(formattedSignals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

#### 개선 방안
```javascript
// 해결: 계층별 분리 (Controller-Service-Repository)

// 1. Repository Layer (데이터 접근)
class TradingSignalRepository {
  async findByUserId(userId) {
    const { data, error } = await supabase
      .from('trading_signals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) throw new Error(error.message);
    return data;
  }
}

// 2. Service Layer (비즈니스 로직)
class TradingSignalService {
  constructor(repository) {
    this.repository = repository;
  }
  
  async getUserSignals(userId) {
    const signals = await this.repository.findByUserId(userId);
    
    return signals.map(signal => ({
      id: signal.id,
      symbol: signal.symbol,
      action: signal.action,
      price: parseFloat(signal.price),
      timestamp: new Date(signal.created_at).toISOString()
    }));
  }
}

// 3. Controller Layer (HTTP 처리)
class TradingSignalController {
  constructor(service) {
    this.service = service;
  }
  
  async getSignals(req, res) {
    try {
      const userId = req.user.id; // 미들웨어에서 설정
      const signals = await this.service.getUserSignals(userId);
      res.json(signals);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

// 4. 라우터는 단순해짐
const authMiddleware = require('./middleware/auth');
const controller = new TradingSignalController(
  new TradingSignalService(new TradingSignalRepository())
);

app.get('/api/signals', authMiddleware, controller.getSignals.bind(controller));
```

### 🔧 미들웨어 리팩토링

#### 현재 문제점
```javascript
// 문제: 인증 로직이 각 라우터에 중복
app.get('/api/signals', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token' });
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // 실제 로직...
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
});
```

#### 개선 방안
```javascript
// 해결: 재사용 가능한 미들웨어
const authMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

// 에러 처리 미들웨어
const errorHandler = (error, req, res, next) => {
  console.error(error);
  
  if (error.name === 'ValidationError') {
    return res.status(400).json({ error: error.message });
  }
  
  if (error.name === 'UnauthorizedError') {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  
  res.status(500).json({ error: 'Internal server error' });
};

// 사용
app.use('/api', authMiddleware);
app.use(errorHandler);
```

## 🗄️ 데이터베이스 리팩토링

### 📊 스키마 최적화

#### 현재 문제점
```sql
-- 문제: 정규화 부족, 인덱스 누락
CREATE TABLE trading_signals (
  id UUID PRIMARY KEY,
  user_id UUID,
  symbol TEXT,
  action TEXT,
  price TEXT, -- 숫자를 텍스트로 저장
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  metadata JSONB -- 구조화되지 않은 데이터
);
```

#### 개선 방안
```sql
-- 해결: 정규화 및 타입 최적화
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE symbols (
  id SERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  market TEXT NOT NULL
);

CREATE TABLE trading_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id),
  symbol_id INTEGER NOT NULL REFERENCES symbols(id),
  action signal_action NOT NULL, -- ENUM 타입
  price DECIMAL(10,2) NOT NULL,
  quantity INTEGER,
  confidence_score DECIMAL(3,2),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- 인덱스 추가
CREATE INDEX idx_trading_signals_user_created ON trading_signals(user_id, created_at DESC);
CREATE INDEX idx_trading_signals_symbol ON trading_signals(symbol_id);

-- ENUM 타입 정의
CREATE TYPE signal_action AS ENUM ('BUY', 'SELL', 'HOLD');
```

### 🔍 쿼리 최적화

#### 현재 문제점
```javascript
// 문제: N+1 쿼리 문제
const getSignalsWithSymbols = async (userId) => {
  const signals = await supabase
    .from('trading_signals')
    .select('*')
    .eq('user_id', userId);
  
  // 각 신호마다 별도 쿼리 실행
  for (const signal of signals.data) {
    const symbol = await supabase
      .from('symbols')
      .select('*')
      .eq('code', signal.symbol)
      .single();
    
    signal.symbolInfo = symbol.data;
  }
  
  return signals.data;
};
```

#### 개선 방안
```javascript
// 해결: JOIN을 사용한 단일 쿼리
const getSignalsWithSymbols = async (userId) => {
  const { data, error } = await supabase
    .from('trading_signals')
    .select(`
      *,
      symbols (
        code,
        name,
        market
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  
  if (error) throw new Error(error.message);
  return data;
};
```

## 🧪 테스트 리팩토링

### 🔧 테스트 구조 개선

#### 현재 문제점
```javascript
// 문제: 테스트가 구현 세부사항에 의존
test('should fetch trading signals', async () => {
  // 내부 구현에 의존하는 테스트
  const mockSupabase = {
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: [{ id: 1, symbol: 'AAPL' }]
          })
        })
      })
    })
  };
  
  // 테스트가 깨지기 쉬움
});
```

#### 개선 방안
```javascript
// 해결: 행위 중심 테스트
describe('TradingSignalService', () => {
  let service;
  let mockRepository;
  
  beforeEach(() => {
    mockRepository = {
      findByUserId: jest.fn()
    };
    service = new TradingSignalService(mockRepository);
  });
  
  test('should return formatted signals for user', async () => {
    // Given
    const userId = 'user-123';
    const rawSignals = [
      { id: 1, symbol: 'AAPL', price: '150.00', created_at: '2023-01-01' }
    ];
    mockRepository.findByUserId.mockResolvedValue(rawSignals);
    
    // When
    const result = await service.getUserSignals(userId);
    
    // Then
    expect(result).toEqual([
      {
        id: 1,
        symbol: 'AAPL',
        price: 150.00,
        timestamp: '2023-01-01T00:00:00.000Z'
      }
    ]);
    expect(mockRepository.findByUserId).toHaveBeenCalledWith(userId);
  });
});
```

## 📋 리팩토링 체크리스트

### ✅ 리팩토링 전 준비
- [ ] 기존 테스트 실행 및 통과 확인
- [ ] 리팩토링 범위 및 목표 명확화
- [ ] 백업 및 브랜치 생성
- [ ] 팀원과 리팩토링 계획 공유

### ✅ 리팩토링 진행
- [ ] 작은 단위로 점진적 변경
- [ ] 각 단계마다 테스트 실행
- [ ] 기능 동작 확인
- [ ] 코드 리뷰 요청

### ✅ 리팩토링 완료 후
- [ ] 전체 테스트 스위트 실행
- [ ] 성능 테스트 수행
- [ ] 문서 업데이트
- [ ] 팀원에게 변경사항 공유

## 🎯 우선순위별 리팩토링 계획

### Phase 1: 긴급 리팩토링 (1주일)
1. **중복 코드 제거**: 공통 유틸리티 함수 추출
2. **에러 처리 표준화**: 일관된 에러 처리 패턴 적용
3. **환경변수 관리**: 설정 파일 중앙화

### Phase 2: 구조적 개선 (2주일)
1. **컴포넌트 분할**: 거대한 컴포넌트 분리
2. **상태 관리 최적화**: 도메인별 스토어 분리
3. **API 계층 분리**: Controller-Service-Repository 패턴 적용

### Phase 3: 성능 최적화 (1개월)
1. **데이터베이스 최적화**: 인덱스 추가, 쿼리 개선
2. **번들 최적화**: 코드 스플리팅, 트리 쉐이킹
3. **캐싱 전략**: 메모이제이션, API 캐싱

## 📊 리팩토링 성과 측정

### 🎯 정량적 지표
- **코드 복잡도**: Cyclomatic Complexity 감소
- **중복도**: Code Duplication 비율 감소
- **테스트 커버리지**: 80% 이상 유지
- **번들 크기**: 20% 이상 감소

### 📈 정성적 지표
- **가독성**: 코드 리뷰 시간 단축
- **유지보수성**: 버그 수정 시간 단축
- **확장성**: 새 기능 추가 시간 단축
- **팀 만족도**: 개발자 경험 개선

---
**📅 작성일**: 2025-05-27 01:40  
**👤 작성자**: PM AI Assistant  
**🔄 버전**: v1.0  
**📊 상태**: 리팩토링 전략 수립 완료 