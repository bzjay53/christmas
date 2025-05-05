import logging
import os
import json
import redis.asyncio as redis
from typing import Dict, List, Any, Optional, Tuple
import asyncio
from datetime import datetime, timedelta

from .technical_indicators import TechnicalIndicators

# 로깅 설정
logger = logging.getLogger(__name__)

# 환경 변수에서 설정 로드
REDIS_HOST = os.getenv("CHRISTMAS_REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("CHRISTMAS_REDIS_PORT", "6379"))

class MarketDataService:
    """
    시장 데이터 분석 서비스.
    Redis에서 데이터를 가져와 분석하고, 결과를 다시 저장합니다.
    """
    
    def __init__(self):
        """생성자"""
        self.redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
        self.analysis_cache = {}  # 메모리 캐시
    
    async def __aenter__(self):
        return self
        
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.redis_client.close()
    
    async def get_current_price(self, symbol: str) -> Dict[str, Any]:
        """
        종목의 현재가 조회
        
        Args:
            symbol: 종목 코드
            
        Returns:
            현재가 정보
        """
        try:
            # Redis에서 최신 틱 데이터 조회
            data = await self.redis_client.hgetall(f"tick:{symbol}:latest")
            
            if not data:
                logger.warning(f"종목 {symbol}의 최신 틱 데이터가 없습니다")
                return {}
                
            # 데이터 형변환
            return {
                "symbol": symbol,
                "price": float(data.get("price", 0)),
                "volume": int(data.get("volume", 0)),
                "timestamp": data.get("timestamp", ""),
            }
        except Exception as e:
            logger.error(f"현재가 조회 실패: {e}")
            return {}
    
    async def get_candle_data(
        self,
        symbol: str,
        interval: str = "1m",
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """
        캔들 데이터 조회
        
        Args:
            symbol: 종목 코드
            interval: 캔들 간격 (1m, 3m, 5m, 15m, 30m, 1h)
            limit: 조회할 캔들 개수
            
        Returns:
            캔들 데이터 리스트
        """
        try:
            # interval을 초로 변환
            seconds_map = {
                "1m": 60,
                "3m": 180,
                "5m": 300,
                "15m": 900,
                "30m": 1800,
                "1h": 3600,
            }
            seconds = seconds_map.get(interval, 60)
            
            # Redis에서 틱 데이터 조회
            now = datetime.now()
            end_time = int(now.timestamp() * 1000)
            start_time = int((now - timedelta(seconds=seconds * limit)).timestamp() * 1000)
            
            # Redis ZRANGEBYSCORE 쿼리 (시간 범위 내 데이터 조회)
            tick_data = await self.redis_client.zrangebyscore(
                f"ticks:{symbol}",
                start_time,
                end_time
            )
            
            if not tick_data:
                logger.warning(f"종목 {symbol}의 틱 데이터가 없습니다")
                return []
                
            # 캔들로 집계
            return await self._aggregate_candles(tick_data, interval, limit)
        except Exception as e:
            logger.error(f"캔들 데이터 조회 실패: {e}")
            return []
    
    async def _aggregate_candles(
        self,
        tick_data: List[str],
        interval: str,
        limit: int
    ) -> List[Dict[str, Any]]:
        """
        틱 데이터를 캔들로 집계
        
        Args:
            tick_data: Redis에서 조회한 틱 데이터 (JSON 문자열)
            interval: 캔들 간격
            limit: 조회할 캔들 개수
            
        Returns:
            집계된 캔들 데이터
        """
        # 간격을 초로 변환
        seconds_map = {
            "1m": 60,
            "3m": 180,
            "5m": 300,
            "15m": 900,
            "30m": 1800,
            "1h": 3600,
        }
        interval_seconds = seconds_map.get(interval, 60)
        
        # 틱 데이터 파싱
        ticks = []
        for tick_json in tick_data:
            try:
                tick = json.loads(tick_json)
                # ISO 포맷 시간을 타임스탬프로 변환
                timestamp = datetime.fromisoformat(tick["timestamp"])
                tick["timestamp"] = timestamp
                ticks.append(tick)
            except (json.JSONDecodeError, ValueError) as e:
                logger.error(f"틱 데이터 파싱 실패: {e}")
                continue
        
        # 시간순 정렬
        ticks.sort(key=lambda x: x["timestamp"])
        
        # 빈 캔들 딕셔너리 초기화
        candles = {}
        
        # 틱 데이터를 캔들로 집계
        for tick in ticks:
            # 캔들 시작 시간 계산
            tick_time = tick["timestamp"]
            candle_timestamp = tick_time.replace(
                microsecond=0,
                second=0,
                minute=(tick_time.minute // (interval_seconds // 60)) * (interval_seconds // 60)
            )
            
            # 캔들 키
            candle_key = candle_timestamp.isoformat()
            
            # 새 캔들 생성 or 기존 캔들 업데이트
            if candle_key not in candles:
                candles[candle_key] = {
                    "timestamp": candle_key,
                    "open": tick["price"],
                    "high": tick["price"],
                    "low": tick["price"],
                    "close": tick["price"],
                    "volume": tick.get("volume", 0),
                }
            else:
                candle = candles[candle_key]
                candle["high"] = max(candle["high"], tick["price"])
                candle["low"] = min(candle["low"], tick["price"])
                candle["close"] = tick["price"]
                candle["volume"] += tick.get("volume", 0)
        
        # 딕셔너리를 리스트로 변환
        candle_list = list(candles.values())
        
        # 시간 역순 정렬 (최신 데이터가 먼저)
        candle_list.sort(key=lambda x: x["timestamp"], reverse=True)
        
        # 개수 제한
        return candle_list[:limit]
    
    async def analyze_market_data(
        self,
        symbol: str,
        interval: str = "1m"
    ) -> Dict[str, Any]:
        """
        시장 데이터 분석
        
        Args:
            symbol: 종목 코드
            interval: 캔들 간격
            
        Returns:
            분석 결과
        """
        # 캐시 키
        cache_key = f"{symbol}:{interval}"
        
        # 캐시된 결과가 있다면 반환
        if cache_key in self.analysis_cache:
            cached_result = self.analysis_cache[cache_key]
            cache_time = cached_result.get("timestamp")
            
            # 캐시가 10초 이내라면 캐시된 결과 반환
            if cache_time and (datetime.now() - datetime.fromisoformat(cache_time)).total_seconds() < 10:
                return cached_result
        
        try:
            # 캔들 데이터 조회 (최소 30개)
            candles = await self.get_candle_data(symbol, interval, 100)
            
            if not candles:
                logger.warning(f"종목 {symbol}의 캔들 데이터가 없습니다")
                return {}
                
            # 기술적 지표 계산
            analyzed_data = TechnicalIndicators.calculate_all_indicators(candles)
            
            # 최신 데이터 추출
            latest_data = analyzed_data[0] if analyzed_data else {}
            
            # 현재가 조회
            current_price = await self.get_current_price(symbol)
            
            # 분석 결과 생성
            result = {
                "symbol": symbol,
                "interval": interval,
                "timestamp": datetime.now().isoformat(),
                "current_price": current_price.get("price", 0),
                "change": 0,  # 추후 계산
                "indicators": {
                    "rsi": latest_data.get("rsi"),
                    "macd": latest_data.get("macd"),
                    "macd_signal": latest_data.get("macd_signal"),
                    "macd_histogram": latest_data.get("macd_histogram"),
                    "bb_upper": latest_data.get("bb_upper"),
                    "bb_middle": latest_data.get("bb_middle"),
                    "bb_lower": latest_data.get("bb_lower"),
                },
                "candles": analyzed_data[:30],  # 최근 30개 캔들만 반환
            }
            
            # 변동률 계산
            if len(analyzed_data) >= 2:
                prev_close = analyzed_data[1].get("close", 0)
                if prev_close > 0:
                    result["change"] = (current_price.get("price", 0) - prev_close) / prev_close * 100
            
            # 캐시에 저장
            self.analysis_cache[cache_key] = result
            
            # Redis에도 저장
            await self.redis_client.set(
                f"analysis:{symbol}:{interval}",
                json.dumps(result),
                ex=60  # 60초 만료
            )
            
            return result
        except Exception as e:
            logger.error(f"시장 데이터 분석 실패: {e}")
            return {}
    
    async def get_market_summary(self, symbols: List[str]) -> Dict[str, Any]:
        """
        여러 종목의 시장 요약 정보 조회
        
        Args:
            symbols: 종목 코드 리스트
            
        Returns:
            종목별 요약 정보
        """
        result = {}
        
        # 각 종목별로 분석 실행
        analysis_tasks = []
        for symbol in symbols:
            task = asyncio.create_task(self.analyze_market_data(symbol, "1m"))
            analysis_tasks.append((symbol, task))
        
        # 모든 분석 작업 대기 및 결과 취합
        for symbol, task in analysis_tasks:
            try:
                analysis = await task
                
                # 필요한 정보만 추출
                if analysis:
                    result[symbol] = {
                        "symbol": symbol,
                        "price": analysis.get("current_price", 0),
                        "change": analysis.get("change", 0),
                        "rsi": analysis.get("indicators", {}).get("rsi"),
                        "macd_histogram": analysis.get("indicators", {}).get("macd_histogram"),
                        "bb_position": self._calculate_bb_position(analysis),
                        "timestamp": analysis.get("timestamp"),
                    }
            except Exception as e:
                logger.error(f"종목 {symbol} 요약 정보 조회 실패: {e}")
        
        return result
    
    def _calculate_bb_position(self, analysis: Dict[str, Any]) -> float:
        """
        볼린저 밴드 내 현재 가격 위치 계산 (0~100%)
        
        Args:
            analysis: 분석 결과
            
        Returns:
            볼린저 밴드 내 위치 (0: 하단 밴드, 50: 중앙 밴드, 100: 상단 밴드)
        """
        try:
            indicators = analysis.get("indicators", {})
            current_price = analysis.get("current_price", 0)
            bb_upper = indicators.get("bb_upper", 0)
            bb_lower = indicators.get("bb_lower", 0)
            
            if not (bb_upper and bb_lower) or bb_upper <= bb_lower:
                return 50  # 기본값
                
            # 현재가가 밴드 내에 있는 상대적 위치 계산 (0~100%)
            position = (current_price - bb_lower) / (bb_upper - bb_lower) * 100
            
            # 범위 제한
            return max(0, min(100, position))
        except Exception:
            return 50  # 기본값 