# 🎄 Christmas Trading Dashboard

![Christmas Trading Dashboard](https://img.shields.io/badge/Christmas-Trading-red)
![React](https://img.shields.io/badge/React-18.0-blue)
![Material-UI](https://img.shields.io/badge/Material--UI-5.0-green)

실시간 자동매매 시스템을 위한 React 기반 웹 대시보드입니다.

## 🔄 배포 테스트 (2025-05-25)
- **main 브랜치 자동 배포 테스트 진행 중**
- **Netlify 직접 연동 확인 중**

## ✨ 주요 기능

### 📊 실시간 대시보드
- 실시간 포트폴리오 모니터링
- 수익률 및 손익 차트
- 시장 데이터 실시간 업데이트

### 💼 포트폴리오 관리
- 보유 종목 상세 정보
- 실시간 가격 변동 추적
- 종목별 수익률 분석
- 포트폴리오 비중 관리

### 🎯 자동매매 거래
- 자동매매 시스템 제어
- 실시간 거래 전략 모니터링
- 수동 주문 생성
- 거래 내역 추적

### ⚙️ 설정 관리
- 시스템 설정
- 알림 설정
- 테마 변경

## 🚀 기술 스택

- **Frontend**: React 18, Vite
- **UI Library**: Material-UI (MUI)
- **Charts**: Recharts
- **State Management**: React Hooks
- **Styling**: Emotion, Material-UI

## 📦 설치 및 실행

### 개발 환경
```bash
# 의존성 설치
npm install

# 개발 서버 시작
npm run dev

# 브라우저에서 http://localhost:5173 접속
```

### 프로덕션 빌드
```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview
```

## 🌐 배포

### Netlify 자동 배포
- GitHub 연동으로 자동 배포
- 빌드 명령어: `npm run build`
- 배포 디렉토리: `dist`

### 배포 URL
- **Production**: [https://christmas-trading.netlify.app](https://christmas-trading.netlify.app)
- **Preview**: 각 PR마다 자동 생성

## 📱 반응형 디자인

모든 화면 크기에서 최적화된 사용자 경험을 제공합니다:
- 데스크톱 (1200px+)
- 태블릿 (768px - 1199px)
- 모바일 (767px 이하)

## 🎨 테마

- **다크 테마**: 기본 테마
- **라이트 테마**: 선택 가능
- **크리스마스 테마**: 특별 테마

## 📊 실시간 데이터

### 시뮬레이션 데이터
- 한국 주식 시장 데이터 시뮬레이션
- ±3% 실시간 가격 변동
- 실제 거래 시간 반영

### 지원 종목
- 삼성전자 (005930)
- SK하이닉스 (000660)
- 네이버 (035420)
- LG전자 (066570)
- POSCO홀딩스 (005490)

## 🔧 개발 가이드

### 컴포넌트 구조
```
src/
├── components/
│   ├── Dashboard.jsx     # 메인 대시보드
│   ├── Portfolio.jsx     # 포트폴리오 관리
│   ├── Trading.jsx       # 거래 관리
│   ├── Settings.jsx      # 설정
│   └── Navigation.jsx    # 네비게이션
├── App.jsx              # 메인 앱
└── main.jsx            # 엔트리 포인트
```

### 상태 관리
- React Hooks 기반
- 실시간 데이터 업데이트
- 로컬 스토리지 활용

## 🎯 향후 계획

- [ ] 실제 API 연동
- [ ] 사용자 인증 시스템
- [ ] 고급 차트 기능
- [ ] 모바일 앱 개발
- [ ] 다국어 지원

## 📄 라이선스

MIT License

## 👥 기여

프로젝트에 기여하고 싶으시다면 Pull Request를 보내주세요!

---

**🎄 Merry Christmas & Happy Trading! 🎄** 