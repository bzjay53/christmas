"""
스캘핑 전략 - 100% 승률 목표 알고리즘
안전한 단기 매매로 꾸준한 수익 창출
"""
import asyncio
import logging
import numpy as np
import pandas as pd
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Tuple, Any
from dataclasses import dataclass

from app.trading.real_broker_api import get_trading_engine, OrderType
from app.notification.telegram_bot_service import get_telegram_service
from app.analysis.simple_indicators import SimpleIndicators

logger = logging.getLogger(__name__)

@dataclass
class TradingSignal:
    """거래 신호"""
    symbol: str
    action: str  # 'BUY', 'SELL', 'HOLD'
    confidence: float  # 0.0 ~ 1.0
    price: float
    quantity: int
    reason: str
    timestamp: datetime

class TechnicalIndicators:
    """기술적 지표 계산 클래스"""
    
    @staticmethod
    def calculate_rsi(prices: np.array, period: int = 14) -> float:
        """RSI 계산"""
        return SimpleIndicators.rsi(prices, period)
    
    @staticmethod
    def calculate_macd(prices: np.array) -> Tuple[float, float, float]:
        """MACD 계산"""
        return SimpleIndicators.macd(prices)
    
    @staticmethod
    def calculate_bollinger_bands(prices: np.array, period: int = 20) -> Tuple[float, float, float]:
        """볼린저 밴드 계산"""
        return SimpleIndicators.bollinger_bands(prices, period)
    
    @staticmethod
    def calculate_moving_averages(prices: np.array) -> Dict[str, float]:
        """이동평균 계산"""
        result = {}
        for period in [5, 10, 20, 60]:
            if len(prices) >= period:
                ma_values = SimpleIndicators.sma(prices, period)
                result[f'ma_{period}'] = ma_values[-1]
            else:
                result[f'ma_{period}'] = prices[-1]
        return result
    
    @staticmethod
    def calculate_volume_indicators(prices: np.array, volumes: np.array) -> Dict[str, float]:
        """거래량 지표 계산"""
        if len(prices) < 10 or len(volumes) < 10:
            return {'volume_ratio': 1.0, 'price_volume_trend': 0.0}
        
        avg_volume = np.mean(volumes[-10:])
        current_volume = volumes[-1]
        
        return {
            'volume_ratio': current_volume / avg_volume if avg_volume > 0 else 1.0,
            'price_volume_trend': (prices[-1] - prices[-2]) * current_volume
        }

class SafetyManager:
    """안전 관리 시스템"""
    
    def __init__(self, max_position_size: float = 0.1, max_daily_loss: float = 0.03):
        self.max_position_size = max_position_size  # 최대 포지션 크기 (총 자산의 10%)
        self.max_daily_loss = max_daily_loss       # 최대 일일 손실 (3%)
        self.daily_pnl = 0.0
        self.open_positions = {}
        
    def can_open_position(self, symbol: str, position_value: float, total_portfolio_value: float) -> bool:
        """포지션 오픈 가능 여부 확인"""
        # 포지션 크기 제한
        if position_value > total_portfolio_value * self.max_position_size:
            logger.warning(f"포지션 크기 초과: {position_value} > {total_portfolio_value * self.max_position_size}")
            return False
        
        # 일일 손실 제한
        if self.daily_pnl < -total_portfolio_value * self.max_daily_loss:
            logger.warning(f"일일 손실 한도 초과: {self.daily_pnl}")
            return False
        
        # 중복 포지션 방지
        if symbol in self.open_positions:
            logger.warning(f"이미 포지션 보유: {symbol}")
            return False
        
        return True
    
    def update_daily_pnl(self, pnl: float):
        """일일 손익 업데이트"""
        self.daily_pnl += pnl

class ScalpingStrategy:
    """초단타 매매 전략"""
    
    def __init__(self, symbols: List[str], min_profit_rate: float = 0.005):
        self.symbols = symbols
        self.min_profit_rate = min_profit_rate  # 최소 수익률 0.5%
        self.price_history: Dict[str, List[float]] = {symbol: [] for symbol in symbols}
        self.volume_history: Dict[str, List[float]] = {symbol: [] for symbol in symbols}
        self.indicators = TechnicalIndicators()
        self.safety_manager = SafetyManager()
        self.trading_engine = None
        self.telegram_service = None
        self.is_running = False
        
    async def start(self):
        """전략 시작"""
        self.trading_engine = get_trading_engine()
        self.telegram_service = get_telegram_service()
        
        if not self.trading_engine:
            raise Exception("거래 엔진이 초기화되지 않았습니다")
            
        self.is_running = True
        logger.info("초단타 매매 전략 시작")
        
        if self.telegram_service:
            await self.telegram_service.send_system_message(
                "🎯 초단타 매매 전략 시작\n"
                f"📊 대상 종목: {', '.join(self.symbols)}\n"
                f"💰 최소 수익률: {self.min_profit_rate*100:.1f}%"
            )
    
    async def stop(self):
        """전략 중지"""
        self.is_running = False
        logger.info("초단타 매매 전략 중지")
        
        if self.telegram_service:
            await self.telegram_service.send_system_message("🛑 초단타 매매 전략 중지")
    
    async def update_market_data(self, symbol: str, price: float, volume: float):
        """시장 데이터 업데이트"""
        self.price_history[symbol].append(price)
        self.volume_history[symbol].append(volume)
        
        # 최대 200개 데이터만 유지
        if len(self.price_history[symbol]) > 200:
            self.price_history[symbol] = self.price_history[symbol][-200:]
            self.volume_history[symbol] = self.volume_history[symbol][-200:]
    
    def analyze_market_conditions(self, symbol: str) -> Dict[str, Any]:
        """시장 상황 분석"""
        prices = np.array(self.price_history[symbol])
        volumes = np.array(self.volume_history[symbol])
        
        if len(prices) < 20:
            return {"status": "insufficient_data"}
        
        current_price = prices[-1]
        
        # 기술적 지표 계산
        rsi = self.indicators.calculate_rsi(prices)
        macd, signal, hist = self.indicators.calculate_macd(prices)
        upper_bb, middle_bb, lower_bb = self.indicators.calculate_bollinger_bands(prices)
        mas = self.indicators.calculate_moving_averages(prices)
        volume_indicators = self.indicators.calculate_volume_indicators(prices, volumes)
        
        # 트렌드 분석
        short_ma = mas['ma_5']
        long_ma = mas['ma_20']
        trend = "상승" if short_ma > long_ma else "하락"
        
        # 변동성 분석
        bb_width = (upper_bb - lower_bb) / middle_bb
        volatility = "높음" if bb_width > 0.04 else "낮음"
        
        return {
            "status": "analyzed",
            "current_price": current_price,
            "rsi": rsi,
            "macd": {"macd": macd, "signal": signal, "histogram": hist},
            "bollinger": {"upper": upper_bb, "middle": middle_bb, "lower": lower_bb},
            "moving_averages": mas,
            "volume": volume_indicators,
            "trend": trend,
            "volatility": volatility,
            "bb_width": bb_width
        }
    
    def generate_safe_signal(self, symbol: str, analysis: Dict[str, Any]) -> Optional[TradingSignal]:
        """안전한 거래 신호 생성 (100% Win-Rate 목표)"""
        if analysis["status"] != "analyzed":
            return None
        
        current_price = analysis["current_price"]
        rsi = analysis["rsi"]
        macd_data = analysis["macd"]
        bb_data = analysis["bollinger"]
        volume_data = analysis["volume"]
        
        # 매수 신호 조건 (매우 보수적)
        buy_conditions = [
            rsi < 30,  # 과매도
            current_price <= bb_data["lower"] * 1.001,  # 볼린저 밴드 하단 근처
            macd_data["macd"] > macd_data["signal"],  # MACD 상승 신호
            volume_data["volume_ratio"] > 1.2,  # 거래량 증가
            analysis["volatility"] == "낮음"  # 낮은 변동성에서만 거래
        ]
        
        # 매도 신호 조건 (빠른 익절)
        sell_conditions = [
            rsi > 70,  # 과매수
            current_price >= bb_data["upper"] * 0.999,  # 볼린저 밴드 상단 근처
            macd_data["histogram"] < 0  # MACD 하락 신호
        ]
        
        # 강력한 매수 신호 (모든 조건 만족)
        if all(buy_conditions):
            confidence = 0.9
            quantity = self._calculate_safe_quantity(symbol, current_price)
            
            if quantity > 0:
                return TradingSignal(
                    symbol=symbol,
                    action="BUY",
                    confidence=confidence,
                    price=current_price,
                    quantity=quantity,
                    reason=f"과매도+볼린저하단+MACD상승+거래량증가 (RSI:{rsi:.1f})",
                    timestamp=datetime.now()
                )
        
        # 보유 중인 경우 매도 신호
        if symbol in self.safety_manager.open_positions:
            position = self.safety_manager.open_positions[symbol]
            profit_rate = (current_price - position['buy_price']) / position['buy_price']
            
            # 익절 조건: 최소 수익률 달성 또는 기술적 매도 신호
            if profit_rate >= self.min_profit_rate or any(sell_conditions):
                return TradingSignal(
                    symbol=symbol,
                    action="SELL",
                    confidence=0.8,
                    price=current_price,
                    quantity=position['quantity'],
                    reason=f"익절실현 (수익률:{profit_rate*100:.2f}%)" if profit_rate >= self.min_profit_rate else "기술적매도신호",
                    timestamp=datetime.now()
                )
            
            # 손절 조건: -1% 손실
            elif profit_rate <= -0.01:
                return TradingSignal(
                    symbol=symbol,
                    action="SELL",
                    confidence=1.0,
                    price=current_price,
                    quantity=position['quantity'],
                    reason=f"손절컷 (손실률:{profit_rate*100:.2f}%)",
                    timestamp=datetime.now()
                )
        
        return None
    
    def _calculate_safe_quantity(self, symbol: str, price: float) -> int:
        """안전한 매수 수량 계산"""
        if not self.trading_engine:
            return 0
        
        # 계좌 정보 가져오기 (여기서는 임시로 1000만원 가정)
        total_value = 10_000_000  # 실제로는 API에서 가져와야 함
        max_position_value = total_value * self.safety_manager.max_position_size
        
        max_quantity = int(max_position_value / price)
        
        # 최소 10주, 최대 100주로 제한
        return max(10, min(max_quantity, 100))
    
    async def execute_signal(self, signal: TradingSignal) -> bool:
        """거래 신호 실행"""
        if not self.trading_engine:
            return False
        
        try:
            if signal.action == "BUY":
                # 안전성 검사
                position_value = signal.price * signal.quantity
                if not self.safety_manager.can_open_position(signal.symbol, position_value, 10_000_000):
                    return False
                
                # 매수 실행
                success = await self.trading_engine.buy_stock(
                    symbol=signal.symbol,
                    quantity=signal.quantity,
                    price=signal.price,
                    order_type=OrderType.LIMIT
                )
                
                if success:
                    # 포지션 기록
                    self.safety_manager.open_positions[signal.symbol] = {
                        'quantity': signal.quantity,
                        'buy_price': signal.price,
                        'timestamp': signal.timestamp
                    }
                    
                    # 텔레그램 알림
                    if self.telegram_service:
                        await self.telegram_service.send_system_message(
                            f"🟢 매수 신호 실행\n"
                            f"📊 {signal.symbol}\n"
                            f"💰 {signal.quantity}주 @ {signal.price:,.0f}원\n"
                            f"🎯 신뢰도: {signal.confidence*100:.0f}%\n"
                            f"📝 사유: {signal.reason}"
                        )
                
                return success
                
            elif signal.action == "SELL":
                # 매도 실행
                success = await self.trading_engine.sell_stock(
                    symbol=signal.symbol,
                    quantity=signal.quantity,
                    price=signal.price,
                    order_type=OrderType.LIMIT
                )
                
                if success and signal.symbol in self.safety_manager.open_positions:
                    # 손익 계산
                    position = self.safety_manager.open_positions[signal.symbol]
                    profit = (signal.price - position['buy_price']) * signal.quantity
                    profit_rate = (signal.price - position['buy_price']) / position['buy_price']
                    
                    # 일일 손익 업데이트
                    self.safety_manager.update_daily_pnl(profit)
                    
                    # 포지션 제거
                    del self.safety_manager.open_positions[signal.symbol]
                    
                    # 텔레그램 알림
                    if self.telegram_service:
                        profit_emoji = "💰" if profit > 0 else "📉"
                        await self.telegram_service.send_system_message(
                            f"🔴 매도 신호 실행\n"
                            f"📊 {signal.symbol}\n"
                            f"💰 {signal.quantity}주 @ {signal.price:,.0f}원\n"
                            f"{profit_emoji} 손익: {profit:,.0f}원 ({profit_rate*100:.2f}%)\n"
                            f"📝 사유: {signal.reason}"
                        )
                
                return success
                
        except Exception as e:
            logger.error(f"신호 실행 오류: {e}")
            return False
        
        return False
    
    async def run_strategy_loop(self):
        """전략 실행 루프"""
        while self.is_running:
            try:
                # 장 시간 확인
                if not (self.trading_engine.scheduler.is_trading_hours() or 
                       self.trading_engine.scheduler.is_pre_market()):
                    await asyncio.sleep(60)  # 장외 시간에는 1분마다 확인
                    continue
                
                # 각 종목별 분석 및 거래
                for symbol in self.symbols:
                    # 현재가 데이터 업데이트 (실제로는 실시간 데이터 필요)
                    current_price = await self._get_current_price(symbol)
                    if current_price:
                        await self.update_market_data(symbol, current_price, 100000)  # 임시 거래량
                        
                        # 시장 분석
                        analysis = self.analyze_market_conditions(symbol)
                        
                        # 거래 신호 생성
                        signal = self.generate_safe_signal(symbol, analysis)
                        
                        # 신호 실행
                        if signal and signal.confidence > 0.7:
                            await self.execute_signal(signal)
                
                # 짧은 간격으로 반복 (스캘핑)
                await asyncio.sleep(10)  # 10초마다 확인
                
            except Exception as e:
                logger.error(f"전략 루프 오류: {e}")
                await asyncio.sleep(5)
    
    async def _get_current_price(self, symbol: str) -> Optional[float]:
        """현재가 조회 (실제로는 브로커 API 사용)"""
        try:
            if self.trading_engine and hasattr(self.trading_engine.broker_api, 'get_current_price'):
                return await self.trading_engine.broker_api.get_current_price(symbol)
            else:
                # 임시 가격 (실제로는 실시간 데이터 필요)
                import random
                base_prices = {"005930": 75000, "000660": 130000, "035420": 58000}  # 삼성전자, SK하이닉스, 네이버
                base_price = base_prices.get(symbol, 50000)
                return base_price * (1 + random.uniform(-0.02, 0.02))
        except Exception as e:
            logger.error(f"현재가 조회 오류: {e}")
            return None

# 전역 전략 인스턴스
_strategy: Optional[ScalpingStrategy] = None

async def start_scalping_strategy(symbols: List[str] = None):
    """초단타 전략 시작"""
    global _strategy
    
    if not symbols:
        symbols = ["005930", "000660", "035420"]  # 삼성전자, SK하이닉스, 네이버
    
    _strategy = ScalpingStrategy(symbols)
    await _strategy.start()
    
    # 전략 루프 시작
    asyncio.create_task(_strategy.run_strategy_loop())
    
    return _strategy

async def stop_scalping_strategy():
    """초단타 전략 중지"""
    global _strategy
    if _strategy:
        await _strategy.stop()
        _strategy = None

def get_strategy() -> Optional[ScalpingStrategy]:
    """전략 인스턴스 반환"""
    return _strategy 