"""
Supabase 연동 주문 서비스 테스트 스크립트
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
async def test_supabase_order_service():
    try:
        from app.ingestion.market_api import MarketAPIClient
        from app.execution.order_service_ext import SupabaseOrderService
        from app.execution.order_model import OrderSide, OrderType, OrderStatus
        from app.db.supabase_client import SupabaseClient
        
        print("모듈 임포트 성공")
        
        # Supabase 클라이언트 생성
        supabase_client = SupabaseClient.get_instance()
        
        # 모의 API 클라이언트 생성
        mock_api_client = MarketAPIClient.create_mock_client()
        
        # SupabaseOrderService 인스턴스 생성
        order_service = SupabaseOrderService(
            api_client=mock_api_client, 
            account_number="mock_account",
            telegram_enabled=True  # 테스트를 위해 텔레그램 알림 활성화
        )
        
        print("SupabaseOrderService 인스턴스 생성 성공")
        
        # 서비스 시작
        await order_service.start()
        
        # 테스트 1: 주문 생성 및 체결 테스트
        test_signal = {
            "symbol": "BTC/USDT",
            "action": "buy",
            "quantity": 0.01,
            "price": 60000.0,
            "strategy_id": "test_strategy",
            "client_order_id": "test-order-id-1"
        }
        
        # 주문 처리
        order = await order_service.process_signal(test_signal)
        
        if order:
            print(f"\n[테스트 1] 주문 생성 성공: {order}")
            print(f"주문 ID: {order.client_order_id}")
            print(f"주문 상태: {order.status.value}")
            
            # 주문 조회 테스트
            orders = await order_service.get_order_history(symbol="BTC/USDT")
            print(f"주문 내역 수: {len(orders)}")
            
            # Supabase에서 주문 조회 테스트
            db_orders = await order_service.order_repository.get_orders_by_symbol("BTC/USDT")
            print(f"DB 주문 내역 수: {len(db_orders)}")
        else:
            print("\n[테스트 1] 주문 생성 실패")
        
        # 테스트 2: 주문 생성 후 취소 테스트
        test_signal2 = {
            "symbol": "ETH/USDT",
            "action": "buy",
            "quantity": 0.1,
            "price": 3000.0,
            "strategy_id": "test_strategy_cancel",
            "client_order_id": "test-order-id-2"
        }
        
        # 주문 처리
        order2 = await order_service.process_signal(test_signal2)
        
        if order2:
            print(f"\n[테스트 2] 주문 생성 성공: {order2}")
            print(f"주문 ID: {order2.client_order_id}")
            print(f"주문 상태: {order2.status.value}")
            
            # 주문 취소 테스트
            cancelled_orders = await order_service.cancel_orders_by_strategy("test_strategy_cancel")
            print(f"취소된 주문 수: {len(cancelled_orders)}")
            
            if cancelled_orders:
                for co in cancelled_orders:
                    print(f"취소된 주문: {co.client_order_id}, 상태: {co.status.value}")
                    
                    # Supabase에서 취소된 주문 조회
                    db_order = await order_service.order_repository.get_order_by_id(co.id)
                    if db_order:
                        print(f"DB에서 조회된 취소 주문 상태: {db_order.status.value}")
            else:
                print("취소할 주문이 없거나 이미 최종 상태인 주문입니다.")
        else:
            print("\n[테스트 2] 주문 생성 실패")
        
        # 서비스 종료
        await order_service.stop()
        print("\n주문 서비스 종료")
        
    except ImportError as e:
        print(f"모듈 임포트 오류: {e}")
    except Exception as e:
        print(f"테스트 중 오류 발생: {e}")

# 메인 함수
if __name__ == "__main__":
    asyncio.run(test_supabase_order_service()) 