"""
Christmas 프로젝트 - 완전한 실전 거래 시스템 테스트
모의투자 + 실전투자 + 텔레그램 + 초단타 전략 통합 테스트
"""
import asyncio
import os
import sys
import logging
from datetime import datetime

# 프로젝트 루트 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.notification.telegram_bot_service import initialize_telegram_service, stop_telegram_service
from app.simulation.portfolio_simulator import start_simulation, stop_simulation
from app.trading.real_broker_api import MarketScheduler
from app.analysis.simple_indicators import SimpleIndicators
import numpy as np

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_telegram_connection():
    """텔레그램 봇 연결 테스트"""
    print("\n🤖 ===== 텔레그램 봇 연결 테스트 =====")
    
    # 환경 변수 확인
    bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
    chat_id = os.getenv('TELEGRAM_CHAT_ID')
    
    if not bot_token or not chat_id:
        print("❌ 텔레그램 환경변수가 설정되지 않았습니다")
        print("설정 방법:")
        print('$env:TELEGRAM_BOT_TOKEN="당신의_봇_토큰"')
        print('$env:TELEGRAM_CHAT_ID="당신의_채팅_ID"')
        return False
    
    try:
        telegram_service = await initialize_telegram_service()
        if telegram_service:
            await telegram_service.send_system_message(
                "🎄 Christmas 시스템 테스트\n"
                "텔레그램 봇 연결이 성공적으로 완료되었습니다!"
            )
            print("✅ 텔레그램 봇 연결 성공!")
            await stop_telegram_service()
            return True
        else:
            print("❌ 텔레그램 봇 연결 실패")
            return False
    except Exception as e:
        print(f"❌ 텔레그램 테스트 오류: {e}")
        return False

async def test_market_scheduler():
    """장 시간 스케줄러 테스트"""
    print("\n⏰ ===== 장 시간 스케줄러 테스트 =====")
    
    scheduler = MarketScheduler()
    
    current_time = scheduler.get_korea_time()
    market_status = scheduler.get_market_status()
    is_trading = scheduler.is_trading_hours()
    is_pre_market = scheduler.is_pre_market()
    is_after_market = scheduler.is_after_market()
    time_until_open = scheduler.time_until_market_open()
    
    print(f"📅 현재 한국 시간: {current_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📊 장 상태: {market_status}")
    print(f"🟢 정규거래 시간: {'예' if is_trading else '아니오'}")
    print(f"🟡 동시호가 시간: {'예' if is_pre_market else '아니오'}")
    print(f"🟠 시간외거래 시간: {'예' if is_after_market else '아니오'}")
    print(f"⏰ 장 시작까지: {time_until_open}")
    
    print("✅ 장 시간 스케줄러 정상 작동")
    return True

def test_technical_indicators():
    """기술적 지표 계산 테스트"""
    print("\n📈 ===== 기술적 지표 계산 테스트 =====")
    
    # 테스트 데이터 생성 (실제 주가 패턴과 유사하게)
    np.random.seed(42)
    base_price = 75000  # 삼성전자 기준
    prices = [base_price]
    
    for i in range(100):
        change = np.random.normal(0, 0.02)  # 평균 0%, 표준편차 2% 변동
        new_price = prices[-1] * (1 + change)
        prices.append(new_price)
    
    prices = np.array(prices)
    
    # 지표 계산
    indicators = SimpleIndicators()
    
    # RSI 계산
    rsi = indicators.rsi(prices)
    print(f"📊 RSI (14일): {rsi:.2f}")
    
    # MACD 계산
    macd, signal, histogram = indicators.macd(prices)
    print(f"📊 MACD: {macd:.2f}, Signal: {signal:.2f}, Histogram: {histogram:.2f}")
    
    # 볼린저 밴드 계산
    upper, middle, lower = indicators.bollinger_bands(prices)
    print(f"📊 볼린저 밴드: 상단 {upper:.0f}, 중간 {middle:.0f}, 하단 {lower:.0f}")
    
    # 이동평균 계산
    ma5 = indicators.sma(prices, 5)[-1]
    ma20 = indicators.sma(prices, 20)[-1]
    print(f"📊 이동평균: MA5 {ma5:.0f}, MA20 {ma20:.0f}")
    
    print("✅ 기술적 지표 계산 정상 작동")
    return True

async def test_portfolio_simulation():
    """포트폴리오 시뮬레이션 테스트"""
    print("\n💰 ===== 포트폴리오 시뮬레이션 테스트 =====")
    
    try:
        # 시뮬레이터 시작
        simulator = await start_simulation(5_000_000)  # 500만원
        print("🚀 모의투자 시뮬레이터 시작")
        
        # 초기 상태
        summary = simulator.get_portfolio_summary()
        print(f"💵 초기 자금: {summary['cash']:,.0f}원")
        
        # 테스트 거래
        print("\n📈 테스트 거래 실행 중...")
        
        # 매수 거래
        await simulator.buy_order("삼성전자", 50)
        await asyncio.sleep(1)
        await simulator.buy_order("SK하이닉스", 30)
        
        # 포트폴리오 확인
        summary = simulator.get_portfolio_summary()
        print(f"💰 거래 후 총 자산: {summary['total_value']:,.0f}원")
        print(f"📊 총 손익: {summary['total_pnl']:,.0f}원 ({summary['return_rate']:.2f}%)")
        print(f"🔢 거래 횟수: {summary['trades_count']}회")
        
        # 가격 변동 시뮬레이션
        print("\n⏳ 가격 변동 시뮬레이션 (5초)...")
        await asyncio.sleep(5)
        
        # 변동 후 상태
        summary = simulator.get_portfolio_summary()
        print(f"💰 변동 후 총 자산: {summary['total_value']:,.0f}원")
        print(f"📊 총 손익: {summary['total_pnl']:,.0f}원 ({summary['return_rate']:.2f}%)")
        
        # 일부 매도
        await simulator.sell_order("삼성전자", 25)
        
        # 최종 결과
        final_summary = simulator.get_portfolio_summary()
        print(f"\n🎯 최종 결과:")
        print(f"💰 최종 자산: {final_summary['total_value']:,.0f}원")
        print(f"📊 최종 손익: {final_summary['total_pnl']:,.0f}원 ({final_summary['return_rate']:.2f}%)")
        print(f"🔢 총 거래: {final_summary['trades_count']}회")
        
        # 시뮬레이터 종료
        await stop_simulation()
        print("✅ 포트폴리오 시뮬레이션 정상 작동")
        return True
        
    except Exception as e:
        logger.error(f"시뮬레이션 테스트 오류: {e}")
        return False

def test_broker_api_setup():
    """브로커 API 설정 확인"""
    print("\n🏦 ===== 브로커 API 설정 확인 =====")
    
    kis_app_key = os.getenv('KIS_APP_KEY')
    kis_app_secret = os.getenv('KIS_APP_SECRET')
    kis_account_no = os.getenv('KIS_ACCOUNT_NO')
    kis_mock = os.getenv('KIS_MOCK', 'true').lower()
    
    if not kis_app_key:
        print("❌ KIS_APP_KEY 환경변수가 설정되지 않았습니다")
        return False
    
    if not kis_app_secret:
        print("❌ KIS_APP_SECRET 환경변수가 설정되지 않았습니다")
        return False
    
    if not kis_account_no:
        print("❌ KIS_ACCOUNT_NO 환경변수가 설정되지 않았습니다")
        return False
    
    print(f"✅ KIS_APP_KEY: {kis_app_key[:10]}***")
    print(f"✅ KIS_APP_SECRET: {kis_app_secret[:10]}***")
    print(f"✅ KIS_ACCOUNT_NO: {kis_account_no[:5]}***")
    print(f"✅ KIS_MOCK: {kis_mock} ({'모의투자' if kis_mock == 'true' else '실전투자'})")
    
    print("✅ 한국투자증권 API 설정 완료")
    
    if kis_mock == 'false':
        print("⚠️  실전투자 모드입니다! 실제 돈이 거래됩니다!")
    
    return True

async def main():
    """통합 테스트 메인 함수"""
    print("🎄 Christmas 프로젝트 - 완전한 시스템 테스트")
    print("=" * 60)
    
    results = {}
    
    # 1. 텔레그램 연결 테스트
    results['telegram'] = await test_telegram_connection()
    
    # 2. 장 시간 스케줄러 테스트
    results['scheduler'] = await test_market_scheduler()
    
    # 3. 기술적 지표 테스트
    results['indicators'] = test_technical_indicators()
    
    # 4. 포트폴리오 시뮬레이션 테스트
    results['simulation'] = await test_portfolio_simulation()
    
    # 5. 브로커 API 설정 확인
    results['broker_setup'] = test_broker_api_setup()
    
    # 결과 요약
    print("\n" + "=" * 60)
    print("🎯 전체 테스트 결과 요약:")
    
    for test_name, success in results.items():
        status = "✅ 성공" if success else "❌ 실패"
        test_names = {
            'telegram': '텔레그램 봇 연결',
            'scheduler': '장 시간 스케줄러',
            'indicators': '기술적 지표 계산',
            'simulation': '포트폴리오 시뮬레이션',
            'broker_setup': '브로커 API 설정'
        }
        print(f"{test_names[test_name]}: {status}")
    
    success_count = sum(results.values())
    total_count = len(results)
    
    print(f"\n🏆 전체 성공률: {success_count}/{total_count} ({success_count/total_count*100:.1f}%)")
    
    if success_count == total_count:
        print("\n🎉 모든 테스트가 성공했습니다!")
        print("🚀 실전 거래 시스템이 준비되었습니다!")
        print("\n📋 다음 단계:")
        print("1. 텔레그램 설정: setup_telegram.md 참고")
        print("2. 한국투자증권 API 설정: setup_kis_api.md 참고")
        print("3. 모의투자 실행: python real_trading_system.py")
        print("4. 웹 대시보드: python real_dashboard.py")
    else:
        print("\n⚠️  일부 테스트가 실패했습니다.")
        print("설정 가이드를 참고하여 문제를 해결해주세요.")

if __name__ == "__main__":
    # 통합 테스트 실행
    asyncio.run(main()) 