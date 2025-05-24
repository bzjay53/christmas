"""
실시간 투자 데이터 텔레그램 봇 서비스
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import json
from dataclasses import dataclass, asdict
from .telegram_bot_service import TelegramBotService, TelegramConfig

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class TradingData:
    """거래 데이터 클래스"""
    symbol: str
    price: float
    volume: int
    side: str  # 'buy' or 'sell'
    timestamp: datetime
    profit_loss: float = 0.0
    status: str = 'pending'  # 'pending', 'filled', 'cancelled'

@dataclass
class PortfolioData:
    """포트폴리오 데이터 클래스"""
    total_value: float
    total_profit_loss: float
    win_rate: float
    total_trades: int
    active_positions: List[Dict]
    timestamp: datetime

class RealTimeTradingBot:
    """실시간 거래 데이터 텔레그램 봇"""
    
    def __init__(self, telegram_service: TelegramBotService):
        self.telegram_service = telegram_service
        self.is_running = False
        self.trade_history: List[TradingData] = []
        self.portfolio_cache: Optional[PortfolioData] = None
        self.last_report_time = datetime.now()
        
        # 알림 설정
        self.settings = {
            'real_time_alerts': True,
            'profit_threshold': 50000,  # 5만원 이상 수익시 알림
            'loss_threshold': -30000,   # 3만원 이상 손실시 알림
            'daily_report_time': '18:00',  # 일일 리포트 시간
            'hourly_summary': True,     # 시간별 요약
        }
    
    async def start_monitoring(self):
        """실시간 모니터링 시작"""
        if self.is_running:
            logger.warning("이미 모니터링이 실행 중입니다.")
            return
            
        self.is_running = True
        logger.info("🚀 실시간 거래 모니터링 시작")
        
        # 시작 메시지
        await self.telegram_service.send_system_message(
            "🎯 실시간 거래 모니터링이 시작되었습니다!\n"
            "📊 모든 거래 활동을 실시간으로 추적하고 있습니다."
        )
        
        # 백그라운드 태스크 시작
        tasks = [
            asyncio.create_task(self._real_time_monitoring()),
            asyncio.create_task(self._periodic_reports()),
            asyncio.create_task(self._portfolio_monitoring())
        ]
        
        try:
            await asyncio.gather(*tasks)
        except Exception as e:
            logger.error(f"모니터링 중 오류 발생: {e}")
            await self.stop_monitoring()
    
    async def stop_monitoring(self):
        """모니터링 중지"""
        self.is_running = False
        logger.info("⏹️ 실시간 거래 모니터링 중지")
        
        await self.telegram_service.send_system_message(
            "⏹️ 실시간 거래 모니터링이 중지되었습니다."
        )
    
    async def _real_time_monitoring(self):
        """실시간 데이터 모니터링 루프"""
        while self.is_running:
            try:
                # 실제 거래 데이터 수집 (시뮬레이션)
                trading_data = await self._collect_trading_data()
                
                if trading_data:
                    for trade in trading_data:
                        await self._process_trade(trade)
                
                # 1초마다 체크
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"실시간 모니터링 오류: {e}")
                await asyncio.sleep(5)  # 오류시 5초 대기
    
    async def _periodic_reports(self):
        """주기적 리포트 전송"""
        while self.is_running:
            try:
                current_time = datetime.now()
                
                # 시간별 요약 (매시 정각)
                if (current_time.minute == 0 and 
                    self.settings['hourly_summary'] and
                    current_time.hour != self.last_report_time.hour):
                    
                    await self._send_hourly_summary()
                    self.last_report_time = current_time
                
                # 일일 리포트
                if current_time.strftime("%H:%M") == self.settings['daily_report_time']:
                    await self._send_daily_report()
                
                await asyncio.sleep(60)  # 1분마다 체크
                
            except Exception as e:
                logger.error(f"주기적 리포트 오류: {e}")
                await asyncio.sleep(60)
    
    async def _portfolio_monitoring(self):
        """포트폴리오 모니터링"""
        while self.is_running:
            try:
                portfolio_data = await self._collect_portfolio_data()
                
                if portfolio_data:
                    await self._check_portfolio_alerts(portfolio_data)
                    self.portfolio_cache = portfolio_data
                
                # 30초마다 체크
                await asyncio.sleep(30)
                
            except Exception as e:
                logger.error(f"포트폴리오 모니터링 오류: {e}")
                await asyncio.sleep(30)
    
    async def _collect_trading_data(self) -> List[TradingData]:
        """거래 데이터 수집 (실제 API 연동 필요)"""
        # 시뮬레이션 데이터
        import random
        
        if random.random() < 0.1:  # 10% 확률로 새로운 거래
            symbols = ['삼성전자', 'SK하이닉스', '네이버', 'LG전자', 'POSCO홀딩스']
            sides = ['buy', 'sell']
            
            return [TradingData(
                symbol=random.choice(symbols),
                price=random.randint(50000, 300000),
                volume=random.randint(10, 100),
                side=random.choice(sides),
                timestamp=datetime.now(),
                profit_loss=random.randint(-50000, 100000),
                status='filled'
            )]
        
        return []
    
    async def _collect_portfolio_data(self) -> Optional[PortfolioData]:
        """포트폴리오 데이터 수집"""
        # 시뮬레이션 데이터
        import random
        
        return PortfolioData(
            total_value=random.randint(15000000, 25000000),
            total_profit_loss=random.randint(-500000, 1000000),
            win_rate=random.uniform(0.7, 0.95),
            total_trades=len(self.trade_history),
            active_positions=[
                {'symbol': '삼성전자', 'quantity': 100, 'profit': 150000},
                {'symbol': 'SK하이닉스', 'quantity': 50, 'profit': -30000},
            ],
            timestamp=datetime.now()
        )
    
    async def _process_trade(self, trade: TradingData):
        """거래 처리 및 알림"""
        self.trade_history.append(trade)
        
        if self.settings['real_time_alerts']:
            await self._send_trade_alert(trade)
        
        # 수익/손실 임계값 체크
        if trade.profit_loss >= self.settings['profit_threshold']:
            await self._send_profit_alert(trade)
        elif trade.profit_loss <= self.settings['loss_threshold']:
            await self._send_loss_alert(trade)
    
    async def _check_portfolio_alerts(self, portfolio: PortfolioData):
        """포트폴리오 알림 체크"""
        if not self.portfolio_cache:
            return
        
        # 급격한 변화 감지
        prev_value = self.portfolio_cache.total_value
        current_value = portfolio.total_value
        change_percent = ((current_value - prev_value) / prev_value) * 100
        
        if abs(change_percent) >= 5:  # 5% 이상 변화시 알림
            await self._send_portfolio_alert(portfolio, change_percent)
    
    async def _send_trade_alert(self, trade: TradingData):
        """거래 알림 전송"""
        side_emoji = "🟢" if trade.side == 'buy' else "🔴"
        status_emoji = {"pending": "⏳", "filled": "✅", "cancelled": "❌"}.get(trade.status, "📊")
        
        message = f"""
{status_emoji} <b>실시간 거래 알림</b>
📅 {trade.timestamp.strftime('%H:%M:%S')}

{side_emoji} <b>{trade.symbol}</b>
📈 {trade.side.upper()} {trade.volume:,}주
💰 가격: {trade.price:,.0f}원
📊 총액: {trade.price * trade.volume:,.0f}원

{f"💸 손익: {trade.profit_loss:+,.0f}원" if trade.profit_loss else ""}
        """.strip()
        
        await self.telegram_service.send_message(message)
    
    async def _send_profit_alert(self, trade: TradingData):
        """수익 알림 전송"""
        message = f"""
🎉 <b>수익 달성!</b>
📅 {trade.timestamp.strftime('%H:%M:%S')}

💰 <b>{trade.symbol}</b>에서 <b>{trade.profit_loss:+,.0f}원</b> 수익!
🚀 계속해서 좋은 성과를 보이고 있습니다!
        """.strip()
        
        await self.telegram_service.send_message(message)
    
    async def _send_loss_alert(self, trade: TradingData):
        """손실 알림 전송"""
        message = f"""
⚠️ <b>손실 발생</b>
📅 {trade.timestamp.strftime('%H:%M:%S')}

💸 <b>{trade.symbol}</b>에서 <b>{trade.profit_loss:+,.0f}원</b> 손실
🔍 리스크 관리를 위해 전략을 검토하겠습니다.
        """.strip()
        
        await self.telegram_service.send_message(message)
    
    async def _send_portfolio_alert(self, portfolio: PortfolioData, change_percent: float):
        """포트폴리오 변동 알림"""
        emoji = "📈" if change_percent > 0 else "📉"
        
        message = f"""
{emoji} <b>포트폴리오 급변동 감지</b>
📅 {portfolio.timestamp.strftime('%H:%M:%S')}

💼 총 자산: {portfolio.total_value:,.0f}원
📊 변동률: {change_percent:+.2f}%
💰 총 손익: {portfolio.total_profit_loss:+,.0f}원
🎯 승률: {portfolio.win_rate:.1%}

{f"🚨 주의깊게 모니터링하고 있습니다." if abs(change_percent) >= 10 else "📊 정상 범위 내 변동입니다."}
        """.strip()
        
        await self.telegram_service.send_message(message)
    
    async def _send_hourly_summary(self):
        """시간별 요약 전송"""
        current_hour = datetime.now().hour - 1
        recent_trades = [
            t for t in self.trade_history 
            if t.timestamp.hour == current_hour
        ]
        
        if not recent_trades:
            return
        
        total_profit = sum(t.profit_loss for t in recent_trades)
        total_volume = sum(t.volume for t in recent_trades)
        
        message = f"""
⏰ <b>시간별 거래 요약</b> ({current_hour:02d}:00-{current_hour+1:02d}:00)

📊 거래 횟수: {len(recent_trades)}건
📈 총 거래량: {total_volume:,}주
💰 시간 수익: {total_profit:+,.0f}원

💡 지속적으로 모니터링하고 있습니다.
        """.strip()
        
        await self.telegram_service.send_message(message)
    
    async def _send_daily_report(self):
        """일일 리포트 전송"""
        today_trades = [
            t for t in self.trade_history 
            if t.timestamp.date() == datetime.now().date()
        ]
        
        if not today_trades:
            return
        
        total_profit = sum(t.profit_loss for t in today_trades)
        win_trades = [t for t in today_trades if t.profit_loss > 0]
        win_rate = len(win_trades) / len(today_trades) if today_trades else 0
        
        message = f"""
📋 <b>일일 거래 리포트</b>
📅 {datetime.now().strftime('%Y-%m-%d')}

📊 총 거래: {len(today_trades)}건
🎯 승률: {win_rate:.1%}
💰 일일 수익: {total_profit:+,.0f}원

{f"🎉 오늘도 수익을 달성했습니다!" if total_profit > 0 else 
 f"💪 내일은 더 좋은 결과를 기대합니다!" if total_profit < 0 else 
 f"📊 안정적인 거래를 유지했습니다."}

🌙 좋은 밤 되세요!
        """.strip()
        
        await self.telegram_service.send_message(message)
    
    def update_settings(self, new_settings: Dict[str, Any]):
        """알림 설정 업데이트"""
        self.settings.update(new_settings)
        logger.info(f"알림 설정 업데이트: {new_settings}")

# 전역 인스턴스
_trading_bot: Optional[RealTimeTradingBot] = None

async def initialize_trading_bot(telegram_service: TelegramBotService) -> RealTimeTradingBot:
    """거래 봇 초기화"""
    global _trading_bot
    _trading_bot = RealTimeTradingBot(telegram_service)
    return _trading_bot

def get_trading_bot() -> Optional[RealTimeTradingBot]:
    """거래 봇 인스턴스 반환"""
    return _trading_bot

async def start_real_time_monitoring():
    """실시간 모니터링 시작"""
    if _trading_bot:
        await _trading_bot.start_monitoring()

async def stop_real_time_monitoring():
    """실시간 모니터링 중지"""
    if _trading_bot:
        await _trading_bot.stop_monitoring()

if __name__ == "__main__":
    # 테스트 실행
    async def test():
        from .telegram_bot_service import initialize_telegram_service
        
        # 텔레그램 서비스 초기화
        telegram_service = await initialize_telegram_service()
        if not telegram_service:
            print("텔레그램 서비스 초기화 실패")
            return
        
        # 거래 봇 초기화 및 시작
        trading_bot = await initialize_trading_bot(telegram_service)
        
        # 10초간 테스트 실행
        task = asyncio.create_task(trading_bot.start_monitoring())
        await asyncio.sleep(10)
        await trading_bot.stop_monitoring()
    
    asyncio.run(test()) 