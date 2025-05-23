from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class Order(BaseModel):
    id: str
    symbol: str
    time: datetime
    side: str  # "buy" or "sell"
    price: float
    quantity: float
    status: str  # "pending", "filled", "canceled"

class Position(BaseModel):
    symbol: str
    quantity: float
    entry_price: float
    current_price: float
    profit: float
    profit_percent: float

class DashboardData(BaseModel):
    last_update: datetime
    total_profit: float
    profit_change: float # Percentage change from last week
    total_orders: int
    success_rate: float
    active_positions_count: int
    avg_holding_time: str # e.g., "2h 15m"
    total_alerts: int
    critical_alerts: int
    warning_alerts: int
    # For performance chart (example)
    performance_trend: List[Dict[str, Any]] = Field(default_factory=list) 
    recent_orders: List[Order] = Field(default_factory=list)
    current_positions: List[Position] = Field(default_factory=list)
    # For strategy performance (example)
    strategy_performance: List[Dict[str, Any]] = Field(default_factory=list)

class Signal(BaseModel):
    id: str
    symbol: str
    strategy: str
    signal_type: str # "buy", "sell", "hold"
    confidence: float
    price_target: Optional[float] = None
    stop_loss: Optional[float] = None
    timestamp: datetime
    metadata: Optional[Dict[str, Any]] = None

class Alert(BaseModel):
    id: str
    timestamp: datetime
    severity: str # "critical", "warning", "info"
    message: str
    source: str # e.g., "system", "strategy_x"

class BacktestResult(BaseModel):
    id: str
    strategy_name: str
    symbol: str
    start_time: datetime
    end_time: datetime
    total_trades: int
    winning_trades: int
    losing_trades: int
    total_profit: float
    profit_factor: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    max_drawdown: Optional[float] = None
    # Further detailed results can be added
    trade_log: List[Dict[str, Any]] = Field(default_factory=list)

class Setting(BaseModel):
    key: str
    value: Any
    description: Optional[str] = None
    category: Optional[str] = None # e.g., "general", "trading", "notifications"

class HelpArticle(BaseModel):
    id: str
    title: str
    content: str # Can be Markdown or HTML
    category: str
    last_updated: datetime 