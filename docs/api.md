# Christmas 프로젝트 API 문서

## 1. API 개요

Christmas 프로젝트의 API는 RESTful 원칙을 따르며, JSON 형식으로 데이터를 주고받습니다. 모든 API 엔드포인트는 `/api/v1`을 기본 경로로 사용합니다.

## 2. 인증

### 2.1 JWT 인증
모든 API 요청은 JWT 토큰을 포함해야 합니다. 토큰은 Authorization 헤더에 다음과 같이 포함됩니다:
```
Authorization: Bearer <token>
```

### 2.2 토큰 갱신
- 엔드포인트: `POST /api/v1/auth/refresh`
- 설명: 액세스 토큰이 만료되었을 때 리프레시 토큰을 사용하여 새로운 액세스 토큰을 발급받습니다.

## 3. API 엔드포인트

### 3.1 인증 관련 API

#### 3.1.1 로그인
- 엔드포인트: `POST /api/v1/auth/login`
- 설명: 사용자 인증 및 토큰 발급
- 요청 본문:
  ```json
  {
    "username": "string",
    "password": "string"
  }
  ```
- 응답:
  ```json
  {
    "access_token": "string",
    "refresh_token": "string",
    "token_type": "bearer"
  }
  ```

#### 3.1.2 회원가입
- 엔드포인트: `POST /api/v1/auth/register`
- 설명: 새로운 사용자 등록
- 요청 본문:
  ```json
  {
    "username": "string",
    "email": "string",
    "password": "string"
  }
  ```

### 3.2 알림 관련 API

#### 3.2.1 알림 목록 조회
- 엔드포인트: `GET /api/v1/notifications`
- 설명: 사용자의 알림 목록을 조회합니다.
- 쿼리 파라미터:
  - `page`: 페이지 번호 (기본값: 1)
  - `size`: 페이지 크기 (기본값: 20)
- 응답:
  ```json
  {
    "items": [
      {
        "id": "string",
        "title": "string",
        "content": "string",
        "created_at": "string",
        "read": boolean
      }
    ],
    "total": number,
    "page": number,
    "size": number
  }
  ```

#### 3.2.2 알림 읽음 처리
- 엔드포인트: `PUT /api/v1/notifications/{notification_id}/read`
- 설명: 특정 알림을 읽음 처리합니다.

### 3.3 전략 관련 API

#### 3.3.1 전략 목록 조회
- 엔드포인트: `GET /api/v1/strategies`
- 설명: 사용 가능한 트레이딩 전략 목록을 조회합니다.
- 응답:
  ```json
  {
    "strategies": [
      {
        "id": "string",
        "name": "string",
        "description": "string",
        "parameters": {
          "param1": "string",
          "param2": "number"
        }
      }
    ]
  }
  ```

#### 3.3.2 전략 실행
- 엔드포인트: `POST /api/v1/strategies/{strategy_id}/execute`
- 설명: 특정 전략을 실행합니다.
- 요청 본문:
  ```json
  {
    "parameters": {
      "param1": "value1",
      "param2": "value2"
    }
  }
  ```

### 3.4 백테스트 관련 API

#### 3.4.1 백테스트 실행
- 엔드포인트: `POST /api/v1/backtest`
- 설명: 전략의 백테스트를 실행합니다.
- 요청 본문:
  ```json
  {
    "strategy_id": "string",
    "start_date": "string",
    "end_date": "string",
    "parameters": {
      "param1": "value1",
      "param2": "value2"
    }
  }
  ```

#### 3.4.2 백테스트 결과 조회
- 엔드포인트: `GET /api/v1/backtest/{backtest_id}`
- 설명: 특정 백테스트의 결과를 조회합니다.

## 4. 에러 처리

### 4.1 에러 응답 형식
모든 API는 에러 발생 시 다음과 같은 형식으로 응답합니다:
```json
{
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

### 4.2 주요 에러 코드
- `400`: 잘못된 요청
- `401`: 인증 실패
- `403`: 권한 없음
- `404`: 리소스를 찾을 수 없음
- `500`: 서버 내부 오류

## 5. 웹소켓 API

### 5.1 실시간 알림
- 엔드포인트: `ws://host/api/v1/ws/notifications`
- 설명: 실시간 알림을 수신하기 위한 웹소켓 연결
- 메시지 형식:
  ```json
  {
    "type": "notification",
    "data": {
      "id": "string",
      "title": "string",
      "content": "string"
    }
  }
  ```

### 5.2 실시간 시장 데이터
- 엔드포인트: `ws://host/api/v1/ws/market-data`
- 설명: 실시간 시장 데이터를 수신하기 위한 웹소켓 연결
- 메시지 형식:
  ```json
  {
    "type": "market_data",
    "data": {
      "symbol": "string",
      "price": number,
      "volume": number,
      "timestamp": "string"
    }
  }
  ``` 