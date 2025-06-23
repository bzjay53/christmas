# 🎄 Christmas Trading - 서버 기반 백엔드 아키텍처

## 📋 **현재 환경 및 요구사항**

### **현재 인프라**
```
✅ Ubuntu Linux 서버 (24시간 가동)
✅ Docker 지원
✅ Netlify 프론트엔드 호스팅
✅ 비용 최소화 우선
```

### **선택된 기술 스택**
```
Backend: Node.js + Express (Docker)
Database: Firebase Firestore (90일 무료)
Cache: Redis (Docker 컨테이너)
Market Data: Alpha Vantage (무료 tier)
Auth: Firebase Authentication
Frontend: Netlify (현재 유지)
```

---

## 🏗️ **아키텍처 설계**

### **전체 시스템 구조**
```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Netlify       │    │   Ubuntu Server  │    │   Firebase      │
│  (Frontend)     │◄──►│   (Backend)      │◄──►│  (Database)     │
│                 │    │                  │    │                 │
│ - index.html    │    │ Docker Container │    │ - Firestore     │
│ - Chart.js      │    │ - Node.js API    │    │ - Auth          │
│ - Christmas UI  │    │ - Redis Cache    │    │ - Real-time     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                       ┌──────────────────┐
                       │  External APIs   │
                       │ - Alpha Vantage  │
                       │ - Market Data    │
                       └──────────────────┘
```

### **Docker 컨테이너 구성**
```
📁 christmas-trading-backend/
├── 🐳 docker-compose.yml
├── 🐳 Dockerfile
├── 📁 src/
│   ├── server.js
│   ├── 📁 routes/
│   ├── 📁 services/
│   ├── 📁 middleware/
│   └── 📁 config/
├── package.json
├── .env.example
└── README.md
```

---

## 🛠️ **상세 구현 계획**

### **1. Firebase 설정 (무료 90일)**
```javascript
// Firebase 초기 설정
const admin = require('firebase-admin');
const serviceAccount = require('./firebase-service-account.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: 'https://christmas-trading.firebaseio.com'
});

const db = admin.firestore();
const auth = admin.auth();
```

#### **Firestore 데이터 구조**
```
📁 users/
├── {userId}/
│   ├── email: string
│   ├── displayName: string
│   ├── portfolioBalance: number
│   ├── availableCash: number
│   └── createdAt: timestamp

📁 portfolios/
├── {userId}/
│   └── holdings/
│       ├── {stockSymbol}/
│       │   ├── quantity: number
│       │   ├── avgCost: number
│       │   └── lastUpdated: timestamp

📁 orders/
├── {orderId}/
│   ├── userId: string
│   ├── symbol: string
│   ├── type: 'buy' | 'sell'
│   ├── quantity: number
│   ├── price: number
│   ├── status: 'pending' | 'executed' | 'cancelled'
│   └── timestamp: timestamp

📁 marketData/
├── {symbol}/
│   ├── currentPrice: number
│   ├── change: number
│   ├── changePercent: number
│   └── lastUpdated: timestamp
```

### **2. Docker Compose 설정**
```yaml
# docker-compose.yml
version: '3.8'

services:
  christmas-trading-api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PORT=3000
      - FIREBASE_PROJECT_ID=${FIREBASE_PROJECT_ID}
      - ALPHA_VANTAGE_API_KEY=${ALPHA_VANTAGE_API_KEY}
      - REDIS_URL=redis://redis:6379
    depends_on:
      - redis
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped
    volumes:
      - redis_data:/data

volumes:
  redis_data:
```

### **3. Node.js 백엔드 구조**
```javascript
// src/server.js
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const app = express();

// 미들웨어
app.use(helmet());
app.use(cors({
  origin: 'https://christmas-protocol.netlify.app',
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15분
  max: 100 // IP당 최대 100 요청
});
app.use('/api/', limiter);

app.use(express.json());

// 라우트
app.use('/api/auth', require('./routes/auth'));
app.use('/api/market', require('./routes/market'));
app.use('/api/trading', require('./routes/trading'));
app.use('/api/portfolio', require('./routes/portfolio'));

// 헬스체크
app.get('/health', (req, res) => {
  res.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    service: 'Christmas Trading API'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🎄 Christmas Trading API running on port ${PORT}`);
});
```

### **4. 주요 API 엔드포인트**

#### **시장 데이터 API**
```javascript
// src/routes/market.js
const express = require('express');
const marketService = require('../services/marketService');
const cache = require('../middleware/cache');

const router = express.Router();

// KOSPI 데이터 (현재 차트에서 사용)
router.get('/kospi', cache(300), async (req, res) => {
  try {
    const kospiData = await marketService.getKOSPIData();
    res.json({
      symbol: 'KOSPI',
      data: kospiData,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    // Fallback to mock data
    res.json({
      symbol: 'KOSPI',
      data: [2580, 2595, 2610, 2625, 2640, 2655, 2670],
      timestamp: new Date().toISOString(),
      fallback: true
    });
  }
});

// 개별 주식 데이터
router.get('/stock/:symbol', cache(60), async (req, res) => {
  try {
    const stockData = await marketService.getStockData(req.params.symbol);
    res.json(stockData);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

#### **인증 API**
```javascript
// src/routes/auth.js
const express = require('express');
const admin = require('firebase-admin');
const authMiddleware = require('../middleware/auth');

const router = express.Router();

// Firebase 토큰 검증
router.post('/verify', async (req, res) => {
  try {
    const { idToken } = req.body;
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    
    // 사용자 정보 Firestore에 저장/업데이트
    const userRef = admin.firestore().collection('users').doc(decodedToken.uid);
    await userRef.set({
      email: decodedToken.email,
      displayName: decodedToken.name || 'Christmas Trader',
      lastLogin: admin.firestore.FieldValue.serverTimestamp()
    }, { merge: true });

    res.json({
      success: true,
      uid: decodedToken.uid,
      email: decodedToken.email
    });
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
});

// 사용자 프로필 조회
router.get('/profile', authMiddleware, async (req, res) => {
  try {
    const userDoc = await admin.firestore()
      .collection('users')
      .doc(req.user.uid)
      .get();
    
    if (!userDoc.exists) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(userDoc.data());
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
```

---

## 🚀 **배포 및 실행 계획**

### **서버 환경 준비**
```bash
# 1. Docker 및 Docker Compose 설치 확인
docker --version
docker-compose --version

# 2. 프로젝트 클론 및 설정
cd /opt
git clone <repository-url> christmas-trading-backend
cd christmas-trading-backend

# 3. 환경 변수 설정
cp .env.example .env
nano .env

# 4. Firebase 서비스 계정 키 설정
# Firebase Console에서 서비스 계정 키 다운로드
# firebase-service-account.json 파일 배치

# 5. Docker 빌드 및 실행
docker-compose up -d

# 6. 로그 확인
docker-compose logs -f
```

### **Netlify 프론트엔드 연동**
```javascript
// 기존 index.html에 추가할 API 연동 코드
const API_BASE_URL = 'http://YOUR_SERVER_IP:3000/api';

// 시장 데이터 실제 API 호출로 변경
async function getKOSPIData() {
    try {
        const response = await fetch(`${API_BASE_URL}/market/kospi`);
        const data = await response.json();
        return data.data;
    } catch (error) {
        console.warn('API 호출 실패, 모의 데이터 사용');
        return [2580, 2595, 2610, 2625, 2640, 2655, 2670];
    }
}

// 차트 생성 함수 수정
async function createMajorIndicesChart() {
    const ctx = document.getElementById('majorIndicesChart').getContext('2d');
    
    // 기존 차트가 있으면 삭제
    if (chartInstances.majorIndices) {
        chartInstances.majorIndices.destroy();
    }
    
    // 실제 데이터 가져오기
    const kospiData = await getKOSPIData();
    
    const labels = ['12/18', '12/19', '12/20', '12/21', '12/22', '12/23', '12/24'];
    
    chartInstances.majorIndices = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'KOSPI',
                data: kospiData,
                borderColor: '#10B981',
                backgroundColor: 'rgba(16, 185, 129, 0.1)',
                tension: 0.4
            }]
        },
        // ... 기존 옵션
    });
}
```

---

## 💰 **비용 분석**

### **현재 설정 (90일 무료)**
```
Ubuntu 서버: 기존 서버 활용 ($0)
Docker: 무료 ($0)
Firebase: 90일 무료 tier ($0)
Alpha Vantage: 무료 tier ($0)
Netlify: 무료 tier ($0)

총 비용: $0/월 (90일간)
```

### **90일 후 예상 비용**
```
Ubuntu 서버: 기존 서버 ($0)
Firebase: $25/월 (Blaze plan)
Alpha Vantage: 무료 tier 유지 가능 ($0)
도메인 (선택): $10/년

총 예상 비용: $25/월
```

---

## 📋 **구현 순서**

### **Week 1: 기반 구축**
1. ✅ 포트폴리오 차트 스크롤 문제 해결
2. 🎯 Firebase 프로젝트 설정
3. 🎯 Docker 백엔드 환경 구축
4. 🎯 기본 API 엔드포인트 구현

### **Week 2: 데이터 연동**
1. 🎯 Alpha Vantage API 통합
2. 🎯 실시간 시장 데이터 파이프라인
3. 🎯 Redis 캐싱 시스템
4. 🎯 프론트엔드와 API 연결

### **Week 3: 사용자 시스템**
1. 🎯 Firebase Authentication 구현
2. 🎯 사용자 등록/로그인 UI 추가
3. 🎯 포트폴리오 관리 API
4. 🎯 실제 거래 기능 구현

### **Week 4: 최적화 및 완성**
1. 🎯 실시간 WebSocket 연동
2. 🎯 성능 최적화
3. 🎯 보안 강화
4. 🎯 모니터링 시스템 구축

---

**🚀 다음 단계: Firebase 프로젝트 설정 및 Docker 백엔드 구축**

현재 서버 환경을 최대한 활용하여 비용 효율적인 백엔드를 구축하겠습니다!