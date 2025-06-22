# 🎄 정적 → 동적 마이그레이션 가이드

## 📋 **현재 static-test 기반 구조**

### **강점 분석**
```html
✅ 완벽한 Chart.js 통합
✅ 안정적인 렌더링
✅ 즉시 로딩
✅ 모든 기능 작동
✅ 한국어 완성
✅ 크리스마스 테마
```

### **현재 아키텍처**
```
index.html (678 라인)
├── CSS (Embedded, 205 라인)
├── HTML Structure (180 라인)
└── JavaScript (293 라인)
    ├── Chart.js Functions (4개 차트)
    ├── Real-time Simulation
    ├── Button Interactions
    └── Christmas Effects
```

---

## 🔄 **마이그레이션 전략**

### **Phase 1: 모듈화 (백엔드 준비)**
현재 단일 파일을 구조화된 아키텍처로 분리

```
📁 backend/
├── 📁 api/
│   ├── auth.js
│   ├── market.js
│   ├── orders.js
│   └── portfolio.js
├── 📁 models/
│   ├── User.js
│   ├── Stock.js
│   └── Order.js
├── 📁 middleware/
│   ├── auth.js
│   └── validation.js
├── 📁 services/
│   ├── marketData.js
│   ├── trading.js
│   └── realtime.js
└── server.js

📁 frontend/ (current index.html 확장)
├── 📁 assets/
│   ├── 📁 css/
│   │   ├── dashboard.css
│   │   ├── charts.css
│   │   └── christmas.css
│   ├── 📁 js/
│   │   ├── charts.js
│   │   ├── trading.js
│   │   ├── auth.js
│   │   └── realtime.js
│   └── 📁 images/
├── index.html (simplified)
└── static-test.html (backup)
```

### **Phase 2: API 통합 포인트**
기존 가짜 데이터를 실제 API로 점진적 교체

```javascript
// 현재 (static-test 방식)
const mockData = [2580, 2595, 2610, 2625, 2640, 2655, 2670];

// 마이그레이션 단계
async function getKOSPIData() {
    try {
        const response = await fetch('/api/market/kospi');
        const realData = await response.json();
        return realData;
    } catch (error) {
        // Fallback to mock data
        console.warn('Using fallback data');
        return mockData;
    }
}
```

### **Phase 3: 실시간 WebSocket 연동**
```javascript
// 현재 (30초 간격 시뮬레이션)
setInterval(() => {
    const variation = (Math.random() - 0.5) * 100;
    updatePortfolio(currentValue + variation);
}, 30000);

// 목표 (실시간 WebSocket)
const ws = new WebSocket('wss://api.christmas-trading.com/realtime');
ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    updatePortfolio(data.portfolio);
    updateCharts(data.marketData);
};
```

---

## 🎯 **단계별 백엔드 구현**

### **Step 1: 기본 서버 설정**
```javascript
// backend/server.js
const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Static file serving (기존 index.html 유지)
app.use(express.static('../'));

// API routes
app.use('/api/auth', require('./api/auth'));
app.use('/api/market', require('./api/market'));
app.use('/api/orders', require('./api/orders'));
app.use('/api/portfolio', require('./api/portfolio'));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`🎄 Christmas Trading API running on port ${PORT}`);
});
```

### **Step 2: 시장 데이터 API**
```javascript
// backend/api/market.js
const express = require('express');
const router = express.Router();
const marketService = require('../services/marketData');

// KOSPI 데이터 (현재 차트에서 사용 중)
router.get('/kospi', async (req, res) => {
    try {
        const kospiData = await marketService.getKOSPIData();
        res.json({
            symbol: 'KOSPI',
            data: kospiData,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        // Fallback to static-test data
        res.json({
            symbol: 'KOSPI',
            data: [2580, 2595, 2610, 2625, 2640, 2655, 2670],
            timestamp: new Date().toISOString(),
            fallback: true
        });
    }
});

// Apple 주식 (현재 차트에서 사용 중)
router.get('/stock/:symbol', async (req, res) => {
    const { symbol } = req.params;
    try {
        const stockData = await marketService.getStockData(symbol);
        res.json(stockData);
    } catch (error) {
        // Fallback for AAPL
        if (symbol === 'AAPL') {
            res.json({
                symbol: 'AAPL',
                price: 150.25,
                change: 2.45,
                data: [148.50, 149.20, 150.10, 149.80, 150.25, 150.60, 150.25],
                fallback: true
            });
        }
    }
});

module.exports = router;
```

### **Step 3: 사용자 인증**
```javascript
// backend/api/auth.js
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

router.post('/register', async (req, res) => {
    const { email, password, name } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            email,
            password: hashedPassword,
            name,
            portfolio_balance: 100000.00, // $100k 시작 자금
            available_cash: 100000.00
        });
        
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                portfolio_balance: user.portfolio_balance
            }
        });
    } catch (error) {
        res.status(400).json({ success: false, error: error.message });
    }
});

router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const user = await User.findByEmail(email);
        if (!user || !await bcrypt.compare(password, user.password)) {
            return res.status(401).json({ 
                success: false, 
                error: '이메일 또는 비밀번호가 올바르지 않습니다.' 
            });
        }
        
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );
        
        res.json({
            success: true,
            token,
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                portfolio_balance: user.portfolio_balance
            }
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
```

### **Step 4: 트레이딩 엔진**
```javascript
// backend/api/orders.js
const express = require('express');
const auth = require('../middleware/auth');
const tradingService = require('../services/trading');
const router = express.Router();

// 매수/매도 주문 (현재 버튼 기능을 실제로 구현)
router.post('/place', auth, async (req, res) => {
    const { symbol, type, quantity, price } = req.body;
    const userId = req.user.userId;
    
    try {
        const order = await tradingService.placeOrder({
            userId,
            symbol,
            type, // 'buy' or 'sell'
            quantity,
            price, // 'market' or specific price
        });
        
        // 주문 성공 시 포트폴리오 업데이트
        await tradingService.updatePortfolio(userId, order);
        
        res.json({
            success: true,
            order: {
                id: order.id,
                symbol: order.symbol,
                type: order.type,
                quantity: order.quantity,
                price: order.executed_price,
                status: order.status,
                message: `${order.type === 'buy' ? '매수' : '매도'} 주문이 성공적으로 처리되었습니다.`
            }
        });
    } catch (error) {
        res.status(400).json({
            success: false,
            error: error.message
        });
    }
});

// 주문 내역 조회
router.get('/history', auth, async (req, res) => {
    const userId = req.user.userId;
    
    try {
        const orders = await tradingService.getOrderHistory(userId);
        res.json({
            success: true,
            orders
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;
```

---

## 🔄 **프론트엔드 점진적 마이그레이션**

### **1단계: JavaScript 분리**
```html
<!-- index.html (기존 embedded script를 외부 파일로) -->
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script src="/assets/js/charts.js"></script>
<script src="/assets/js/trading.js"></script>
<script src="/assets/js/auth.js"></script>
<script src="/assets/js/realtime.js"></script>
```

### **2단계: API 연동 추가**
```javascript
// assets/js/trading.js (매수 버튼 실제 구현)
async function placeOrder(symbol, type, quantity, price) {
    const token = localStorage.getItem('auth_token');
    
    try {
        const response = await fetch('/api/orders/place', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                symbol,
                type,
                quantity,
                price
            })
        });
        
        const result = await response.json();
        
        if (result.success) {
            showSuccessMessage(result.order.message);
            await updatePortfolioDisplay();
            await updateOrderHistory();
        } else {
            showErrorMessage(result.error);
        }
    } catch (error) {
        console.error('Order placement failed:', error);
        showErrorMessage('주문 처리 중 오류가 발생했습니다.');
    }
}

// 기존 버튼 이벤트 수정
document.querySelector('.btn-buy[style*="width: 100%"]')
    .addEventListener('click', async function() {
        const symbol = document.querySelector('input[value="AAPL"]').value;
        const quantity = parseInt(document.querySelector('input[value="10"]').value);
        
        this.textContent = '주문 처리 중...';
        this.style.background = '#6B7280';
        
        await placeOrder(symbol, 'buy', quantity, 'market');
    });
```

### **3단계: 실시간 데이터 연동**
```javascript
// assets/js/realtime.js
class RealTimeDataManager {
    constructor() {
        this.ws = null;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
    }
    
    connect() {
        try {
            this.ws = new WebSocket('wss://api.christmas-trading.com/realtime');
            
            this.ws.onopen = () => {
                console.log('🎄 Real-time connection established');
                this.reconnectAttempts = 0;
            };
            
            this.ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleRealTimeUpdate(data);
            };
            
            this.ws.onclose = () => {
                this.handleReconnect();
            };
            
        } catch (error) {
            console.warn('WebSocket not available, using fallback polling');
            this.startPolling();
        }
    }
    
    handleRealTimeUpdate(data) {
        if (data.type === 'market_data') {
            updateCharts(data.payload);
        } else if (data.type === 'portfolio_update') {
            updatePortfolioDisplay(data.payload);
        } else if (data.type === 'order_update') {
            updateOrderHistory();
        }
    }
    
    startPolling() {
        // Fallback to current 30-second polling
        setInterval(async () => {
            try {
                await updateMarketData();
                await updatePortfolioData();
            } catch (error) {
                console.warn('Polling update failed:', error);
            }
        }, 30000);
    }
}

// Initialize real-time connection
const rtManager = new RealTimeDataManager();
rtManager.connect();
```

---

## 🚀 **구현 순서**

### **Week 1: 백엔드 기반**
1. Express 서버 설정
2. PostgreSQL 데이터베이스 설정  
3. 기본 API 엔드포인트 구현
4. 외부 시장 데이터 API 연동

### **Week 2: 인증 및 사용자 관리**
1. JWT 인증 시스템
2. 사용자 등록/로그인 API
3. 포트폴리오 데이터 모델
4. 프론트엔드 인증 연동

### **Week 3: 트레이딩 기능**
1. 주문 처리 시스템
2. 포트폴리오 계산 로직
3. 실제 매수/매도 구현
4. 기존 버튼을 실제 기능으로 연결

### **Week 4: 실시간 기능**
1. WebSocket 서버 구현
2. 실시간 차트 업데이트
3. 포트폴리오 실시간 반영
4. 성능 최적화

---

## 📋 **마이그레이션 체크리스트**

### **백엔드 Ready**
- [ ] Express 서버 설정
- [ ] 데이터베이스 스키마 생성
- [ ] 시장 데이터 API 연동
- [ ] 사용자 인증 구현
- [ ] 주문 처리 시스템

### **프론트엔드 연동**  
- [ ] JavaScript 모듈화
- [ ] API 호출 함수 구현
- [ ] 인증 상태 관리
- [ ] 실시간 데이터 연동
- [ ] 에러 처리 개선

### **기능 검증**
- [ ] 회원가입/로그인 작동
- [ ] 실제 주문 처리 작동
- [ ] 포트폴리오 실시간 업데이트
- [ ] 모든 차트 정상 동작
- [ ] 모바일 반응형 유지

---

**🎯 목표: 현재의 완벽한 UI/UX를 유지하면서 실제 트레이딩 기능을 구현**

정적 기반의 안정성을 바탕으로 점진적으로 동적 기능을 추가하여 완전한 트레이딩 플랫폼으로 발전시키겠습니다!