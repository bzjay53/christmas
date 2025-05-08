"""
브로커 인터페이스 모듈
여러 증권사 API를 통합적으로 처리하기 위한 기본 클래스 및 인터페이스 정의
"""

from abc import ABC, abstractmethod
from typing import Dict, List, Any, Optional
import datetime

class BaseBroker(ABC):
    """브로커 인터페이스 기본 클래스"""
    
    @abstractmethod
    def get_stock_price(self, symbol: str) -> Dict[str, Any]:
        """
        종목 현재가 조회
        
        Args:
            symbol: 종목코드
            
        Returns:
            현재가 정보를 포함한 응답
        """
        pass
    
    @abstractmethod
    def place_order(self, symbol: str, order_type: str, price: float, quantity: int) -> Dict[str, Any]:
        """
        주문 실행
        
        Args:
            symbol: 종목코드
            order_type: 주문 유형 ("buy" 또는 "sell")
            price: 주문 가격
            quantity: 주문 수량
            
        Returns:
            주문 결과 정보
        """
        pass
    
    @abstractmethod
    def cancel_order(self, order_id: str, **kwargs) -> Dict[str, Any]:
        """
        주문 취소
        
        Args:
            order_id: 취소할 주문 ID
            **kwargs: 추가 매개변수
            
        Returns:
            취소 결과 정보
        """
        pass
    
    @abstractmethod
    def get_account_balance(self) -> Dict[str, Any]:
        """
        계좌 잔고 조회
        
        Returns:
            계좌 잔고 정보
        """
        pass
    
    @abstractmethod
    def get_order_history(self, start_date: Optional[str] = None, end_date: Optional[str] = None) -> Dict[str, Any]:
        """
        주문 내역 조회
        
        Args:
            start_date: 조회 시작일 (YYYYMMDD)
            end_date: 조회 종료일 (YYYYMMDD)
            
        Returns:
            주문 내역 정보
        """
        pass


class BrokerFactory:
    """브로커 팩토리 클래스"""
    
    @staticmethod
    def create_broker(broker_type: str, **kwargs) -> BaseBroker:
        """
        브로커 객체 생성
        
        Args:
            broker_type: 브로커 유형 ('kr_investment', 'virtual', 등)
            **kwargs: 브로커별 설정 매개변수
            
        Returns:
            브로커 객체
            
        Raises:
            ValueError: 지원하지 않는 브로커 유형인 경우
        """
        from app.broker.kr_investment import KoreaInvestmentAPI, KoreaInvestmentCredentials
        from app.broker.virtual_broker import VirtualBroker
        
        if broker_type == 'kr_investment':
            if 'app_key' not in kwargs or 'app_secret' not in kwargs or 'account_number' not in kwargs:
                raise ValueError("한국투자증권 API 연동에는 app_key, app_secret, account_number가 필요합니다.")
            
            credentials = KoreaInvestmentCredentials(
                app_key=kwargs['app_key'],
                app_secret=kwargs['app_secret'],
                account_number=kwargs['account_number'],
                account_code=kwargs.get('account_code', '01'),
                is_virtual=kwargs.get('is_virtual', False)
            )
            
            return KoreaInvestmentAPI(credentials)
        
        elif broker_type == 'virtual':
            initial_balance = kwargs.get('initial_balance', 10000000.0)
            return VirtualBroker(initial_balance=initial_balance)
        
        else:
            raise ValueError(f"지원하지 않는 브로커 유형: {broker_type}")


# 브로커 어댑터 클래스 (향후 확장성을 위한 템플릿)
class BrokerAdapter(BaseBroker):
    """브로커 어댑터 기본 클래스"""
    
    def __init__(self, broker_impl):
        """
        브로커 어댑터 초기화
        
        Args:
            broker_impl: 실제 브로커 구현체
        """
        self.broker = broker_impl
    
    # 필요에 따라 브로커별 인터페이스 차이를 조정하기 위한 메서드들을 오버라이드 