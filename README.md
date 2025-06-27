# 🎄 Christmas Trading - 글로벌 암호화폐 거래 플랫폼

Professional cryptocurrency trading interface built with React, TypeScript, and Supabase backend.

## 🔄 **바이낸스 전환 진행 중**

> **⚠️ 프로젝트 전환 알림**: 이 프로젝트는 현재 한국 주식 거래에서 **글로벌 바이낸스 암호화폐 거래**로 전환 중입니다.
> 
> - **기존 한국증권 문서**: `docs/legacy/` 폴더에 백업 완료
> - **전환 일정**: 3주 (2025-06-27 ~ 2025-07-18)
> - **현재 단계**: Phase 1 - 문서 구조 재편 및 준비

## 📊 **Current Status**

### **Phase 1: 문서 및 구조 준비 🔄 (진행 중)**
- **문서 백업**: 기존 한국증권 관련 문서 `docs/legacy/`로 이동 완료
- **구조 재편**: 바이낸스 API 중심 문서 구조 준비
- **환경 설정**: 바이낸스 API 키 설정 준비
- **브랜치 관리**: `feature/binance-migration` 브랜치 준비

### **Phase 2: API 및 데이터 전환 ⏳ (예정 - 1주차)**
- **Binance API**: 한국투자증권 API → Binance REST API
- **데이터 구조**: 주식 데이터 → 암호화폐 거래 쌍
- **실시간 데이터**: WebSocket 기반 24/7 글로벌 시장 데이터
- **Database**: PostgreSQL 스키마 암호화폐 중심으로 재설계

### **Phase 3: UI/UX 및 고급 기능 ⏳ (예정 - 2-3주차)**
- **거래 인터페이스**: 암호화폐 spot/futures 거래 지원
- **포트폴리오**: 멀티코인 포트폴리오 관리
- **DeFi 연동**: Staking, Yield Farming 추적
- **Advanced Charts**: TradingView 위젯 통합

### **Deployment Status**
- **Live Site**: [Christmas Trading](https://christmas-ruddy.vercel.app/) ✅ **Production Ready** (한국주식 버전)
- **Platform**: Vercel (Edge Network + CDN)
- **Status**: 🔄 **바이낸스 전환 중 - 기존 기능 유지**

## ✨ Features (바이낸스 전환 후)

- 🪙 Real-time cryptocurrency portfolio tracking
- 📊 Interactive Chart.js crypto visualizations
- 🤖 AI-powered crypto trading recommendations  
- 🌙 Dark theme professional UI
- 🎄 Christmas-themed design elements
- 📱 Mobile-responsive design
- 🌍 24/7 Global cryptocurrency market support
- 💰 Multi-coin portfolio management
- 🔐 Advanced security with Binance API integration

## 🛠️ Tech Stack

### **Current Architecture (전환 준비 중)**
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS with Christmas theme
- **Charts**: Chart.js with real-time crypto market data
- **API**: Binance REST API + WebSocket (전환 중)
- **Backend**: Supabase (PostgreSQL + Realtime)
- **Deployment**: Vercel (Edge Functions + CDN)
- **Bundle Size**: 695KB (optimized, 211KB gzipped)

### **Target Architecture (바이낸스 전환 완료 후)**
- **Authentication**: Supabase Auth (Google, GitHub)
- **Market Data**: Binance API (Spot, Futures, Options)
- **Advanced Features**: DeFi tracking, NFT portfolio, P2P trading
- **Mobile**: PWA support with crypto-specific features
- **Security**: HMAC SHA256 signatures, API key management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- **Binance Account** (for API access) ⭐ **NEW**
- Supabase account

### Installation

```bash
# Clone the repository
git clone https://github.com/bzjay53/christmas.git
cd christmas

# Install dependencies
npm install

# Environment Setup
cp .env.example .env.local

# Configure Binance API (NEW)
VITE_BINANCE_API_KEY=your_binance_api_key
VITE_BINANCE_SECRET_KEY=your_binance_secret_key
VITE_BINANCE_TESTNET=true  # Use testnet for development

# Configure Supabase
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Start development server
npm run dev
```

### Binance API Setup ⭐ **NEW**

1. **Create Binance Account**: [binance.com](https://binance.com)
2. **Generate API Keys**:
   - Go to Account > API Management
   - Create API Key with Spot Trading permissions
   - Enable IP restrictions for security
3. **Testnet Setup** (Development):
   - Use [testnet.binance.vision](https://testnet.binance.vision) for testing
   - Generate testnet API keys for safe development

### Legacy Korean Securities Setup (deprecated)
- 기존 한국투자증권 관련 설정은 `docs/legacy/README_KOREAN_STOCKS.md` 참조

## 📁 Project Structure

```
christmas-trading/
├── src/
│   ├── components/
│   │   ├── charts/           # Crypto charts (Chart.js)
│   │   └── trading/          # Trading interface components
│   ├── lib/
│   │   ├── binanceAPI.ts     # NEW: Binance API client
│   │   ├── cryptoService.ts  # NEW: Crypto trading service
│   │   └── supabase.ts       # Database client
│   └── services/
│       └── api.ts            # API service layer
├── docs/
│   ├── guides/               # Binance integration guides
│   ├── specifications/       # Crypto trading specs
│   └── legacy/               # 기존 한국증권 문서 백업
└── sql/                      # Database migrations
```

## 🔒 Security

### API Key Management
- **Environment Variables**: Never commit API keys to repository
- **IP Restrictions**: Enable IP whitelist in Binance API settings
- **Permissions**: Use minimal required permissions (Spot Trading only)
- **Rotation**: Regularly rotate API keys

### Trading Safety
- **Paper Trading**: Start with Binance testnet
- **Risk Management**: Implement position size limits
- **Real-time Monitoring**: Track all API calls and responses

## 📚 Documentation

### Core Documentation
- **[Binance API Guide](docs/guides/API_INTEGRATION_GUIDE.md)** - Complete Binance API integration
- **[Crypto Trading Spec](docs/specifications/TRADING_SYSTEM_SPEC.md)** - Trading system specification
- **[Database Schema](docs/architecture/SUPABASE_DATABASE_SCHEMA.md)** - Crypto-focused database design

### Legacy Documentation (한국증권)
- **[한국투자증권 API](docs/legacy/guides/KOREA_INVESTMENT_API_GUIDE.md)** - 기존 한국 API 가이드
- **[한국 주식 거래](docs/legacy/specifications/KOREAN_STOCK_TRADING_SPEC.md)** - 기존 주식 거래 명세

## 🌟 Roadmap

### Q1 2025 - Binance Integration
- [x] Project structure migration
- [ ] Binance API client implementation
- [ ] Cryptocurrency data models
- [ ] Real-time WebSocket integration

### Q2 2025 - Advanced Features
- [ ] DeFi portfolio tracking
- [ ] NFT integration
- [ ] Advanced trading indicators
- [ ] Mobile PWA optimization

### Q3 2025 - Global Expansion
- [ ] Multi-language support
- [ ] Additional exchange integrations
- [ ] Advanced charting (TradingView)
- [ ] Social trading features

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/crypto-feature`)
3. Commit changes (`git commit -am 'Add crypto feature'`)
4. Push to branch (`git push origin feature/crypto-feature`)
5. Create Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎯 Support

- **Issues**: [GitHub Issues](https://github.com/bzjay53/christmas/issues)
- **Discussions**: [GitHub Discussions](https://github.com/bzjay53/christmas/discussions)
- **Documentation**: [Project Wiki](https://github.com/bzjay53/christmas/wiki)

---

**🚀 Ready to trade cryptocurrencies with Christmas Trading!**  
**🔄 Currently transitioning from Korean stocks to global crypto trading**

*바이낸스 전환 시작: 2025-06-27*  
*예상 완료: 2025-07-18*