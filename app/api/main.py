from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from typing import Dict, List, Union, Optional, Any
from datetime import datetime, timedelta
import logging
import time
import uuid

# 데이터 모델 임포트
from .models import DashboardData, Order as ApiOrder, Position, Signal, Alert, BacktestResult, Setting, HelpArticle

# 주문 서비스 임포트
from app.execution.order_service import OrderService
from app.execution.order_model import Order as ExecutionOrder, OrderSide, OrderType, OrderStatus
from app.ingestion.market_api import MarketAPIClient

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

# FastAPI 앱 초기화
app = FastAPI(
    title="Christmas API",
    description="초단타 자동 매매 플랫폼 API",
    version="1.0.0", # 버전 업데이트
)

# OrderService 인스턴스 생성 - 모의 클라이언트 사용
mock_api_client = MarketAPIClient.create_mock_client()
order_service = OrderService(api_client=mock_api_client, account_number="mock_account")

# CORS 미들웨어 추가
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # 실제 배포 시 특정 도메인으로 제한
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# API 키 검증 dependency
from app.auth.api_key import get_api_key_manager

async def verify_api_key(x_api_key: Optional[str] = Header(None)):
    if x_api_key is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="API 키가 필요합니다",
            headers={"WWW-Authenticate": "ApiKey"},
        )
    
    api_key_manager = get_api_key_manager()
    # 실제 환경에서는 API 키 검증 로직을 사용해야 합니다.
    # 현재는 임시로 모든 키를 유효하다고 가정합니다.
    # result = api_key_manager.validate_key(x_api_key)
    # if not result:
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED,
    #         detail="유효하지 않은 API 키입니다",
    #         headers={"WWW-Authenticate": "ApiKey"},
    #     )
    # return result
    return {"user_id": "test_user", "scope": "read write"} # 임시 반환값

# === 상태 체크용 엔드포인트 ===
@app.get("/", tags=["Health"])
async def root() -> Dict[str, str]:
    return {"message": "Christmas API 서버가 정상 작동 중입니다"}

@app.get("/health", tags=["Health"])
async def health_check() -> Dict[str, Union[str, float]]:
    return {
        "status": "ok",
        "timestamp": time.time(),
        "version": app.version, # 앱 버전 사용
    }

# === 대시보드 API ===
@app.get("/api/v1/dashboard", response_model=DashboardData, tags=["Dashboard"])
async def get_dashboard_data(api_key_info: Dict = Depends(verify_api_key)) -> DashboardData:
    # 실제로는 서비스 계층에서 데이터를 가져와야 합니다.
    # 여기서는 더미 데이터를 생성합니다.
    now = datetime.now()
    recent_orders_dummy = [
        ApiOrder(id=str(uuid.uuid4()), symbol="BTC/USDT", time=now - timedelta(minutes=10), side="buy", price=60000.0, quantity=0.01, status="filled"),
        ApiOrder(id=str(uuid.uuid4()), symbol="ETH/USDT", time=now - timedelta(minutes=5), side="sell", price=3000.0, quantity=0.1, status="filled"),
    ]
    current_positions_dummy = [
        Position(symbol="BTC/USDT", quantity=0.02, entry_price=59000.0, current_price=60500.0, profit=30.0, profit_percent=0.025),
        Position(symbol="ADA/USDT", quantity=100, entry_price=0.40, current_price=0.45, profit=5.0, profit_percent=0.125),
    ]
    performance_trend_dummy = [
        {"date": (now - timedelta(days=i)).strftime("%Y-%m-%d"), "profit": 100 - i*5} for i in range(7)
    ]
    strategy_performance_dummy = [
        {"name": "Scalping V1", "profit": 150.0, "win_rate": 0.75},
        {"name": "Swing V2", "profit": 320.5, "win_rate": 0.60},
    ]

    return DashboardData(
        last_update=now,
        total_profit=12345.67,
        profit_change=2.5,
        total_orders=152,
        success_rate=0.85,
        active_positions_count=len(current_positions_dummy),
        avg_holding_time="1h 30m",
        total_alerts=15,
        critical_alerts=2,
        warning_alerts=5,
        performance_trend=performance_trend_dummy,
        recent_orders=recent_orders_dummy,
        current_positions=current_positions_dummy,
        strategy_performance=strategy_performance_dummy,
    )

# === 주문 API ===
@app.get("/api/v1/orders", response_model=List[ApiOrder], tags=["Orders"])
async def get_orders_list(
    symbol: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 20,
    offset: int = 0,
    api_key_info: Dict = Depends(verify_api_key)
) -> List[ApiOrder]:
    # OrderService를 사용하여 주문 목록 조회
    # order_service.get_order_history는 List[Dict]를 반환합니다.
    exec_order_dicts = await order_service.get_order_history(symbol=symbol)
    
    api_orders = []
    for exec_dict in exec_order_dicts:
        # ExecutionOrder.to_dict()의 결과를 ApiOrder로 변환
        api_order = ApiOrder(
            id=exec_dict.get("client_order_id", str(uuid.uuid4())),
            symbol=exec_dict.get("symbol"),
            time=datetime.fromisoformat(exec_dict.get("created_at")) if exec_dict.get("created_at") else datetime.now(),
            side=exec_dict.get("side"),
            price=exec_dict.get("price") or 0.0,
            quantity=exec_dict.get("quantity"),
            status=exec_dict.get("status")
        )
        # Status 필터링
        if status and api_order.status.lower() != status.lower():
            continue
        api_orders.append(api_order)
        
    return api_orders[offset:offset+limit]

@app.post("/api/v1/orders", response_model=ApiOrder, status_code=status.HTTP_201_CREATED, tags=["Orders"])
async def create_new_order(order_data: ApiOrder, api_key_info: Dict = Depends(verify_api_key)) -> ApiOrder:
    # ApiOrder를 ExecutionOrder 생성에 필요한 형태로 변환
    try:
        side_enum = OrderSide[order_data.side.upper()]
        # 가격 유무로 시장가/지정가 구분 (API 모델에 order_type이 없으므로)
        order_type_enum = OrderType.LIMIT if order_data.price and order_data.price > 0 else OrderType.MARKET
    except KeyError:
        raise HTTPException(status_code=400, detail=f"Invalid order side: {order_data.side}. Must be 'BUY' or 'SELL'.")

    # OrderService는 신호(Dict)를 받아 처리하거나, ExecutionOrder 객체를 직접 받을 수 있어야 합니다.
    # process_signal을 사용하려면 signal dict를 구성해야 합니다.
    # 여기서는 ExecutionOrder 객체를 생성하여 order_book에 직접 추가하는 예시를 따르되,
    # OrderService에 주문 제출 기능이 있다면 그것을 사용하는 것이 좋습니다.
    
    # 임시: client_order_id를 ApiOrder의 id에서 가져옵니다.
    client_order_id = order_data.id or str(uuid.uuid4())

    # ExecutionOrder 인스턴스 생성
    # OrderService의 process_signal이 dictionary를 받는다면, 그에 맞게 구성
    signal_for_service = {
        "symbol": order_data.symbol,
        "action": order_data.side.lower(), # "buy" or "sell"
        "quantity": order_data.quantity,
        "price": order_data.price if order_type_enum == OrderType.LIMIT else None,
        "strategy_id": "manual_api", # API를 통한 주문임을 명시
        "client_order_id": client_order_id # 클라이언트가 ID를 제공하도록 허용
    }
    
    # OrderService를 통해 주문 처리
    # process_signal은 ExecutionOrder 또는 None을 반환합니다.
    created_exec_order = await order_service.process_signal(signal_for_service)

    if not created_exec_order:
        raise HTTPException(status_code=500, detail="Failed to create order via OrderService.")

    # 생성된 ExecutionOrder를 ApiOrder로 변환하여 반환
    return ApiOrder(
        id=created_exec_order.client_order_id,
        symbol=created_exec_order.symbol,
        time=created_exec_order.created_at,
        side=created_exec_order.side.value,
        price=created_exec_order.price or 0.0,
        quantity=created_exec_order.quantity,
        status=created_exec_order.status.value
    )

@app.get("/api/v1/orders/{order_id}", response_model=ApiOrder, tags=["Orders"])
async def get_order_details(order_id: str, api_key_info: Dict = Depends(verify_api_key)) -> ApiOrder:
    exec_order = order_service.order_book.get_order(client_order_id=order_id)
    if not exec_order:
        raise HTTPException(status_code=404, detail="Order not found")
    
    return ApiOrder(
        id=exec_order.client_order_id,
        symbol=exec_order.symbol,
        time=exec_order.created_at,
        side=exec_order.side.value,
        price=exec_order.price or 0.0,
        quantity=exec_order.quantity,
        status=exec_order.status.value
    )

@app.put("/api/v1/orders/{order_id}", response_model=ApiOrder, tags=["Orders"])
async def update_existing_order(order_id: str, update_data: ApiOrder, api_key_info: Dict = Depends(verify_api_key)) -> ApiOrder:
    # OrderService를 통해 주문 수정. OrderService에 해당 기능 구현 필요.
    # 현재는 order_book에서 직접 상태를 수정하는 방식으로 제한적 기능만 구현.
    exec_order = order_service.order_book.get_order(client_order_id=order_id)
    if not exec_order:
        raise HTTPException(status_code=404, detail="Order not found for update.")

    updated = False
    if update_data.status:
        try:
            new_status_enum = OrderStatus[update_data.status.upper()]
            # 주문 상태 변경은 단순 할당이 아니라, order_service나 order_executor를 통해야 할 수 있음
            # (예: 취소 요청 API 호출 등). 지금은 직접 변경.
            if exec_order.status != new_status_enum: # 변경이 있을 경우에만 업데이트
                 # OrderService에 주문 상태 변경을 요청하는 메소드가 있다면 사용
                 # 예: await order_service.update_order_status(order_id, new_status_enum)
                 # 지금은 ExecutionOrder의 내부 메소드 사용 (실제 거래소 연동 시 문제될 수 있음)
                if new_status_enum == OrderStatus.CANCELLED:
                     if exec_order.status not in [OrderStatus.FILLED, OrderStatus.REJECTED, OrderStatus.EXPIRED, OrderStatus.CANCELLED]:
                        # await order_service.order_executor.cancel_order(exec_order) # 만약 executor 직접 호출한다면
                        exec_order.update_status(OrderStatus.CANCELLED, cancelled_at=datetime.now())
                        updated = True
                        logger.info(f"Order {order_id} cancellation requested via PUT. New status: {exec_order.status.value}")
                     else:
                        logger.info(f"Order {order_id} cannot be cancelled, current status: {exec_order.status.value}")
                else: # 다른 상태로의 직접 변경은 보통 지원하지 않음 (거래소 상태에 따름)
                    # exec_order.update_status(new_status_enum) # 임의 상태 변경은 주의
                    logger.warning(f"Direct status update to {new_status_enum.value} for order {order_id} is not typically supported. Only cancellation is handled via PUT for now.")
                    # updated = True
        except KeyError:
            raise HTTPException(status_code=400, detail=f"Invalid status value for update: {update_data.status}")
    
    # 주문 가격/수량 변경은 PENDING 상태의 LIMIT 주문에 대해서만 가능할 수 있음
    # if exec_order.status == OrderStatus.PENDING and exec_order.order_type == OrderType.LIMIT:
    #    if update_data.price is not None and update_data.price != exec_order.price:
    #        exec_order.price = update_data.price
    #        updated = True
    #    if update_data.quantity is not None and update_data.quantity != exec_order.quantity:
    #        exec_order.quantity = update_data.quantity
    #        updated = True
    # if updated:
    #    exec_order.updated_at = datetime.now()
    #    order_service.order_book.add_order(exec_order) # 변경사항 저장 (order_book이 dict이므로 자동 업데이트)

    # 업데이트된 정보를 다시 조회하여 반환하는 것이 이상적
    final_exec_order = order_service.order_book.get_order(client_order_id=order_id)
    if not final_exec_order : # 혹시 모르니 다시 체크
        raise HTTPException(status_code=404, detail="Order disappeared after update attempt.")


    return ApiOrder(
        id=final_exec_order.client_order_id,
        symbol=final_exec_order.symbol,
        time=final_exec_order.updated_at,
        side=final_exec_order.side.value,
        price=final_exec_order.price or 0.0,
        quantity=final_exec_order.quantity,
        status=final_exec_order.status.value
    )

@app.delete("/api/v1/orders/{order_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Orders"])
async def cancel_order(order_id: str, api_key_info: Dict = Depends(verify_api_key)):
    # 주문 객체 조회
    exec_order = order_service.order_book.get_order(client_order_id=order_id)
    if not exec_order:
        logger.info(f"주문 ID {order_id}를 찾을 수 없습니다.")
        return

    # 이미 최종 상태인 주문은 취소할 수 없음
    if exec_order.status in [OrderStatus.FILLED, OrderStatus.CANCELLED, OrderStatus.REJECTED, OrderStatus.EXPIRED]:
        logger.info(f"주문 ID {order_id}는 이미 최종 상태({exec_order.status.value})로 취소할 수 없습니다.")
        return

    try:
        # 주문에 사용된 전략 ID 확인 (없으면 임시 ID 생성)
        strategy_id = exec_order.strategy_id or "api_manual"
        
        # OrderService의 cancel_orders_by_strategy 메서드를 활용하여 취소
        cancelled_orders = await order_service.cancel_orders_by_strategy(strategy_id)
        
        # 취소한 주문 중에 요청한 ID가 있는지 확인
        cancelled_order = next((order for order in cancelled_orders if order.client_order_id == order_id), None)
        
        if cancelled_order and cancelled_order.status == OrderStatus.CANCELLED:
            logger.info(f"주문 ID {order_id} 취소 성공")
        else:
            logger.warning(f"주문 ID {order_id} 취소 요청을 보냈으나 취소 결과를 확인할 수 없습니다.")
    except Exception as e:
        logger.error(f"주문 취소 중 오류 발생: {e}")
        # DELETE는 멱등성을 가지므로 실패해도 204를 반환할 수 있음
        # raise HTTPException(status_code=500, detail=f"주문 취소 실패: {str(e)}")
    
    return

# === 포트폴리오 API ===
@app.get("/api/v1/portfolio", response_model=List[Position], tags=["Portfolio"])
async def get_portfolio_positions(api_key_info: Dict = Depends(verify_api_key)) -> List[Position]:
    # 더미 데이터 생성
    positions = [
        Position(symbol="BTC/USDT", quantity=0.025, entry_price=58000.0, current_price=60500.0, profit=62.5, profit_percent=0.0431),
        Position(symbol="ETH/USDT", quantity=0.5, entry_price=2900.0, current_price=3050.0, profit=75.0, profit_percent=0.0517),
        Position(symbol="SOL/USDT", quantity=10, entry_price=150.0, current_price=165.0, profit=150.0, profit_percent=0.10),
    ]
    return positions

@app.get("/api/v1/portfolio/summary", response_model=Dict[str, Any], tags=["Portfolio"])
async def get_portfolio_summary(api_key_info: Dict = Depends(verify_api_key)) -> Dict[str, Any]:
    # 더미 데이터 생성
    return {
        "total_value_usd": 10500.75,
        "total_profit_usd": 1250.25,
        "total_profit_percent": 0.135,
        "asset_allocation": {
            "BTC": 0.45,
            "ETH": 0.30,
            "SOL": 0.15,
            "USDT": 0.10
        }
    }

# === 신호 API ===
@app.get("/api/v1/signals", response_model=List[Signal], tags=["Signals"])
async def get_signals_list(
    symbol: Optional[str] = None,
    strategy: Optional[str] = None,
    limit: int = 10,
    api_key_info: Dict = Depends(verify_api_key)
) -> List[Signal]:
    signals = []
    for i in range(limit):
        signals.append(Signal(
            id=str(uuid.uuid4()),
            symbol=symbol or ["BTC/USDT", "ETH/USDT"][i%2],
            strategy=strategy or f"Strategy_{i%3 + 1}",
            signal_type=["buy", "sell", "hold"][i%3],
            confidence=round(0.6 + i*0.03, 2),
            price_target=65000.0 if ["buy", "sell", "hold"][i%3] == "buy" else None,
            stop_loss=58000.0 if ["buy", "sell", "hold"][i%3] == "buy" else None,
            timestamp=datetime.now() - timedelta(hours=i),
            metadata={"source": "auto_analyzer", "risk_level": "medium"}
        ))
    return signals

@app.post("/api/v1/signals", response_model=Signal, status_code=status.HTTP_201_CREATED, tags=["Signals"])
async def create_manual_signal(signal_data: Signal, api_key_info: Dict = Depends(verify_api_key)) -> Signal:
    logger.info(f"Manual signal created: {signal_data.id} for {signal_data.symbol}")
    # 실제로는 여기서 시그널을 저장하고 처리하는 로직이 필요합니다.
    return signal_data # 입력받은 데이터를 그대로 반환 (ID 등은 이미 채워져 있다고 가정)

# === 설정 API ===
@app.get("/api/v1/settings", response_model=List[Setting], tags=["Settings"])
async def get_all_settings(category: Optional[str] = None, api_key_info: Dict = Depends(verify_api_key)) -> List[Setting]:
    settings = [
        Setting(key="trade_volume_per_order", value=1000, description="주문 당 거래량 (USD)", category="trading"),
        Setting(key="max_concurrent_trades", value=5, description="최대 동시 거래 수", category="trading"),
        Setting(key="email_notifications", value=True, description="이메일 알림 활성화 여부", category="notifications"),
        Setting(key="telegram_notifications", value=False, description="텔레그램 알림 활성화 여부", category="notifications"),
        Setting(key="theme", value="dark", description="UI 테마 (dark/light)", category="general"),
    ]
    if category:
        return [s for s in settings if s.category == category]
    return settings

@app.put("/api/v1/settings/{setting_key}", response_model=Setting, tags=["Settings"])
async def update_setting(setting_key: str, value: Dict[str, Any], api_key_info: Dict = Depends(verify_api_key)) -> Setting:
    # FastAPI에서는 Request Body를 Pydantic 모델 또는 Dict[str, Any] 등으로 받습니다.
    # value: Any 로 직접 받으면 FastAPI가 해석하기 어려울 수 있습니다. value: Dict[str, Any] 혹은 특정 Pydantic 모델 사용 권장
    # 여기서는 간단히 Dict[str, Any]로 받고, 실제 값은 'value' 키로 접근한다고 가정합니다.
    actual_value = value.get("value") 
    logger.info(f"Setting {setting_key} updated to: {actual_value}")
    # 더미 반환
    return Setting(key=setting_key, value=actual_value, description=f"{setting_key} updated", category="general")

# === 백테스트 API ===
@app.post("/api/v1/backtest", response_model=BacktestResult, status_code=status.HTTP_202_ACCEPTED, tags=["Backtesting"])
async def run_backtest(config: Dict[str, Any], api_key_info: Dict = Depends(verify_api_key)) -> BacktestResult:
    backtest_id = str(uuid.uuid4())
    logger.info(f"Backtest {backtest_id} started with config: {config}")
    start_time_str = config.get("start_time")
    end_time_str = config.get("end_time")
    
    start_time = datetime.fromisoformat(start_time_str) if start_time_str else datetime.now() - timedelta(days=30)
    end_time = datetime.fromisoformat(end_time_str) if end_time_str else datetime.now()

    return BacktestResult(
        id=backtest_id,
        strategy_name=config.get("strategy_name", "TestStrategy"),
        symbol=config.get("symbol", "BTC/USDT"),
        start_time=start_time,
        end_time=end_time,
        total_trades=150,
        winning_trades=100,
        losing_trades=50,
        total_profit=2500.75,
        profit_factor=2.0,
        sharpe_ratio=1.5,
        max_drawdown=0.10,
        trade_log=[{"entry_time": (start_time + timedelta(days=j)).isoformat(), "exit_time": (start_time + timedelta(days=j, hours=1)).isoformat(), "profit": 50 - j} for j in range(5)]
    )

@app.get("/api/v1/backtest/results", response_model=List[BacktestResult], tags=["Backtesting"])
async def get_backtest_results_list(limit: int = 10, api_key_info: Dict = Depends(verify_api_key)) -> List[BacktestResult]:
    results = []
    for i in range(limit):
        results.append(BacktestResult(
            id=str(uuid.uuid4()),
            strategy_name=f"StrategyV{i+1}",
            symbol=["BTC/USDT", "ETH/USDT"][i%2],
            start_time=datetime.now() - timedelta(days=30+i),
            end_time=datetime.now() - timedelta(days=i),
            total_trades=100+i*10,
            winning_trades=70+i*5,
            losing_trades=30+i*5,
            total_profit=1500.0 + i*100,
            trade_log=[] # 간단히 빈 리스트로
        ))
    return results

@app.get("/api/v1/backtest/results/{result_id}", response_model=BacktestResult, tags=["Backtesting"])
async def get_backtest_result_details(result_id: str, api_key_info: Dict = Depends(verify_api_key)) -> BacktestResult:
    return BacktestResult(
        id=result_id,
        strategy_name="DetailedStrategy",
        symbol="BTC/USDT",
        start_time=datetime.now() - timedelta(days=10),
        end_time=datetime.now(),
        total_trades=55,
        winning_trades=40,
        losing_trades=15,
        total_profit=850.0,
        trade_log=[{"price": 60000, "action": "buy", "timestamp": (datetime.now() - timedelta(hours=2)).isoformat()}, {"price": 61000, "action": "sell", "timestamp": (datetime.now() - timedelta(hours=1)).isoformat()}]
    )

# === 알림 API ===
@app.get("/api/v1/notifications", response_model=List[Alert], tags=["Notifications"])
async def get_notifications_list(
    severity: Optional[str] = None,
    limit: int = 10,
    unread_only: bool = False, 
    api_key_info: Dict = Depends(verify_api_key)
) -> List[Alert]:
    alerts = []
    severities = ["critical", "warning", "info"]
    for i in range(limit):
        alerts.append(Alert(
            id=str(uuid.uuid4()),
            timestamp=datetime.now() - timedelta(minutes=i*30),
            severity=severity or severities[i%3],
            message=f"테스트 알림 메시지 {i+1}. 심각도: {severity or severities[i%3]}",
            source=["system_health", "trade_engine", "user_action"][i%3]
        ))
    return alerts

# === 도움말 API ===
@app.get("/api/v1/help/articles", response_model=List[HelpArticle], tags=["Help"])
async def get_help_articles_list(category: Optional[str] = None, api_key_info: Dict = Depends(verify_api_key)) -> List[HelpArticle]:
    articles = [
        HelpArticle(id="getting_started", title="시작하기", content="Christmas 플랫폼 사용을 시작하는 방법입니다...", category="general", last_updated=datetime.now()-timedelta(days=1)),
        HelpArticle(id="api_keys", title="API 키 관리", content="API 키를 생성하고 관리하는 방법입니다...", category="account", last_updated=datetime.now()-timedelta(days=2)),
        HelpArticle(id="scalping_strategy", title="초단타 전략 설정", content="초단타 매매 전략을 설정하고 최적화하는 방법입니다...", category="trading", last_updated=datetime.now()),
    ]
    if category:
        return [a for a in articles if a.category == category]
    return articles

@app.get("/api/v1/help/articles/{article_id}", response_model=HelpArticle, tags=["Help"])
async def get_help_article_details(article_id: str, api_key_info: Dict = Depends(verify_api_key)) -> HelpArticle:
    if article_id == "getting_started":
        return HelpArticle(id="getting_started", title="시작하기", content="Christmas 플랫폼 사용을 시작하는 방법입니다. 상세 내용...", category="general", last_updated=datetime.now()-timedelta(days=1))
    elif article_id == "api_keys":
        return HelpArticle(id="api_keys", title="API 키 관리", content="API 키를 생성하고 관리하는 방법입니다. 상세 내용...", category="account", last_updated=datetime.now()-timedelta(days=2))
    elif article_id == "scalping_strategy":
        return HelpArticle(id="scalping_strategy", title="초단타 전략 설정", content="초단타 매매 전략을 설정하고 최적화하는 방법입니다. 상세 내용...", category="trading", last_updated=datetime.now())
    raise HTTPException(status_code=404, detail="도움말 문서를 찾을 수 없습니다.")


# API 라우터 등록
from app.auth.router import router as auth_router
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])

# 시작 이벤트
@app.on_event("startup")
async def startup_event():
    logger.info("Christmas API 서버가 시작되었습니다")

# 종료 이벤트
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Christmas API 서버가 종료됩니다")

# 메인 실행 부분
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)