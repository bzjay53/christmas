# 🎄 Christmas Trading Design System

## 🎨 크리스마스 디자인 철학

### **핵심 가치**
> **"투자도 즐겁게, 크리스마스처럼 따뜻하고 안전하게"**

1. **Joy & Warmth**: 크리스마스의 기쁨과 따뜻함을 투자 경험에 전달
2. **Trust & Safety**: 리스크 제로의 안전함을 시각적으로 표현
3. **Personalization**: 각 고객만의 특별한 크리스마스 선물 같은 경험
4. **Sophistication**: 전문적이면서도 친근한 금융 인터페이스

## 🎨 컬러 팔레트

### **Primary Christmas Colors**
```css
:root {
  /* 메인 크리스마스 컬러 */
  --christmas-red: #dc2626;          /* 산타의 빨간 옷 */
  --christmas-green: #16a34a;        /* 크리스마스 트리 */
  --christmas-gold: #eab308;         /* 황금 장식품 */
  --christmas-silver: #64748b;       /* 은색 장식품 */
  --christmas-white: #fefefe;        /* 순백의 눈 */
  
  /* 보조 컬러 */
  --christmas-dark-red: #991b1b;     /* 깊은 빨강 */
  --christmas-dark-green: #166534;   /* 짙은 초록 */
  --christmas-light-red: #fecaca;    /* 연한 빨강 */
  --christmas-light-green: #dcfce7;  /* 연한 초록 */
  --christmas-cream: #fef3c7;        /* 크림색 */
}
```

### **Semantic Colors (투자 관련)**
```css
:root {
  /* 수익/손실 */
  --profit-green: var(--christmas-green);
  --loss-red: var(--christmas-red);
  --neutral-gray: var(--christmas-silver);
  
  /* 리스크 레벨 */
  --risk-ultra-low: #dcfce7;     /* 초저위험 - 연한 초록 */
  --risk-low: #bbf7d0;           /* 저위험 - 초록 */
  --risk-medium: #fef3c7;        /* 중위험 - 노랑 */
  --risk-high: #fed7aa;          /* 고위험 - 주황 */
  --risk-ultra-high: #fecaca;    /* 초고위험 - 빨강 */
  
  /* 상태 컬러 */
  --status-success: var(--christmas-green);
  --status-warning: var(--christmas-gold);
  --status-error: var(--christmas-red);
  --status-info: #3b82f6;
}
```

### **Gradient Combinations**
```css
:root {
  /* 메인 그라데이션 */
  --christmas-gradient: linear-gradient(135deg, #dc2626 0%, #16a34a 100%);
  --festive-gradient: linear-gradient(45deg, #eab308 0%, #dc2626 50%, #16a34a 100%);
  --snow-gradient: linear-gradient(180deg, #fefefe 0%, #f1f5f9 100%);
  --gold-gradient: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  
  /* 백그라운드 그라데이션 */
  --bg-winter: linear-gradient(to bottom, #e0f2fe 0%, #f0f9ff 100%);
  --bg-warm: linear-gradient(to bottom, #fef3c7 0%, #fed7aa 100%);
  --bg-cool: linear-gradient(to bottom, #ecfdf5 0%, #d1fae5 100%);
}
```

## 🎨 Typography (타이포그래피)

### **Font Stack**
```css
:root {
  /* 메인 폰트 */
  --font-primary: 'Pretendard', -apple-system, BlinkMacSystemFont, system-ui, Roboto, sans-serif;
  --font-secondary: 'Inter', -apple-system, BlinkMacSystemFont, system-ui, sans-serif;
  --font-monospace: 'Fira Code', 'JetBrains Mono', 'Monaco', monospace;
  
  /* 특별한 경우 */
  --font-festive: 'Dancing Script', cursive; /* 크리스마스 장식용 */
}
```

### **Font Sizes & Weights**
```css
:root {
  /* 폰트 크기 */
  --text-xs: 0.75rem;    /* 12px */
  --text-sm: 0.875rem;   /* 14px */
  --text-base: 1rem;     /* 16px */
  --text-lg: 1.125rem;   /* 18px */
  --text-xl: 1.25rem;    /* 20px */
  --text-2xl: 1.5rem;    /* 24px */
  --text-3xl: 1.875rem;  /* 30px */
  --text-4xl: 2.25rem;   /* 36px */
  
  /* 폰트 굵기 */
  --font-light: 300;
  --font-normal: 400;
  --font-medium: 500;
  --font-semibold: 600;
  --font-bold: 700;
  --font-extrabold: 800;
}
```

### **Typography Hierarchy**
```css
/* 제목 스타일 */
.title-hero {
  font-size: var(--text-4xl);
  font-weight: var(--font-extrabold);
  background: var(--christmas-gradient);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  text-shadow: 2px 2px 4px rgba(0,0,0,0.1);
}

.title-section {
  font-size: var(--text-2xl);
  font-weight: var(--font-bold);
  color: var(--christmas-dark-green);
}

.title-card {
  font-size: var(--text-lg);
  font-weight: var(--font-semibold);
  color: var(--christmas-dark-red);
}

/* 본문 스타일 */
.text-primary {
  font-size: var(--text-base);
  font-weight: var(--font-normal);
  color: #374151;
  line-height: 1.6;
}

.text-secondary {
  font-size: var(--text-sm);
  font-weight: var(--font-normal);
  color: #6b7280;
  line-height: 1.5;
}

/* 숫자/데이터 스타일 */
.text-data {
  font-family: var(--font-monospace);
  font-weight: var(--font-semibold);
  letter-spacing: 0.025em;
}

.text-profit {
  color: var(--profit-green);
  font-weight: var(--font-bold);
}

.text-loss {
  color: var(--loss-red);
  font-weight: var(--font-bold);
}
```

## 🎯 Component Design Tokens

### **Spacing System**
```css
:root {
  /* 간격 시스템 */
  --space-0: 0;
  --space-1: 0.25rem;   /* 4px */
  --space-2: 0.5rem;    /* 8px */
  --space-3: 0.75rem;   /* 12px */
  --space-4: 1rem;      /* 16px */
  --space-5: 1.25rem;   /* 20px */
  --space-6: 1.5rem;    /* 24px */
  --space-8: 2rem;      /* 32px */
  --space-10: 2.5rem;   /* 40px */
  --space-12: 3rem;     /* 48px */
  --space-16: 4rem;     /* 64px */
  --space-20: 5rem;     /* 80px */
  --space-24: 6rem;     /* 96px */
}
```

### **Border Radius**
```css
:root {
  /* 모서리 둥글기 */
  --radius-none: 0;
  --radius-sm: 0.125rem;    /* 2px */
  --radius-base: 0.25rem;   /* 4px */
  --radius-md: 0.375rem;    /* 6px */
  --radius-lg: 0.5rem;      /* 8px */
  --radius-xl: 0.75rem;     /* 12px */
  --radius-2xl: 1rem;       /* 16px */
  --radius-3xl: 1.5rem;     /* 24px */
  --radius-full: 9999px;    /* 완전한 원 */
  
  /* 크리스마스 특화 */
  --radius-gift: var(--radius-xl);      /* 선물상자 느낌 */
  --radius-ornament: var(--radius-full); /* 장식품 느낌 */
}
```

### **Shadows**
```css
:root {
  /* 그림자 시스템 */
  --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
  --shadow-base: 0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px 0 rgba(0, 0, 0, 0.06);
  --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
  --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
  --shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
  
  /* 크리스마스 특화 그림자 */
  --shadow-christmas: 0 8px 24px rgba(220, 38, 38, 0.2);
  --shadow-gold: 0 4px 16px rgba(234, 179, 8, 0.3);
  --shadow-snow: 0 2px 12px rgba(255, 255, 255, 0.8);
  --shadow-festive: 0 8px 32px rgba(22, 163, 74, 0.15);
}
```

## 🎄 Component Library

### **Christmas Cards**
```css
/* 기본 카드 */
.christmas-card {
  background: white;
  border-radius: var(--radius-gift);
  box-shadow: var(--shadow-md);
  border: 2px solid transparent;
  background: linear-gradient(white, white) padding-box,
              var(--festive-gradient) border-box;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
}

.christmas-card::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 4px;
  background: var(--festive-gradient);
}

.christmas-card:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-christmas);
}

/* 특별한 카드들 */
.card-profit {
  background: var(--christmas-light-green);
  border-left: 4px solid var(--christmas-green);
}

.card-portfolio {
  background: var(--christmas-light-red);
  border-left: 4px solid var(--christmas-red);
}

.card-trading {
  background: var(--christmas-cream);
  border-left: 4px solid var(--christmas-gold);
}

.card-ai {
  background: linear-gradient(135deg, #e0e7ff 0%, #c7d2fe 100%);
  border-left: 4px solid #6366f1;
}
```

### **Christmas Buttons**
```css
/* 메인 버튼 */
.btn-christmas-primary {
  background: var(--christmas-gradient);
  border: none;
  border-radius: var(--radius-lg);
  color: white;
  font-weight: var(--font-semibold);
  padding: var(--space-3) var(--space-6);
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
}

.btn-christmas-primary::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
  transition: left 0.5s;
}

.btn-christmas-primary:hover {
  background: linear-gradient(135deg, #b91c1c 0%, #15803d 100%);
  transform: translateY(-2px);
  box-shadow: var(--shadow-christmas);
}

.btn-christmas-primary:hover::before {
  left: 100%;
}

/* 보조 버튼 */
.btn-christmas-secondary {
  background: white;
  border: 2px solid var(--christmas-gold);
  color: var(--christmas-gold);
  border-radius: var(--radius-lg);
  font-weight: var(--font-semibold);
  padding: var(--space-3) var(--space-6);
  transition: all 0.3s ease;
}

.btn-christmas-secondary:hover {
  background: var(--christmas-gold);
  color: white;
  transform: translateY(-2px);
  box-shadow: var(--shadow-gold);
}

/* 위험 버튼 */
.btn-christmas-danger {
  background: var(--christmas-red);
  border: none;
  border-radius: var(--radius-lg);
  color: white;
  font-weight: var(--font-semibold);
  padding: var(--space-3) var(--space-6);
  transition: all 0.3s ease;
}

.btn-christmas-danger:hover {
  background: var(--christmas-dark-red);
  transform: translateY(-2px);
  box-shadow: var(--shadow-md);
}
```

### **Christmas Form Elements**
```css
/* 입력 필드 */
.input-christmas {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-base);
  transition: all 0.3s ease;
}

.input-christmas:focus {
  outline: none;
  border-color: var(--christmas-green);
  box-shadow: 0 0 0 3px rgba(22, 163, 74, 0.1);
}

.input-christmas:invalid {
  border-color: var(--christmas-red);
  box-shadow: 0 0 0 3px rgba(220, 38, 38, 0.1);
}

/* 선택 필드 */
.select-christmas {
  background: white;
  border: 2px solid #e5e7eb;
  border-radius: var(--radius-lg);
  padding: var(--space-3) var(--space-4);
  font-size: var(--text-base);
  background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3E%3C/svg%3E");
  background-position: right var(--space-3) center;
  background-repeat: no-repeat;
  background-size: 16px;
  padding-right: var(--space-10);
  appearance: none;
}
```

### **Christmas Progress & Loading**
```css
/* 진행률 바 */
.progress-christmas {
  background: #e5e7eb;
  border-radius: var(--radius-full);
  height: 8px;
  overflow: hidden;
}

.progress-christmas-bar {
  background: var(--christmas-gradient);
  height: 100%;
  border-radius: var(--radius-full);
  transition: width 0.3s ease;
  position: relative;
}

.progress-christmas-bar::after {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  background: linear-gradient(45deg, transparent 33%, rgba(255,255,255,0.3) 33%, rgba(255,255,255,0.3) 66%, transparent 66%);
  background-size: 20px 20px;
  animation: progress-stripes 1s linear infinite;
}

@keyframes progress-stripes {
  0% { background-position: 0 0; }
  100% { background-position: 20px 0; }
}

/* 로딩 스피너 */
.spinner-christmas {
  width: 40px;
  height: 40px;
  border: 4px solid #e5e7eb;
  border-top: 4px solid var(--christmas-red);
  border-radius: var(--radius-full);
  animation: spin-christmas 1s linear infinite;
}

@keyframes spin-christmas {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 펄스 효과 */
.pulse-christmas {
  animation: pulse-christmas 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}

@keyframes pulse-christmas {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.5;
  }
}
```

## ❄️ Christmas Animations

### **Snow Animation**
```css
/* 눈송이 애니메이션 */
@keyframes snowfall {
  0% {
    transform: translateY(-100vh) rotate(0deg);
    opacity: 1;
  }
  100% {
    transform: translateY(100vh) rotate(360deg);
    opacity: 0;
  }
}

.snow-particle {
  position: fixed;
  top: -10px;
  color: white;
  user-select: none;
  pointer-events: none;
  animation: snowfall linear infinite;
  z-index: 1000;
}

/* 다양한 눈송이 크기 */
.snow-small { font-size: 10px; animation-duration: 6s; }
.snow-medium { font-size: 16px; animation-duration: 8s; }
.snow-large { font-size: 22px; animation-duration: 10s; }
```

### **Sparkle Effects**
```css
/* 반짝임 효과 */
@keyframes sparkle {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.7;
    transform: scale(1.2);
  }
}

.sparkle {
  animation: sparkle 2s ease-in-out infinite;
}

/* 황금 반짝임 */
@keyframes gold-sparkle {
  0%, 100% {
    opacity: 0.8;
    transform: scale(1) rotate(0deg);
  }
  50% {
    opacity: 1;
    transform: scale(1.1) rotate(180deg);
  }
}

.gold-sparkle {
  animation: gold-sparkle 3s ease-in-out infinite;
  color: var(--christmas-gold);
}
```

### **Hover Animations**
```css
/* 호버 상승 효과 */
.hover-lift {
  transition: transform 0.3s ease, box-shadow 0.3s ease;
}

.hover-lift:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lg);
}

/* 호버 확대 효과 */
.hover-scale {
  transition: transform 0.3s ease;
}

.hover-scale:hover {
  transform: scale(1.05);
}

/* 호버 회전 효과 */
.hover-rotate {
  transition: transform 0.3s ease;
}

.hover-rotate:hover {
  transform: rotate(5deg);
}
```

## 📱 Responsive Design

### **Breakpoints**
```css
:root {
  /* 반응형 브레이크포인트 */
  --breakpoint-sm: 640px;    /* 스마트폰 */
  --breakpoint-md: 768px;    /* 태블릿 */
  --breakpoint-lg: 1024px;   /* 노트북 */
  --breakpoint-xl: 1280px;   /* 데스크톱 */
  --breakpoint-2xl: 1536px;  /* 대형 모니터 */
}
```

### **Responsive Utilities**
```css
/* 모바일 우선 설계 */
.container {
  width: 100%;
  margin: 0 auto;
  padding: 0 var(--space-4);
}

@media (min-width: 640px) {
  .container { max-width: 640px; }
}

@media (min-width: 768px) {
  .container { max-width: 768px; }
}

@media (min-width: 1024px) {
  .container { max-width: 1024px; }
}

@media (min-width: 1280px) {
  .container { max-width: 1280px; }
}

/* 반응형 텍스트 */
.text-responsive {
  font-size: var(--text-sm);
}

@media (min-width: 768px) {
  .text-responsive {
    font-size: var(--text-base);
  }
}

@media (min-width: 1024px) {
  .text-responsive {
    font-size: var(--text-lg);
  }
}

/* 반응형 그리드 */
.grid-responsive {
  display: grid;
  gap: var(--space-4);
  grid-template-columns: 1fr;
}

@media (min-width: 768px) {
  .grid-responsive {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (min-width: 1024px) {
  .grid-responsive {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (min-width: 1280px) {
  .grid-responsive {
    grid-template-columns: repeat(4, 1fr);
  }
}
```

## 🎯 Design Guidelines

### **컴포넌트 사용 가이드라인**

#### **1. 색상 사용 원칙**
- **빨간색**: 손실, 위험, 경고 상황에만 사용
- **초록색**: 수익, 성공, 승인 상황에 사용
- **금색**: 프리미엄, 특별한 기능, 강조 요소
- **은색**: 보조 정보, 비활성 상태

#### **2. 타이포그래피 원칙**
- **제목**: 항상 굵은 글씨체 사용
- **데이터**: 모노스페이스 폰트로 정렬성 확보
- **강조**: 색상보다는 굵기로 강조
- **가독성**: 충분한 line-height (1.5 이상) 유지

#### **3. 레이아웃 원칙**
- **간격**: 8px 단위 시스템 준수
- **정렬**: 일관된 정렬 기준 유지
- **계층**: 시각적 계층 구조 명확히
- **흐름**: 자연스러운 시선 흐름 고려

#### **4. 상호작용 원칙**
- **피드백**: 모든 액션에 즉각적 피드백
- **애니메이션**: 0.3초 이내의 자연스러운 전환
- **상태**: 명확한 상태 표시 (로딩, 성공, 오류)
- **접근성**: 키보드 네비게이션 지원

---

## 🎄 결론

Christmas Trading Design System은 **크리스마스의 따뜻함과 금융의 전문성을 조화**시킨 독창적인 디자인 언어입니다.

**핵심 특징:**
- 🎨 **크리스마스 테마**: 빨강, 초록, 금색의 축제 색상
- 🛡️ **리스크 제로 표현**: 안전함을 시각적으로 전달
- 💎 **프리미엄 경험**: 고급스럽고 신뢰할 수 있는 인터페이스
- 📱 **완벽한 반응형**: 모든 디바이스에서 최적의 경험

이 디자인 시스템을 통해 사용자들은 투자를 하면서도 크리스마스 선물을 받는 것 같은 즐거운 경험을 하게 될 것입니다! 🎁

---

**📅 작성일**: 2025-06-21  
**📝 작성자**: Claude Code  
**🔄 버전**: v1.0  
**📍 상태**: 디자인 시스템 완성