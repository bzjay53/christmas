# Christmas API 사용 예제

이 문서는 Christmas API를 사용하는 방법과 일반적인 시나리오에 대한 예제를 제공합니다.

## 인증

모든 API 호출은 API 키를 필요로 합니다. API 키는 HTTP 헤더 `X-API-KEY`에 포함되어야 합니다.

### API 키 생성하기

```bash
# API 키 생성 요청
curl -X POST https://api.christmas-trading.com/v1/auth/api-key \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: 기존_API_키" \
  -d '{
    "name": "내 트레이딩 앱",
    "permissions": ["read_market_data", "create_orders", "read_orders"],
    "expires_in": 7776000
  }'

# 응답
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "key": "trng_abcdefghijklmnopqrstuvwxyz",
  "secret": "secret_abcdefghijklmnopqrstuvwxyz",
  "name": "내 트레이딩 앱",
  "permissions": ["read_market_data", "create_orders", "read_orders"],
  "created_at": "2023-12-15T12:00:00Z",
  "expires_at": "2024-06-15T12:00:00Z",
  "is_active": true
}
```

## 시장 데이터 조회

### 가격 데이터 가져오기

```bash
# 특정 종목의 15분봉 데이터 가져오기
curl -X GET "https://api.christmas-trading.com/v1/market/prices?symbol=BTC-USDT&interval=15m&limit=5" \
  -H "X-API-KEY: 내_API_키"

# 응답
{
  "symbol": "BTC-USDT",
  "interval": "15m",
  "prices": [
    {
      "timestamp": "2023-12-15T12:00:00Z",
      "open": 42350.25,
      "high": 42380.15,
      "low": 42320.40,
      "close": 42375.10,
      "volume": 125.34
    },
    {
      "timestamp": "2023-12-15T12:15:00Z",
      "open": 42375.10,
      "high": 42395.60,
      "low": 42370.30,
      "close": 42390.80,
      "volume": 118.72
    },
    // ... 추가 데이터 포인트
  ]
}
```

## 주문 관리

### 주문 생성하기

```bash
# 지정가 매수 주문 생성
curl -X POST https://api.christmas-trading.com/v1/orders \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: 내_API_키" \
  -d '{
    "symbol": "BTC-USDT",
    "side": "buy",
    "type": "limit",
    "quantity": 0.01,
    "price": 42000.00,
    "time_in_force": "gtc",
    "client_order_id": "my_order_1234"
  }'

# 응답
{
  "id": "order_abcdefghijklmnopqrstuvwxyz",
  "client_order_id": "my_order_1234",
  "symbol": "BTC-USDT",
  "side": "buy",
  "type": "limit",
  "quantity": 0.01,
  "price": 42000.00,
  "time_in_force": "gtc",
  "status": "new",
  "filled_quantity": 0,
  "filled_price": 0,
  "created_at": "2023-12-15T14:30:00Z",
  "updated_at": "2023-12-15T14:30:00Z"
}
```

### 주문 목록 조회하기

```bash
# 열린 주문 목록 조회
curl -X GET "https://api.christmas-trading.com/v1/orders?status=open" \
  -H "X-API-KEY: 내_API_키"

# 응답
{
  "orders": [
    {
      "id": "order_abcdefghijklmnopqrstuvwxyz",
      "client_order_id": "my_order_1234",
      "symbol": "BTC-USDT",
      "side": "buy",
      "type": "limit",
      "quantity": 0.01,
      "price": 42000.00,
      "time_in_force": "gtc",
      "status": "new",
      "filled_quantity": 0,
      "filled_price": 0,
      "created_at": "2023-12-15T14:30:00Z",
      "updated_at": "2023-12-15T14:30:00Z"
    },
    // ... 추가 주문 정보
  ],
  "count": 1,
  "total": 1
}
```

## 자동 매매 전략

### 스켈핑 전략 설정

```bash
# 스켈핑 전략 생성 (실제 API에서 구현 필요)
curl -X POST https://api.christmas-trading.com/v1/strategies \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: 내_API_키" \
  -d '{
    "name": "BTC 스켈핑 1",
    "type": "scalping",
    "symbol": "BTC-USDT",
    "parameters": {
      "profit_target_pct": 0.15,
      "stop_loss_pct": 0.1,
      "max_position_size": 0.05,
      "time_frame": "1m"
    },
    "status": "active"
  }'

# 응답
{
  "id": "strategy_abcdefghijklmnopqrstuvwxyz",
  "name": "BTC 스켈핑 1",
  "type": "scalping",
  "symbol": "BTC-USDT",
  "parameters": {
    "profit_target_pct": 0.15,
    "stop_loss_pct": 0.1,
    "max_position_size": 0.05,
    "time_frame": "1m"
  },
  "status": "active",
  "created_at": "2023-12-15T15:00:00Z",
  "updated_at": "2023-12-15T15:00:00Z"
}
```

## 백테스팅

### 전략 백테스트 실행

```bash
# 백테스트 실행 (실제 API에서 구현 필요)
curl -X POST https://api.christmas-trading.com/v1/backtest \
  -H "Content-Type: application/json" \
  -H "X-API-KEY: 내_API_키" \
  -d '{
    "strategy_id": "strategy_abcdefghijklmnopqrstuvwxyz",
    "start_date": "2023-11-01T00:00:00Z",
    "end_date": "2023-12-01T00:00:00Z",
    "initial_capital": 10000,
    "parameters": {
      "profit_target_pct": 0.20,
      "stop_loss_pct": 0.1
    }
  }'

# 응답
{
  "id": "backtest_abcdefghijklmnopqrstuvwxyz",
  "strategy_id": "strategy_abcdefghijklmnopqrstuvwxyz",
  "start_date": "2023-11-01T00:00:00Z",
  "end_date": "2023-12-01T00:00:00Z",
  "initial_capital": 10000,
  "status": "pending",
  "created_at": "2023-12-15T16:00:00Z"
}
```

## 오류 처리

API는 오류가 발생할 경우 적절한 HTTP 상태 코드와 함께 오류 정보를 JSON 형식으로 반환합니다.

```json
{
  "error_code": "invalid_request",
  "message": "유효하지 않은 요청 매개변수",
  "details": {
    "field": "price",
    "reason": "0보다 큰 값이어야 합니다"
  }
}
```

## 속도 제한

API는 속도 제한이 있습니다:

- 공개 API: 분당 60 요청
- 인증된 API: 분당 1200 요청

속도 제한에 도달하면 HTTP 429 응답을 받습니다. 헤더에서 남은 요청 수를 확인할 수 있습니다:

```
X-Rate-Limit-Limit: 1200
X-Rate-Limit-Remaining: 1199
X-Rate-Limit-Reset: 1639569600
```

## 웹소켓 API

실시간 데이터는 웹소켓 API를 통해 이용할 수 있습니다.

```javascript
// 웹소켓 연결
const socket = new WebSocket('wss://api.christmas-trading.com/v1/ws');

// 인증
socket.send(JSON.stringify({
  action: 'auth',
  key: '내_API_키'
}));

// 시장 데이터 구독
socket.send(JSON.stringify({
  action: 'subscribe',
  channel: 'ticker',
  symbols: ['BTC-USDT', 'ETH-USDT']
}));

// 메시지 수신
socket.onmessage = function(event) {
  const data = JSON.parse(event.data);
  console.log('받은 데이터:', data);
};
```

## 더 많은 정보

전체 API 문서는 [OpenAPI 스펙](openapi-spec.yaml)을 참조하세요. 