"""
한국투자증권 API 클라이언트 모듈
REST API 및 WebSocket을 이용한 한국투자증권 서비스 연동
"""

import requests
import json
import hashlib
import datetime
import logging
import asyncio
import websockets
from typing import Dict, List, Optional, Union, Any, Callable
import time
from dataclasses import dataclass

logger = logging.getLogger(__name__)

@dataclass
class KoreaInvestmentCredentials:
    """한국투자증권 API 인증 정보"""
    app_key: str
    app_secret: str
    account_number: str
    account_code: str = "01"  # 기본값: 보통예수금
    is_virtual: bool = False  # 실전/모의투자 구분


class KoreaInvestmentAPI:
    """한국투자증권 Open API 클라이언트"""
    
    def __init__(self, credentials: KoreaInvestmentCredentials):
        """
        한국투자증권 API 클라이언트 초기화
        
        Args:
            credentials: 인증 정보 객체
        """
        self.credentials = credentials
        self.access_token: Optional[str] = None
        self.token_expiry: Optional[datetime.datetime] = None
        
        # 실전/모의투자 구분에 따른 URL 설정
        if credentials.is_virtual:
            self.base_url = "https://openapivts.koreainvestment.com:29443"
            # 모의투자 TR_ID 접두사 매핑
            self.tr_id_prefix = "V"  # 실전은 T, 모의투자는 V
        else:
            self.base_url = "https://openapi.koreainvestment.com:9443"
            self.tr_id_prefix = "T"
    
    def _get_hash_key(self) -> tuple[str, str]:
        """HMAC 기반 해시키 생성"""
        time_stamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        key = self.credentials.app_key + time_stamp
        hash_obj = hashlib.sha256(key.encode())
        hashed_key = hash_obj.hexdigest()
        return time_stamp, hashed_key
    
    def get_access_token(self) -> str:
        """접근 토큰 발급"""
        url = f"{self.base_url}/oauth2/tokenP"
        time_stamp, hash_key = self._get_hash_key()
        
        headers = {
            "content-type": "application/json"
        }
        
        body = {
            "grant_type": "client_credentials",
            "appkey": self.credentials.app_key,
            "appsecret": self.credentials.app_secret
        }
        
        try:
            response = requests.post(url, headers=headers, data=json.dumps(body))
            response.raise_for_status()
            
            token_data = response.json()
            self.access_token = token_data.get("access_token")
            expires_in = token_data.get("expires_in", 86400)  # 기본 24시간
            self.token_expiry = datetime.datetime.now() + datetime.timedelta(seconds=expires_in)
            
            logger.info(f"한국투자증권 API 토큰 발급 성공: 만료 시간 {self.token_expiry}")
            return self.access_token
            
        except requests.RequestException as e:
            logger.error(f"토큰 발급 실패: {str(e)}")
            if hasattr(e.response, 'text'):
                logger.error(f"응답: {e.response.text}")
            raise Exception(f"토큰 발급 실패: {str(e)}")
    
    def is_token_valid(self) -> bool:
        """토큰 유효성 확인"""
        if not self.access_token or not self.token_expiry:
            return False
        
        # 만료 10분 전에 갱신
        buffer_time = datetime.timedelta(minutes=10)
        return datetime.datetime.now() < (self.token_expiry - buffer_time)
    
    def ensure_token(self) -> str:
        """토큰이 유효한지 확인하고 필요시 갱신"""
        if not self.is_token_valid():
            self.get_access_token()
        return self.access_token
    
    def _get_standard_headers(self, tr_id: str) -> Dict[str, str]:
        """표준 API 호출 헤더 생성"""
        return {
            "Content-Type": "application/json",
            "authorization": f"Bearer {self.ensure_token()}",
            "appkey": self.credentials.app_key,
            "appsecret": self.credentials.app_secret,
            "tr_id": tr_id
        }
    
    def get_stock_price(self, symbol: str) -> Dict[str, Any]:
        """주식 현재가 조회"""
        url = f"{self.base_url}/uapi/domestic-stock/v1/quotations/inquire-price"
        headers = self._get_standard_headers("FHKST01010100")
        
        params = {
            "FID_COND_MRKT_DIV_CODE": "J",  # 주식 시장 구분
            "FID_INPUT_ISCD": symbol  # 종목코드
        }
        
        try:
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"주식 현재가 조회 실패: {str(e)}")
            if hasattr(e.response, 'text'):
                logger.error(f"응답: {e.response.text}")
            raise Exception(f"주식 현재가 조회 실패: {str(e)}")
    
    def get_stock_daily(self, symbol: str, start_date: str = None, end_date: str = None, period: str = "D") -> Dict[str, Any]:
        """주식 일/주/월 데이터 조회"""
        url = f"{self.base_url}/uapi/domestic-stock/v1/quotations/inquire-daily-price"
        headers = self._get_standard_headers("FHKST01010400")
        
        params = {
            "FID_COND_MRKT_DIV_CODE": "J",  # 주식 시장 구분
            "FID_INPUT_ISCD": symbol,  # 종목코드
            "FID_PERIOD_DIV_CODE": period,  # D(일), W(주), M(월)
            "FID_ORG_ADJ_PRC": "0"  # 수정주가 반영 여부 (0: 원주가, 1: 수정주가)
        }
        
        if start_date:
            params["FID_INPUT_DATE_1"] = start_date
        if end_date:
            params["FID_INPUT_DATE_2"] = end_date
        
        try:
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"주식 일/주/월 데이터 조회 실패: {str(e)}")
            if hasattr(e.response, 'text'):
                logger.error(f"응답: {e.response.text}")
            raise Exception(f"주식 일/주/월 데이터 조회 실패: {str(e)}")
    
    def get_stock_minute(self, symbol: str, time_unit: str = "1", count: int = 100) -> Dict[str, Any]:
        """주식 분봉 데이터 조회"""
        url = f"{self.base_url}/uapi/domestic-stock/v1/quotations/inquire-time-itemchartprice"
        headers = self._get_standard_headers("FHKST03010200")
        
        params = {
            "FID_COND_MRKT_DIV_CODE": "J",  # 주식 시장 구분
            "FID_INPUT_ISCD": symbol,  # 종목코드
            "FID_INPUT_HOUR_1": time_unit,  # 시간단위 (1, 3, 5, 10, 15, 30, 60분)
            "FID_PW_DATA_INCU_YN": "Y",  # 동시호가 여부
            "FID_ETC_CLS_CODE": "",
            "FID_INPUT_ISCD_ADDR_CLT": "",
            "FID_INPUT_HOUR_1_CLT": count  # 요청 건수
        }
        
        try:
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"주식 분봉 데이터 조회 실패: {str(e)}")
            if hasattr(e.response, 'text'):
                logger.error(f"응답: {e.response.text}")
            raise Exception(f"주식 분봉 데이터 조회 실패: {str(e)}")
    
    def place_order(self, symbol: str, order_type: str, price: int, quantity: int) -> Dict[str, Any]:
        """주식 주문 실행
        
        Args:
            symbol: 종목코드
            order_type: 주문 유형 ("buy" 또는 "sell")
            price: 주문 가격
            quantity: 주문 수량
        
        Returns:
            API 응답 데이터
        """
        url = f"{self.base_url}/uapi/domestic-stock/v1/trading/order-cash"
        
        # 매수/매도에 따른 TR_ID 설정
        if order_type.lower() == "buy":
            tr_id = f"{self.tr_id_prefix}TTC0802U"  # 매수
        elif order_type.lower() == "sell":
            tr_id = f"{self.tr_id_prefix}TTC0801U"  # 매도
        else:
            raise ValueError("order_type은 'buy' 또는 'sell'이어야 합니다.")
        
        headers = self._get_standard_headers(tr_id)
        
        body = {
            "CANO": self.credentials.account_number[:8],
            "ACNT_PRDT_CD": self.credentials.account_code,
            "PDNO": symbol,
            "ORD_DVSN": "00",  # 지정가
            "ORD_QTY": str(quantity),
            "ORD_UNPR": str(price),
        }
        
        try:
            response = requests.post(url, headers=headers, data=json.dumps(body))
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"주문 실패: {str(e)}")
            if hasattr(e.response, 'text'):
                logger.error(f"응답: {e.response.text}")
            raise Exception(f"주문 실패: {str(e)}")
    
    def cancel_order(self, order_no: str, symbol: str, quantity: int) -> Dict[str, Any]:
        """주문 취소
        
        Args:
            order_no: 원주문번호
            symbol: 종목코드
            quantity: 취소 수량
        
        Returns:
            API 응답 데이터
        """
        url = f"{self.base_url}/uapi/domestic-stock/v1/trading/order-rvsecncl"
        tr_id = f"{self.tr_id_prefix}TTC0803U"  # 취소 주문
        
        headers = self._get_standard_headers(tr_id)
        
        body = {
            "CANO": self.credentials.account_number[:8],
            "ACNT_PRDT_CD": self.credentials.account_code,
            "KRX_FWDG_ORD_ORGNO": "",  # 한국거래소 주문조직번호
            "ORGN_ODNO": order_no,  # 원주문번호
            "RVSE_CNCL_DVSN_CD": "02",  # 정정취소구분코드 (02: 취소)
            "ORD_QTY": str(quantity),  # 주문수량
            "RVSE_CNCL_ORD_OBJT_CBLC_QTY": "0",  # 정정취소주문대상채결수량
            "PDNO": symbol,  # 종목코드
            "ORD_UNPR": "0",  # 주문단가
            "QTY_ALL_ORD_YN": "N"  # 잔량전부주문여부
        }
        
        try:
            response = requests.post(url, headers=headers, data=json.dumps(body))
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"주문 취소 실패: {str(e)}")
            if hasattr(e.response, 'text'):
                logger.error(f"응답: {e.response.text}")
            raise Exception(f"주문 취소 실패: {str(e)}")
    
    def get_account_balance(self) -> Dict[str, Any]:
        """계좌 잔고 조회"""
        url = f"{self.base_url}/uapi/domestic-stock/v1/trading/inquire-balance"
        tr_id = f"{self.tr_id_prefix}TTC8434R"  # 계좌 잔고 조회
        
        headers = self._get_standard_headers(tr_id)
        
        params = {
            "CANO": self.credentials.account_number[:8],
            "ACNT_PRDT_CD": self.credentials.account_code,
            "AFHR_FLPR_YN": "N",  # 시간외단일가여부
            "OFL_YN": "N",  # 오프라인여부
            "INQR_DVSN": "02",  # 조회구분 (01: 대출일별, 02: 종목별)
            "UNPR_DVSN": "01",  # 단가구분 (01: 평균단가, 02: 시장가)
            "FUND_STTL_ICLD_YN": "N",  # 펀드결제분포함여부
            "FNCG_AMT_AUTO_RDPT_YN": "N",  # 융자금액자동상환여부
            "PRCS_DVSN": "01",  # 처리구분 (00: 전일매매포함, 01: 전일매매미포함)
            "CTX_AREA_FK100": "",  # 연속조회검색조건
            "CTX_AREA_NK100": ""  # 연속조회키
        }
        
        try:
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"계좌 잔고 조회 실패: {str(e)}")
            if hasattr(e.response, 'text'):
                logger.error(f"응답: {e.response.text}")
            raise Exception(f"계좌 잔고 조회 실패: {str(e)}")
    
    def get_order_history(self, start_date: str, end_date: str) -> Dict[str, Any]:
        """주문 내역 조회"""
        url = f"{self.base_url}/uapi/domestic-stock/v1/trading/inquire-daily-ccld"
        tr_id = f"{self.tr_id_prefix}TTC8001R"  # 일별 주문체결내역
        
        headers = self._get_standard_headers(tr_id)
        
        params = {
            "CANO": self.credentials.account_number[:8],
            "ACNT_PRDT_CD": self.credentials.account_code,
            "INQR_STRT_DT": start_date,  # 조회 시작일자 (YYYYMMDD)
            "INQR_END_DT": end_date,  # 조회 종료일자 (YYYYMMDD)
            "SLL_BUY_DVSN_CD": "00",  # 매도매수구분코드 (00: 전체, 01: 매도, 02: 매수)
            "INQR_DVSN": "00",  # 조회구분 (00: 역순, 01: 정순)
            "PDNO": "",  # 종목코드
            "CCLD_DVSN": "00",  # 체결구분 (00: 전체, 01: 체결, 02: 미체결)
            "ORD_GNO_BRNO": "",  # 주문채번지점번호
            "ODNO": "",  # 주문번호
            "INQR_DVSN_3": "00",  # 조회구분3 (00: 전체, 01: 현금, 02: 융자, 03: 대출)
            "INQR_DVSN_1": "",  # 조회구분1
            "CTX_AREA_FK100": "",  # 연속조회검색조건
            "CTX_AREA_NK100": ""  # 연속조회키
        }
        
        try:
            response = requests.get(url, headers=headers, params=params)
            response.raise_for_status()
            return response.json()
        except requests.RequestException as e:
            logger.error(f"주문 내역 조회 실패: {str(e)}")
            if hasattr(e.response, 'text'):
                logger.error(f"응답: {e.response.text}")
            raise Exception(f"주문 내역 조회 실패: {str(e)}")
    
    async def connect_websocket(self, symbol: str, callback: Callable[[Dict[str, Any]], None]) -> None:
        """실시간 시세 WebSocket 연결
        
        Args:
            symbol: 종목코드
            callback: 데이터 수신 시 호출할 콜백 함수
        """
        url = f"wss://openapi.koreainvestment.com:9443/tryitout/websocket"
        access_token = self.ensure_token()
        
        # WebSocket 요청 헤더
        header = {
            "appkey": self.credentials.app_key,
            "appsecret": self.credentials.app_secret,
            "authorization": f"Bearer {access_token}",
            "tr_type": "1",  # 1: 시세, 2: 체결
            "tr_cd": "H0STCNT0",  # 실시간 시세 코드
        }
        
        # 요청 데이터
        body = {
            "input": {
                "tr_id": "H0STCNT0",
                "tr_key": symbol  # 종목코드
            }
        }
        
        try:
            async with websockets.connect(url) as websocket:
                # 헤더 전송
                await websocket.send(json.dumps(header))
                
                # 요청 데이터 전송
                await websocket.send(json.dumps(body))
                
                logger.info(f"WebSocket 연결 성공: {symbol}")
                
                # 실시간 데이터 수신
                while True:
                    try:
                        data = await websocket.recv()
                        data_json = json.loads(data)
                        callback(data_json)
                    except json.JSONDecodeError:
                        logger.error(f"잘못된 JSON 형식: {data}")
                    except Exception as e:
                        logger.error(f"WebSocket 데이터 처리 오류: {str(e)}")
                        break
                    
                    # 30초마다 ping 전송
                    await asyncio.sleep(30)
                    await websocket.ping()
        
        except websockets.exceptions.ConnectionClosed:
            logger.warning(f"WebSocket 연결 종료: {symbol}")
        except Exception as e:
            logger.error(f"WebSocket 연결 오류: {str(e)}")
            raise 