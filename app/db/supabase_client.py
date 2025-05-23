"""
Supabase 데이터베이스 클라이언트 모듈

이 모듈은 Supabase 데이터베이스 연결 및 데이터 액세스를 제공합니다.
"""

import os
import logging
from typing import Dict, List, Optional, Any, Union
from dotenv import load_dotenv
from supabase import create_client, Client

# 로깅 설정
logger = logging.getLogger(__name__)

# 환경 변수 로드
load_dotenv()

class SupabaseClient:
    """
    Supabase 데이터베이스 클라이언트 클래스
    애플리케이션 전체에서 사용할 수 있는 싱글톤 인스턴스를 제공합니다.
    """
    
    _instance: Optional['SupabaseClient'] = None
    _client: Optional[Client] = None
    
    @classmethod
    def get_instance(cls) -> 'SupabaseClient':
        """
        SupabaseClient의 싱글톤 인스턴스를 반환합니다.
        
        Returns:
            SupabaseClient 인스턴스
        """
        if cls._instance is None:
            cls._instance = cls()
        return cls._instance
    
    def __init__(self):
        """
        SupabaseClient 초기화
        환경 변수에서 Supabase URL과 API 키를 로드하여 클라이언트를 생성합니다.
        """
        if SupabaseClient._instance is not None:
            raise RuntimeError("SupabaseClient는 싱글톤 클래스입니다. get_instance() 메서드를 사용하세요.")
        
        self._url = os.environ.get("SUPABASE_URL")
        self._key = os.environ.get("SUPABASE_KEY")
        
        if not self._url or not self._key:
            logger.warning("Supabase URL 또는 API 키가 설정되지 않았습니다. 테스트 모드로 실행합니다.")
            self._test_mode = True
        else:
            self._test_mode = False
            try:
                self._client = create_client(self._url, self._key)
                logger.info("Supabase 클라이언트 초기화 성공")
            except Exception as e:
                logger.error(f"Supabase 클라이언트 초기화 실패: {e}")
                self._test_mode = True
    
    @property
    def client(self) -> Optional[Client]:
        """
        Supabase 클라이언트 인스턴스를 반환합니다.
        
        Returns:
            Supabase Client 인스턴스 또는 None (테스트 모드)
        """
        return self._client
    
    @property
    def is_test_mode(self) -> bool:
        """
        테스트 모드 여부를 반환합니다.
        
        Returns:
            테스트 모드 여부 (True/False)
        """
        return self._test_mode
    
    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """
        사용자 정보를 조회합니다.
        
        Args:
            user_id: 사용자 ID
            
        Returns:
            사용자 정보 또는 None (조회 실패시)
        """
        if self._test_mode:
            # 테스트 데이터 반환
            return {
                "id": user_id,
                "email": f"user_{user_id}@example.com",
                "created_at": "2023-01-01T00:00:00Z"
            }
        
        try:
            response = await self._client.table('users').select('*').eq('id', user_id).execute()
            data = response.data
            
            if data and len(data) > 0:
                return data[0]
            return None
        except Exception as e:
            logger.error(f"사용자 조회 실패: {e}")
            return None
    
    async def get_orders(self, user_id: Optional[str] = None, 
                       symbol: Optional[str] = None, 
                       status: Optional[str] = None) -> List[Dict[str, Any]]:
        """
        주문 내역을 조회합니다.
        
        Args:
            user_id: 사용자 ID (None이면 모든 사용자)
            symbol: 종목 코드 (None이면 모든 종목)
            status: 주문 상태 (None이면 모든 상태)
            
        Returns:
            주문 내역 리스트
        """
        if self._test_mode:
            # 테스트 데이터 반환
            return [
                {
                    "id": "order1",
                    "user_id": user_id or "test_user",
                    "symbol": symbol or "BTC/USDT",
                    "side": "BUY",
                    "quantity": 0.01,
                    "price": 60000.0,
                    "status": status or "FILLED",
                    "created_at": "2023-01-01T00:00:00Z"
                }
            ]
        
        try:
            query = self._client.table('orders').select('*')
            
            if user_id:
                query = query.eq('user_id', user_id)
            if symbol:
                query = query.eq('symbol', symbol)
            if status:
                query = query.eq('status', status)
                
            response = await query.execute()
            return response.data or []
        except Exception as e:
            logger.error(f"주문 내역 조회 실패: {e}")
            return []
    
    async def create_order(self, order_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        주문을 생성합니다.
        
        Args:
            order_data: 주문 데이터
            
        Returns:
            생성된 주문 정보 또는 None (생성 실패시)
        """
        if self._test_mode:
            # 테스트 데이터 반환
            return {
                "id": "new_order_id",
                **order_data,
                "created_at": "2023-01-01T00:00:00Z"
            }
        
        try:
            response = await self._client.table('orders').insert(order_data).execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"주문 생성 실패: {e}")
            return None
    
    async def update_order(self, order_id: str, update_data: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        """
        주문 정보를 업데이트합니다.
        
        Args:
            order_id: 주문 ID
            update_data: 업데이트할 데이터
            
        Returns:
            업데이트된 주문 정보 또는 None (업데이트 실패시)
        """
        if self._test_mode:
            # 테스트 데이터 반환
            return {
                "id": order_id,
                **update_data,
                "updated_at": "2023-01-01T00:00:00Z"
            }
        
        try:
            response = await self._client.table('orders').update(update_data).eq('id', order_id).execute()
            
            if response.data and len(response.data) > 0:
                return response.data[0]
            return None
        except Exception as e:
            logger.error(f"주문 업데이트 실패: {e}")
            return None 