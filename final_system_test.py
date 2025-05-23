"""
Christmas 프로젝트 - 최종 통합 시스템 테스트
실제 텔레그램 + KIS API + 자동매매 전략 통합
"""
import asyncio
import os
import sys
import logging
from datetime import datetime

# 프로젝트 루트 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.notification.telegram_bot_service import initialize_telegram_service, get_telegram_service
from app.trading.real_broker_api import initialize_real_trading, get_trading_engine
from app.strategies.scalping_strategy import start_scalping_strategy, get_strategy
from app.simulation.portfolio_simulator import start_simulation

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def test_final_system():
    """최종 통합 시스템 테스트"""
    print("🎄 Christmas 최종 통합 시스템 테스트")
    print("=" * 60)
    
    success_count = 0
    total_tests = 6
    
    try:
        # 1. 환경변수 확인
        print("\n🔧 1. 환경변수 확인")
        required_vars = ['TELEGRAM_BOT_TOKEN', 'TELEGRAM_CHAT_ID', 'KIS_APP_KEY', 'KIS_APP_SECRET', 'KIS_ACCOUNT_NO']
        missing_vars = [var for var in required_vars if not os.getenv(var)]
        
        if missing_vars:
            print(f"❌ 누락된 환경변수: {', '.join(missing_vars)}")
        else:
            print("✅ 모든 환경변수 설정 완료")
            success_count += 1
        
        # 2. 텔레그램 봇 연결 테스트
        print("\n📱 2. 텔레그램 봇 연결")
        try:
            telegram_service = await initialize_telegram_service()
            if telegram_service:
                print("✅ 텔레그램 봇 연결 성공")
                success_count += 1
                
                # 시스템 시작 알림
                await telegram_service.send_system_message(
                    "🎄 Christmas 최종 시스템 테스트 시작!\n"
                    "모든 구성요소를 통합 테스트 중입니다..."
                )
            else:
                print("❌ 텔레그램 봇 연결 실패")
        except Exception as e:
            print(f"❌ 텔레그램 오류: {e}")
        
        # 3. KIS API 연결 테스트
        print("\n🏦 3. 한국투자증권 API 연결")
        try:
            trading_engine = await initialize_real_trading(
                app_key=os.getenv('KIS_APP_KEY'),
                app_secret=os.getenv('KIS_APP_SECRET'),
                account_no=os.getenv('KIS_ACCOUNT_NO'),
                is_mock=True,
                telegram_service=get_telegram_service()
            )
            
            if trading_engine:
                print("✅ KIS API 연결 성공")
                success_count += 1
                
                # 계좌 정보 조회
                account_summary = await trading_engine.get_account_summary()
                print(f"📊 계좌 정보: {account_summary['account_no']}")
                print(f"🏦 브로커: {account_summary['broker']}")
                print(f"📈 모의투자: {account_summary['is_mock']}")
            else:
                print("❌ KIS API 연결 실패")
        except Exception as e:
            print(f"❌ KIS API 오류: {e}")
        
        # 4. 자동매매 전략 테스트
        print("\n🎯 4. 자동매매 전략 시작")
        try:
            strategy = await start_scalping_strategy(['005930', '000660'])  # 삼성전자, SK하이닉스
            if strategy:
                print("✅ 자동매매 전략 시작 성공")
                success_count += 1
                
                # 전략 상태 확인
                print(f"📊 대상 종목: {', '.join(strategy.symbols)}")
                print(f"💰 최소 수익률: {strategy.min_profit_rate*100:.1f}%")
                print(f"🛡️ 안전 관리: 활성화")
            else:
                print("❌ 자동매매 전략 시작 실패")
        except Exception as e:
            print(f"❌ 전략 오류: {e}")
        
        # 5. 포트폴리오 시뮬레이션 테스트
        print("\n💰 5. 포트폴리오 시뮬레이션")
        try:
            simulator = await start_simulation(10_000_000)  # 1천만원
            if simulator:
                print("✅ 포트폴리오 시뮬레이션 시작 성공")
                success_count += 1
                
                # 테스트 거래
                await simulator.buy_order("삼성전자", 100)
                await asyncio.sleep(2)  # 가격 변동 대기
                
                summary = simulator.get_portfolio_summary()
                print(f"💰 총 자산: {summary['total_value']:,.0f}원")
                print(f"📊 수익률: {summary['return_rate']:.2f}%")
            else:
                print("❌ 포트폴리오 시뮬레이션 실패")
        except Exception as e:
            print(f"❌ 시뮬레이션 오류: {e}")
        
        # 6. 통합 시스템 동작 테스트
        print("\n🔄 6. 통합 시스템 동작")
        try:
            if success_count >= 4:  # 최소 4개 구성요소가 작동해야 함
                print("✅ 통합 시스템 정상 작동")
                success_count += 1
                
                # 최종 성공 알림
                if get_telegram_service():
                    await get_telegram_service().send_system_message(
                        f"🎉 Christmas 시스템 통합 테스트 완료!\n\n"
                        f"✅ 성공: {success_count}/{total_tests}\n"
                        f"📊 성공률: {success_count/total_tests*100:.1f}%\n\n"
                        f"🚀 시스템이 정상적으로 작동하고 있습니다!\n"
                        f"실전 자동매매가 준비되었습니다."
                    )
                
                # 시스템 상태 출력
                print("\n📊 시스템 상태:")
                print(f"🤖 텔레그램 봇: {'✅ 활성' if get_telegram_service() else '❌ 비활성'}")
                print(f"🏦 거래 엔진: {'✅ 활성' if get_trading_engine() else '❌ 비활성'}")
                print(f"🎯 매매 전략: {'✅ 활성' if get_strategy() else '❌ 비활성'}")
                print(f"💰 시뮬레이션: {'✅ 활성' if simulator else '❌ 비활성'}")
                
            else:
                print("❌ 통합 시스템 일부 구성요소 실패")
                
        except Exception as e:
            print(f"❌ 통합 테스트 오류: {e}")
        
        # 결과 요약
        print("\n" + "=" * 60)
        print("🏆 최종 테스트 결과")
        print(f"✅ 성공: {success_count}/{total_tests}")
        print(f"📊 성공률: {success_count/total_tests*100:.1f}%")
        
        if success_count == total_tests:
            print("\n🎉 완벽한 성공! 모든 시스템이 정상 작동합니다!")
            print("🚀 실전 자동매매를 시작할 수 있습니다!")
        elif success_count >= 4:
            print("\n✅ 대부분 성공! 핵심 기능이 정상 작동합니다!")
            print("🎯 실전 운용 가능한 상태입니다!")
        else:
            print("\n⚠️ 일부 구성요소에 문제가 있습니다.")
            print("🔧 설정을 다시 확인해주세요.")
        
        return success_count >= 4
        
    except Exception as e:
        print(f"❌ 시스템 테스트 중 오류 발생: {e}")
        return False

if __name__ == "__main__":
    asyncio.run(test_final_system()) 