# ⚡ 성능 최적화 가이드 (Christmas Trading)

## 📋 개요

### 🎯 성능 목표
- **페이지 로딩 시간**: 3초 이하
- **API 응답 시간**: 500ms 이하
- **First Contentful Paint**: 1.5초 이하
- **Time to Interactive**: 3초 이하
- **Lighthouse 점수**: 90점 이상

### 📊 현재 성능 지표
```
Frontend (Netlify):
- 빌드 시간: 2분
- 배포 시간: 1분
- 번들 크기: ~2MB

Backend (Docker):
- 시작 시간: 30초
- 메모리 사용량: 512MB
- CPU 사용률: 15%
```

## 🎨 프론트엔드 최적화

### 📦 번들 최적화
```javascript
// vite.config.js - 번들 분할 설정
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom'],
          ui: ['@mui/material', '@mui/icons-material'],
          charts: ['recharts', 'chart.js'],
          utils: ['lodash', 'date-fns']
        }
      }
    },
    chunkSizeWarningLimit: 1000
  }
});
```

### 🖼️ 이미지 최적화
```javascript
// 이미지 지연 로딩 및 최적화
const OptimizedImage = ({ src, alt, ...props }) => {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      decoding="async"
      {...props}
      style={{
        ...props.style,
        aspectRatio: 'auto'
      }}
    />
  );
};

// WebP 형식 지원
const getOptimizedImageSrc = (src) => {
  const supportsWebP = document.createElement('canvas')
    .toDataURL('image/webp').indexOf('data:image/webp') === 0;
  
  return supportsWebP ? src.replace(/\.(jpg|jpeg|png)$/, '.webp') : src;
};
```

### 🔄 코드 분할 (Code Splitting)
```javascript
// React.lazy를 사용한 컴포넌트 지연 로딩
import { lazy, Suspense } from 'react';

const Dashboard = lazy(() => import('./components/Dashboard'));
const Analytics = lazy(() => import('./components/Analytics'));
const Portfolio = lazy(() => import('./components/Portfolio'));

const App = () => {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <Routes>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/analytics" element={<Analytics />} />
        <Route path="/portfolio" element={<Portfolio />} />
      </Routes>
    </Suspense>
  );
};
```

### 💾 캐싱 전략
```javascript
// Service Worker 캐싱
const CACHE_NAME = 'christmas-trading-v1';
const urlsToCache = [
  '/',
  '/static/css/main.css',
  '/static/js/main.js',
  '/manifest.json'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

// React Query 캐싱 설정
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5분
      cacheTime: 10 * 60 * 1000, // 10분
      refetchOnWindowFocus: false,
      retry: 3
    }
  }
});
```

### 🎯 상태 관리 최적화
```javascript
// Zustand 상태 분할
const useAuthStore = create((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => set({ user: null })
}));

const useTradingStore = create((set) => ({
  signals: [],
  portfolio: {},
  setSignals: (signals) => set({ signals }),
  setPortfolio: (portfolio) => set({ portfolio })
}));

// React.memo를 사용한 불필요한 리렌더링 방지
const TradingSignal = React.memo(({ signal }) => {
  return (
    <div className="trading-signal">
      <h3>{signal.symbol}</h3>
      <p>{signal.action}</p>
    </div>
  );
});
```

## 🖥️ 백엔드 최적화

### 🗄️ 데이터베이스 최적화
```sql
-- 인덱스 최적화
CREATE INDEX CONCURRENTLY idx_trading_signals_user_created 
ON trading_signals(user_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_portfolio_user_symbol 
ON portfolio(user_id, symbol);

-- 쿼리 최적화 (N+1 문제 해결)
SELECT 
  ts.*,
  u.email,
  p.current_value
FROM trading_signals ts
JOIN users u ON ts.user_id = u.id
LEFT JOIN portfolio p ON ts.user_id = p.user_id AND ts.symbol = p.symbol
WHERE ts.user_id = $1
ORDER BY ts.created_at DESC
LIMIT 50;
```

### 🔄 API 최적화
```javascript
// 응답 압축
const compression = require('compression');
app.use(compression());

// 캐싱 헤더 설정
app.use((req, res, next) => {
  if (req.method === 'GET') {
    res.set('Cache-Control', 'public, max-age=300'); // 5분 캐시
  }
  next();
});

// 데이터베이스 연결 풀링
const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  max: 20, // 최대 연결 수
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

### 📊 비동기 처리 최적화
```javascript
// 병렬 처리를 통한 성능 향상
const getUserDashboardData = async (userId) => {
  const [user, signals, portfolio, analytics] = await Promise.all([
    getUserById(userId),
    getTradingSignals(userId),
    getPortfolio(userId),
    getAnalytics(userId)
  ]);

  return {
    user,
    signals,
    portfolio,
    analytics
  };
};

// 스트리밍 응답 (대용량 데이터)
app.get('/api/export/trading-history', async (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Transfer-Encoding', 'chunked');
  
  const stream = getTradingHistoryStream(req.user.id);
  stream.pipe(res);
});
```

## 🐳 Docker 최적화

### 📦 이미지 최적화
```dockerfile
# 멀티 스테이지 빌드
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 8000
CMD ["node", "server.js"]

# .dockerignore 최적화
node_modules
npm-debug.log
.git
.gitignore
README.md
.env
.nyc_output
coverage
.nyc_output
```

### 🔧 컨테이너 리소스 최적화
```yaml
# docker-compose.yml
version: '3.8'
services:
  backend:
    image: christmas-backend
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## 🌐 네트워크 최적화

### 🚀 CDN 활용
```javascript
// Netlify CDN 최적화 설정
// netlify.toml
[build]
  publish = "dist"
  command = "npm run build"

[[headers]]
  for = "/*"
  [headers.values]
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Cache-Control = "public, max-age=31536000"

[[headers]]
  for = "*.html"
  [headers.values]
    Cache-Control = "public, max-age=0, must-revalidate"
```

### 🔄 HTTP/2 및 압축
```javascript
// Express 서버 최적화
const express = require('express');
const compression = require('compression');
const helmet = require('helmet');

const app = express();

// Gzip 압축
app.use(compression({
  level: 6,
  threshold: 1024,
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  }
}));

// 보안 헤더 (성능에도 영향)
app.use(helmet({
  contentSecurityPolicy: false, // 개발 중에는 비활성화
  crossOriginEmbedderPolicy: false
}));
```

## 📊 모니터링 및 측정

### 🔍 성능 모니터링 도구
```javascript
// Web Vitals 측정
import { getCLS, getFID, getFCP, getLCP, getTTFB } from 'web-vitals';

const sendToAnalytics = (metric) => {
  // Google Analytics 또는 다른 분석 도구로 전송
  gtag('event', metric.name, {
    event_category: 'Web Vitals',
    value: Math.round(metric.value),
    event_label: metric.id,
    non_interaction: true,
  });
};

getCLS(sendToAnalytics);
getFID(sendToAnalytics);
getFCP(sendToAnalytics);
getLCP(sendToAnalytics);
getTTFB(sendToAnalytics);
```

### 📈 백엔드 성능 모니터링
```javascript
// Express 성능 미들웨어
const responseTime = require('response-time');

app.use(responseTime((req, res, time) => {
  console.log(`${req.method} ${req.url} - ${time}ms`);
  
  // 느린 요청 로깅
  if (time > 1000) {
    console.warn(`Slow request: ${req.method} ${req.url} - ${time}ms`);
  }
}));

// 메모리 사용량 모니터링
setInterval(() => {
  const memUsage = process.memoryUsage();
  console.log('Memory usage:', {
    rss: Math.round(memUsage.rss / 1024 / 1024) + ' MB',
    heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024) + ' MB',
    heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024) + ' MB'
  });
}, 60000); // 1분마다
```

## 🧪 성능 테스트

### 🔧 Lighthouse CI 설정
```yaml
# .github/workflows/lighthouse.yml
name: Lighthouse CI
on: [push]
jobs:
  lighthouse:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Audit URLs using Lighthouse CI
        uses: treosh/lighthouse-ci-action@v9
        with:
          urls: |
            https://christmas-protocol.netlify.app/
            https://christmas-protocol.netlify.app/dashboard
          uploadArtifacts: true
          temporaryPublicStorage: true
```

### 📊 로드 테스트 (K6)
```javascript
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // 2분 동안 100명까지 증가
    { duration: '5m', target: 100 }, // 5분 동안 100명 유지
    { duration: '2m', target: 200 }, // 2분 동안 200명까지 증가
    { duration: '5m', target: 200 }, // 5분 동안 200명 유지
    { duration: '2m', target: 0 },   // 2분 동안 0명까지 감소
  ],
};

export default function () {
  let response = http.get('http://31.220.83.213:8000/api/health');
  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  sleep(1);
}
```

## 📋 성능 최적화 체크리스트

### ✅ 프론트엔드 최적화
- [ ] 번들 크기 분석 및 최적화
- [ ] 코드 분할 (Route-based, Component-based)
- [ ] 이미지 최적화 (WebP, 지연 로딩)
- [ ] 캐싱 전략 구현
- [ ] Service Worker 설정
- [ ] Tree Shaking 적용
- [ ] CSS 최적화 (Critical CSS)

### ✅ 백엔드 최적화
- [ ] 데이터베이스 인덱스 최적화
- [ ] 쿼리 성능 튜닝
- [ ] API 응답 캐싱
- [ ] 연결 풀링 설정
- [ ] 압축 미들웨어 적용
- [ ] 비동기 처리 최적화

### ✅ 인프라 최적화
- [ ] CDN 설정
- [ ] HTTP/2 활성화
- [ ] Gzip 압축 설정
- [ ] 캐시 헤더 최적화
- [ ] Docker 이미지 최적화
- [ ] 리소스 제한 설정

## 🎯 성능 목표 및 KPI

### 📊 Core Web Vitals
- **LCP (Largest Contentful Paint)**: < 2.5초
- **FID (First Input Delay)**: < 100ms
- **CLS (Cumulative Layout Shift)**: < 0.1

### 🚀 추가 성능 지표
- **TTFB (Time to First Byte)**: < 200ms
- **FCP (First Contentful Paint)**: < 1.8초
- **TTI (Time to Interactive)**: < 3.8초
- **Speed Index**: < 3.4초

### 📈 비즈니스 지표
- **페이지 이탈률**: < 40%
- **세션 지속 시간**: > 3분
- **API 에러율**: < 1%
- **서버 가동률**: > 99.9%

## 🔮 향후 최적화 계획

### Phase 1: 기본 최적화 (1주일)
- 번들 분할 및 코드 스플리팅
- 이미지 최적화 및 지연 로딩
- 기본 캐싱 전략 구현

### Phase 2: 고급 최적화 (2주일)
- Service Worker 구현
- 데이터베이스 쿼리 최적화
- CDN 및 압축 설정

### Phase 3: 모니터링 및 자동화 (1개월)
- 성능 모니터링 시스템 구축
- 자동화된 성능 테스트
- 지속적인 성능 개선

---
**📅 작성일**: 2025-05-27 01:30  
**👤 작성자**: PM AI Assistant  
**🔄 버전**: v1.0  
**📊 상태**: 성능 최적화 계획 수립 완료 