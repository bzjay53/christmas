import asyncio
import logging
import os
import signal
import json
import redis.asyncio as redis
from typing import List, Dict, Any
from datetime import datetime

from .market_data_service import MarketDataService

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

# 환경 변수에서 설정 로드
REDIS_HOST = os.getenv("CHRISTMAS_REDIS_HOST", "localhost")
REDIS_PORT = int(os.getenv("CHRISTMAS_REDIS_PORT", "6379"))

# 감시할 종목 리스트
WATCH_SYMBOLS = ["005930", "035720", "000660"]  # 삼성전자, 카카오, SK하이닉스

class AnalysisService:
    """
    시장 데이터 분석 서비스.
    주기적으로 데이터를 분석하고, 결과를 Redis에 저장합니다.
    """
    
    def __init__(self):
        """생성자"""
        self.redis_client = redis.Redis(host=REDIS_HOST, port=REDIS_PORT, decode_responses=True)
        self.market_data_service = MarketDataService()
        self.running = False
        self.pubsub = self.redis_client.pubsub()
        
    async def initialize(self):
        """서비스 초기화"""
        # Redis 연결 확인
        try:
            await self.redis_client.ping()
            logger.info("Redis 서버에 연결되었습니다")
        except Exception as e:
            logger.error(f"Redis 연결 실패: {e}")
            raise
            
        # 종료 시그널 핸들러 등록
        for sig in (signal.SIGINT, signal.SIGTERM):
            signal.signal(sig, self.handle_shutdown)
            
        # 실시간 틱 업데이트 구독
        for symbol in WATCH_SYMBOLS:
            await self.pubsub.subscribe(f"tick_updates:{symbol}")
        
        self.running = True
        logger.info("분석 서비스가 초기화되었습니다")
    
    def handle_shutdown(self, signum, frame):
        """종료 시그널 처리"""
        logger.info(f"종료 시그널 {signum} 수신")
        self.running = False
    
    async def start(self):
        """서비스 시작"""
        await self.initialize()
        
        # 주기적 분석 작업과 실시간 틱 처리를 병렬로 실행
        tasks = [
            asyncio.create_task(self.periodic_analysis()),
            asyncio.create_task(self.listen_tick_updates())
        ]
        
        try:
            # 모든 작업이 완료될 때까지 대기
            await asyncio.gather(*tasks)
        except asyncio.CancelledError:
            logger.info("작업이 취소되었습니다")
        finally:
            await self.shutdown()
    
    async def shutdown(self):
        """서비스 종료"""
        self.running = False
        
        # Redis PubSub 구독 해제
        await self.pubsub.unsubscribe()
        await self.pubsub.close()
        
        # Redis 연결 종료
        await self.redis_client.close()
        
        logger.info("서비스가 종료되었습니다")
    
    async def periodic_analysis(self):
        """
        주기적인 시장 데이터 분석 수행
        1분마다 모든 감시 종목에 대해 분석 실행
        """
        try:
            while self.running:
                # 시작 시간 기록
                start_time = datetime.now()
                
                logger.info("주기적 분석 작업 시작")
                
                # 모든 종목에 대해 분석 수행
                for symbol in WATCH_SYMBOLS:
                    try:
                        # 1분봉 분석
                        minute_analysis = await self.market_data_service.analyze_market_data(
                            symbol, "1m"
                        )
                        
                        # 5분봉 분석
                        five_min_analysis = await self.market_data_service.analyze_market_data(
                            symbol, "5m"
                        )
                        
                        # 시장 상태 평가
                        market_status = self.evaluate_market_status(minute_analysis, five_min_analysis)
                        
                        # Redis에 저장
                        await self.redis_client.set(
                            f"market_status:{symbol}",
                            json.dumps(market_status),
                            ex=120  # 2분 만료
                        )
                        
                        logger.info(f"종목 {symbol} 분석 완료: {market_status['status']}")
                    except Exception as e:
                        logger.error(f"종목 {symbol} 분석 실패: {e}")
                
                # 모든 종목 요약 정보
                try:
                    market_summary = await self.market_data_service.get_market_summary(WATCH_SYMBOLS)
                    await self.redis_client.set(
                        "market_summary",
                        json.dumps(market_summary),
                        ex=120  # 2분 만료
                    )
                except Exception as e:
                    logger.error(f"시장 요약 정보 생성 실패: {e}")
                
                # 1분에 한 번씩 실행 (작업 시간 고려)
                elapsed = (datetime.now() - start_time).total_seconds()
                sleep_time = max(0, 60 - elapsed)
                await asyncio.sleep(sleep_time)
        except asyncio.CancelledError:
            logger.info("주기적 분석 작업이 취소되었습니다")
            raise
    
    async def listen_tick_updates(self):
        """
        Redis PubSub에서 실시간 틱 업데이트 수신 및 처리
        """
        try:
            while self.running:
                message = await self.pubsub.get_message(ignore_subscribe_messages=True)
                
                if message is not None:
                    try:
                        channel = message["channel"]
                        data = json.loads(message["data"])
                        
                        # 채널에서 종목 코드 추출
                        symbol = channel.split(":")[-1]
                        
                        # 실시간 분석 수행
                        await self.handle_tick_update(symbol, data)
                    except (json.JSONDecodeError, KeyError) as e:
                        logger.error(f"틱 업데이트 메시지 파싱 실패: {e}")
                
                # 짧은 대기 (CPU 사용량 조절)
                await asyncio.sleep(0.01)
        except asyncio.CancelledError:
            logger.info("틱 업데이트 리스너가 취소되었습니다")
            raise
        except Exception as e:
            logger.error(f"틱 업데이트 처리 중 오류 발생: {e}")
            if self.running:
                # 복구 시도
                await asyncio.sleep(5)
                await self.listen_tick_updates()
    
    async def handle_tick_update(self, symbol: str, tick_data: Dict[str, Any]):
        """
        실시간 틱 업데이트 처리
        
        Args:
            symbol: 종목 코드
            tick_data: 틱 데이터
        """
        try:
            # 최신 시장 상태 조회
            market_status_json = await self.redis_client.get(f"market_status:{symbol}")
            
            # 시장 상태가 없으면 건너뜀
            if not market_status_json:
                return
                
            market_status = json.loads(market_status_json)
            
            # 현재가 업데이트
            current_price = tick_data.get("price", 0)
            
            # 시장 상태 업데이트
            updated_status = self.update_market_status(market_status, current_price)
            
            # Redis에 저장
            await self.redis_client.set(
                f"market_status:{symbol}",
                json.dumps(updated_status),
                ex=120  # 2분 만료
            )
            
            # 상태 변경이 있을 경우 이벤트 발행
            if updated_status.get("status") != market_status.get("status"):
                logger.info(f"종목 {symbol} 상태 변경: {market_status.get('status')} -> {updated_status.get('status')}")
                
                # 상태 변경 이벤트 발행
                await self.redis_client.publish(
                    f"status_change:{symbol}",
                    json.dumps({
                        "symbol": symbol,
                        "old_status": market_status.get("status"),
                        "new_status": updated_status.get("status"),
                        "price": current_price,
                        "timestamp": datetime.now().isoformat(),
                    })
                )
        except Exception as e:
            logger.error(f"틱 업데이트 처리 실패: {e}")
    
    def evaluate_market_status(
        self,
        minute_analysis: Dict[str, Any],
        five_min_analysis: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        시장 상태 평가
        
        Args:
            minute_analysis: 1분봉 분석 결과
            five_min_analysis: 5분봉 분석 결과
            
        Returns:
            시장 상태
        """
        # 기본 상태
        status = "NEUTRAL"
        confidence = 0
        signals = []
        
        try:
            # 지표 추출
            rsi_1m = minute_analysis.get("indicators", {}).get("rsi")
            macd_histogram_1m = minute_analysis.get("indicators", {}).get("macd_histogram")
            bb_upper_1m = minute_analysis.get("indicators", {}).get("bb_upper")
            bb_lower_1m = minute_analysis.get("indicators", {}).get("bb_lower")
            bb_middle_1m = minute_analysis.get("indicators", {}).get("bb_middle")
            
            rsi_5m = five_min_analysis.get("indicators", {}).get("rsi")
            macd_histogram_5m = five_min_analysis.get("indicators", {}).get("macd_histogram")
            
            current_price = minute_analysis.get("current_price", 0)
            
            # 매수 신호 확인
            buy_signals = []
            if rsi_1m is not None and rsi_1m < 30:
                buy_signals.append(f"RSI 1분봉 과매도({rsi_1m:.2f})")
            
            if rsi_5m is not None and rsi_5m < 30:
                buy_signals.append(f"RSI 5분봉 과매도({rsi_5m:.2f})")
            
            if macd_histogram_1m is not None and macd_histogram_1m > 0 and macd_histogram_5m is not None and macd_histogram_5m > 0:
                buy_signals.append("MACD 1분봉 및 5분봉 상승")
            
            if bb_lower_1m is not None and current_price < bb_lower_1m:
                buy_signals.append("볼린저 밴드 하단 돌파")
            
            # 매도 신호 확인
            sell_signals = []
            if rsi_1m is not None and rsi_1m > 70:
                sell_signals.append(f"RSI 1분봉 과매수({rsi_1m:.2f})")
            
            if rsi_5m is not None and rsi_5m > 70:
                sell_signals.append(f"RSI 5분봉 과매수({rsi_5m:.2f})")
            
            if macd_histogram_1m is not None and macd_histogram_1m < 0 and macd_histogram_5m is not None and macd_histogram_5m < 0:
                sell_signals.append("MACD 1분봉 및 5분봉 하락")
            
            if bb_upper_1m is not None and current_price > bb_upper_1m:
                sell_signals.append("볼린저 밴드 상단 돌파")
            
            # 시장 상태 결정
            if len(buy_signals) > len(sell_signals) and len(buy_signals) >= 2:
                status = "BUY"
                confidence = min(100, len(buy_signals) * 25)
                signals = buy_signals
            elif len(sell_signals) > len(buy_signals) and len(sell_signals) >= 2:
                status = "SELL"
                confidence = min(100, len(sell_signals) * 25)
                signals = sell_signals
            else:
                # 중립 상태
                status = "NEUTRAL"
                confidence = 50
                signals = ["명확한 매매 신호 없음"]
                
                # 약한 신호 추가
                if len(buy_signals) > 0:
                    signals.extend(buy_signals)
                if len(sell_signals) > 0:
                    signals.extend(sell_signals)
        except Exception as e:
            logger.error(f"시장 상태 평가 실패: {e}")
            status = "ERROR"
            confidence = 0
            signals = [f"분석 오류: {str(e)}"]
        
        return {
            "symbol": minute_analysis.get("symbol"),
            "status": status,
            "confidence": confidence,
            "signals": signals,
            "current_price": current_price,
            "timestamp": datetime.now().isoformat(),
        }
    
    def update_market_status(
        self,
        market_status: Dict[str, Any],
        current_price: float
    ) -> Dict[str, Any]:
        """
        실시간 틱으로 시장 상태 업데이트
        
        Args:
            market_status: 기존 시장 상태
            current_price: 최신 가격
            
        Returns:
            업데이트된 시장 상태
        """
        # 상태 복사
        updated_status = market_status.copy()
        
        # 현재가 업데이트
        updated_status["current_price"] = current_price
        updated_status["timestamp"] = datetime.now().isoformat()
        
        # 여기서 추가적인 로직을 구현할 수 있음
        # 예: 급격한 가격 변동 감지, 지정가 도달 확인 등
        
        return updated_status


async def main():
    """메인 함수"""
    service = AnalysisService()
    try:
        await service.start()
    except Exception as e:
        logger.error(f"서비스 실행 중 오류 발생: {e}")
    finally:
        await service.shutdown()


if __name__ == "__main__":
    asyncio.run(main()) 