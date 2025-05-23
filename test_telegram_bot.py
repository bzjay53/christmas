"""
텔레그램 봇 알림 테스트 스크립트
"""
import sys
import os
import asyncio
import logging
from datetime import datetime

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# 현재 디렉토리를 Python 경로에 추가
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

# 비동기 테스트 함수
async def test_telegram_bot():
    try:
        from app.notification.telegram_bot import TelegramBot
        from app.execution.order_model import Order, OrderSide, OrderType, OrderStatus
        
        print("모듈 임포트 성공")
        
        # 텔레그램 봇 인스턴스 생성
        telegram_bot = TelegramBot.get_instance()
        
        print("텔레그램 봇 인스턴스 생성 성공")
        
        # 시스템 알림 테스트
        await telegram_bot.send_system_notification(
            title="시스템 시작 알림",
            content="Christmas 트레이딩 시스템이 시작되었습니다.",
            level="info"
        )
        
        print("시스템 알림 전송 완료")
        
        # 테스트 주문 객체 생성
        test_order = Order(
            client_order_id="test-order-123",
            symbol="BTC/USDT",
            side=OrderSide.BUY,
            order_type=OrderType.LIMIT,
            quantity=0.01,
            price=60000.0,
            status=OrderStatus.PENDING,
            strategy_id="test_strategy"
        )
        
        # 주문 생성 알림 테스트
        await telegram_bot.send_order_notification(test_order, "created")
        
        print("주문 생성 알림 전송 완료")
        
        # 주문 상태 변경
        test_order.status = OrderStatus.FILLED
        test_order.filled_quantity = 0.01
        test_order.filled_price = 59800.0
        
        # 주문 체결 알림 테스트
        await telegram_bot.send_order_notification(test_order, "filled")
        
        print("주문 체결 알림 전송 완료")
        
        # 성능 지표 알림 테스트
        test_metrics = {
            "symbol": "BTC/USDT",
            "strategy_id": "test_strategy",
            "total_trades": 120,
            "win_count": 75,
            "loss_count": 45,
            "win_rate": 62.5,
            "profit_loss": 1250.75,
            "max_drawdown": -250.5,
            "sharpe_ratio": 1.8,
            "period_start": datetime.now(),
            "period_end": datetime.now()
        }
        
        await telegram_bot.send_performance_notification(test_metrics)
        
        print("성능 지표 알림 전송 완료")
        
        # 가격 알림 테스트
        await telegram_bot.send_alert_notification(
            alert_type="price",
            symbol="BTC/USDT",
            price=61500.0,
            condition="above",
            threshold=60000.0
        )
        
        print("가격 알림 전송 완료")
        
        print("\n모든 테스트 완료")
        
    except ImportError as e:
        print(f"모듈 임포트 오류: {e}")
    except Exception as e:
        print(f"테스트 중 오류 발생: {e}")

# 메인 함수
if __name__ == "__main__":
    asyncio.run(test_telegram_bot()) 