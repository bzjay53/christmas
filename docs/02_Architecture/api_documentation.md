# Christmas Trading API 문서

## 📋 문서 정보
- **작성일**: 2025-05-26
- **버전**: 1.0
- **Base URL**: http://31.220.83.213/api
- **인증 방식**: JWT Bearer Token

## 🔐 인증 시스템

### 인증 플로우
1. 사용자 회원가입/로그인 → JWT 토큰 발급
2. API 요청 시 `Authorization: Bearer <token>` 헤더 포함
3. 서버에서 토큰 검증 후 요청 처리

### 토큰 형식
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 📚 API 엔드포인트

### 🔑 인증 관련 API

#### 1. 회원가입
```http
POST /api/auth/signup
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "홍",
  "lastName": "길동",
  "username": "honggildong",
  "phone": "010-1234-5678"
}
```

**응답 (성공)**
```json
{
  "success": true,
  "message": "회원가입이 완료되었습니다.",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "홍",
      "lastName": "길동",
      "username": "honggildong",
      "tier": "basic",
      "referralCode": "ABC12345",
      "createdAt": "2025-05-26T09:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**응답 (실패)**
```json
{
  "success": false,
  "message": "이미 존재하는 이메일입니다.",
  "error": "EMAIL_ALREADY_EXISTS"
}
```

#### 2. 로그인
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**응답 (성공)**
```json
{
  "success": true,
  "message": "로그인 성공",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "홍",
      "lastName": "길동",
      "tier": "basic",
      "lastLogin": "2025-05-26T09:30:00Z"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

#### 3. 사용자 정보 조회
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**응답**
```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "firstName": "홍",
      "lastName": "길동",
      "username": "honggildong",
      "tier": "basic",
      "phone": "010-1234-5678",
      "referralCode": "ABC12345",
      "isVerified": false,
      "createdAt": "2025-05-26T09:30:00Z"
    }
  }
}
```

#### 4. 로그아웃
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**응답**
```json
{
  "success": true,
  "message": "로그아웃 되었습니다."
}
```

### 👤 사용자 관리 API

#### 1. 프로필 업데이트
```http
PUT /api/users/profile
Authorization: Bearer <token>
Content-Type: application/json

{
  "firstName": "김",
  "lastName": "철수",
  "phone": "010-9876-5432"
}
```

#### 2. 비밀번호 변경
```http
PUT /api/users/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "currentPassword": "oldpassword",
  "newPassword": "newpassword123"
}
```

### 🎫 쿠폰 관리 API

#### 1. 사용 가능한 쿠폰 목록
```http
GET /api/coupons/available
Authorization: Bearer <token>
```

**응답**
```json
{
  "success": true,
  "data": {
    "coupons": [
      {
        "id": "uuid",
        "code": "WELCOME10",
        "name": "신규 가입 10% 할인",
        "description": "신규 회원 가입 시 10% 할인 쿠폰",
        "discountType": "percentage",
        "discountValue": 10.00,
        "minOrderAmount": 0,
        "validFrom": "2025-05-26T00:00:00Z",
        "validUntil": "2026-05-26T23:59:59Z"
      }
    ]
  }
}
```

#### 2. 쿠폰 사용
```http
POST /api/coupons/use
Authorization: Bearer <token>
Content-Type: application/json

{
  "couponCode": "WELCOME10",
  "orderId": "ORDER123",
  "orderAmount": 50000
}
```

### 🔗 리퍼럴 시스템 API

#### 1. 내 리퍼럴 코드 조회
```http
GET /api/referrals/my-code
Authorization: Bearer <token>
```

**응답**
```json
{
  "success": true,
  "data": {
    "referralCode": "ABC12345",
    "usageCount": 5,
    "totalRewards": 25000
  }
}
```

#### 2. 리퍼럴 보상 내역
```http
GET /api/referrals/rewards
Authorization: Bearer <token>
```

### 📈 거래 관련 API

#### 1. 주문 생성
```http
POST /api/trading/orders
Authorization: Bearer <token>
Content-Type: application/json

{
  "stockCode": "005930",
  "stockName": "삼성전자",
  "orderType": "buy",
  "quantity": 10,
  "price": 75000
}
```

#### 2. 주문 내역 조회
```http
GET /api/trading/orders?page=1&limit=20
Authorization: Bearer <token>
```

#### 3. 주문 취소
```http
DELETE /api/trading/orders/:orderId
Authorization: Bearer <token>
```

### 🔔 알림 관련 API

#### 1. 텔레그램 봇 연동
```http
POST /api/telegram/connect
Authorization: Bearer <token>
Content-Type: application/json

{
  "telegramUserId": "123456789",
  "chatId": "-987654321"
}
```

## 🚨 에러 코드

### 인증 관련 에러
- `AUTH_TOKEN_MISSING`: 인증 토큰이 없음
- `AUTH_TOKEN_INVALID`: 유효하지 않은 토큰
- `AUTH_TOKEN_EXPIRED`: 만료된 토큰
- `AUTH_UNAUTHORIZED`: 권한 없음

### 사용자 관련 에러
- `USER_NOT_FOUND`: 사용자를 찾을 수 없음
- `EMAIL_ALREADY_EXISTS`: 이미 존재하는 이메일
- `USERNAME_ALREADY_EXISTS`: 이미 존재하는 사용자명
- `INVALID_CREDENTIALS`: 잘못된 로그인 정보

### 쿠폰 관련 에러
- `COUPON_NOT_FOUND`: 쿠폰을 찾을 수 없음
- `COUPON_EXPIRED`: 만료된 쿠폰
- `COUPON_ALREADY_USED`: 이미 사용된 쿠폰
- `COUPON_USAGE_LIMIT_EXCEEDED`: 쿠폰 사용 한도 초과

### 거래 관련 에러
- `INVALID_STOCK_CODE`: 유효하지 않은 종목 코드
- `INSUFFICIENT_BALANCE`: 잔액 부족
- `ORDER_NOT_FOUND`: 주문을 찾을 수 없음
- `ORDER_ALREADY_EXECUTED`: 이미 체결된 주문

## 📊 응답 형식

### 성공 응답
```json
{
  "success": true,
  "message": "요청이 성공적으로 처리되었습니다.",
  "data": {
    // 응답 데이터
  }
}
```

### 실패 응답
```json
{
  "success": false,
  "message": "에러 메시지",
  "error": "ERROR_CODE",
  "details": {
    // 추가 에러 정보
  }
}
```

## 🔧 요청 헤더

### 필수 헤더
```http
Content-Type: application/json
Authorization: Bearer <token>  # 인증이 필요한 API만
```

### 선택적 헤더
```http
X-Request-ID: unique-request-id  # 요청 추적용
User-Agent: ChristmasTrading/1.0  # 클라이언트 정보
```

## 📈 페이지네이션

### 요청 파라미터
```http
GET /api/endpoint?page=1&limit=20&sort=createdAt&order=desc
```

### 응답 형식
```json
{
  "success": true,
  "data": {
    "items": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalItems": 100,
      "itemsPerPage": 20,
      "hasNextPage": true,
      "hasPrevPage": false
    }
  }
}
```

## 🔍 필터링 및 정렬

### 필터링 예시
```http
GET /api/trading/orders?status=executed&stockCode=005930&startDate=2025-05-01&endDate=2025-05-31
```

### 정렬 예시
```http
GET /api/trading/orders?sort=createdAt&order=desc
```

## 🚀 API 테스트 예시

### cURL 예시
```bash
# 회원가입
curl -X POST http://31.220.83.213/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "firstName": "테스트",
    "lastName": "사용자"
  }'

# 로그인
curl -X POST http://31.220.83.213/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'

# 사용자 정보 조회
curl -X GET http://31.220.83.213/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

### JavaScript 예시
```javascript
// 회원가입
const signupResponse = await fetch('http://31.220.83.213/api/auth/signup', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123',
    firstName: '테스트',
    lastName: '사용자'
  })
});

const signupData = await signupResponse.json();

// 로그인
const loginResponse = await fetch('http://31.220.83.213/api/auth/login', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    email: 'test@example.com',
    password: 'password123'
  })
});

const loginData = await loginResponse.json();
const token = loginData.data.token;

// 인증이 필요한 API 호출
const userResponse = await fetch('http://31.220.83.213/api/auth/me', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
});
```

## 🔄 API 버전 관리

### 현재 버전
- **v1**: 현재 사용 중인 버전
- **Base URL**: `/api/v1` (향후 버전 관리를 위해 예약)

### 버전 업그레이드 정책
- 하위 호환성 유지
- 주요 변경사항은 새 버전으로 분리
- 구 버전은 최소 6개월 지원 