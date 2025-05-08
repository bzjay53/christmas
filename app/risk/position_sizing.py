"""
Christmas 프로젝트 - 포지션 사이징 모듈
거래 시 적절한, 구매 수량을 결정하는 다양한 전략을 제공
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
import logging

logger = logging.getLogger(__name__)

class PositionSizer(ABC):
    """포지션 사이징 인터페이스"""
    
    @abstractmethod
    def calculate_position_size(self, 
                               symbol: str, 
                               price: float, 
                               account_info: Dict[str, Any],
                               risk_params: Optional[Dict[str, Any]] = None) -> int:
        """
        주문할 주식 수량을 계산
        
        Args:
            symbol: 종목코드
            price: 현재 가격
            account_info: 계좌 정보
            risk_params: 위험 매개변수
            
        Returns:
            주문 수량 (정수)
        """
        pass


class FixedAmountSizer(PositionSizer):
    """고정 금액 기반 포지션 사이징 전략"""
    
    def __init__(self, fixed_amount: float = 1000000.0):
        """
        고정 금액 사이저 초기화
        
        Args:
            fixed_amount: 거래당 고정 금액 (기본값: 100만원)
        """
        self.fixed_amount = fixed_amount
    
    def calculate_position_size(self, 
                               symbol: str, 
                               price: float, 
                               account_info: Dict[str, Any],
                               risk_params: Optional[Dict[str, Any]] = None) -> int:
        """
        주문할 주식 수량을 계산 (고정 금액 방식)
        
        Args:
            symbol: 종목코드
            price: 현재 가격
            account_info: 계좌 정보
            risk_params: 위험 매개변수
            
        Returns:
            주문 수량 (정수)
        """
        if risk_params and 'fixed_amount' in risk_params:
            amount = risk_params['fixed_amount']
        else:
            amount = self.fixed_amount
        
        # 최대 가능 수량 (계좌 잔고 기준)
        max_possible = int(account_info.get('cash_balance', 0) / price)
        
        # 목표 수량 (고정 금액 기준)
        target_quantity = int(amount / price)
        
        # 둘 중 작은 값 선택
        quantity = min(target_quantity, max_possible)
        
        logger.info(f"고정 금액 포지션 사이징: {symbol} @ {price}원, {amount}원 기준 -> {quantity}주")
        return quantity


class FixedRiskSizer(PositionSizer):
    """고정 리스크 기반 포지션 사이징 전략"""
    
    def __init__(self, risk_per_trade: float = 0.01, default_stop_pct: float = 0.02):
        """
        고정 리스크 사이저 초기화
        
        Args:
            risk_per_trade: 거래당 위험 비율 (기본값: 1%)
            default_stop_pct: 기본 손절매 비율 (기본값: 2%)
        """
        self.risk_per_trade = risk_per_trade
        self.default_stop_pct = default_stop_pct
    
    def calculate_position_size(self, 
                               symbol: str, 
                               price: float, 
                               account_info: Dict[str, Any],
                               risk_params: Optional[Dict[str, Any]] = None) -> int:
        """
        주문할 주식 수량을 계산 (고정 리스크 방식)
        
        Args:
            symbol: 종목코드
            price: 현재 가격
            account_info: 계좌 정보
            risk_params: 위험 매개변수
            
        Returns:
            주문 수량 (정수)
        """
        # 위험 매개변수에서 값 가져오기 또는 기본값 사용
        risk_per_trade = risk_params.get('risk_per_trade', self.risk_per_trade) if risk_params else self.risk_per_trade
        stop_pct = risk_params.get('stop_loss_pct', self.default_stop_pct) if risk_params else self.default_stop_pct
        
        # 계좌 총 자산
        total_equity = account_info.get('total_equity', 0)
        
        # 손실 허용 금액
        risk_amount = total_equity * risk_per_trade
        
        # 주당 리스크 금액
        price_risk = price * stop_pct
        
        # 리스크 기반 수량 계산
        if price_risk <= 0:
            logger.warning(f"손절매 비율이 0 또는 음수입니다: {stop_pct}")
            return 0
        
        target_quantity = int(risk_amount / price_risk)
        
        # 최대 가능 수량 (계좌 잔고 기준)
        max_possible = int(account_info.get('cash_balance', 0) / price)
        
        # 둘 중 작은 값 선택
        quantity = min(target_quantity, max_possible)
        
        logger.info(f"고정 리스크 포지션 사이징: {symbol} @ {price}원, 리스크 {risk_per_trade*100}%, 손절매 {stop_pct*100}% -> {quantity}주")
        return quantity


class PercentageOfEquitySizer(PositionSizer):
    """자산 비율 기반 포지션 사이징 전략"""
    
    def __init__(self, percentage: float = 0.02):
        """
        자산 비율 사이저 초기화
        
        Args:
            percentage: 총 자산 대비 거래 비율 (기본값: 2%)
        """
        self.percentage = percentage
    
    def calculate_position_size(self, 
                               symbol: str, 
                               price: float, 
                               account_info: Dict[str, Any],
                               risk_params: Optional[Dict[str, Any]] = None) -> int:
        """
        주문할 주식 수량을 계산 (자산 비율 방식)
        
        Args:
            symbol: 종목코드
            price: 현재 가격
            account_info: 계좌 정보
            risk_params: 위험 매개변수
            
        Returns:
            주문 수량 (정수)
        """
        # 위험 매개변수에서 값 가져오기 또는 기본값 사용
        percentage = risk_params.get('position_percentage', self.percentage) if risk_params else self.percentage
        
        # 계좌 총 자산
        total_equity = account_info.get('total_equity', 0)
        
        # 투자 금액
        investment_amount = total_equity * percentage
        
        # 자산 비율 기반 수량 계산
        target_quantity = int(investment_amount / price)
        
        # 최대 가능 수량 (계좌 잔고 기준)
        max_possible = int(account_info.get('cash_balance', 0) / price)
        
        # 둘 중 작은 값 선택
        quantity = min(target_quantity, max_possible)
        
        logger.info(f"자산 비율 포지션 사이징: {symbol} @ {price}원, 비율 {percentage*100}% -> {quantity}주")
        return quantity 