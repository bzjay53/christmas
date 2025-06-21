# Christmas 프로젝트 데이터베이스 설계 문서

## 1. 개요

Christmas 프로젝트는 다양한 데이터베이스 시스템을 활용하여 데이터를 저장하고 관리합니다. 주요 데이터베이스는 다음과 같습니다:

- **PostgreSQL (TimescaleDB)**: 시계열 데이터 및 주요 비즈니스 데이터 저장
- **Redis**: 캐싱 및 세션 관리
- **Weaviate**: 벡터 데이터베이스 (RAG 시스템용)

## 2. PostgreSQL (TimescaleDB) 데이터 모델

### 2.1 사용자 관련 테이블

#### 2.1.1 users
```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2.1.2 user_profiles
```sql
CREATE TABLE user_profiles (
  user_id INTEGER PRIMARY KEY REFERENCES users(id),
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  phone VARCHAR(20),
  address TEXT,
  preferences JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 2.2 시장 데이터 테이블

#### 2.2.1 market_data
```sql
CREATE TABLE market_data (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  open NUMERIC(19, 4),
  high NUMERIC(19, 4),
  low NUMERIC(19, 4),
  close NUMERIC(19, 4),
  volume NUMERIC(19, 4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TimescaleDB 하이퍼테이블 생성
SELECT create_hypertable('market_data', 'timestamp');

-- 인덱스 생성
CREATE INDEX idx_market_data_symbol ON market_data(symbol);
```

#### 2.2.2 technical_indicators
```sql
CREATE TABLE technical_indicators (
  id BIGSERIAL PRIMARY KEY,
  symbol VARCHAR(20) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  indicator_type VARCHAR(50) NOT NULL,
  value NUMERIC(19, 6),
  parameters JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- TimescaleDB 하이퍼테이블 생성
SELECT create_hypertable('technical_indicators', 'timestamp');

-- 인덱스 생성
CREATE INDEX idx_tech_indicators_symbol_type ON technical_indicators(symbol, indicator_type);
```

### 2.3 주문 관련 테이블

#### 2.3.1 orders
```sql
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  symbol VARCHAR(20) NOT NULL,
  order_type VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL,
  quantity NUMERIC(19, 4) NOT NULL,
  price NUMERIC(19, 4),
  status VARCHAR(20) NOT NULL,
  external_id VARCHAR(100),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_symbol ON orders(symbol);
CREATE INDEX idx_orders_created_at ON orders(created_at);
```

#### 2.3.2 trades
```sql
CREATE TABLE trades (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  user_id INTEGER REFERENCES users(id),
  symbol VARCHAR(20) NOT NULL,
  side VARCHAR(10) NOT NULL,
  quantity NUMERIC(19, 4) NOT NULL,
  price NUMERIC(19, 4) NOT NULL,
  timestamp TIMESTAMPTZ NOT NULL,
  fee NUMERIC(19, 4),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 인덱스 생성
CREATE INDEX idx_trades_order_id ON trades(order_id);
CREATE INDEX idx_trades_user_id ON trades(user_id);
CREATE INDEX idx_trades_symbol ON trades(symbol);
CREATE INDEX idx_trades_timestamp ON trades(timestamp);
```

### 2.4 백테스트 관련 테이블

#### 2.4.1 backtest_runs
```sql
CREATE TABLE backtest_runs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  strategy_name VARCHAR(100) NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  symbols TEXT[] NOT NULL,
  parameters JSONB,
  status VARCHAR(20) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

#### 2.4.2 backtest_results
```sql
CREATE TABLE backtest_results (
  id SERIAL PRIMARY KEY,
  backtest_id INTEGER REFERENCES backtest_runs(id),
  total_trades INTEGER,
  winning_trades INTEGER,
  losing_trades INTEGER,
  win_rate NUMERIC(5, 2),
  total_return NUMERIC(19, 4),
  sharpe_ratio NUMERIC(10, 4),
  max_drawdown NUMERIC(10, 4),
  results_data JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 3. Redis 데이터 모델

### 3.1 세션 관리
```
Key: session:{session_id}
Value: { user_id, username, roles, created_at, expires_at, ... }
Expiry: 24 hours
```

### 3.2 API 속도 제한
```
Key: rate_limit:{ip_address}
Value: (Integer) 요청 횟수
Expiry: 1 minute
```

### 3.3 실시간 시장 데이터 캐시
```
Key: market:{symbol}:latest
Value: { timestamp, open, high, low, close, volume }
Expiry: 5 seconds
```

### 3.4 사용자 설정 캐시
```
Key: user:{user_id}:preferences
Value: { theme, dashboard_layout, notification_settings, ... }
Expiry: 1 hour
```

## 4. Weaviate 벡터 데이터베이스 모델 (RAG 시스템)

### 4.1 스키마 정의

```json
{
  "classes": [
    {
      "class": "ChristmasDocument",
      "description": "Christmas 프로젝트 문서 청크",
      "vectorizer": "text2vec-openai",
      "moduleConfig": {
        "text2vec-openai": {
          "model": "text-embedding-ada-002",
          "modelVersion": "002",
          "type": "text"
        }
      },
      "properties": [
        {
          "name": "content",
          "dataType": ["text"],
          "description": "문서 청크 내용"
        },
        {
          "name": "file_path",
          "dataType": ["string"],
          "description": "원본 파일 경로"
        },
        {
          "name": "section",
          "dataType": ["string"],
          "description": "문서 섹션"
        },
        {
          "name": "chunk_id",
          "dataType": ["int"],
          "description": "청크 ID"
        },
        {
          "name": "metadata",
          "dataType": ["text"],
          "description": "추가 메타데이터(타임스탬프, 토큰 수 등)"
        }
      ]
    }
  ]
}
```

### 4.2 데이터 예시

```json
{
  "class": "ChristmasDocument",
  "id": "36ddd591-2dee-4e7e-8c94-a8a3a950fb71",
  "properties": {
    "content": "Christmas 프로젝트는 Docker 기반의 초단타 자동 매매 플랫폼입니다. 모든 매수·매도에서 실패 없이 이익을 실현(100% Win-Rate)하는 것을 목표로 합니다.",
    "file_path": "docs/01. Christmas_plan.md",
    "section": "프로젝트 개요",
    "chunk_id": 1,
    "metadata": "{\"timestamp\": \"2025-05-11T00:00:00Z\", \"tokens\": 75}"
  },
  "vector": [0.123, 0.456, 0.789, ...]
}
```

### 4.3 데이터 검색 쿼리 예시

```graphql
{
  Get {
    ChristmasDocument(
      nearText: {
        concepts: ["자동 매매 시스템 특징"],
        certainty: 0.7
      }
      limit: 5
    ) {
      content
      file_path
      section
      _additional {
        certainty
        id
      }
    }
  }
}
```

### 4.4 인덱스 설정

- **벡터 인덱스 타입**: HNSW (Hierarchical Navigable Small World)
- **벡터 차원**: 1536 (OpenAI text-embedding-ada-002 모델 기준)
- **거리 메트릭**: 코사인 유사도
- **efConstruction**: 128 (색인 시 탐색 품질)
- **maxConnections**: 64 (HNSW 그래프의 노드 당 최대 연결 수)

## 5. 데이터베이스 연결 설정

### 5.1 PostgreSQL 연결 설정
```python
DATABASE_URL = "postgresql://username:password@timescaledb:5432/christmas_db"
```

### 5.2 Redis 연결 설정
```python
REDIS_URL = "redis://redis:6379/0"
```

### 5.3 Weaviate 연결 설정
```python
WEAVIATE_URL = "http://weaviate:8080"
OPENAI_API_KEY = "your-openai-api-key"
```

## 6. 데이터 마이그레이션 및 백업 전략

### 6.1 PostgreSQL 마이그레이션
- Alembic을 사용한 버전 관리식 마이그레이션
- 스키마 변경 이력 Git 저장소에 기록

### 6.2 백업 전략
- PostgreSQL: 일일 전체 백업 + 시간별 증분 백업
- Redis: RDB 스냅샷 + AOF 로그
- Weaviate: 정기적인 백업 스크립트를 통한 데이터 덤프

## 7. 데이터 보안

### 7.1 접근 제어
- 데이터베이스별 전용 서비스 계정 사용
- 최소 권한 원칙 적용
- IP 기반 접근 제한

### 7.2 데이터 암호화
- 전송 중 암호화: TLS/SSL 적용
- 저장 시 암호화: 민감 데이터 필드 암호화

### 7.3 감사 및 모니터링
- 데이터베이스 액세스 로깅
- 이상 패턴 모니터링

## 8. 성능 최적화

### 8.1 PostgreSQL 성능 최적화
- 인덱스 전략 구현
- 쿼리 최적화
- 파티셔닝 (TimescaleDB 활용)

### 8.2 Redis 성능 최적화
- 메모리 관리 정책 설정
- 적절한 데이터 만료 시간 설정

### 8.3 Weaviate 성능 최적화
- 벡터 차원 최적화
- 검색 매개변수 튜닝
- 배치 처리를 통한 색인 성능 향상 