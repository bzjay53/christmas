import time
import logging
from typing import Dict, List, Optional, Any, Union
import httpx
from datetime import datetime

# 로깅 설정
logger = logging.getLogger(__name__)

class MarketAPIClient:
    """
    증권사 REST API 클라이언트.
    KIS Developers API 연동을 통해 시장 데이터를 수집합니다.
    """
    
    def __init__(self, app_key: str, app_secret: str, base_url: str):
        """
        증권사 API 클라이언트 초기화
        
        Args:
            app_key: API 앱 키
            app_secret: API 앱 시크릿
            base_url: API 기본 URL
        """
        self.app_key = app_key
        self.app_secret = app_secret
        self.base_url = base_url
        self.access_token: Optional[str] = None
        self.token_expires_at: int = 0
        self.client = httpx.AsyncClient(
            base_url=self.base_url, 
            headers={"Content-Type": "application/json"}
        )
    
    @classmethod
    def create_mock_client(cls) -> 'MarketAPIClient':
        """
        테스트용 모의 클라이언트를 생성합니다.
        실제 API 서버에 연결하지 않고 모의 데이터를 반환합니다.
        
        Returns:
            모의 MarketAPIClient 인스턴스
        """
        return cls(app_key="mock_app_key", app_secret="mock_app_secret", base_url="https://mock-api.example.com")
        
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.close()
        
    async def close(self):
        """API 클라이언트 연결 종료"""
        await self.client.aclose()
    
    async def ensure_token(self) -> str:
        """
        유효한 액세스 토큰이 있는지 확인하고, 없으면 새로 발급받습니다.
        
        Returns:
            유효한 액세스 토큰
        """
        current_time = int(time.time())
        
        # 토큰이 없거나 만료되었으면 새로 발급
        if not self.access_token or current_time >= self.token_expires_at:
            await self._fetch_new_token()
            
        return self.access_token
    
    async def _fetch_new_token(self) -> None:
        """OAuth2 토큰 발급 API 호출"""
        try:
            response = await self.client.post(
                "/oauth2/token",
                headers={
                    "appkey": self.app_key,
                    "appsecret": self.app_secret,
                },
                json={"grant_type": "client_credentials"}
            )
            response.raise_for_status()
            data = response.json()
            
            self.access_token = data.get("access_token")
            # 토큰 만료 시간 설정 (만료 10분 전에 갱신하도록)
            self.token_expires_at = int(time.time()) + (data.get("expires_in", 86400) - 600)
            
            logger.info("새 액세스 토큰 발급 완료")
        except httpx.HTTPStatusError as e:
            logger.error(f"토큰 발급 실패: {e}")
            raise
    
    async def fetch_current_price(self, symbol: str) -> Dict[str, Any]:
        """
        종목 현재가 조회
        
        Args:
            symbol: 종목 코드 (예: "005930" - 삼성전자)
            
        Returns:
            현재가 정보를 담은 딕셔너리
        """
        token = await self.ensure_token()
        
        try:
            response = await self.client.get(
                "/uapi/domestic-stock/v1/quotations/inquire-price",
                params={"fid_input_iscd": symbol},
                headers={
                    "authorization": f"Bearer {token}",
                    "appkey": self.app_key,
                    "appsecret": self.app_secret,
                    "tr_id": "FHKST01010100"
                }
            )
            response.raise_for_status()
            data = response.json()
            
            # 응답 데이터 가공
            output = data.get("output", {})
            return {
                "symbol": symbol,
                "price": float(output.get("stck_prpr", "0")),  # 현재가
                "change": float(output.get("prdy_vrss", "0")),  # 전일 대비 변동
                "change_rate": float(output.get("prdy_ctrt", "0")),  # 전일 대비 등락률
                "volume": int(output.get("acml_vol", "0")),  # 누적 거래량
                "timestamp": datetime.now().isoformat(),
            }
        except httpx.HTTPStatusError as e:
            logger.error(f"현재가 조회 실패: {e}")
            raise
    
    async def fetch_minute_chart(self, symbol: str, minutes: int = 1, count: int = 30) -> List[Dict[str, Any]]:
        """
        분봉 데이터 조회
        
        Args:
            symbol: 종목 코드
            minutes: 분봉 단위 (1, 3, 5, 10, 15, 30, 60 중 하나)
            count: 조회할 캔들 개수
            
        Returns:
            분봉 데이터 리스트 (최신 데이터가 먼저 옴)
        """
        token = await self.ensure_token()
        
        # 분봉 단위에 따른 tr_id 설정
        tr_id_mapping = {
            1: "FHKST03010100",   # 1분
            3: "FHKST03010200",   # 3분
            5: "FHKST03010300",   # 5분
            10: "FHKST03010400",  # 10분
            15: "FHKST03010500",  # 15분
            30: "FHKST03010600",  # 30분
            60: "FHKST03010700",  # 60분
        }
        
        tr_id = tr_id_mapping.get(minutes, tr_id_mapping[1])
        
        try:
            response = await self.client.get(
                "/uapi/domestic-stock/v1/quotations/inquire-daily-itemchartprice",
                params={
                    "fid_input_iscd": symbol,
                    "fid_input_hour_1": count
                },
                headers={
                    "authorization": f"Bearer {token}",
                    "appkey": self.app_key,
                    "appsecret": self.app_secret,
                    "tr_id": tr_id
                }
            )
            response.raise_for_status()
            data = response.json()
            
            # 응답 데이터 가공
            candles = []
            for item in data.get("output2", []):
                candle = {
                    "symbol": symbol,
                    "timestamp": item.get("stck_bsop_date", "") + item.get("stck_cntg_hour", ""),
                    "open": float(item.get("stck_oprc", "0")),
                    "high": float(item.get("stck_hgpr", "0")),
                    "low": float(item.get("stck_lwpr", "0")),
                    "close": float(item.get("stck_prpr", "0")),
                    "volume": int(item.get("cntg_vol", "0")),
                }
                candles.append(candle)
                
            return candles
        except httpx.HTTPStatusError as e:
            logger.error(f"분봉 조회 실패: {e}")
            raise 