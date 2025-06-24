# 🤖 Christmas Trading - 텔레그램 봇 시스템 명세서

## 📋 문서 정보
- **문서명**: 텔레그램 봇 시스템 명세서 (Telegram Bot System Specification)
- **작성일**: 2025-06-24
- **버전**: v1.0
- **우선순위**: HIGH
- **상태**: 설계 단계 (Design Phase)

## 🎯 목적
Christmas Trading 플랫폼의 실시간 거래 알림, 수익률 분석, 총자산 현황을 텔레그램 봇을 통해 자동 전송하는 시스템을 설계합니다.

## 🏗️ 시스템 아키텍처

### 1. 전체 시스템 구조
```
텔레그램 봇 시스템 구조:
┌─────────────────────────────────────────────────────────────┐
│                    Frontend (React)                        │
├─────────────────────────────────────────────────────────────┤
│  거래 이벤트 발생 │ 수익률 계산 │ 포트폴리오 변화 감지        │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                 Notification Service                       │
├─────────────────────────────────────────────────────────────┤
│  telegramService.ts │ notificationManager.ts │ webhooks.ts │
│  - 메시지 포맷팅    │ - 알림 큐 관리        │ - 이벤트 처리│
│  - Bot API 호출     │ - 사용자별 설정       │ - 실시간 감지│
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                 Telegram Bot API                           │
├─────────────────────────────────────────────────────────────┤
│      Bot Token       │    Chat ID      │   Message Queue   │
│   - 인증 및 권한     │  - 사용자 식별  │  - 메시지 대기열  │
│   - Rate Limiting    │  - 그룹 채팅    │  - 배치 처리     │
└─────────────────────────────────────────────────────────────┘
                             │
                             ▼
┌─────────────────────────────────────────────────────────────┐
│                    User's Telegram                         │
├─────────────────────────────────────────────────────────────┤
│         개인 채팅         │        그룹 채팅                │
│      - 실시간 알림        │      - 공유 알림                │
│      - 명령어 처리        │      - 토론 기능                │
└─────────────────────────────────────────────────────────────┘
```

## 🤖 봇 기능 명세

### 2. 핵심 기능 목록
```typescript
interface TelegramBotFeatures {
  realTimeAlerts: {
    tradeNotification: boolean;     // 거래 체결 알림
    profitLossUpdates: boolean;     // 수익률 변화 알림
    portfolioChanges: boolean;      // 포트폴리오 구성 변화
    marketAlerts: boolean;          // 시장 주요 이벤트
  };
  commands: {
    '/status': 'portfolio-summary'; // 포트폴리오 현황
    '/trades': 'recent-trades';     // 최근 거래 내역
    '/profit': 'profit-analysis';   // 수익률 분석
    '/settings': 'notification-config'; // 알림 설정
    '/help': 'command-guide';       // 도움말
  };
  scheduling: {
    dailyReport: '09:00 KST';      // 일일 요약 보고서
    weeklyAnalysis: 'Sunday 18:00'; // 주간 분석 보고서
    monthlyReview: 'Last day 20:00'; // 월간 리뷰
  };
}
```

### 3. 메시지 템플릿 시스템
```typescript
// 거래 체결 알림 템플릿
const tradeNotificationTemplate = `
🎄 **Christmas Trading** 거래 체결

📊 **종목**: {stockName} ({stockCode})
💰 **거래**: {orderType} {quantity}주
💵 **체결가**: {executionPrice:,}원
📈 **수익률**: {profitLoss:+.2f}% ({profitAmount:+,}원)

⏰ **시간**: {timestamp}
🏦 **총자산**: {totalAsset:,}원
📋 **상세**: /trades 명령어로 확인

{additionalInfo}
`;

// 일일 리포트 템플릿  
const dailyReportTemplate = `
🌅 **일일 포트폴리오 요약** ({date})

💼 **총자산**: {totalAsset:,}원 ({dailyChange:+.2f}%)
📊 **일일 수익**: {dailyProfit:+,}원
📈 **수익률**: {totalProfitRate:+.2f}%

**🔥 TOP 종목**:
{topStocks}

**📉 관심 종목**:
{watchlistStocks}

**⚡ 오늘의 거래**:
• 총 {tradeCount}건
• 매수: {buyCount}건 / 매도: {sellCount}건

🎯 **AI 추천**: {aiRecommendation}

자세한 분석: /profit 명령어 사용
`;
```

## 📱 텔레그램 봇 구현

### 4. 봇 서비스 모듈
```typescript
// telegramService.ts
interface TelegramConfig {
  botToken: string;
  chatId: string;
  parseMode: 'HTML' | 'Markdown';
  disableNotification?: boolean;
}

interface NotificationEvent {
  type: 'trade' | 'profit' | 'portfolio' | 'market' | 'system';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  userId: string;
  data: Record<string, any>;
  timestamp: Date;
  template: string;
}

export class TelegramBotService {
  private botToken: string;
  private baseURL: string;
  private messageQueue: NotificationEvent[] = [];

  constructor(botToken: string) {
    this.botToken = botToken;
    this.baseURL = `https://api.telegram.org/bot${botToken}`;
  }

  // 메시지 전송
  async sendMessage(
    chatId: string, 
    message: string, 
    options?: MessageOptions
  ): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseURL}/sendMessage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: chatId,
          text: message,
          parse_mode: options?.parseMode || 'Markdown',
          disable_notification: options?.silent || false,
          reply_markup: options?.keyboard
        })
      });

      return response.ok;
    } catch (error) {
      console.error('텔레그램 메시지 전송 실패:', error);
      return false;
    }
  }

  // 거래 알림 전송
  async sendTradeNotification(
    chatId: string, 
    tradeData: TradeNotificationData
  ): Promise<boolean> {
    const message = this.formatTradeMessage(tradeData);
    return this.sendMessage(chatId, message);
  }

  // 포트폴리오 요약 전송
  async sendPortfolioSummary(
    chatId: string, 
    portfolioData: PortfolioData
  ): Promise<boolean> {
    const message = this.formatPortfolioMessage(portfolioData);
    return this.sendMessage(chatId, message);
  }

  // 메시지 포맷팅
  private formatTradeMessage(data: TradeNotificationData): string {
    return tradeNotificationTemplate
      .replace(/{(\w+)}/g, (match, key) => {
        return data[key]?.toString() || match;
      });
  }
}
```

### 5. 알림 관리자
```typescript
// notificationManager.ts
export class NotificationManager {
  private telegramBot: TelegramBotService;
  private userSubscriptions: Map<string, UserNotificationSettings> = new Map();
  private rateLimiter: Map<string, number> = new Map();

  constructor(botToken: string) {
    this.telegramBot = new TelegramBotService(botToken);
  }

  // 거래 이벤트 처리
  async handleTradeEvent(tradeEvent: TradeEvent): Promise<void> {
    const affectedUsers = await this.getAffectedUsers(tradeEvent);
    
    for (const userId of affectedUsers) {
      const settings = this.userSubscriptions.get(userId);
      
      if (this.shouldSendNotification(userId, 'trade', settings)) {
        await this.sendTradeNotification(userId, tradeEvent);
        this.updateRateLimit(userId);
      }
    }
  }

  // 포트폴리오 변화 감지
  async handlePortfolioChange(portfolioEvent: PortfolioEvent): Promise<void> {
    const { userId, changes } = portfolioEvent;
    
    // 중요한 변화만 알림 (예: 5% 이상 수익률 변화)
    if (Math.abs(changes.profitPercentChange) >= 5) {
      const settings = this.userSubscriptions.get(userId);
      
      if (this.shouldSendNotification(userId, 'portfolio', settings)) {
        await this.sendPortfolioChangeNotification(userId, changes);
      }
    }
  }

  // 스케줄된 리포트 전송
  async sendScheduledReports(): Promise<void> {
    const now = new Date();
    const hour = now.getHours();
    
    // 매일 오전 9시 일일 리포트
    if (hour === 9) {
      await this.sendDailyReports();
    }
    
    // 일요일 오후 6시 주간 분석
    if (now.getDay() === 0 && hour === 18) {
      await this.sendWeeklyAnalysis();
    }
  }

  // Rate Limiting 체크
  private shouldSendNotification(
    userId: string, 
    type: string, 
    settings?: UserNotificationSettings
  ): boolean {
    if (!settings?.enabled) return false;
    
    const lastSent = this.rateLimiter.get(`${userId}:${type}`);
    const cooldown = this.getCooldownPeriod(type);
    
    return !lastSent || (Date.now() - lastSent) > cooldown;
  }
}
```

## 🔧 기술 구현 사항

### 6. 환경변수 설정
```env
# 텔레그램 봇 설정
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here
TELEGRAM_WEBHOOK_URL=https://your-domain.com/api/telegram/webhook

# 알림 설정
NOTIFICATION_RATE_LIMIT_MS=30000  # 30초 제한
DAILY_REPORT_TIME=09:00
WEEKLY_REPORT_DAY=0  # 일요일
URGENT_ALERT_THRESHOLD=10  # 10% 변화시 긴급 알림
```

### 7. 웹훅 처리
```typescript
// api/telegram/webhook.ts
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const update = req.body;
    
    if (update.message) {
      await handleIncomingMessage(update.message);
    }
    
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('웹훅 처리 오류:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}

async function handleIncomingMessage(message: any) {
  const chatId = message.chat.id;
  const text = message.text;

  if (text.startsWith('/')) {
    await handleCommand(chatId, text);
  }
}

async function handleCommand(chatId: string, command: string) {
  const bot = new TelegramBotService(process.env.TELEGRAM_BOT_TOKEN!);
  
  switch (command) {
    case '/status':
      const portfolio = await getPortfolioSummary(chatId);
      await bot.sendPortfolioSummary(chatId, portfolio);
      break;
      
    case '/trades':
      const trades = await getRecentTrades(chatId);
      await bot.sendTradeHistory(chatId, trades);
      break;
      
    case '/help':
      await bot.sendMessage(chatId, getHelpMessage());
      break;
      
    default:
      await bot.sendMessage(chatId, '알 수 없는 명령어입니다. /help를 사용해보세요.');
  }
}
```

## 📊 실시간 데이터 통합

### 8. 거래 시스템과 연동
```typescript
// 기존 거래 시스템에 텔레그램 알림 추가
import { notificationManager } from '../services/notificationManager';

// safePlaceOrder 함수 수정
export const safePlaceOrder = async (
  userId: string, 
  stockCode: string, 
  orderType: 'buy' | 'sell', 
  quantity: number, 
  price?: number
): Promise<TradeResult> => {
  try {
    // ... 기존 거래 로직 ...

    if (result.success) {
      // 🤖 텔레그램 알림 전송
      await notificationManager.handleTradeEvent({
        userId,
        type: 'trade_executed',
        data: {
          stockCode,
          stockName: await getStockName(stockCode),
          orderType,
          quantity,
          executionPrice: result.executionPrice,
          timestamp: new Date(),
          totalAsset: await getTotalAsset(userId),
          profitLoss: result.profitLoss
        }
      });
    }

    return result;
  } catch (error) {
    // 에러 알림도 전송
    await notificationManager.handleErrorEvent({
      userId,
      error: error.message,
      context: 'trade_execution'
    });
    
    throw error;
  }
};
```

### 9. 스케줄러 시스템
```typescript
// scheduler.ts - 정기 리포트 전송
export class ReportScheduler {
  private notificationManager: NotificationManager;

  constructor(notificationManager: NotificationManager) {
    this.notificationManager = notificationManager;
    this.setupSchedulers();
  }

  private setupSchedulers(): void {
    // 매일 오전 9시 일일 리포트
    setInterval(async () => {
      const now = new Date();
      if (now.getHours() === 9 && now.getMinutes() === 0) {
        await this.sendDailyReports();
      }
    }, 60000); // 1분마다 체크

    // 실시간 포트폴리오 모니터링 (5분 간격)
    setInterval(async () => {
      await this.checkPortfolioChanges();
    }, 300000); // 5분
  }

  private async sendDailyReports(): Promise<void> {
    const activeUsers = await this.getActiveUsers();
    
    for (const userId of activeUsers) {
      const portfolioData = await this.getPortfolioData(userId);
      const dailyAnalysis = await this.generateDailyAnalysis(portfolioData);
      
      await this.notificationManager.sendDailyReport(userId, dailyAnalysis);
    }
  }
}
```

## 🛡️ 보안 및 개인정보 보호

### 10. 보안 고려사항
- **봇 토큰 보안**: 환경변수로 안전하게 관리
- **사용자 인증**: Chat ID 기반 사용자 식별
- **데이터 암호화**: 민감한 포트폴리오 정보 암호화
- **Rate Limiting**: 스팸 방지 및 API 한도 관리
- **권한 관리**: 사용자별 알림 설정 및 권한

### 11. 개인정보 처리
```typescript
interface UserPrivacySettings {
  sharePortfolioValue: boolean;    // 총자산 공유 여부
  shareTradeDetails: boolean;      // 거래 세부사항 공유
  allowAnalytics: boolean;         // 분석 데이터 사용 동의
  dataRetentionDays: number;       // 데이터 보관 기간
}
```

## 📈 향후 확장 계획

### 12. 고도화 기능
1. **AI 기반 개인화**: 사용자별 맞춤 알림
2. **소셜 기능**: 친구와 수익률 비교
3. **그룹 채팅**: 투자 토론 및 정보 공유
4. **멀티미디어**: 차트 이미지 자동 생성
5. **다국어 지원**: 영어, 중국어 등 다국어 봇

---

## 📝 변경 이력
- **v1.0** (2025-06-24): 초기 텔레그램 봇 시스템 명세서 작성
- 실시간 알림 시스템 설계 완료
- 메시지 템플릿 및 명령어 체계 정의
- 보안 및 개인정보 보호 정책 수립

## 🔗 관련 문서
- [거래 시스템 명세서](TRADING_SYSTEM_SPEC.md)
- [사용자 인증 시스템 명세서](USER_AUTHENTICATION_SPEC.md)
- [위험 관리 명세서](RISK_MANAGEMENT_SPEC.md)
- [API 통합 가이드](../guides/API_INTEGRATION_GUIDE.md)

---
*이 문서는 Christmas Trading 프로젝트의 텔레그램 봇 시스템 핵심 명세서입니다.*