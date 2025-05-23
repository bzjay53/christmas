"""
Christmas 프로젝트 - 실제 구현된 기능 테스트
"""
import asyncio
import os
import sys
import logging
from datetime import datetime

# 프로젝트 루트를 경로에 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.notification.telegram_bot_service import initialize_telegram_service, stop_telegram_service
from app.simulation.portfolio_simulator import start_simulation, stop_simulation, get_simulator

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

async def test_telegram_bot():
    """텔레그램 봇 테스트"""
    print("\n🤖 ===== 텔레그램 봇 테스트 =====")
    
    # 환경 변수 설정 안내
    bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
    chat_id = os.getenv('TELEGRAM_CHAT_ID')
    
    if not bot_token or not chat_id:
        print("❌ 텔레그램 설정이 필요합니다!")
        print("다음 환경 변수를 설정하세요:")
        print("TELEGRAM_BOT_TOKEN=당신의_봇_토큰")
        print("TELEGRAM_CHAT_ID=당신의_채팅_ID")
        print("\n📖 설정 방법:")
        print("1. @BotFather에게 /newbot 명령으로 봇 생성")
        print("2. 토큰 받기")
        print("3. 봇과 대화 시작")
        print("4. @userinfobot에게 메시지 보내서 chat_id 확인")
        return False
    else:
        print(f"✅ 텔레그램 설정 확인됨")
        telegram_service = await initialize_telegram_service()
        if telegram_service:
            print("✅ 텔레그램 봇 연결 성공!")
            return True
        else:
            print("❌ 텔레그램 봇 연결 실패")
            return False

async def test_simulation():
    """모의 투자 시뮬레이션 테스트"""
    print("\n💰 ===== 모의 투자 시스템 테스트 =====")
    
    try:
        # 시뮬레이터 시작 (1000만원 초기 자금)
        simulator = await start_simulation(10_000_000)
        print(f"✅ 모의 투자 시작 (초기 자금: 1,000만원)")
        
        # 초기 상태 확인
        summary = simulator.get_portfolio_summary()
        print(f"💵 현금: {summary['cash']:,.0f}원")
        print(f"📊 포트폴리오 가치: {summary['total_value']:,.0f}원")
        
        print("\n📈 거래 테스트 시작...")
        
        # 테스트 거래 1: 삼성전자 매수
        success = await simulator.buy_order("삼성전자", 100)
        if success:
            print("✅ 삼성전자 100주 매수 성공")
        else:
            print("❌ 삼성전자 매수 실패")
        
        await asyncio.sleep(2)
        
        # 테스트 거래 2: SK하이닉스 매수  
        success = await simulator.buy_order("SK하이닉스", 50)
        if success:
            print("✅ SK하이닉스 50주 매수 성공")
        else:
            print("❌ SK하이닉스 매수 실패")
        
        await asyncio.sleep(3)
        
        # 포트폴리오 상태 확인
        summary = simulator.get_portfolio_summary()
        print(f"\n📊 현재 포트폴리오:")
        print(f"💵 현금: {summary['cash']:,.0f}원")
        print(f"📈 포지션 가치: {summary['positions_value']:,.0f}원") 
        print(f"💰 총 자산: {summary['total_value']:,.0f}원")
        print(f"📊 평가손익: {summary['total_pnl']:,.0f}원 ({summary['return_rate']:.2f}%)")
        print(f"🔢 거래 횟수: {summary['trades_count']}회")
        
        if summary['positions']:
            print(f"\n📋 보유 포지션:")
            for symbol, pos in summary['positions'].items():
                print(f"  {symbol}: {pos['quantity']:,}주 @ {pos['avg_price']:,.0f}원 "
                      f"(현재가: {pos['current_price']:,.0f}원, 손익: {pos['unrealized_pnl']:,.0f}원)")
        
        # 가격 변동 대기
        print(f"\n⏳ 시장 가격 변동 대기 중... (10초)")
        await asyncio.sleep(10)
        
        # 가격 변동 후 상태
        summary = simulator.get_portfolio_summary()
        print(f"\n📊 가격 변동 후:")
        print(f"💰 총 자산: {summary['total_value']:,.0f}원")
        print(f"📊 평가손익: {summary['total_pnl']:,.0f}원 ({summary['return_rate']:.2f}%)")
        
        # 일부 매도
        success = await simulator.sell_order("삼성전자", 50)
        if success:
            print("✅ 삼성전자 50주 매도 성공")
        
        await asyncio.sleep(2)
        
        # 최종 상태
        final_summary = simulator.get_portfolio_summary()
        print(f"\n🎯 최종 결과:")
        print(f"💵 현금: {final_summary['cash']:,.0f}원")
        print(f"💰 총 자산: {final_summary['total_value']:,.0f}원")
        print(f"📊 총 손익: {final_summary['total_pnl']:,.0f}원")
        print(f"📈 수익률: {final_summary['return_rate']:.2f}%")
        print(f"🔢 총 거래: {final_summary['trades_count']}회")
        
        # 시뮬레이터 중지
        await stop_simulation()
        print("✅ 모의 투자 시뮬레이션 종료")
        
        return True
        
    except Exception as e:
        logger.error(f"시뮬레이션 테스트 오류: {e}")
        return False

async def test_auto_trading():
    """자동 거래 시뮬레이션 테스트"""
    print("\n🤖 ===== 자동 거래 시뮬레이션 =====")
    
    try:
        # 시뮬레이터 시작
        simulator = await start_simulation(5_000_000)  # 500만원으로 시작
        print("🚀 자동 거래 시뮬레이션 시작")
        
        # 자동 거래 실행
        await simulator.simulate_trading_day()
        
        # 결과 확인
        summary = simulator.get_portfolio_summary()
        print(f"\n🎯 자동 거래 결과:")
        print(f"💰 총 자산: {summary['total_value']:,.0f}원")
        print(f"📊 총 손익: {summary['total_pnl']:,.0f}원")
        print(f"📈 수익률: {summary['return_rate']:.2f}%")
        print(f"🔢 거래 횟수: {summary['trades_count']}회")
        
        await stop_simulation()
        return True
        
    except Exception as e:
        logger.error(f"자동 거래 테스트 오류: {e}")
        return False

async def main():
    """메인 테스트 함수"""
    print("🎄 Christmas 프로젝트 - 실제 기능 테스트")
    print("=" * 50)
    
    # 1. 텔레그램 봇 테스트
    telegram_ok = await test_telegram_bot()
    
    # 2. 모의 투자 테스트
    simulation_ok = await test_simulation() 
    
    # 3. 자동 거래 테스트
    auto_trading_ok = await test_auto_trading()
    
    # 텔레그램 서비스 종료
    await stop_telegram_service()
    
    # 결과 요약
    print("\n" + "=" * 50)
    print("🎯 테스트 결과 요약:")
    print(f"📱 텔레그램 봇: {'✅ 성공' if telegram_ok else '❌ 실패'}")
    print(f"💰 모의 투자: {'✅ 성공' if simulation_ok else '❌ 실패'}")
    print(f"🤖 자동 거래: {'✅ 성공' if auto_trading_ok else '❌ 실패'}")
    
    if telegram_ok and simulation_ok and auto_trading_ok:
        print("\n🎉 모든 테스트 성공! 실제 기능이 정상 작동합니다.")
    else:
        print("\n⚠️  일부 기능에 문제가 있습니다. 설정을 확인해주세요.")

if __name__ == "__main__":
    # 테스트 실행
    asyncio.run(main()) 