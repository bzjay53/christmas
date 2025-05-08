"""
브로커 모듈 사용 예제
한국투자증권 API 및 모의투자 시스템 활용 예시
"""

import os
import json
import datetime
import asyncio
import logging
from dotenv import load_dotenv

from app.broker import (
    BrokerFactory,
    KoreaInvestmentAPI,
    KoreaInvestmentCredentials,
    VirtualBroker
)

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 환경 변수 로드
load_dotenv()

# 예제 1: 한국투자증권 API 사용 예시
def example_korea_investment_api():
    """한국투자증권 API 사용 예시"""
    # .env 파일에서 API 키 로드
    app_key = os.getenv("KIS_APP_KEY")
    app_secret = os.getenv("KIS_APP_SECRET")
    account_number = os.getenv("KIS_ACCOUNT_NUMBER")
    
    if not all([app_key, app_secret, account_number]):
        logger.error("한국투자증권 API 키가 설정되지 않았습니다. .env 파일에 KIS_APP_KEY, KIS_APP_SECRET, KIS_ACCOUNT_NUMBER를 설정하세요.")
        return
    
    # 브로커 팩토리를 통한 API 클라이언트 생성
    broker = BrokerFactory.create_broker(
        broker_type="kr_investment",
        app_key=app_key,
        app_secret=app_secret,
        account_number=account_number,
        is_virtual=True  # 모의투자 사용
    )
    
    try:
        # 토큰 발급
        token = broker.ensure_token()
        logger.info(f"토큰 발급 성공: {token[:10]}...")
        
        # 종목 현재가 조회
        symbol = "005930"  # 삼성전자
        price_data = broker.get_stock_price(symbol)
        logger.info(f"현재가 조회 결과: {json.dumps(price_data, indent=2, ensure_ascii=False)}")
        
        # 계좌 잔고 조회
        balance_data = broker.get_account_balance()
        logger.info(f"계좌 잔고 조회 결과: {json.dumps(balance_data, indent=2, ensure_ascii=False)}")
        
        # 일별 시세 조회
        today = datetime.datetime.now().strftime("%Y%m%d")
        week_ago = (datetime.datetime.now() - datetime.timedelta(days=7)).strftime("%Y%m%d")
        daily_data = broker.get_stock_daily(symbol, start_date=week_ago, end_date=today)
        logger.info(f"일별 시세 조회 결과: {json.dumps(daily_data, indent=2, ensure_ascii=False)}")
        
    except Exception as e:
        logger.error(f"API 호출 중 오류 발생: {str(e)}")


# 예제 2: 실시간 시세 수신 예시
async def example_websocket():
    """실시간 시세 수신 예시"""
    app_key = os.getenv("KIS_APP_KEY")
    app_secret = os.getenv("KIS_APP_SECRET")
    account_number = os.getenv("KIS_ACCOUNT_NUMBER")
    
    if not all([app_key, app_secret, account_number]):
        logger.error("한국투자증권 API 키가 설정되지 않았습니다.")
        return
    
    # 직접 API 클라이언트 생성
    credentials = KoreaInvestmentCredentials(
        app_key=app_key,
        app_secret=app_secret,
        account_number=account_number,
        is_virtual=True
    )
    api_client = KoreaInvestmentAPI(credentials)
    
    # 웹소켓 콜백 함수
    def on_message(data):
        logger.info(f"실시간 데이터 수신: {json.dumps(data, ensure_ascii=False)}")
    
    try:
        # 삼성전자 실시간 시세 수신
        symbol = "005930"
        await api_client.connect_websocket(symbol, on_message)
    except Exception as e:
        logger.error(f"웹소켓 연결 오류: {str(e)}")


# 예제 3: 모의투자 시스템 사용 예시
def example_virtual_broker():
    """모의투자 시스템 사용 예시"""
    # 모의투자 브로커 생성
    virtual_broker = VirtualBroker(initial_balance=50000000.0)  # 5천만원 초기 잔고
    
    # 종목별 현재가 설정
    symbols = {
        "005930": 70000,  # 삼성전자
        "035720": 180000,  # 카카오
        "035420": 350000,  # NAVER
    }
    
    # 가격 업데이트
    for symbol, price in symbols.items():
        virtual_broker.update_price(symbol, price)
        logger.info(f"{symbol} 가격 설정: {price}원")
    
    # 계좌 정보 확인
    logger.info(f"계좌 정보: {virtual_broker.get_account_balance()}")
    
    try:
        # 매수 주문
        symbol = "005930"
        buy_price = 70000
        quantity = 10
        order_id = virtual_broker.place_order(symbol, "buy", buy_price, quantity)
        logger.info(f"매수 주문 실행: {symbol} {quantity}주 @ {buy_price}원 (주문 ID: {order_id})")
        
        # 계좌 정보 확인
        logger.info(f"매수 후 계좌 정보: {virtual_broker.get_account_balance()}")
        
        # 가격 변동 시뮬레이션
        new_price = 72000
        virtual_broker.update_price(symbol, new_price)
        logger.info(f"{symbol} 가격 변동: {new_price}원")
        
        # 계좌 정보 확인 (손익 변동)
        logger.info(f"가격 변동 후 계좌 정보: {virtual_broker.get_account_balance()}")
        
        # 매도 주문
        sell_price = 72000
        order_id = virtual_broker.place_order(symbol, "sell", sell_price, quantity)
        logger.info(f"매도 주문 실행: {symbol} {quantity}주 @ {sell_price}원 (주문 ID: {order_id})")
        
        # 최종 계좌 정보 확인
        logger.info(f"매도 후 계좌 정보: {virtual_broker.get_account_balance()}")
        
        # 주문 내역 확인
        logger.info(f"주문 내역: {virtual_broker.get_order_history()}")
        
    except Exception as e:
        logger.error(f"모의투자 오류: {str(e)}")


# 메인 실행
if __name__ == "__main__":
    logger.info("===== 한국투자증권 API 예제 =====")
    example_korea_investment_api()
    
    logger.info("\n===== 모의투자 시스템 예제 =====")
    example_virtual_broker()
    
    # 웹소켓 예제는 비동기 함수이므로 이벤트 루프에서 실행
    logger.info("\n===== 실시간 시세 예제 =====")
    try:
        asyncio.run(example_websocket())
    except KeyboardInterrupt:
        logger.info("프로그램 종료") 