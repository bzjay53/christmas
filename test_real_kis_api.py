"""
실제 한국투자증권 API 테스트
모의투자 계좌로 실제 API 호출 테스트
"""
import asyncio
import os
import sys
import logging
import json
from datetime import datetime

# 프로젝트 루트 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.trading.real_broker_api import KISBrokerAPI, MarketScheduler

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_kis_api():
    """실제 KIS API 테스트"""
    print("🏦 한국투자증권 API 실제 연결 테스트")
    print("=" * 50)
    
    # 환경변수 확인
    app_key = os.getenv('KIS_APP_KEY')
    app_secret = os.getenv('KIS_APP_SECRET')
    account_no = os.getenv('KIS_ACCOUNT_NO')
    is_mock = os.getenv('KIS_MOCK', 'true').lower() == 'true'
    
    if not all([app_key, app_secret, account_no]):
        print("❌ KIS API 환경변수가 설정되지 않았습니다!")
        return False
    
    print(f"📊 모드: {'모의투자' if is_mock else '실전투자'}")
    print(f"🏦 계좌: {account_no}")
    
    try:
        # KIS API 초기화
        broker = KISBrokerAPI(app_key, app_secret, account_no, is_mock)
        await broker.start()
        
        print("✅ API 연결 성공!")
        
        # 계좌 잔고 조회
        print("\n💰 계좌 잔고 조회 중...")
        balance = await broker.get_account_balance()
        
        # 응답 구조 확인
        print("🔍 API 응답 구조:")
        print(json.dumps(balance, indent=2, ensure_ascii=False))
        
        # 잔고 정보 파싱
        if balance:
            if 'output1' in balance and balance['output1']:
                output1 = balance['output1'][0] if isinstance(balance['output1'], list) else balance['output1']
                print(f"\n💵 주문가능현금: {float(output1.get('ord_psbl_cash', 0)):,.0f}원")
                print(f"📊 총평가금액: {float(output1.get('tot_evlu_amt', 0)):,.0f}원")
                print(f"📈 평가손익: {float(output1.get('evlu_pfls_amt', 0)):,.0f}원")
            elif 'output' in balance:
                output = balance['output']
                print(f"📊 잔고 정보: {json.dumps(output, indent=2, ensure_ascii=False)}")
        
        # 삼성전자 현재가 조회
        print("\n📈 삼성전자 현재가 조회 중...")
        try:
            current_price = await broker.get_current_price("005930")
            print(f"💰 삼성전자 현재가: {current_price:,.0f}원")
        except Exception as e:
            print(f"❌ 현재가 조회 실패: {e}")
        
        # 장 시간 확인
        scheduler = MarketScheduler()
        market_status = scheduler.get_market_status()
        print(f"📊 현재 장 상태: {market_status}")
        
        await broker.stop()
        print("\n✅ KIS API 테스트 완료!")
        return True
        
    except Exception as e:
        print(f"❌ API 테스트 실패: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    asyncio.run(test_kis_api()) 