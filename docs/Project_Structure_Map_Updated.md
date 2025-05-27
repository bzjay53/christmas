# 🎄 Christmas Trading Project Structure Map (Updated 2025-05-26)

## 📋 프로젝트 전체 구조

### 🏗️ 시스템 아키텍처 개요
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │    Backend      │    │   Database      │
│   (Netlify)     │◄──►│   (Docker)      │◄──►│  (Supabase)     │
│                 │    │                 │    │                 │
│ React + Zustand │    │ Node.js + Express│    │ PostgreSQL      │
│ christmas-      │    │ 31.220.83.213   │    │ qehzzsxzjijfzq  │
│ protocol.netlify│    │ :8000           │    │ kysazc.supabase │
│ .app            │    │                 │    │ .co             │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📁 루트 디렉토리 구조

```
christmas/
├── 📁 web-dashboard/              # Frontend Application
│   ├── 📁 src/                   # Source Code
│   ├── 📁 public/                # Static Assets
│   ├── 📁 dist/                  # Build Output
│   ├── 📄 package.json           # Dependencies
│   ├── 📄 vite.config.js         # Build Configuration
│   ├── 📄 index.html             # Entry Point
│   └── 📄 netlify.toml           # Deployment Config
│
├── 📁 backend/                   # Backend Application
│   ├── 📁 src/                   # Source Code
│   ├── 📄 package.json           # Dependencies
│   ├── 📄 Dockerfile             # Container Config
│   ├── 📄 .env                   # Environment Variables
│   └── 📄 env.txt                # Environment Reference
│
├── 📁 scripts/                   # Automation Scripts
│   ├── 📄 docker-recovery.sh     # Docker Recovery
│   ├── 📄 server-sync-guide-en.ps1 # Server Sync Guide
│   ├── 📄 fix-supabase-schema.sql # Database Schema Fix
│   └── 📄 *.ps1                  # PowerShell Scripts
│
├── 📁 docs/                      # Documentation
│   ├── 📄 PM_Master_Plan_2025-05-26.md
│   ├── 📄 PM_WBS_Updated_2025-05-26.md
│   ├── 📄 RAG_Knowledge_Base_Updated.md
│   └── 📄 *.md                   # Various Documents
│
├── 📁 config/                    # Configuration Files
├── 📁 monitoring/                # Monitoring Setup
├── 📁 nginx/                     # Reverse Proxy Config
├── 📁 supabase/                  # Database Migrations
├── 📁 tests/                     # Test Files
├── 📁 logs/                      # Log Files
├── 📁 backups/                   # Backup Files
│
├── 📄 docker-compose.yml         # Docker Orchestration
├── 📄 package.json               # Root Dependencies
├── 📄 README.md                  # Project Documentation
├── 📄 .gitignore                 # Git Ignore Rules
└── 📄 netlify.toml               # Netlify Configuration
```

## 🎨 Frontend 구조 (web-dashboard/)

### 📁 Source Code Structure
```
web-dashboard/src/
├── 📁 components/                # React Components
│   ├── 📄 App.jsx               # Main Application
│   ├── 📄 Dashboard.jsx         # Dashboard Component
│   ├── 📄 Login.jsx             # Authentication
│   ├── 📄 PaymentService.jsx    # Payment Integration
│   ├── 📄 Portfolio.jsx         # Portfolio Management
│   ├── 📄 Analytics.jsx         # Data Analytics
│   ├── 📄 Settings.jsx          # User Settings
│   └── 📄 *.jsx                 # Other Components
│
├── 📁 lib/                      # Utility Libraries
│   ├── 📄 supabase.js           # Supabase Client
│   ├── 📄 apiService.js         # API Service Layer
│   ├── 📄 utils.js              # Helper Functions
│   └── 📄 constants.js          # Application Constants
│
├── 📁 stores/                   # State Management
│   ├── 📄 authStore.js          # Authentication State
│   ├── 📄 portfolioStore.js     # Portfolio State
│   ├── 📄 settingsStore.js      # Settings State
│   └── 📄 globalStore.js        # Global State
│
├── 📁 styles/                   # Styling
│   ├── 📄 globals.css           # Global Styles
│   ├── 📄 components.css        # Component Styles
│   └── 📄 themes.css            # Theme Definitions
│
├── 📁 assets/                   # Static Assets
│   ├── 📁 images/               # Image Files
│   ├── 📁 icons/                # Icon Files
│   └── 📁 fonts/                # Font Files
│
└── 📄 main.jsx                  # Application Entry Point
```

### 🔧 Configuration Files
```
web-dashboard/
├── 📄 package.json              # Dependencies & Scripts
├── 📄 vite.config.js            # Vite Build Configuration
├── 📄 index.html                # HTML Template
├── 📄 netlify.toml              # Netlify Deployment
├── 📄 env.txt                   # Environment Variables Reference
└── 📄 .dockerignore             # Docker Ignore Rules
```

## 🖥️ Backend 구조 (backend/)

### 📁 Source Code Structure
```
backend/src/
├── 📁 routes/                   # API Routes
│   ├── 📄 auth.js               # Authentication Routes
│   ├── 📄 users.js              # User Management
│   ├── 📄 trading.js            # Trading Operations
│   ├── 📄 portfolio.js          # Portfolio Management
│   ├── 📄 analytics.js          # Analytics API
│   └── 📄 health.js             # Health Check
│
├── 📁 middleware/               # Express Middleware
│   ├── 📄 auth.js               # Authentication Middleware
│   ├── 📄 cors.js               # CORS Configuration
│   ├── 📄 rateLimit.js          # Rate Limiting
│   └── 📄 errorHandler.js       # Error Handling
│
├── 📁 services/                 # Business Logic
│   ├── 📄 supabaseService.js    # Database Service
│   ├── 📄 kisApiService.js      # KIS API Integration
│   ├── 📄 aiService.js          # AI/ML Services
│   ├── 📄 notificationService.js # Notifications
│   └── 📄 tradingService.js     # Trading Logic
│
├── 📁 models/                   # Data Models
│   ├── 📄 User.js               # User Model
│   ├── 📄 Trade.js              # Trade Model
│   ├── 📄 Portfolio.js          # Portfolio Model
│   └── 📄 Analytics.js          # Analytics Model
│
├── 📁 utils/                    # Utility Functions
│   ├── 📄 logger.js             # Logging Utility
│   ├── 📄 validator.js          # Input Validation
│   ├── 📄 encryption.js         # Data Encryption
│   └── 📄 helpers.js            # Helper Functions
│
└── 📄 app.js                    # Express Application
```

### 🔧 Configuration Files
```
backend/
├── 📄 package.json              # Dependencies & Scripts
├── 📄 Dockerfile                # Container Configuration
├── 📄 .env                      # Environment Variables
├── 📄 env.txt                   # Environment Reference
└── 📄 docker-compose.yml        # Local Development
```

## 🗄️ 데이터베이스 구조 (Supabase)

### 📊 테이블 관계도
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│    users    │◄──►│referral_codes│   │   coupons   │
│             │    │             │   │             │
│ - id        │    │ - user_id   │   │ - id        │
│ - email     │    │ - code      │   │ - code      │
│ - name      │    │ - is_active │   │ - discount  │
│ - membership│    └─────────────┘   │ - valid_until│
└─────────────┘                      └─────────────┘
       │                                     │
       ▼                                     ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│trade_records│    │ai_learning_ │    │coupon_usages│
│             │    │    data     │    │             │
│ - user_id   │    │             │    │ - user_id   │
│ - symbol    │    │ - user_id   │    │ - coupon_id │
│ - amount    │    │ - strategy  │    │ - used_at   │
│ - profit    │    │ - performance│    └─────────────┘
└─────────────┘    └─────────────┘
```

### 🔐 보안 정책 (RLS)
```sql
-- Row Level Security Policies
users: 사용자는 자신의 데이터만 접근 가능
trade_records: 사용자는 자신의 거래 기록만 조회 가능
ai_learning_data: 사용자는 자신의 AI 데이터만 관리 가능
referral_codes: 공개 읽기, 소유자만 수정 가능
coupons: 공개 읽기, 관리자만 생성/수정 가능
```

## 🔄 데이터 플로우

### 📈 사용자 인증 플로우
```
1. Frontend (Login.jsx)
   ↓ 사용자 입력
2. Supabase Auth
   ↓ 인증 토큰
3. Frontend State (authStore.js)
   ↓ API 요청
4. Backend Middleware (auth.js)
   ↓ 검증된 요청
5. Backend Services
   ↓ 데이터 응답
6. Frontend Components
```

### 📊 거래 데이터 플로우
```
1. KIS API
   ↓ 시장 데이터
2. Backend (kisApiService.js)
   ↓ 데이터 처리
3. AI Service (aiService.js)
   ↓ 분석 결과
4. Database (Supabase)
   ↓ 저장된 데이터
5. Frontend (Dashboard.jsx)
   ↓ 실시간 업데이트
6. User Interface
```

## 🚀 배포 아키텍처

### 🌐 Production Environment
```
Internet
    │
    ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Netlify   │    │   Contabo   │    │  Supabase   │
│   CDN       │    │    VPS      │    │   Cloud     │
│             │    │             │    │             │
│ Frontend    │    │ Docker      │    │ PostgreSQL  │
│ Static      │◄──►│ Backend     │◄──►│ Database    │
│ Assets      │    │ API Server  │    │ Real-time   │
│             │    │             │    │ Auth        │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 🔧 Development Environment
```
Local Machine
├── Frontend (localhost:3000)
├── Backend (localhost:8000)
└── Database (Supabase Cloud)
```

## 📦 의존성 관리

### 🎨 Frontend Dependencies
```json
{
  "dependencies": {
    "react": "^18.0.0",
    "zustand": "^4.0.0",
    "@mui/material": "^5.0.0",
    "@supabase/supabase-js": "^2.0.0",
    "vite": "^4.0.0"
  }
}
```

### 🖥️ Backend Dependencies
```json
{
  "dependencies": {
    "express": "^4.18.0",
    "cors": "^2.8.5",
    "helmet": "^6.0.0",
    "express-rate-limit": "^6.0.0",
    "@supabase/supabase-js": "^2.0.0"
  }
}
```

## 🔍 모니터링 및 로깅

### 📊 시스템 모니터링
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Frontend   │    │   Backend   │    │  Database   │
│  Monitoring │    │  Monitoring │    │  Monitoring │
│             │    │             │    │             │
│ - Console   │    │ - Health    │    │ - Supabase  │
│ - Network   │    │ - Logs      │    │ - Dashboard │
│ - Performance│    │ - Metrics   │    │ - Queries   │
└─────────────┘    └─────────────┘    └─────────────┘
```

### 📝 로그 관리
```
logs/
├── 📄 frontend.log              # Frontend Logs
├── 📄 backend.log               # Backend Logs
├── 📄 database.log              # Database Logs
├── 📄 error.log                 # Error Logs
└── 📄 access.log                # Access Logs
```

## 🔒 보안 구조

### 🛡️ 보안 레이어
```
1. Network Security
   ├── HTTPS/TLS Encryption
   ├── CORS Policy
   └── Rate Limiting

2. Application Security
   ├── Input Validation
   ├── SQL Injection Prevention
   └── XSS Protection

3. Authentication & Authorization
   ├── Supabase Auth
   ├── JWT Tokens
   └── Row Level Security (RLS)

4. Data Security
   ├── Environment Variables
   ├── API Key Management
   └── Database Encryption
```

## 🧪 테스트 구조

### 🔬 테스트 계층
```
tests/
├── 📁 unit/                     # Unit Tests
│   ├── 📄 components.test.js    # Component Tests
│   ├── 📄 services.test.js      # Service Tests
│   └── 📄 utils.test.js         # Utility Tests
│
├── 📁 integration/              # Integration Tests
│   ├── 📄 api.test.js           # API Tests
│   ├── 📄 database.test.js      # Database Tests
│   └── 📄 auth.test.js          # Authentication Tests
│
├── 📁 e2e/                      # End-to-End Tests
│   ├── 📄 login.test.js         # Login Flow
│   ├── 📄 trading.test.js       # Trading Flow
│   └── 📄 dashboard.test.js     # Dashboard Flow
│
└── 📁 performance/              # Performance Tests
    ├── 📄 load.test.js          # Load Testing
    └── 📄 stress.test.js        # Stress Testing
```

---
**📅 최종 업데이트**: 2025-05-26 23:15  
**👤 작성자**: PM AI Assistant  
**🔄 버전**: v1.0  
**📊 상태**: 완료  
**📞 참조**: PM_Master_Plan_2025-05-26.md, RAG_Knowledge_Base_Updated.md 