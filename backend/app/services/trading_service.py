"""
Trading Service - Core trading logic and queue management
"""

import asyncio
import json
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from loguru import logger
import redis.asyncio as redis

from app.core.config import settings
from .kis_api_service import KISAPIService

class TradingService:
    """
    Core trading service with collision prevention
    """
    
    def __init__(self):
        self.redis_client = None
        self.kis_api = KISAPIService()
        self.trading_active = True
        self.queue_prefix = "christmas:trade_queue:"
        
    async def initialize(self):
        """
        Initialize trading service
        """
        try:
            # Initialize Redis
            self.redis_client = redis.from_url(
                settings.REDIS_URL,
                password=settings.REDIS_PASSWORD,
                decode_responses=True
            )
            
            # Test Redis connection
            await self.redis_client.ping()
            logger.info("✅ Redis 연결 성공")
            
            # Initialize KIS API
            await self.kis_api.initialize()
            
            logger.info("✅ Trading Service 초기화 완료")
            return True
            
        except Exception as e:
            logger.error(f"❌ Trading Service 초기화 실패: {e}")
            return False
    
    async def add_to_queue(self, trade_request: Dict[str, Any]) -> str:
        """
        Add trade request to queue with collision prevention
        """
        try:
            stock_code = trade_request["stock_code"]
            action = trade_request["action"]  # 'buy' or 'sell'
            
            # Calculate priority score
            priority_score = self._calculate_priority(trade_request)
            
            # Add delay based on queue length
            queue_key = f"{self.queue_prefix}{stock_code}:{action}"
            queue_length = await self.redis_client.zcard(queue_key)
            
            # Calculate execution time with delay
            delay_seconds = settings.QUEUE_DELAY_SECONDS + (queue_length * 5)
            execution_time = datetime.now() + timedelta(seconds=delay_seconds)
            
            # Add execution time to request
            trade_request["target_execution_time"] = execution_time.isoformat()
            trade_request["queue_position"] = queue_length + 1
            
            # Store in Redis sorted set (higher score = higher priority)
            await self.redis_client.zadd(
                queue_key,
                {json.dumps(trade_request): priority_score}
            )
            
            trade_id = f"{stock_code}_{action}_{int(datetime.now().timestamp())}"
            
            logger.info(f"✅ 매매 요청 대기열 추가: {trade_id} (지연: {delay_seconds}초)")
            
            return trade_id
            
        except Exception as e:
            logger.error(f"❌ 대기열 추가 실패: {e}")
            raise
    
    def _calculate_priority(self, trade_request: Dict[str, Any]) -> float:
        """
        Calculate priority score for queue ordering
        """
        score = 0.0
        
        # AI confidence (0-40 points)
        ai_confidence = trade_request.get("ai_confidence", 0.5)
        score += ai_confidence * 40
        
        # Order size (smaller orders get higher priority to reduce market impact)
        quantity = trade_request.get("quantity", 100)
        size_score = max(20 - (quantity / 10), 0)
        score += min(size_score, 20)
        
        # Urgency based on stop loss/take profit
        if trade_request.get("is_stop_loss"):
            score += 30  # High priority for stop loss
        elif trade_request.get("is_take_profit"):
            score += 20  # Medium priority for take profit
        
        # Time-based priority
        timestamp = datetime.fromisoformat(trade_request.get("timestamp", datetime.now().isoformat()))
        wait_time = (datetime.now() - timestamp).total_seconds() / 60  # minutes
        score += min(wait_time / 10, 10)  # Max 10 points for waiting
        
        return min(score, 100)  # Cap at 100
    
    async def get_next_trade(self, stock_code: str, action: str) -> Optional[Dict[str, Any]]:
        """
        Get next trade from queue if ready for execution
        """
        try:
            queue_key = f"{self.queue_prefix}{stock_code}:{action}"
            
            # Get highest priority trade
            trades = await self.redis_client.zrevrange(
                queue_key, 0, 0, withscores=True
            )
            
            if not trades:
                return None
            
            trade_data, priority = trades[0]
            trade_request = json.loads(trade_data)
            
            # Check if ready for execution
            target_time = datetime.fromisoformat(trade_request["target_execution_time"])
            
            if datetime.now() >= target_time:
                # Remove from queue
                await self.redis_client.zrem(queue_key, trade_data)
                logger.info(f"✅ 대기열에서 매매 요청 처리: {stock_code} {action}")
                return trade_request
            
            return None
            
        except Exception as e:
            logger.error(f"❌ 대기열 조회 실패: {e}")
            return None
    
    async def execute_trade(self, trade_request: Dict[str, Any]) -> Dict[str, Any]:
        """
        Execute actual trade through KIS API
        """
        try:
            stock_code = trade_request["stock_code"]
            action = trade_request["action"]
            quantity = trade_request["quantity"]
            price = trade_request.get("price")
            
            # Get current price if not specified
            if not price:
                current_price_data = await self.kis_api.get_current_price(stock_code)
                price = current_price_data["current_price"]
            
            # Execute trade based on action
            if action == "buy":
                result = await self.kis_api.place_buy_order(stock_code, quantity, price)
            elif action == "sell":
                result = await self.kis_api.place_sell_order(stock_code, quantity, price)
            else:
                raise ValueError(f"Invalid action: {action}")
            
            # Store trade result
            trade_result = {
                **result,
                "user_id": trade_request.get("user_id"),
                "ai_confidence": trade_request.get("ai_confidence"),
                "queue_delay": trade_request.get("queue_delay", 0),
                "execution_timestamp": datetime.now().isoformat()
            }
            
            # Store in Redis for tracking
            await self.redis_client.setex(
                f"christmas:trade_result:{result['order_id']}",
                86400,  # 24 hours
                json.dumps(trade_result)
            )
            
            logger.info(f"✅ 매매 실행 완료: {stock_code} {action} {quantity}주")
            
            return trade_result
            
        except Exception as e:
            logger.error(f"❌ 매매 실행 실패: {e}")
            raise
    
    async def run_trading_queue(self):
        """
        Background task to process trading queue
        """
        logger.info("🚀 Trading Queue 처리 시작")
        
        while self.trading_active:
            try:
                # Get all active stocks from queues
                queue_keys = await self.redis_client.keys(f"{self.queue_prefix}*")
                
                for queue_key in queue_keys:
                    # Parse stock code and action from key
                    parts = queue_key.replace(self.queue_prefix, "").split(":")
                    if len(parts) == 2:
                        stock_code, action = parts
                        
                        # Process next trade if ready
                        trade_request = await self.get_next_trade(stock_code, action)
                        
                        if trade_request:
                            try:
                                await self.execute_trade(trade_request)
                            except Exception as e:
                                logger.error(f"❌ 매매 실행 중 오류: {e}")
                                # Could implement retry logic here
                
                # Wait 1 second before next iteration
                await asyncio.sleep(1)
                
            except Exception as e:
                logger.error(f"❌ Trading Queue 처리 중 오류: {e}")
                await asyncio.sleep(5)
    
    async def emergency_stop(self) -> bool:
        """
        Emergency stop all trading
        """
        try:
            self.trading_active = False
            
            # Clear all queues
            queue_keys = await self.redis_client.keys(f"{self.queue_prefix}*")
            if queue_keys:
                await self.redis_client.delete(*queue_keys)
            
            logger.warning("🛑 긴급 매매 중단 실행")
            return True
            
        except Exception as e:
            logger.error(f"❌ 긴급 중단 실패: {e}")
            return False
    
    async def resume_trading(self) -> bool:
        """
        Resume trading after emergency stop
        """
        try:
            self.trading_active = True
            logger.info("▶️ 매매 재시작")
            return True
            
        except Exception as e:
            logger.error(f"❌ 매매 재시작 실패: {e}")
            return False
    
    async def get_queue_status(self) -> Dict[str, Any]:
        """
        Get current queue status
        """
        try:
            queue_keys = await self.redis_client.keys(f"{self.queue_prefix}*")
            queue_stats = {}
            
            total_pending = 0
            
            for queue_key in queue_keys:
                queue_length = await self.redis_client.zcard(queue_key)
                queue_name = queue_key.replace(self.queue_prefix, "")
                queue_stats[queue_name] = queue_length
                total_pending += queue_length
            
            return {
                "trading_active": self.trading_active,
                "total_pending_orders": total_pending,
                "queue_details": queue_stats,
                "timestamp": datetime.now().isoformat()
            }
            
        except Exception as e:
            logger.error(f"❌ 큐 상태 조회 실패: {e}")
            return {"error": str(e)}
    
    async def health_check(self) -> bool:
        """
        Health check for trading service
        """
        try:
            # Check Redis connection
            await self.redis_client.ping()
            
            # Check KIS API
            kis_healthy = await self.kis_api.health_check()
            
            return kis_healthy
            
        except Exception as e:
            logger.error(f"❌ Trading Service 헬스체크 실패: {e}")
            return False
    
    async def cleanup(self):
        """
        Cleanup resources
        """
        try:
            self.trading_active = False
            
            if self.redis_client:
                await self.redis_client.close()
            
            await self.kis_api.cleanup()
            
            logger.info("✅ Trading Service 정리 완료")
            
        except Exception as e:
            logger.error(f"❌ Trading Service 정리 실패: {e}")