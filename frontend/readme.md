# 🎄 Christmas Crypto Trading Dashboard

크리스마스 테마의 바이낸스 암호화폐 거래 대시보드입니다. React + TypeScript + Tailwind CSS로 구축되었습니다.

## ✨ 주요 기능

### 🎅 크리스마스 테마
- **눈 내리는 효과**: 실시간 눈송이 애니메이션
- **크리스마스 색상**: 빨강, 초록, 금색 테마
- **홀리데이 아이콘**: 🎄, ❄️, 🎁, ⭐ 등 크리스마스 이모지
- **Santa's Workshop**: 크리스마스 컨셉의 UI/UX

### 📊 실시간 데이터
- **바이낸스 API 연동**: 실시간 암호화폐 가격
- **라이브 차트**: 상호작용 가능한 실시간 차트
- **WebSocket 연결**: 실시간 가격 업데이트
- **가격 알림**: 중요한 가격 변동 알림

### 🤖 AI 거래 기능
- **자동 거래**: AI 기반 자동 거래 시스템
- **전략 선택**: 보수적/균형/공격적 전략
- **수익률 추적**: 실시간 수익률 모니터링
- **리스크 관리**: 스탑로스/익절 설정

### 🎁 사용자 경험
- **반응형 디자인**: 모바일/태블릿/데스크톱 지원
- **다크 테마**: 트레이딩에 최적화된 다크 모드
- **애니메이션**: 부드러운 트랜지션과 효과
- **직관적 UI**: 사용하기 쉬운 인터페이스

## 🚀 빠른 시작

### 전제 조건
- Node.js 18.0 이상
- npm 또는 yarn
- Git

### 설치 방법

```bash
# 1. 저장소 클론
git clone https://github.com/bzjay53/christmas.git
cd christmas

# 2. 의존성 설치
npm install

# 3. 환경변수 설정
cp .env.example .env
# .env 파일을 편집하여 바이낸스 API 키 설정

# 4. 개발 서버 시작
npm start

# 5. 브라우저에서 확인
# http://localhost:3000
```

### Ubuntu 서버 배포

```bash
# 1. 서버 접속
ssh root@your-server-ip

# 2. 프로젝트 클론
cd /var/www
git clone https://github.com/bzjay53/christmas.git
cd christmas

# 3. 의존성 설치
npm install

# 4. 프로덕션 빌드
npm run build

# 5. PM2로 실행
npm install -g pm2
pm2 start npm --name "christmas-dashboard" -- start

# 6. 부팅 시 자동 시작
pm2 startup
pm2 save
```

## 📁 프로젝트 구조

```
christmas/
├── public/
│   ├── index.html              # HTML 템플릿
│   └── manifest.json           # PWA 매니페스트
├── src/
│   ├── components/
│   │   ├── trading/
│   │   │   ├── CryptoCard.tsx      # 암호화폐 카드
│   │   │   └── TradingButtons.tsx  # 거래 버튼
│   │   ├── charts/
│   │   │   └── LiveChart.tsx       # 실시간 차트
│   │   └── ui/
│   │       └── PortfolioSummary.tsx # 포트폴리오 요약
│   ├── services/
│   │   └── binanceAPI.ts       # 바이낸스 API 서비스
│   ├── types/
│   │   └── index.ts            # TypeScript 타입 정의
│   ├── App.tsx                 # 메인 애플리케이션
│   ├── index.tsx               # 엔트리 포인트
│   └── index.css               # 전역 스타일
├── package.json                # 의존성 및 스크립트
├── tailwind.config.js          # Tailwind CSS 설정
├── .env                        # 환경변수
└── README.md                   # 프로젝트 문서
```

## 🛠️ 기술 스택

### Frontend
- **React 18**: 컴포넌트 기반 UI 라이브러리
- **TypeScript**: 정적 타입 검사
- **Tailwind CSS**: 유틸리티 우선 CSS 프레임워크
- **Recharts**: 차트 라이브러리
- **Lucide React**: 아이콘 라이브러리

### API & Data
- **Binance API**: 암호화폐 데이터
- **WebSocket**: 실시간 데이터 스트리밍
- **Axios**: HTTP 클라이언트

### Development
- **Create React App**: 개발 환경 설정
- **ESLint**: 코드 린팅
- **Prettier**: 코드 포매팅

## 🎨 디자인 특징

### 크리스마스 컬러 팔레트
- **Primary**: #16A34A (Christmas Green)
- **Secondary**: #DC2626 (Christmas Red)
- **Accent**: #FBBF24 (Gold)
- **Background**: #0F172A (Dark Slate)

### 폰트
- **Heading**: Mountains of Christmas (Google Fonts)
- **Body**: Orbitron (Google Fonts)
- **Monospace**: System monospace

### 애니메이션
- **눈 내리는 효과**: CSS keyframes
- **호버 효과**: Transform & transition
- **가격 변동**: 색상 변화 애니메이션
- **로딩**: 스피너 및 펄스 효과

## 🔧 환경 설정

### 필수 환경변수
```env
REACT_APP_BINANCE_API_KEY=your_api_key
REACT_APP_BINANCE_SECRET_KEY=your_secret_key
REACT_APP_API_BASE_URL=https://api.binance.com/api/v3
```

### 선택적 환경변수
```env
REACT_APP_SNOW_EFFECT=true
REACT_APP_CHRISTMAS_SOUNDS=true
REACT_APP_THEME=christmas
```

## 📱 반응형 디자인

- **Desktop**: 1200px 이상 - 전체 기능 표시
- **Tablet**: 768px - 1199px - 적응형 레이아웃
- **Mobile**: 767px 이하 - 모바일 최적화

## 🔐 보안 고려사항

### API 키 보안
- 환경변수로 API 키 관리
- 프론트엔드에서 Secret Key 사용 금지
- 읽기 전용 API 키 권장

### CORS 정책
- 바이낸스 API CORS 제한 우회
- 프록시 서버 또는 백엔드 API 권장

## 🎯 성능 최적화

### 코드 스플리팅
- React.lazy()를 통한 컴포넌트 지연 로딩
- 청크 기반 번들링

### 이미지 최적화
- WebP 형식 이미지 사용
- 이미지 지연 로딩

### 캐싱 전략
- 서비스 워커 활용
- API 응답 캐싱
- 브라우저 캐시 최적화

## 🎄 크리스마스 테마 가이드

### 컴포넌트별 테마 적용

#### CryptoCard
- 🎄 Bitcoin → 크리스마스 트리 아이콘
- ❄️ Ethereum → 눈송이 아이콘  
- ⭐ Binance Coin → 별 아이콘
- 가격 상승 시 🎁, 하락 시 ❄️ 표시

#### TradingButtons
- BUY 버튼: 🎄 크리스마스 트리
- SELL 버튼: ❄️ 눈송이
- AI 거래: 🤖 Santa's AI Trading
- 전략: 🛡️ 루돌프, ⚖️ 산타, ⚔️ 엘프

#### LiveChart
- 간격 버튼: 🎄 1m, ❄️ 5m, ⭐ 15m, 🎁 1h
- 상승 추세: 🎄↗, 하락 추세: ❄️↘
- 거래량: 🎁 거래량 표시

## 🚀 배포 가이드

### Nginx 설정 (권장)

```nginx
server {
    listen 80;
    server_name your-domain.com;
    
    root /var/www/christmas/build;
    index index.html;
    
    # Gzip 압축
    gzip on;
    gzip_types text/css application/javascript application/json;
    
    # 정적 파일 캐싱
    location /static/ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
    
    # React Router 지원
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API 프록시 (선택사항)
    location /api/ {
        proxy_pass https://api.binance.com/;
        proxy_set_header Host api.binance.com;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### Docker 배포

```dockerfile
# Dockerfile
FROM node:18-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

```bash
# Docker 빌드 및 실행
docker build -t christmas-crypto .
docker run -p 80:80 christmas-crypto
```

### PM2 Ecosystem 설정

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'christmas-crypto',
    script: 'serve',
    args: '-s build -l 3000',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
  }]
};
```

## 🐛 문제 해결

### 자주 발생하는 문제

#### 1. CORS 에러
```bash
# 해결방법 1: 프록시 설정
# package.json에 추가
"proxy": "https://api.binance.com"

# 해결방법 2: 백엔드 API 서버 구축
# Express.js 등으로 프록시 서버 생성
```

#### 2. WebSocket 연결 실패
```javascript
// 재연결 로직 구현
const connectWebSocket = () => {
  try {
    // WebSocket 연결 시도
  } catch (error) {
    setTimeout(connectWebSocket, 5000); // 5초 후 재시도
  }
};
```

#### 3. 빌드 크기 최적화
```bash
# 번들 분석
npm install -g webpack-bundle-analyzer
npx webpack-bundle-analyzer build/static/js/*.js

# 의존성 최적화
npm audit
npm update
```

## 📊 모니터링 및 분석

### 성능 메트리클
- **First Contentful Paint**: < 1.5초
- **Largest Contentful Paint**: < 2.5초
- **Cumulative Layout Shift**: < 0.1
- **First Input Delay**: < 100ms

### 로깅 설정
```javascript
// 에러 로깅
window.addEventListener('error', (e) => {
  console.error('Application Error:', {
    message: e.message,
    filename: e.filename,
    lineno: e.lineno,
    timestamp: new Date().toISOString()
  });
});
```

## 🔄 업데이트 가이드

### 버전 업그레이드
```bash
# 의존성 업데이트
npm update

# 보안 취약점 확인
npm audit

# 자동 수정
npm audit fix
```

### 기능 추가 시
1. `src/types/index.ts`에 새 타입 정의
2. `src/services/`에 새 서비스 추가
3. `src/components/`에 새 컴포넌트 생성
4. 크리스마스 테마 적용
5. 테스트 코드 작성

## 🎅 기여 가이드

### 개발 환경 설정
```bash
# 개발 브랜치 생성
git checkout -b feature/new-christmas-feature

# 개발 서버 실행 (Hot Reload)
npm start

# 타입 체크
npm run type-check

# 린트 검사
npm run lint

# 프리티어 포매팅
npm run format
```

### 커밋 메시지 규칙
```
🎄 feat: 새로운 크리스마스 기능 추가
❄️ fix: 눈송이 애니메이션 버그 수정
⭐ style: CSS 스타일 개선
🎁 docs: 문서 업데이트
🔧 refactor: 코드 리팩토링
```

## 📞 지원 및 연락처

### 버그 리포트
- GitHub Issues: [Repository Issues](https://github.com/bzjay53/christmas/issues)
- 이메일: support@christmas-crypto.com

### 기능 요청
- GitHub Discussions 활용
- 크리스마스 테마 유지 필수

## 📄 라이선스

이 프로젝트는 MIT 라이선스 하에 배포됩니다.

```
MIT License

Copyright (c) 2025 Christmas Crypto Trading

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.
```

## 🎉 감사의 말

### 사용된 오픈소스
- React Team - UI 라이브러리
- Tailwind CSS - CSS 프레임워크  
- Binance API - 암호화폐 데이터
- Recharts - 차트 라이브러리
- Lucide - 아이콘 세트

### 특별한 감사
- 🎅 Santa Claus - 크리스마스 테마 영감
- ❄️ 눈송이들 - 아름다운 배경 효과
- 🎄 크리스마스 트리 - 프로젝트 상징

---

## 🎄 Merry Christmas & Happy Trading! 🎄

**Ho Ho Ho! 크리스마스의 마법으로 성공적인 트레이딩 되세요! 🎅✨**