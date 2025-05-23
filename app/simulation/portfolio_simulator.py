"""
실제 작동하는 모의 투자 시스템
"""
import asyncio
import logging
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, field
import json
import random

from app.notification.telegram_bot_service import send_order_alert, send_profit_alert

# 로깅 설정
logger = logging.getLogger(__name__)

@dataclass
class Position:
    """포지션 정보"""
    symbol: str
    quantity: int
    avg_price: float
    current_price: float
    market_value: float = field(init=False)
    unrealized_pnl: float = field(init=False)
    
    def __post_init__(self):
        self.update_market_value()
    
    def update_market_value(self):
        """시장가치 및 평가손익 업데이트"""
        self.market_value = self.quantity * self.current_price
        self.unrealized_pnl = (self.current_price - self.avg_price) * self.quantity

@dataclass 
class Trade:
    """거래 기록"""
    timestamp: datetime
    symbol: str
    side: str  # 'buy' or 'sell'
    quantity: int
    price: float
    amount: float
    profit_loss: float = 0.0
    strategy: str = "manual"

class VirtualPortfolio:
    """가상 포트폴리오"""
    
    def __init__(self, initial_cash: float = 10_000_000):  # 기본 1000만원
        self.initial_cash = initial_cash
        self.cash = initial_cash
        self.positions: Dict[str, Position] = {}
        self.trades: List[Trade] = []
        self.start_time = datetime.now()
        
    @property
    def total_value(self) -> float:
        """총 자산가치"""
        positions_value = sum(pos.market_value for pos in self.positions.values())
        return self.cash + positions_value
    
    @property
    def unrealized_pnl(self) -> float:
        """미실현 손익"""
        return sum(pos.unrealized_pnl for pos in self.positions.values())
    
    @property
    def realized_pnl(self) -> float:
        """실현 손익"""
        return sum(trade.profit_loss for trade in self.trades)
    
    @property
    def total_pnl(self) -> float:
        """총 손익"""
        return self.unrealized_pnl + self.realized_pnl
    
    @property
    def return_rate(self) -> float:
        """수익률"""
        return (self.total_value - self.initial_cash) / self.initial_cash * 100
    
    def get_position(self, symbol: str) -> Optional[Position]:
        """포지션 조회"""
        return self.positions.get(symbol)
    
    def buy(self, symbol: str, quantity: int, price: float, strategy: str = "manual") -> bool:
        """매수 주문"""
        amount = quantity * price
        
        # 현금 부족 확인
        if self.cash < amount:
            logger.warning(f"현금 부족: 필요 {amount:,.0f}원, 보유 {self.cash:,.0f}원")
            return False
        
        # 현금 차감
        self.cash -= amount
        
        # 포지션 업데이트
        if symbol in self.positions:
            pos = self.positions[symbol]
            total_amount = pos.quantity * pos.avg_price + amount
            total_quantity = pos.quantity + quantity
            pos.avg_price = total_amount / total_quantity
            pos.quantity = total_quantity
            pos.current_price = price
            pos.update_market_value()
        else:
            self.positions[symbol] = Position(
                symbol=symbol,
                quantity=quantity,
                avg_price=price,
                current_price=price
            )
        
        # 거래 기록
        trade = Trade(
            timestamp=datetime.now(),
            symbol=symbol,
            side="buy",
            quantity=quantity,
            price=price,
            amount=amount,
            strategy=strategy
        )
        self.trades.append(trade)
        
        logger.info(f"매수 완료: {symbol} {quantity:,}주 @ {price:,.0f}원")
        return True
    
    def sell(self, symbol: str, quantity: int, price: float, strategy: str = "manual") -> bool:
        """매도 주문"""
        # 포지션 확인
        if symbol not in self.positions:
            logger.warning(f"포지션 없음: {symbol}")
            return False
        
        pos = self.positions[symbol]
        if pos.quantity < quantity:
            logger.warning(f"수량 부족: 요청 {quantity:,}주, 보유 {pos.quantity:,}주")
            return False
        
        # 매도 처리
        amount = quantity * price
        self.cash += amount
        
        # 손익 계산
        profit_loss = (price - pos.avg_price) * quantity
        
        # 포지션 업데이트
        pos.quantity -= quantity
        pos.current_price = price
        pos.update_market_value()
        
        # 포지션이 모두 청산되면 제거
        if pos.quantity == 0:
            del self.positions[symbol]
        
        # 거래 기록
        trade = Trade(
            timestamp=datetime.now(),
            symbol=symbol,
            side="sell",
            quantity=quantity,
            price=price,
            amount=amount,
            profit_loss=profit_loss,
            strategy=strategy
        )
        self.trades.append(trade)
        
        logger.info(f"매도 완료: {symbol} {quantity:,}주 @ {price:,.0f}원 (손익: {profit_loss:,.0f}원)")
        return True
    
    def update_prices(self, price_data: Dict[str, float]):
        """시장가격 업데이트"""
        for symbol, price in price_data.items():
            if symbol in self.positions:
                self.positions[symbol].current_price = price
                self.positions[symbol].update_market_value()
    
    def get_summary(self) -> Dict[str, Any]:
        """포트폴리오 요약"""
        return {
            "total_value": self.total_value,
            "cash": self.cash,
            "positions_value": sum(pos.market_value for pos in self.positions.values()),
            "unrealized_pnl": self.unrealized_pnl,
            "realized_pnl": self.realized_pnl,
            "total_pnl": self.total_pnl,
            "return_rate": self.return_rate,
            "positions_count": len(self.positions),
            "trades_count": len(self.trades),
            "trading_days": (datetime.now() - self.start_time).days + 1
        }

class MarketSimulator:
    """시장 데이터 시뮬레이터"""
    
    def __init__(self):
        # 가상 종목들과 기본 가격
        self.symbols = {
            "삼성전자": 75000,
            "SK하이닉스": 130000,
            "POSCO": 380000,
            "카카오": 58000,
            "네이버": 225000,
            "LG화학": 680000,
            "현대차": 185000,
            "셀트리온": 195000
        }
        self.current_prices = self.symbols.copy()
        
    def get_current_prices(self) -> Dict[str, float]:
        """현재 시장가격 반환"""
        return self.current_prices.copy()
    
    def update_prices(self):
        """가격 업데이트 (랜덤 변동)"""
        for symbol in self.symbols:
            # ±3% 범위에서 랜덤 변동
            change_rate = random.uniform(-0.03, 0.03)
            self.current_prices[symbol] *= (1 + change_rate)
            
            # 너무 벗어나지 않게 제한
            base_price = self.symbols[symbol]
            if self.current_prices[symbol] < base_price * 0.8:
                self.current_prices[symbol] = base_price * 0.8
            elif self.current_prices[symbol] > base_price * 1.2:
                self.current_prices[symbol] = base_price * 1.2

class TradingSimulator:
    """통합 거래 시뮬레이터"""
    
    def __init__(self, initial_cash: float = 10_000_000):
        self.portfolio = VirtualPortfolio(initial_cash)
        self.market = MarketSimulator()
        self.is_running = False
        self.update_interval = 5  # 5초마다 업데이트
        
    async def start(self):
        """시뮬레이터 시작"""
        self.is_running = True
        logger.info(f"거래 시뮬레이터 시작 (초기자금: {self.portfolio.initial_cash:,.0f}원)")
        
        # 시장 데이터 업데이트 루프 시작
        asyncio.create_task(self._market_update_loop())
        
        # 텔레그램 알림
        await send_order_alert({
            'symbol': 'SYSTEM',
            'side': 'INFO',
            'quantity': 0,
            'price': self.portfolio.initial_cash,
            'status': f'모의투자 시작 (자금: {self.portfolio.initial_cash:,.0f}원)'
        })
    
    async def stop(self):
        """시뮬레이터 중지"""
        self.is_running = False
        logger.info("거래 시뮬레이터 중지")
        
        # 최종 결과 알림
        summary = self.portfolio.get_summary()
        await send_order_alert({
            'symbol': 'SYSTEM',
            'side': 'INFO', 
            'quantity': summary['trades_count'],
            'price': summary['total_pnl'],
            'status': f'모의투자 종료 (수익률: {summary["return_rate"]:.2f}%)'
        })
    
    async def _market_update_loop(self):
        """시장 가격 업데이트 루프"""
        while self.is_running:
            try:
                # 가격 업데이트
                self.market.update_prices()
                current_prices = self.market.get_current_prices()
                self.portfolio.update_prices(current_prices)
                
                await asyncio.sleep(self.update_interval)
                
            except Exception as e:
                logger.error(f"시장 업데이트 오류: {e}")
                await asyncio.sleep(1)
    
    async def buy_order(self, symbol: str, quantity: int, strategy: str = "auto") -> bool:
        """매수 주문"""
        if symbol not in self.market.current_prices:
            logger.warning(f"지원하지 않는 종목: {symbol}")
            return False
        
        price = self.market.current_prices[symbol]
        success = self.portfolio.buy(symbol, quantity, price, strategy)
        
        if success:
            # 텔레그램 알림
            await send_order_alert({
                'symbol': symbol,
                'side': 'buy',
                'quantity': quantity,
                'price': price,
                'status': 'filled'
            })
        
        return success
    
    async def sell_order(self, symbol: str, quantity: int, strategy: str = "auto") -> bool:
        """매도 주문"""
        if symbol not in self.market.current_prices:
            logger.warning(f"지원하지 않는 종목: {symbol}")
            return False
        
        price = self.market.current_prices[symbol]
        success = self.portfolio.sell(symbol, quantity, price, strategy)
        
        if success:
            # 손익 계산 및 알림
            if self.portfolio.trades:
                last_trade = self.portfolio.trades[-1]
                await send_profit_alert(last_trade.profit_loss, symbol)
            
            await send_order_alert({
                'symbol': symbol,
                'side': 'sell',
                'quantity': quantity,
                'price': price,
                'status': 'filled'
            })
        
        return success
    
    def get_portfolio_summary(self) -> Dict[str, Any]:
        """포트폴리오 요약 반환"""
        summary = self.portfolio.get_summary()
        summary['current_prices'] = self.market.get_current_prices()
        summary['positions'] = {
            symbol: {
                'quantity': pos.quantity,
                'avg_price': pos.avg_price,
                'current_price': pos.current_price,
                'market_value': pos.market_value,
                'unrealized_pnl': pos.unrealized_pnl
            }
            for symbol, pos in self.portfolio.positions.items()
        }
        return summary
    
    async def simulate_trading_day(self):
        """하루 거래 시뮬레이션"""
        symbols = list(self.market.symbols.keys())
        
        # 무작위로 3-5회 거래
        trade_count = random.randint(3, 5)
        
        for i in range(trade_count):
            symbol = random.choice(symbols)
            quantity = random.randint(1, 10) * 10  # 10주 단위
            
            # 50% 확률로 매수/매도
            if random.random() > 0.5 and self.portfolio.cash > 1_000_000:
                await self.buy_order(symbol, quantity, "simulation")
            else:
                # 보유 포지션이 있으면 매도
                if symbol in self.portfolio.positions:
                    pos = self.portfolio.positions[symbol]
                    sell_qty = min(quantity, pos.quantity)
                    if sell_qty > 0:
                        await self.sell_order(symbol, sell_qty, "simulation")
            
            # 거래 간 간격
            await asyncio.sleep(2)

# 전역 시뮬레이터 인스턴스
_simulator: Optional[TradingSimulator] = None

def get_simulator() -> Optional[TradingSimulator]:
    """시뮬레이터 인스턴스 반환"""
    return _simulator

async def start_simulation(initial_cash: float = 10_000_000):
    """시뮬레이션 시작"""
    global _simulator
    _simulator = TradingSimulator(initial_cash)
    await _simulator.start()
    return _simulator

async def stop_simulation():
    """시뮬레이션 중지"""
    global _simulator
    if _simulator:
        await _simulator.stop()
        _simulator = None

if __name__ == "__main__":
    # 테스트 실행
    async def test():
        # 시뮬레이터 시작
        sim = await start_simulation(10_000_000)
        
        # 테스트 거래
        await sim.buy_order("삼성전자", 100)
        await asyncio.sleep(2)
        await sim.buy_order("SK하이닉스", 50)
        await asyncio.sleep(2)
        
        # 포트폴리오 확인
        summary = sim.get_portfolio_summary()
        print(f"포트폴리오 요약: {summary}")
        
        # 일부 매도
        await asyncio.sleep(5)
        await sim.sell_order("삼성전자", 50)
        
        # 최종 요약
        final_summary = sim.get_portfolio_summary()
        print(f"최종 요약: {final_summary}")
        
        await stop_simulation()
    
    asyncio.run(test()) 