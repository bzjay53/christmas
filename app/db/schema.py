"""
Supabase 데이터베이스 스키마 정의

이 모듈은 Supabase 데이터베이스의 테이블 구조를 정의합니다.
데이터베이스 스키마를 코드로 문서화하여 개발자들이 참조할 수 있게 합니다.
"""

from typing import Dict, Any, List
from pydantic import BaseModel, Field
from datetime import datetime
from enum import Enum

# 주문 관련 열거형
class OrderSide(str, Enum):
    BUY = "BUY"
    SELL = "SELL"

class OrderType(str, Enum):
    MARKET = "MARKET"
    LIMIT = "LIMIT"

class OrderStatus(str, Enum):
    PENDING = "PENDING"
    ACCEPTED = "ACCEPTED"
    PARTIALLY_FILLED = "PARTIALLY_FILLED"
    FILLED = "FILLED"
    CANCELLED = "CANCELLED"
    REJECTED = "REJECTED"

# 데이터베이스 모델
class User(BaseModel):
    """사용자 테이블 스키마"""
    id: str = Field(..., description="사용자 ID (Supabase Auth ID)")
    email: str = Field(..., description="사용자 이메일")
    first_name: str = Field(None, description="이름")
    last_name: str = Field(None, description="성")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="생성 시간")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="수정 시간")
    
    class Config:
        schema_extra = {
            "table_name": "users",
            "sql": """
            CREATE TABLE users (
                id UUID PRIMARY KEY REFERENCES auth.users(id),
                email TEXT NOT NULL UNIQUE,
                first_name TEXT,
                last_name TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            
            -- RLS 정책 (행 수준 보안)
            ALTER TABLE users ENABLE ROW LEVEL SECURITY;
            
            -- 사용자는 자신의 정보만 볼 수 있음
            CREATE POLICY "Users can view their own data" ON users
                FOR SELECT USING (auth.uid() = id);
                
            -- 사용자는 자신의 정보만 업데이트할 수 있음
            CREATE POLICY "Users can update their own data" ON users
                FOR UPDATE USING (auth.uid() = id);
            """
        }

class Order(BaseModel):
    """주문 테이블 스키마"""
    id: str = Field(..., description="주문 ID (UUID)")
    user_id: str = Field(..., description="사용자 ID")
    client_order_id: str = Field(..., description="클라이언트 주문 ID")
    broker_order_id: str = Field(None, description="브로커 주문 ID")
    symbol: str = Field(..., description="종목 코드")
    side: OrderSide = Field(..., description="매수/매도 방향")
    order_type: OrderType = Field(..., description="주문 유형")
    quantity: float = Field(..., description="주문 수량")
    price: float = Field(None, description="주문 가격")
    status: OrderStatus = Field(OrderStatus.PENDING, description="주문 상태")
    filled_quantity: float = Field(0, description="체결 수량")
    filled_price: float = Field(None, description="체결 가격")
    strategy_id: str = Field(None, description="전략 ID")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="생성 시간")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="수정 시간")
    filled_at: datetime = Field(None, description="체결 시간")
    cancelled_at: datetime = Field(None, description="취소 시간")
    rejected_reason: str = Field(None, description="거부 사유")
    
    class Config:
        schema_extra = {
            "table_name": "orders",
            "sql": """
            CREATE TABLE orders (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id),
                client_order_id TEXT NOT NULL,
                broker_order_id TEXT,
                symbol TEXT NOT NULL,
                side TEXT NOT NULL,
                order_type TEXT NOT NULL,
                quantity DECIMAL NOT NULL,
                price DECIMAL,
                status TEXT NOT NULL,
                filled_quantity DECIMAL DEFAULT 0,
                filled_price DECIMAL,
                strategy_id TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                filled_at TIMESTAMP WITH TIME ZONE,
                cancelled_at TIMESTAMP WITH TIME ZONE,
                rejected_reason TEXT,
                UNIQUE(user_id, client_order_id)
            );
            
            -- 인덱스 생성
            CREATE INDEX idx_orders_user_id ON orders(user_id);
            CREATE INDEX idx_orders_symbol ON orders(symbol);
            CREATE INDEX idx_orders_status ON orders(status);
            CREATE INDEX idx_orders_created_at ON orders(created_at);
            
            -- RLS 정책 (행 수준 보안)
            ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
            
            -- 사용자는 자신의 주문만 볼 수 있음
            CREATE POLICY "Users can view their own orders" ON orders
                FOR SELECT USING (auth.uid() = user_id);
                
            -- 사용자는 자신의 주문만 생성할 수 있음
            CREATE POLICY "Users can insert their own orders" ON orders
                FOR INSERT WITH CHECK (auth.uid() = user_id);
                
            -- 사용자는 자신의 주문만 업데이트할 수 있음
            CREATE POLICY "Users can update their own orders" ON orders
                FOR UPDATE USING (auth.uid() = user_id);
            """
        }

class Position(BaseModel):
    """포지션 테이블 스키마"""
    id: str = Field(..., description="포지션 ID (UUID)")
    user_id: str = Field(..., description="사용자 ID")
    symbol: str = Field(..., description="종목 코드")
    quantity: float = Field(..., description="보유 수량")
    avg_price: float = Field(..., description="평균 매입가")
    current_price: float = Field(None, description="현재가")
    profit_loss: float = Field(None, description="평가 손익")
    profit_loss_rate: float = Field(None, description="평가 손익률")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="생성 시간")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="수정 시간")
    
    class Config:
        schema_extra = {
            "table_name": "positions",
            "sql": """
            CREATE TABLE positions (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id),
                symbol TEXT NOT NULL,
                quantity DECIMAL NOT NULL,
                avg_price DECIMAL NOT NULL,
                current_price DECIMAL,
                profit_loss DECIMAL,
                profit_loss_rate DECIMAL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                UNIQUE(user_id, symbol)
            );
            
            -- 인덱스 생성
            CREATE INDEX idx_positions_user_id ON positions(user_id);
            CREATE INDEX idx_positions_symbol ON positions(symbol);
            
            -- RLS 정책 (행 수준 보안)
            ALTER TABLE positions ENABLE ROW LEVEL SECURITY;
            
            -- 사용자는 자신의 포지션만 볼 수 있음
            CREATE POLICY "Users can view their own positions" ON positions
                FOR SELECT USING (auth.uid() = user_id);
                
            -- 사용자는 자신의 포지션만 업데이트할 수 있음
            CREATE POLICY "Users can update their own positions" ON positions
                FOR UPDATE USING (auth.uid() = user_id);
            """
        }

class Strategy(BaseModel):
    """전략 테이블 스키마"""
    id: str = Field(..., description="전략 ID (UUID)")
    user_id: str = Field(..., description="사용자 ID")
    name: str = Field(..., description="전략 이름")
    description: str = Field(None, description="전략 설명")
    symbols: List[str] = Field(..., description="대상 종목 목록")
    parameters: Dict[str, Any] = Field({}, description="전략 파라미터")
    is_active: bool = Field(False, description="활성화 여부")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="생성 시간")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="수정 시간")
    
    class Config:
        schema_extra = {
            "table_name": "strategies",
            "sql": """
            CREATE TABLE strategies (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id),
                name TEXT NOT NULL,
                description TEXT,
                symbols JSONB NOT NULL,
                parameters JSONB NOT NULL DEFAULT '{}',
                is_active BOOLEAN NOT NULL DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            
            -- 인덱스 생성
            CREATE INDEX idx_strategies_user_id ON strategies(user_id);
            CREATE INDEX idx_strategies_is_active ON strategies(is_active);
            
            -- RLS 정책 (행 수준 보안)
            ALTER TABLE strategies ENABLE ROW LEVEL SECURITY;
            
            -- 사용자는 자신의 전략만 볼 수 있음
            CREATE POLICY "Users can view their own strategies" ON strategies
                FOR SELECT USING (auth.uid() = user_id);
                
            -- 사용자는 자신의 전략만 생성할 수 있음
            CREATE POLICY "Users can insert their own strategies" ON strategies
                FOR INSERT WITH CHECK (auth.uid() = user_id);
                
            -- 사용자는 자신의 전략만 업데이트할 수 있음
            CREATE POLICY "Users can update their own strategies" ON strategies
                FOR UPDATE USING (auth.uid() = user_id);
                
            -- 사용자는 자신의 전략만 삭제할 수 있음
            CREATE POLICY "Users can delete their own strategies" ON strategies
                FOR DELETE USING (auth.uid() = user_id);
            """
        }

class PerformanceMetric(BaseModel):
    """성능 지표 테이블 스키마"""
    id: str = Field(..., description="지표 ID (UUID)")
    user_id: str = Field(..., description="사용자 ID")
    strategy_id: str = Field(None, description="전략 ID")
    symbol: str = Field(None, description="종목 코드")
    total_trades: int = Field(0, description="총 거래 횟수")
    win_count: int = Field(0, description="승리 횟수")
    loss_count: int = Field(0, description="패배 횟수")
    win_rate: float = Field(0, description="승률")
    profit_loss: float = Field(0, description="총 손익")
    max_drawdown: float = Field(0, description="최대 손실폭")
    sharpe_ratio: float = Field(None, description="샤프 비율")
    period_start: datetime = Field(..., description="기간 시작")
    period_end: datetime = Field(..., description="기간 종료")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="생성 시간")
    updated_at: datetime = Field(default_factory=datetime.utcnow, description="수정 시간")
    
    class Config:
        schema_extra = {
            "table_name": "performance_metrics",
            "sql": """
            CREATE TABLE performance_metrics (
                id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
                user_id UUID NOT NULL REFERENCES users(id),
                strategy_id UUID REFERENCES strategies(id),
                symbol TEXT,
                total_trades INTEGER DEFAULT 0,
                win_count INTEGER DEFAULT 0,
                loss_count INTEGER DEFAULT 0,
                win_rate DECIMAL DEFAULT 0,
                profit_loss DECIMAL DEFAULT 0,
                max_drawdown DECIMAL DEFAULT 0,
                sharpe_ratio DECIMAL,
                period_start TIMESTAMP WITH TIME ZONE NOT NULL,
                period_end TIMESTAMP WITH TIME ZONE NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
            );
            
            -- 인덱스 생성
            CREATE INDEX idx_performance_metrics_user_id ON performance_metrics(user_id);
            CREATE INDEX idx_performance_metrics_strategy_id ON performance_metrics(strategy_id);
            CREATE INDEX idx_performance_metrics_symbol ON performance_metrics(symbol);
            CREATE INDEX idx_performance_metrics_period ON performance_metrics(period_start, period_end);
            
            -- RLS 정책 (행 수준 보안)
            ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
            
            -- 사용자는 자신의 성능 지표만 볼 수 있음
            CREATE POLICY "Users can view their own performance metrics" ON performance_metrics
                FOR SELECT USING (auth.uid() = user_id);
            """
        }

# 모든 테이블 목록
TABLES = [
    User,
    Order,
    Position,
    Strategy,
    PerformanceMetric
]

def get_create_table_sql() -> List[str]:
    """
    모든 테이블의 CREATE TABLE SQL 문을 반환합니다.
    
    Returns:
        SQL 문 리스트
    """
    return [table.Config.schema_extra["sql"] for table in TABLES] 