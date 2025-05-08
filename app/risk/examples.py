"""
위험 관리 모듈 사용 예제
포지션 사이징 및 손절매/이익실현 관리 예시
"""

import logging
from typing import Dict, Any

from app.risk import (
    RiskService, 
    RiskParameters,
    PositionSizer, 
    FixedAmountSizer, 
    FixedRiskSizer, 
    PercentageOfEquitySizer,
    StopLossManager, 
    FixedStopLoss, 
    TrailingStopLoss, 
    ATRStopLoss
)

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# 예제 1: 포지션 사이징 예시
def example_position_sizing():
    """포지션 사이징 전략별 예시"""
    # 테스트용 계좌 정보
    account_info = {
        "cash_balance": 10000000,  # 현금 잔고: 1000만원
        "total_equity": 15000000,  # 총 자산: 1500만원 (현금 + 포지션)
    }
    
    # 종목 및 가격 정보
    symbol = "005930"  # 삼성전자
    price = 70000  # 현재가: 7만원
    
    # 1. 고정 금액 전략
    fixed_amount_sizer = FixedAmountSizer(fixed_amount=1000000)  # 100만원 고정
    quantity = fixed_amount_sizer.calculate_position_size(symbol, price, account_info)
    logger.info(f"고정 금액 전략 (100만원): {quantity}주")
    
    # 2. 고정 리스크 전략
    fixed_risk_sizer = FixedRiskSizer(risk_per_trade=0.01, default_stop_pct=0.02)  # 1% 리스크, 2% 손절
    quantity = fixed_risk_sizer.calculate_position_size(symbol, price, account_info)
    logger.info(f"고정 리스크 전략 (자산의 1%, 손절 2%): {quantity}주")
    
    # 3. 자산 비율 전략
    percentage_sizer = PercentageOfEquitySizer(percentage=0.05)  # 자산의 5%
    quantity = percentage_sizer.calculate_position_size(symbol, price, account_info)
    logger.info(f"자산 비율 전략 (자산의 5%): {quantity}주")
    
    # 리스크 매개변수로 조정
    risk_params = {
        "fixed_amount": 2000000,  # 200만원
        "risk_per_trade": 0.02,   # 2%
        "position_percentage": 0.1  # 10%
    }
    
    logger.info("\n매개변수 조정 후:")
    quantity = fixed_amount_sizer.calculate_position_size(symbol, price, account_info, risk_params)
    logger.info(f"조정된 고정 금액 전략 (200만원): {quantity}주")
    
    quantity = fixed_risk_sizer.calculate_position_size(symbol, price, account_info, risk_params)
    logger.info(f"조정된 고정 리스크 전략 (자산의 2%): {quantity}주")
    
    quantity = percentage_sizer.calculate_position_size(symbol, price, account_info, risk_params)
    logger.info(f"조정된 자산 비율 전략 (자산의 10%): {quantity}주")


# 예제 2: 손절매/이익실현 예시
def example_stop_loss():
    """손절매/이익실현 전략별 예시"""
    # 종목 및 진입 정보
    symbol = "005930"  # 삼성전자
    entry_price = 70000  # 진입가: 7만원
    position_type = "long"  # 롱 포지션
    
    # 시장 데이터 (ATR 계산용)
    market_data = {
        "high": [69000, 70000, 71000, 72000, 71500, 70500, 69500, 70000, 71000, 72000, 
                73000, 72500, 71500, 70500, 71000, 72000, 73000, 74000, 75000, 74500],
        "low":  [68000, 68500, 69000, 70000, 70000, 69000, 68000, 68500, 69500, 70500, 
                71000, 71000, 70000, 69000, 69500, 70500, 71500, 72500, 73000, 73000],
        "close": [68500, 69000, 70000, 71000, 70500, 69500, 68500, 69500, 70500, 71500, 
                72000, 71500, 70500, 69500, 70500, 71500, 72500, 73500, 74000, 73500]
    }
    
    # 1. 고정 비율 손절매
    fixed_stop_loss = FixedStopLoss(stop_loss_pct=0.02, take_profit_pct=0.04)
    stop_loss, take_profit = fixed_stop_loss.calculate_exit_points(
        symbol, entry_price, position_type
    )
    logger.info(f"고정 비율 손절매 (손절 2%, 익절 4%): 손절가 {stop_loss}원, 익절가 {take_profit}원")
    
    # 2. 트레일링 스탑 손절매
    trailing_stop_loss = TrailingStopLoss(initial_stop_pct=0.02, trail_pct=0.01, take_profit_pct=0.04)
    stop_loss, take_profit = trailing_stop_loss.calculate_exit_points(
        symbol, entry_price, position_type
    )
    logger.info(f"트레일링 스탑 손절매 (초기 손절 2%, 트레일링 1%, 익절 4%): 손절가 {stop_loss}원, 익절가 {take_profit}원")
    
    # 가격 변동 시뮬레이션
    current_price = 72000  # 현재가: 7.2만원 (상승)
    updated_stop, updated_target = trailing_stop_loss.update_exit_points(
        symbol, entry_price, current_price, position_type, stop_loss, take_profit
    )
    logger.info(f"가격 상승 시 트레일링 스탑 업데이트: 현재가 {current_price}원, 손절가 {updated_stop}원, 익절가 {updated_target}원")
    
    # 3. ATR 기반 손절매
    atr_stop_loss = ATRStopLoss(atr_multiplier=2.0, take_profit_atr_multiplier=4.0)
    stop_loss, take_profit = atr_stop_loss.calculate_exit_points(
        symbol, entry_price, position_type, market_data
    )
    logger.info(f"ATR 기반 손절매 (ATR x2, 익절 ATR x4): 손절가 {stop_loss}원, 익절가 {take_profit}원")


# 예제 3: 위험 관리 서비스 통합 예시
def example_risk_service():
    """위험 관리 서비스 통합 사용 예시"""
    # 사용자 정의 위험 관리 매개변수
    risk_params = RiskParameters(
        position_sizing_method="fixed_risk",
        risk_per_trade=0.01,  # 거래당 자산의 1% 리스크
        stop_loss_method="trailing",
        stop_loss_pct=0.02,  # 손절매 2%
        trail_pct=0.01,  # 트레일링 1%
        take_profit_pct=0.03,  # 이익실현 3%
        max_open_positions=3  # 최대 3개 포지션
    )
    
    # 위험 관리 서비스 생성
    risk_service = RiskService(risk_params)
    
    # 테스트용 계좌 정보
    account_info = {
        "cash_balance": 10000000,  # 현금 잔고: 1000만원
        "total_equity": 15000000,  # 총 자산: 1500만원 (현금 + 포지션)
    }
    
    # 종목 정보
    symbols = {
        "005930": 70000,  # 삼성전자: 7만원
        "035720": 180000,  # 카카오: 18만원
        "035420": 350000,  # NAVER: 35만원
    }
    
    # 위험 지표 조회
    risk_metrics = risk_service.get_risk_metrics(account_info)
    logger.info(f"위험 지표: {risk_metrics}")
    
    # 첫 번째 종목 매매 시뮬레이션
    symbol = "005930"
    price = symbols[symbol]
    
    # 1. 포지션 사이즈 계산
    quantity = risk_service.calculate_position_size(symbol, price, account_info)
    logger.info(f"계산된 주문 수량: {symbol} {quantity}주")
    
    # 2. 손절매/이익실현 가격 계산
    stop_loss, take_profit = risk_service.calculate_exit_points(
        symbol, price, "long"
    )
    logger.info(f"계산된 손절/익절 가격: 손절가 {stop_loss}원, 익절가 {take_profit}원")
    
    # 3. 포지션 등록
    risk_service.register_position(
        symbol, price, quantity, "long", stop_loss, take_profit
    )
    
    # 두 번째 종목 매매 시뮬레이션
    symbol = "035720"
    price = symbols[symbol]
    
    quantity = risk_service.calculate_position_size(symbol, price, account_info)
    stop_loss, take_profit = risk_service.calculate_exit_points(
        symbol, price, "long"
    )
    risk_service.register_position(
        symbol, price, quantity, "long", stop_loss, take_profit
    )
    
    # 상승장 시뮬레이션 - 첫 번째 종목
    symbol = "005930"
    new_price = 72000  # 상승
    
    # 포지션 업데이트
    position = risk_service.update_position(symbol, new_price)
    logger.info(f"업데이트된 포지션: {position}")
    
    # 종료 신호 확인
    exit_signal = risk_service.check_exit_signals(symbol, new_price)
    if exit_signal:
        trade_record = risk_service.close_position(symbol, new_price, exit_signal)
        logger.info(f"종료된 거래: {trade_record}")
    else:
        logger.info(f"종료 신호 없음")
    
    # 하락장 시뮬레이션 - 두 번째 종목
    symbol = "035720"
    new_price = 170000  # 하락
    
    # 포지션 업데이트
    position = risk_service.update_position(symbol, new_price)
    
    # 종료 신호 확인
    exit_signal = risk_service.check_exit_signals(symbol, new_price)
    if exit_signal:
        trade_record = risk_service.close_position(symbol, new_price, exit_signal)
        logger.info(f"종료된 거래: {trade_record}")
    else:
        logger.info(f"종료 신호 없음")
    
    # 최종 위험 지표 조회
    risk_metrics = risk_service.get_risk_metrics(account_info)
    logger.info(f"최종 위험 지표: {risk_metrics}")
    
    # 일일 통계 초기화
    risk_service.reset_daily_stats()
    logger.info("일일 통계 초기화 완료")


# 메인 실행
if __name__ == "__main__":
    logger.info("===== 포지션 사이징 예제 =====")
    example_position_sizing()
    
    logger.info("\n===== 손절매/이익실현 예제 =====")
    example_stop_loss()
    
    logger.info("\n===== 위험 관리 서비스 통합 예제 =====")
    example_risk_service() 