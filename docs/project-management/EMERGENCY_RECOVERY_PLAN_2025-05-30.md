# 🚨 긴급 복구 실행 계획서
**프로젝트**: Christmas Trading System  
**날짜**: 2025-05-30 23:05 KST  
**상황**: Mixed Content API 연결 장애  
**목표**: 30분 내 서비스 정상화  

## 🎯 **실행 전략 개요**

### **전략 A: 백엔드 CORS 우회 (즉시 실행)**
- **소요시간**: 10분
- **성공확률**: 높음 (90%)
- **리스크**: 낮음

### **전략 B: Netlify Functions 재구축 (병렬 실행)**  
- **소요시간**: 15분
- **성공확률**: 중간 (70%)
- **리스크**: 중간

### **전략 C: 임시 프록시 서버 (백업)**
- **소요시간**: 20분  
- **성공확률**: 높음 (95%)
- **리스크**: 낮음

## 🚀 **Phase 1: 백엔드 CORS 긴급 패치**

### **1.1 백엔드 Docker 컨테이너 접속 (Dry Run)**
```bash
# DRY RUN: 명령어 확인
echo "=== Docker 컨테이너 상태 확인 ==="
docker ps | grep christmas
echo "=== Express.js CORS 설정 파일 위치 확인 ==="
docker exec -it christmas_backend ls -la /app/src/middleware/
```

### **1.2 CORS 설정 업데이트 스크립트**
```javascript
// 백엔드 수정 내용 (app.js 또는 middleware/cors.js)
app.use(cors({
  origin: [
    'https://christmas-protocol.netlify.app',
    'http://localhost:3000',
    'https://*.netlify.app'
  ],
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 추가: Mixed Content 우회 헤더
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'https://christmas-protocol.netlify.app');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('X-Content-Type-Options', 'nosniff');
  next();
});
```

### **1.3 실제 실행 명령어 시퀀스**
```bash
# 1. 백엔드 서버 현재 설정 백업
docker exec christmas_backend cp /app/src/app.js /app/src/app.js.backup

# 2. CORS 설정 업데이트 
# (실제로는 로컬에서 수정 후 Docker 이미지 재빌드)

# 3. 서버 재시작 (무중단)
docker exec christmas_backend pm2 reload all
```

## 🔧 **Phase 2: Netlify Functions 재구축**

### **2.1 현재 Functions 상태 진단**
```bash
# 로컬에서 Functions 테스트
cd web-dashboard/netlify/functions
node -c api-proxy.js  # 문법 오류 확인
node -c test.js       # 테스트 함수 확인
```

### **2.2 강화된 API 프록시 구현**
```javascript
// api-proxy.js 최적화 버전
const http = require('http');
const https = require('https');
const url = require('url');

exports.handler = async (event, context) => {
  const startTime = Date.now();
  
  console.log('🔧 Enhanced API Proxy Called:', {
    method: event.httpMethod,
    path: event.path,
    timestamp: new Date().toISOString(),
    headers: Object.keys(event.headers)
  });

  // CORS 최적화
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'Content-Type': 'application/json',
    'Cache-Control': 'no-cache'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: corsHeaders, body: '' };
  }

  try {
    const apiPath = event.path.replace('/api/proxy', '') || '/health';
    const targetUrl = `http://31.220.83.213:8000${apiPath}`;
    
    const response = await makeRequest(targetUrl, event);
    
    console.log(`✅ Response: ${response.statusCode} (${Date.now() - startTime}ms)`);
    
    return {
      statusCode: response.statusCode,
      headers: corsHeaders,
      body: response.data
    };
    
  } catch (error) {
    console.error('❌ Proxy Error:', error.message);
    
    return {
      statusCode: 500,
      headers: corsHeaders,
      body: JSON.stringify({
        error: 'API Proxy Error',
        message: error.message,
        timestamp: new Date().toISOString(),
        processingTime: Date.now() - startTime
      })
    };
  }
};

// HTTP 요청 헬퍼 함수
function makeRequest(targetUrl, event) {
  return new Promise((resolve, reject) => {
    const parsedUrl = url.parse(targetUrl);
    const options = {
      hostname: parsedUrl.hostname,
      port: parsedUrl.port || 8000,
      path: parsedUrl.path,
      method: event.httpMethod,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Netlify-Christmas-Proxy/1.0'
      },
      timeout: 30000
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ statusCode: res.statusCode, data }));
    });

    req.on('error', reject);
    req.on('timeout', () => reject(new Error('Request timeout')));
    
    if (event.body) req.write(event.body);
    req.end();
  });
}
```

## 🧪 **테스트 및 검증 절차**

### **3.1 Dry Run 테스트 시퀀스**
```bash
# 1. 백엔드 서버 상태 확인
curl -I http://31.220.83.213:8000/health

# 2. CORS 헤더 확인  
curl -H "Origin: https://christmas-protocol.netlify.app" \
     -H "Access-Control-Request-Method: GET" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS http://31.220.83.213:8000/health

# 3. Netlify Functions 테스트
curl https://christmas-protocol.netlify.app/.netlify/functions/test

# 4. API 프록시 테스트
curl https://christmas-protocol.netlify.app/api/proxy/health
```

### **3.2 성공 기준**
- [ ] 백엔드 서버 응답: 200 OK
- [ ] CORS 헤더 정상: Access-Control-Allow-Origin 포함
- [ ] Netlify Functions 응답: 200 OK  
- [ ] API 프록시 응답: 200 OK
- [ ] 프론트엔드 API 호출: 성공

## 📊 **모니터링 및 롤백 계획**

### **모니터링 지표**
- API 응답 시간 < 500ms
- 에러율 < 1%
- 가동률 > 99%

### **롤백 트리거**
- 에러율 > 5%
- 응답 시간 > 2초
- 새로운 오류 발생

### **롤백 절차**
```bash
# 1. 백엔드 설정 롤백
docker exec christmas_backend cp /app/src/app.js.backup /app/src/app.js
docker exec christmas_backend pm2 reload all

# 2. 프론트엔드 이전 버전 배포
git revert HEAD
git push origin main
```

## ⏰ **타임라인 및 체크포인트**

### **T+0분**: 실행 시작
- [x] PM 상황 분석 완료
- [x] 실행 계획 수립 완료

### **T+10분**: Phase 1 완료
- [ ] 백엔드 CORS 패치 적용
- [ ] 서버 재시작 완료
- [ ] 기본 연결성 확인

### **T+20분**: Phase 2 완료  
- [ ] Netlify Functions 업데이트
- [ ] API 프록시 배포 완료
- [ ] 전체 테스트 완료

### **T+30분**: 검증 및 모니터링
- [ ] 프론트엔드 기능 정상 확인
- [ ] 성능 지표 모니터링
- [ ] 문서 업데이트

---
**작성자**: AI PM Assistant  
**승인자**: Project Lead  
**실행 시작**: 2025-05-30 23:10 KST  
**완료 목표**: 2025-05-30 23:40 KST 