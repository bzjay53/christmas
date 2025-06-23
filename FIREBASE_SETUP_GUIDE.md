# 🔥 Firebase 설정 가이드 - Christmas Trading Platform

## 📋 개요
안전하고 비용 효율적인 Firebase 프로젝트 설정을 위한 단계별 가이드

## 🎯 Phase 1: Firebase 프로젝트 생성

### Step 1: Firebase Console 접속
1. https://console.firebase.google.com 접속
2. Google 계정으로 로그인
3. "프로젝트 추가" 클릭

### Step 2: 프로젝트 기본 설정
```
프로젝트 이름: christmas-trading-platform
프로젝트 ID: christmas-trading-[자동생성ID] 
리전: asia-northeast3 (서울)
```

### Step 3: 기본 설정 확인
- [ ] Google Analytics 비활성화 (개발 단계에서는 불필요)
- [ ] 과금 계정 연결하지 않기 (무료 tier 사용)

## 🗄️ Phase 2: Firestore 데이터베이스 설정

### Step 1: Firestore 활성화
1. Firebase Console > "Firestore Database" 클릭
2. "데이터베이스 만들기" 선택
3. **중요**: "테스트 모드로 시작" 선택 (보안 규칙은 나중에 설정)
4. 위치: `asia-northeast3 (Seoul)` 선택

### Step 2: 초기 컬렉션 구조 생성
```
📁 users/ (사용자 정보)
📁 portfolios/ (포트폴리오 데이터)  
📁 orders/ (거래 주문)
📁 marketData/ (시장 데이터 캐시)
```

## 🔐 Phase 3: Authentication 설정

### Step 1: Authentication 활성화
1. Firebase Console > "Authentication" 클릭
2. "시작하기" 클릭
3. "Sign-in method" 탭 선택

### Step 2: 로그인 제공업체 설정
- [ ] **이메일/비밀번호**: 활성화
- [ ] **Google**: 활성화 (선택사항)
- [ ] **익명**: 개발용으로 임시 활성화

### Step 3: 승인된 도메인 추가
```
localhost (개발용)
christmas-protocol.netlify.app (프로덕션)
```

## 🔑 Phase 4: 서비스 계정 키 생성

### Step 1: 서비스 계정 생성
1. Firebase Console > "프로젝트 설정" (톱니바퀴 아이콘)
2. "서비스 계정" 탭 선택
3. "새 비공개 키 생성" 클릭

### Step 2: 키 파일 보안 관리
```bash
# 키 파일을 안전한 위치에 저장
mv ~/Downloads/christmas-trading-*.json /root/dev/christmas-trading/backend/config/firebase-service-account.json

# 권한 설정 (읽기 전용)
chmod 600 /root/dev/christmas-trading/backend/config/firebase-service-account.json
```

### Step 3: .gitignore 업데이트
```
# Firebase 키 파일 제외
backend/config/firebase-service-account.json
backend/.env
```

## 🛡️ Phase 5: 보안 규칙 설정

### Firestore 보안 규칙
```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 사용자는 자신의 데이터만 액세스
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 포트폴리오는 소유자만 액세스
    match /portfolios/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    
    // 주문은 소유자만 액세스
    match /orders/{orderId} {
      allow read, write: if request.auth != null && resource.data.userId == request.auth.uid;
    }
    
    // 시장 데이터는 인증된 사용자 모두 읽기 가능
    match /marketData/{symbol} {
      allow read: if request.auth != null;
      allow write: if false; // 서버에서만 업데이트
    }
  }
}
```

## 💰 Phase 6: 비용 모니터링 설정

### Firestore 사용량 제한 설정
```
일일 읽기: 50,000회 (무료 한도)
일일 쓰기: 20,000회 (무료 한도)
일일 삭제: 20,000회 (무료 한도)
```

### 알림 설정
- [ ] 무료 한도 80% 달성 시 이메일 알림
- [ ] 비용 발생 시 즉시 알림

## 🔧 Phase 7: 환경 변수 설정

### backend/.env 파일 생성
```env
# Firebase 설정
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_PRIVATE_KEY_ID=your-private-key-id
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com
FIREBASE_CLIENT_ID=your-client-id
FIREBASE_AUTH_URI=https://accounts.google.com/o/oauth2/auth
FIREBASE_TOKEN_URI=https://oauth2.googleapis.com/token

# API 키
ALPHA_VANTAGE_API_KEY=your-alpha-vantage-key

# 서버 설정
NODE_ENV=development
PORT=3000
REDIS_URL=redis://localhost:6379

# CORS 설정
CORS_ORIGIN=http://localhost:5173,https://christmas-protocol.netlify.app
```

## ✅ Phase 8: 연결 테스트

### 백엔드 연결 테스트
```bash
cd /root/dev/christmas-trading/backend
npm install
npm run test-firebase-connection
```

### 프론트엔드 연결 테스트
```javascript
// 간단한 연결 테스트 코드
const testFirebaseConnection = async () => {
  try {
    const response = await fetch('/api/health');
    console.log('Backend connection:', response.status);
  } catch (error) {
    console.error('Connection failed:', error);
  }
};
```

## 🚨 주의사항

### 보안 체크리스트
- [ ] 서비스 계정 키 파일이 .gitignore에 포함됨
- [ ] 환경 변수가 소스 코드에 하드코딩되지 않음
- [ ] Firestore 보안 규칙이 적절히 설정됨
- [ ] API 키가 외부에 노출되지 않음

### 비용 관리 체크리스트
- [ ] 무료 tier 한도 모니터링 설정
- [ ] 불필요한 서비스 비활성화
- [ ] 개발 완료 후 테스트 데이터 정리

## 📝 다음 단계
1. Firebase 프로젝트 생성 및 설정 완료
2. 백엔드 Docker 컨테이너 실행
3. API 엔드포인트 테스트
4. 프론트엔드 연동 테스트
5. 실제 데이터 연동 및 배포

---
**⚠️ 중요**: 각 단계를 신중히 진행하고, 설정 완료 후 반드시 테스트를 수행하세요.