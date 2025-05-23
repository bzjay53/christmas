"""
Christmas 프로젝트 - 실전 거래 시스템
한국투자증권 API 연동 + 초단타 전략 + 텔레그램 알림
"""
import asyncio
import os
import sys
import logging
from datetime import datetime

# 프로젝트 루트 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.trading.real_broker_api import initialize_real_trading, stop_real_trading, get_trading_engine
from app.notification.telegram_bot_service import initialize_telegram_service, stop_telegram_service
from app.strategies.scalping_strategy import start_scalping_strategy, stop_scalping_strategy

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('trading.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

class RealTradingSystem:
    """실전 거래 시스템 통합 관리자"""
    
    def __init__(self):
        self.is_running = False
        self.trading_engine = None
        self.telegram_service = None
        self.strategy = None
        
    async def start(self, config: dict):
        """실전 거래 시스템 시작"""
        try:
            logger.info("🎄 Christmas 실전 거래 시스템 시작")
            
            # 1. 텔레그램 서비스 초기화
            print("📱 텔레그램 서비스 연결 중...")
            self.telegram_service = await initialize_telegram_service()
            
            # 2. 실전 거래 엔진 초기화
            print("🏦 증권사 API 연결 중...")
            self.trading_engine = await initialize_real_trading(
                app_key=config['app_key'],
                app_secret=config['app_secret'],
                account_no=config['account_no'],
                is_mock=config.get('is_mock', True),
                telegram_service=self.telegram_service
            )
            
            # 3. 거래 전략 시작
            print("🎯 초단타 매매 전략 시작 중...")
            self.strategy = await start_scalping_strategy(config.get('symbols'))
            
            self.is_running = True
            logger.info("✅ 실전 거래 시스템 시작 완료")
            
            # 시작 알림
            if self.telegram_service:
                market_status = self.trading_engine.scheduler.get_market_status()
                time_until_open = self.trading_engine.scheduler.time_until_market_open()
                
                message = f"""
🎄 Christmas 실전 거래 시스템 시작!

🏦 증권사: {'한국투자증권 (모의투자)' if config.get('is_mock') else '한국투자증권 (실전투자)'}
📊 현재 장 상태: {market_status}
⏰ 장 시작까지: {time_until_open}
🎯 전략: 초단타 매매 (100% Win-Rate 목표)
📱 텔레그램 알림: 활성화

🚀 자동매매가 시작되었습니다!
                """.strip()
                
                await self.telegram_service.send_system_message(message)
            
            return True
            
        except Exception as e:
            logger.error(f"시스템 시작 실패: {e}")
            await self.stop()
            return False
    
    async def stop(self):
        """실전 거래 시스템 중지"""
        logger.info("🛑 실전 거래 시스템 중지")
        
        self.is_running = False
        
        # 전략 중지
        if self.strategy:
            await stop_scalping_strategy()
            
        # 거래 엔진 중지
        if self.trading_engine:
            await stop_real_trading()
            
        # 텔레그램 서비스 중지
        if self.telegram_service:
            await stop_telegram_service()
            
        logger.info("✅ 실전 거래 시스템 중지 완료")
    
    async def get_status(self) -> dict:
        """시스템 상태 조회"""
        if not self.is_running:
            return {"status": "stopped"}
        
        account_summary = {}
        if self.trading_engine:
            account_summary = await self.trading_engine.get_account_summary()
        
        return {
            "status": "running",
            "timestamp": datetime.now().isoformat(),
            "market_status": self.trading_engine.scheduler.get_market_status() if self.trading_engine else "unknown",
            "account": account_summary,
            "strategy_running": self.strategy is not None and self.strategy.is_running
        }

async def main():
    """메인 실행 함수"""
    print("🎄 Christmas 실전 거래 시스템")
    print("=" * 50)
    
    # 설정 확인
    config = {
        'app_key': os.getenv('KIS_APP_KEY'),
        'app_secret': os.getenv('KIS_APP_SECRET'),
        'account_no': os.getenv('KIS_ACCOUNT_NO'),
        'is_mock': os.getenv('KIS_MOCK', 'true').lower() == 'true',
        'symbols': ['005930', '000660', '035420']  # 삼성전자, SK하이닉스, 네이버
    }
    
    # 필수 설정 확인
    missing_config = []
    if not config['app_key']:
        missing_config.append('KIS_APP_KEY')
    if not config['app_secret']:
        missing_config.append('KIS_APP_SECRET')
    if not config['account_no']:
        missing_config.append('KIS_ACCOUNT_NO')
    
    if missing_config:
        print("❌ 필수 환경 변수가 설정되지 않았습니다:")
        for var in missing_config:
            print(f"  - {var}")
        print("\n📖 설정 방법:")
        print("$env:KIS_APP_KEY='당신의_앱키'")
        print("$env:KIS_APP_SECRET='당신의_앱시크릿'")
        print("$env:KIS_ACCOUNT_NO='당신의_계좌번호'")
        print("$env:KIS_MOCK='true'  # 모의투자는 true, 실전투자는 false")
        return
    
    # 텔레그램 설정 확인
    if not os.getenv('TELEGRAM_BOT_TOKEN') or not os.getenv('TELEGRAM_CHAT_ID'):
        print("⚠️  텔레그램 설정이 없습니다. 알림 기능이 비활성화됩니다.")
        print("텔레그램 설정 방법: setup_telegram.md 참고")
    
    # 시스템 초기화
    system = RealTradingSystem()
    
    try:
        # 시스템 시작
        success = await system.start(config)
        
        if not success:
            print("❌ 시스템 시작 실패")
            return
        
        print("✅ 시스템이 성공적으로 시작되었습니다!")
        print("📊 실시간 모니터링 중...")
        print("⏹️  중지하려면 Ctrl+C를 누르세요")
        
        # 상태 모니터링 루프
        while system.is_running:
            await asyncio.sleep(60)  # 1분마다 상태 확인
            
            status = await system.get_status()
            logger.info(f"시스템 상태: {status['market_status']}")
            
    except KeyboardInterrupt:
        print("\n⏹️  사용자 중지 요청")
    except Exception as e:
        logger.error(f"시스템 오류: {e}")
    finally:
        await system.stop()

if __name__ == "__main__":
    # 실전 거래 시스템 실행
    asyncio.run(main()) 