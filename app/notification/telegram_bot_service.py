"""
실제 작동하는 텔레그램 봇 알림 서비스
"""
import os
import asyncio
import logging
from datetime import datetime
from typing import Dict, Any, Optional, List
import aiohttp
from dataclasses import dataclass
import json

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class TelegramConfig:
    """텔레그램 봇 설정"""
    bot_token: str
    chat_id: str
    api_url: str = "https://api.telegram.org/bot"

class TelegramBotService:
    """실제 작동하는 텔레그램 봇 서비스"""
    
    def __init__(self, config: TelegramConfig):
        self.config = config
        self.session: Optional[aiohttp.ClientSession] = None
        self.is_running = False
        
    async def start(self):
        """서비스 시작"""
        if not self.session:
            self.session = aiohttp.ClientSession()
        self.is_running = True
        
        # 봇 연결 테스트
        if await self.test_connection():
            logger.info("✅ 텔레그램 봇 서비스 시작됨")
            await self.send_system_message("🎄 Christmas 트레이딩 봇이 시작되었습니다!")
        else:
            logger.error("❌ 텔레그램 봇 연결 실패")
            
    async def stop(self):
        """서비스 중지"""
        self.is_running = False
        if self.session:
            await self.send_system_message("🛑 Christmas 트레이딩 봇이 종료됩니다.")
            await self.session.close()
            self.session = None
        logger.info("텔레그램 봇 서비스 종료됨")
    
    async def test_connection(self) -> bool:
        """봇 연결 테스트"""
        try:
            url = f"{self.config.api_url}{self.config.bot_token}/getMe"
            async with self.session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    bot_info = data.get('result', {})
                    logger.info(f"봇 연결 성공: {bot_info.get('username', 'Unknown')}")
                    return True
                else:
                    logger.error(f"봇 연결 실패: {response.status}")
                    return False
        except Exception as e:
            logger.error(f"봇 연결 테스트 오류: {e}")
            return False
    
    async def send_message(self, text: str, parse_mode: str = "HTML") -> bool:
        """메시지 전송"""
        if not self.is_running or not self.session:
            logger.warning("텔레그램 봇이 실행되지 않음")
            return False
            
        try:
            url = f"{self.config.api_url}{self.config.bot_token}/sendMessage"
            payload = {
                "chat_id": self.config.chat_id,
                "text": text,
                "parse_mode": parse_mode
            }
            
            async with self.session.post(url, json=payload) as response:
                if response.status == 200:
                    logger.info(f"메시지 전송 성공: {text[:50]}...")
                    return True
                else:
                    error_text = await response.text()
                    logger.error(f"메시지 전송 실패: {response.status} - {error_text}")
                    return False
                    
        except Exception as e:
            logger.error(f"메시지 전송 오류: {e}")
            return False
    
    async def send_system_message(self, message: str):
        """시스템 메시지 전송"""
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        formatted_message = f"🔔 <b>시스템 알림</b>\n📅 {timestamp}\n\n{message}"
        await self.send_message(formatted_message)
    
    async def send_order_notification(self, order_data: Dict[str, Any]):
        """주문 알림 전송"""
        symbol = order_data.get('symbol', 'Unknown')
        side = order_data.get('side', 'Unknown')
        quantity = order_data.get('quantity', 0)
        price = order_data.get('price', 0)
        status = order_data.get('status', 'Unknown')
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # 상태에 따른 이모지
        status_emoji = {
            'created': '🆕',
            'filled': '✅', 
            'cancelled': '❌',
            'rejected': '🚫',
            'pending': '⏳'
        }.get(status.lower(), '📊')
        
        # 매수/매도 이모지
        side_emoji = '🟢' if side.lower() == 'buy' else '🔴'
        
        message = f"""
{status_emoji} <b>주문 {status.upper()}</b>
📅 {timestamp}

{side_emoji} <b>{symbol}</b>
📈 {side.upper()} {quantity:,}주
💰 {price:,.0f}원
📊 상태: {status}
        """.strip()
        
        await self.send_message(message)
    
    async def send_performance_alert(self, performance_data: Dict[str, Any]):
        """성과 알림 전송"""
        profit_loss = performance_data.get('profit_loss', 0)
        win_rate = performance_data.get('win_rate', 0)
        total_trades = performance_data.get('total_trades', 0)
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # 수익 상태에 따른 이모지
        pl_emoji = '📈' if profit_loss > 0 else '📉' if profit_loss < 0 else '➡️'
        
        message = f"""
📊 <b>성과 리포트</b>
📅 {timestamp}

{pl_emoji} <b>손익: {profit_loss:,.0f}원</b>
🎯 승률: {win_rate:.1f}%
🔢 총 거래: {total_trades}건

💡 지속적인 모니터링 중...
        """.strip()
        
        await self.send_message(message)
    
    async def send_risk_alert(self, risk_data: Dict[str, Any]):
        """위험 알림 전송"""
        risk_level = risk_data.get('level', 'medium')
        message = risk_data.get('message', '위험 상황 감지')
        timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        
        # 위험도에 따른 이모지
        risk_emoji = {
            'low': '🟡',
            'medium': '🟠', 
            'high': '🔴',
            'critical': '🚨'
        }.get(risk_level, '⚠️')
        
        alert_message = f"""
{risk_emoji} <b>위험 알림</b>
📅 {timestamp}

⚠️ 위험도: {risk_level.upper()}
📝 {message}

🔍 즉시 확인이 필요합니다!
        """.strip()
        
        await self.send_message(alert_message)
    
    async def send_daily_summary(self, summary_data: Dict[str, Any]):
        """일일 요약 전송"""
        date = summary_data.get('date', datetime.now().strftime("%Y-%m-%d"))
        total_profit = summary_data.get('total_profit', 0)
        trades_count = summary_data.get('trades_count', 0)
        win_rate = summary_data.get('win_rate', 0)
        
        message = f"""
📋 <b>일일 거래 요약</b>
📅 {date}

💰 총 손익: {total_profit:,.0f}원
🔢 거래 횟수: {trades_count}건
🎯 승률: {win_rate:.1f}%

{"🎉 수익 달성!" if total_profit > 0 else "💪 내일 더 열심히!" if total_profit < 0 else "📊 균형 유지"}
        """.strip()
        
        await self.send_message(message)

# 전역 인스턴스
_telegram_service: Optional[TelegramBotService] = None

def get_telegram_service() -> Optional[TelegramBotService]:
    """텔레그램 서비스 인스턴스 반환"""
    return _telegram_service

async def initialize_telegram_service():
    """텔레그램 서비스 초기화"""
    global _telegram_service
    
    # 환경 변수에서 설정 읽기
    bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
    chat_id = os.getenv('TELEGRAM_CHAT_ID')
    
    if not bot_token or not chat_id:
        logger.warning("텔레그램 봇 설정이 없습니다. TELEGRAM_BOT_TOKEN, TELEGRAM_CHAT_ID 환경 변수를 설정하세요.")
        return None
    
    config = TelegramConfig(
        bot_token=bot_token,
        chat_id=chat_id
    )
    
    _telegram_service = TelegramBotService(config)
    await _telegram_service.start()
    return _telegram_service

async def stop_telegram_service():
    """텔레그램 서비스 종료"""
    global _telegram_service
    if _telegram_service:
        await _telegram_service.stop()
        _telegram_service = None

# 편의 함수들
async def send_order_alert(order_data: Dict[str, Any]):
    """주문 알림 전송 (편의 함수)"""
    service = get_telegram_service()
    if service:
        await service.send_order_notification(order_data)

async def send_profit_alert(profit: float, symbol: str):
    """수익 알림 전송 (편의 함수)"""
    service = get_telegram_service()
    if service:
        emoji = "📈" if profit > 0 else "📉"
        message = f"{emoji} {symbol} 수익: {profit:,.0f}원"
        await service.send_system_message(message)

async def send_startup_message():
    """시작 메시지 전송"""
    service = get_telegram_service()
    if service:
        await service.send_system_message("🚀 Christmas 자동매매 시스템이 시작되었습니다!")

if __name__ == "__main__":
    # 테스트 실행
    async def test():
        await initialize_telegram_service()
        
        # 테스트 메시지들
        await send_startup_message()
        
        # 테스트 주문 알림
        test_order = {
            'symbol': '삼성전자',
            'side': 'buy',
            'quantity': 100,
            'price': 75000,
            'status': 'filled'
        }
        await send_order_alert(test_order)
        
        # 테스트 수익 알림
        await send_profit_alert(150000, '삼성전자')
        
        await stop_telegram_service()
    
    asyncio.run(test()) 