"""
KIS (Korea Investment & Securities) API Service
한국투자증권 OpenAPI 연동 서비스
"""

import httpx
import json
import hashlib
import time
from typing import Dict, List, Optional, Any
from datetime import datetime
from loguru import logger

from app.core.config import settings

class KISAPIService:
    """
    한국투자증권 OpenAPI 클라이언트
    """
    
    def __init__(self):
        self.base_url = settings.KIS_BASE_URL
        self.app_key = settings.KIS_APP_KEY
        self.app_secret = settings.KIS_APP_SECRET
        self.access_token = ""
        self.client = httpx.AsyncClient(timeout=30.0)
        
    async def initialize(self):
        """
        API 클라이언트 초기화 및 토큰 획득
        """
        try:
            await self.get_access_token()
            logger.info("✅ KIS API 초기화 완료")
            return True
        except Exception as e:
            logger.error(f"❌ KIS API 초기화 실패: {e}")
            return False
    
    async def get_access_token(self):
        """
        액세스 토큰 획득
        """
        url = f"{self.base_url}/oauth2/tokenP"
        
        data = {
            "grant_type": "client_credentials",
            "appkey": self.app_key,
            "appsecret": self.app_secret
        }
        
        headers = {
            "content-type": "application/json"
        }
        
        try:
            response = await self.client.post(url, json=data, headers=headers)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get("rt_cd") == "0":
                self.access_token = result["access_token"]
                logger.info("✅ KIS API 토큰 획득 성공")
            else:
                raise Exception(f"토큰 획득 실패: {result.get('msg1', 'Unknown error')}")
                
        except Exception as e:
            logger.error(f"❌ KIS API 토큰 획득 실패: {e}")
            raise
    
    def _get_headers(self, tr_id: str, custtype: str = "P") -> Dict[str, str]:
        """
        API 요청용 공통 헤더 생성
        """
        return {
            "content-type": "application/json; charset=utf-8",
            "authorization": f"Bearer {self.access_token}",
            "appkey": self.app_key,
            "appsecret": self.app_secret,
            "tr_id": tr_id,
            "custtype": custtype
        }
    
    async def get_current_price(self, stock_code: str) -> Dict[str, Any]:
        """
        현재가 조회
        """
        url = f"{self.base_url}/uapi/domestic-stock/v1/quotations/inquire-price"
        
        params = {
            "fid_cond_mrkt_div_code": "J",
            "fid_input_iscd": stock_code
        }
        
        headers = self._get_headers("FHKST01010100")
        
        try:
            response = await self.client.get(url, params=params, headers=headers)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get("rt_cd") == "0":
                output = result["output"]
                return {
                    "stock_code": stock_code,
                    "current_price": int(output["stck_prpr"]),
                    "change_rate": float(output["prdy_ctrt"]),
                    "change_amount": int(output["prdy_vrss"]),
                    "volume": int(output["acml_vol"]),
                    "timestamp": datetime.now().isoformat()
                }
            else:
                raise Exception(f"현재가 조회 실패: {result.get('msg1', 'Unknown error')}")
                
        except Exception as e:
            logger.error(f"❌ 현재가 조회 실패 ({stock_code}): {e}")
            raise
    
    async def place_buy_order(self, stock_code: str, quantity: int, price: int) -> Dict[str, Any]:
        """
        매수 주문
        """
        url = f"{self.base_url}/uapi/domestic-stock/v1/trading/order-cash"
        
        data = {
            "CANO": settings.KIS_ACCOUNT_NUMBER,  # 계좌번호
            "ACNT_PRDT_CD": settings.KIS_ACCOUNT_CODE,  # 계좌상품코드
            "PDNO": stock_code,
            "ORD_DVSN": "00",  # 지정가
            "ORD_QTY": str(quantity),
            "ORD_UNPR": str(price)
        }
        
        headers = self._get_headers("TTTC0802U")
        
        try:
            response = await self.client.post(url, json=data, headers=headers)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get("rt_cd") == "0":
                output = result["output"]
                return {
                    "order_id": output["KRX_FWDG_ORD_ORGNO"] + output["ODNO"],
                    "stock_code": stock_code,
                    "action": "buy",
                    "quantity": quantity,
                    "price": price,
                    "status": "pending",
                    "timestamp": datetime.now().isoformat()
                }
            else:
                raise Exception(f"매수 주문 실패: {result.get('msg1', 'Unknown error')}")
                
        except Exception as e:
            logger.error(f"❌ 매수 주문 실패 ({stock_code}): {e}")
            raise
    
    async def place_sell_order(self, stock_code: str, quantity: int, price: int) -> Dict[str, Any]:
        """
        매도 주문
        """
        url = f"{self.base_url}/uapi/domestic-stock/v1/trading/order-cash"
        
        data = {
            "CANO": settings.KIS_ACCOUNT_NUMBER,  # 계좌번호
            "ACNT_PRDT_CD": settings.KIS_ACCOUNT_CODE,
            "PDNO": stock_code,
            "ORD_DVSN": "00",  # 지정가
            "ORD_QTY": str(quantity),
            "ORD_UNPR": str(price)
        }
        
        headers = self._get_headers("TTTC0801U")
        
        try:
            response = await self.client.post(url, json=data, headers=headers)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get("rt_cd") == "0":
                output = result["output"]
                return {
                    "order_id": output["KRX_FWDG_ORD_ORGNO"] + output["ODNO"],
                    "stock_code": stock_code,
                    "action": "sell",
                    "quantity": quantity,
                    "price": price,
                    "status": "pending",
                    "timestamp": datetime.now().isoformat()
                }
            else:
                raise Exception(f"매도 주문 실패: {result.get('msg1', 'Unknown error')}")
                
        except Exception as e:
            logger.error(f"❌ 매도 주문 실패 ({stock_code}): {e}")
            raise
    
    async def get_account_balance(self) -> Dict[str, Any]:
        """
        계좌 잔고 조회
        """
        url = f"{self.base_url}/uapi/domestic-stock/v1/trading/inquire-balance"
        
        params = {
            "CANO": settings.KIS_ACCOUNT_NUMBER,
            "ACNT_PRDT_CD": settings.KIS_ACCOUNT_CODE,
            "AFHR_FLPR_YN": "N",
            "OFL_YN": "",
            "INQR_DVSN": "02",
            "UNPR_DVSN": "01",
            "FUND_STTL_ICLD_YN": "N",
            "FNCG_AMT_AUTO_RDPT_YN": "N",
            "PRCS_DVSN": "01",
            "CTX_AREA_FK100": "",
            "CTX_AREA_NK100": ""
        }
        
        headers = self._get_headers("TTTC8434R")
        
        try:
            response = await self.client.get(url, params=params, headers=headers)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get("rt_cd") == "0":
                output1 = result["output1"]
                output2 = result["output2"]
                
                holdings = []
                for holding in output1:
                    if int(holding["hldg_qty"]) > 0:
                        holdings.append({
                            "stock_code": holding["pdno"],
                            "stock_name": holding["prdt_name"],
                            "quantity": int(holding["hldg_qty"]),
                            "avg_price": float(holding["pchs_avg_pric"]),
                            "current_price": int(holding["prpr"]),
                            "profit_loss": int(holding["evlu_pfls_amt"]),
                            "profit_rate": float(holding["evlu_pfls_rt"])
                        })
                
                return {
                    "cash_balance": int(output2["dnca_tot_amt"]),
                    "stock_value": int(output2["scts_evlu_amt"]),
                    "total_value": int(output2["tot_evlu_amt"]),
                    "profit_loss": int(output2["evlu_pfls_smtl_amt"]),
                    "profit_rate": float(output2["tot_evlu_pfls_rt"]),
                    "holdings": holdings,
                    "timestamp": datetime.now().isoformat()
                }
            else:
                raise Exception(f"잔고 조회 실패: {result.get('msg1', 'Unknown error')}")
                
        except Exception as e:
            logger.error(f"❌ 잔고 조회 실패: {e}")
            raise
    
    async def get_order_status(self, order_id: str) -> Dict[str, Any]:
        """
        주문 상태 조회
        """
        url = f"{self.base_url}/uapi/domestic-stock/v1/trading/inquire-daily-orders"
        
        params = {
            "CANO": "50067672",
            "ACNT_PRDT_CD": "01",
            "INQR_STRT_DT": datetime.now().strftime("%Y%m%d"),
            "INQR_END_DT": datetime.now().strftime("%Y%m%d"),
            "SLL_BUY_DVSN_CD": "00",
            "INQR_DVSN": "00",
            "PDNO": "",
            "CCLD_DVSN": "00",
            "ORD_GNO_BRNO": "",
            "ODNO": "",
            "INQR_DVSN_3": "00",
            "INQR_DVSN_1": "",
            "CTX_AREA_FK100": "",
            "CTX_AREA_NK100": ""
        }
        
        headers = self._get_headers("TTTC8001R")
        
        try:
            response = await self.client.get(url, params=params, headers=headers)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get("rt_cd") == "0":
                orders = result["output1"]
                
                for order in orders:
                    if order_id in order["odno"]:
                        return {
                            "order_id": order_id,
                            "status": "filled" if order["ord_qty"] == order["tot_ccld_qty"] else "pending",
                            "filled_quantity": int(order["tot_ccld_qty"]),
                            "filled_price": int(order["avg_prvs"]) if order["avg_prvs"] else 0,
                            "timestamp": datetime.now().isoformat()
                        }
                
                return {
                    "order_id": order_id,
                    "status": "not_found",
                    "timestamp": datetime.now().isoformat()
                }
            else:
                raise Exception(f"주문 조회 실패: {result.get('msg1', 'Unknown error')}")
                
        except Exception as e:
            logger.error(f"❌ 주문 상태 조회 실패: {e}")
            raise
    
    async def health_check(self) -> bool:
        """
        API 연결 상태 확인
        """
        try:
            if not self.access_token:
                await self.get_access_token()
            
            # 삼성전자 현재가로 연결 테스트
            await self.get_current_price("005930")
            return True
            
        except Exception as e:
            logger.error(f"❌ KIS API 헬스체크 실패: {e}")
            return False
    
    async def cleanup(self):
        """
        클라이언트 정리
        """
        await self.client.aclose()
        logger.info("✅ KIS API 클라이언트 정리 완료")