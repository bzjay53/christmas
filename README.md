# 🎄 Christmas Trading - AI 자동매매 시스템

Firebase 기반 실시간 AI 자동매매 플랫폼으로 한국투자증권 KIS API와 연동된 스마트 트레이딩 시스템입니다.

## 🎯 주요 기능

- **🤖 AI 기반 매매 분석**: OpenAI GPT-4 활용한 지능형 주식 분석
- **🔥 Firebase 실시간 DB**: 실시간 데이터 동기화 및 확장성
- **📈 KIS API 연동**: 한국투자증권 모의투자 및 실제 매매 지원
- **📱 React 웹 대시보드**: 모던한 SPA 기반 사용자 인터페이스
- **🚀 Netlify 배포**: CDN 기반 고성능 프론트엔드 호스팅
- **🔒 Firebase 인증**: 안전한 사용자 인증 및 권한 관리

## 🏗️ 시스템 아키텍처

```
React Frontend (Netlify) ←→ Firebase Auth & Firestore ←→ Python Backend
                                     ↕️
                               KIS API (한국투자증권)
                                     ↕️
                               OpenAI GPT-4 API
```

## 🌟 최신 업데이트 (2025.06.20)

✅ **Firebase 마이그레이션 완료**
- Supabase → Firebase 완전 이전
- 실시간 데이터 동기화 구현
- Firebase Admin SDK 통합

✅ **100% 테스트 성공**
- 사용자 생성: 성공
- AI 매매 시뮬레이션: 성공
- 포트폴리오 조회: 성공
- Firebase 연결: 성공

🚀 **Netlify 배포 완료**
- GitHub Actions 자동 배포 설정
- Production-ready 환경 구성
- christmas-protocol.netlify.app 배포 대기

## 🚀 Quick Start

### Prerequisites

- Docker & Docker Compose
- Git
- Ubuntu 22.04 LTS (current server)

### Installation

1. **Clone and setup**:
   ```bash
   git clone <repository-url>
   cd christmas-trading
   ./scripts/setup.sh
   ```

2. **Configure environment**:
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your API keys
   ```

3. **Start services**:
   ```bash
   docker-compose up -d
   ```

4. **Check health**:
   ```bash
   curl http://localhost:8080/health
   ```

## 📋 Configuration

### Required API Keys

Create `backend/.env` with:

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_KEY=your-supabase-key

# KIS API (Korean Investment & Securities)
KIS_APP_KEY=your-kis-app-key
KIS_APP_SECRET=your-kis-app-secret

# OpenAI
OPENAI_API_KEY=your-openai-api-key

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-telegram-bot-token

# Security
SECRET_KEY=your-secret-key-here
```

### Trading Settings

```env
# Risk Management
DEFAULT_STOP_LOSS=-0.02        # -2% stop loss
DEFAULT_TAKE_PROFIT=0.05       # +5% take profit
MAX_DAILY_TRADES=20            # Max trades per day

# AI Settings
AI_CONFIDENCE_THRESHOLD=0.7     # Min confidence for trades
QUEUE_DELAY_SECONDS=10         # Collision prevention delay
```

## 🤖 AI Learning System

### How It Works

1. **Trade Execution**: Every trade is recorded with market conditions
2. **Result Analysis**: AI analyzes success/failure patterns
3. **Pattern Learning**: Identifies what works and what doesn't
4. **Strategy Update**: Weekly model improvements
5. **Personalization**: Learns individual user preferences

### Learning Cycle

```
Week 1: Collect baseline data
Week 2: Identify failure patterns  
Week 3: Reinforce success patterns
Week 4: Update trading strategy
```

## 🚦 Collision Prevention

### Smart Queue System

- **Time Distribution**: 10-second minimum intervals
- **Price Splitting**: Large orders divided into smaller chunks
- **Priority System**: AI confidence + user performance based
- **Risk Detection**: Real-time collision monitoring

### Queue Management

```python
# Orders are automatically queued and processed
# No manual intervention needed
trade_request = {
    "stock": "005930",  # Samsung
    "action": "buy",
    "quantity": 100,
    "ai_confidence": 0.85
}
# → Automatically queued with optimal timing
```

## 📱 Telegram Bot Commands

### Basic Commands
- `/status` - Current system status
- `/portfolio` - Portfolio overview
- `/trades` - Recent trading history
- `/ai` - AI learning progress
- `/stop` - Emergency trading halt

### Advanced Commands
- `/analyze [stock_code]` - Detailed stock analysis
- `/risk [1-10]` - Set risk tolerance
- `/report` - Generate detailed report

## 🔧 Development

### Project Structure

```
christmas-trading/
├── backend/          # FastAPI application
│   ├── app/
│   │   ├── api/      # API routes
│   │   ├── core/     # Configuration & logging
│   │   ├── services/ # Business logic
│   │   └── models/   # Data models
│   └── tests/        # Test suite
├── frontend/         # React application (Netlify)
├── docker/           # Docker configuration
├── docs/             # Documentation
└── scripts/          # Utility scripts
```

### Running in Development

```bash
# Backend development
cd backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8080

# Frontend development (if needed)
cd frontend
npm install
npm run dev
```

### Testing

```bash
# Run tests
cd backend
pytest

# Run with coverage
pytest --cov=app tests/
```

## 📊 Monitoring

### Health Checks

- **API Health**: `GET /health`
- **Service Status**: `GET /api/status`
- **AI Performance**: `GET /api/ai/metrics`

### Logs

```bash
# View all logs
docker-compose logs -f

# View specific service
docker-compose logs -f christmas-api
docker-compose logs -f christmas-redis
```

### Metrics

- **Trading Success Rate**: Target 70%+
- **AI Confidence**: Average 0.75+
- **System Uptime**: 99%+
- **Queue Efficiency**: 95%+

## 🔒 Security

### Best Practices

- All API keys in environment variables
- JWT token authentication
- HTTPS only in production
- Rate limiting on all endpoints
- Input validation and sanitization

### API Security

```bash
# All requests require authentication
curl -H "Authorization: Bearer <token>" \
     http://localhost:8080/api/trades
```

## 📈 Performance

### Resource Usage

- **API Container**: 512MB RAM
- **Redis Container**: 128MB RAM  
- **Nginx Container**: 64MB RAM
- **Total**: <1GB RAM usage

### Optimization

- Redis caching for market data
- Async processing for all operations
- Connection pooling for databases
- Gzip compression for API responses

## 🚨 Troubleshooting

### Common Issues

1. **Docker containers not starting**:
   ```bash
   docker-compose down
   docker-compose up -d --build
   ```

2. **API health check fails**:
   ```bash
   docker-compose logs christmas-api
   # Check environment variables
   ```

3. **Redis connection errors**:
   ```bash
   docker-compose restart christmas-redis
   ```

4. **Trading not executing**:
   - Check API keys in `.env`
   - Verify market hours
   - Check telegram bot for error messages

### Emergency Procedures

1. **Stop all trading immediately**:
   ```bash
   # Via Telegram
   /stop
   
   # Via API
   curl -X POST http://localhost:8080/api/trading/emergency-stop
   ```

2. **System recovery**:
   ```bash
   docker-compose down
   docker-compose up -d
   ./scripts/setup.sh
   ```

## 📞 Support

- **Documentation**: `/docs` directory
- **API Docs**: `http://localhost:8080/docs`
- **Health Status**: `http://localhost:8080/health`

## 📄 License

This project is proprietary software. All rights reserved.

---

**⚠️ Important**: This is a trading system that involves real money. Always test thoroughly with paper trading before using real funds. Past performance does not guarantee future results.