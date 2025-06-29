#!/usr/bin/env python3
"""
Christmas Trading Orchestrator
JSON 파일 변화 감지 및 오케스트레이션 시스템

주요 기능:
1. JSON 파일 실시간 모니터링 (inotify)
2. 파일 변화 감지 시 자동 코드 실행
3. WebSocket을 통한 백엔드와 통신
4. 스케줄링된 작업 관리
5. 오류 처리 및 복구
"""

import os
import json
import asyncio
import logging
import time
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List
from dataclasses import dataclass

import httpx
import websockets
import aiofiles
from watchdog.observers import Observer
from watchdog.events import FileSystemEventHandler
from apscheduler.schedulers.asyncio import AsyncIOScheduler
import redis.asyncio as aioredis

# 환경 설정
ENV = os.getenv("ENV", "development")
JSON_DATA_PATH = os.getenv("JSON_DATA_PATH", "/app/data")
BACKEND_URL = os.getenv("BACKEND_URL", "http://christmas-backend:8080")
WEBSOCKET_URL = os.getenv("WEBSOCKET_URL", "ws://christmas-backend:8080/ws")
REDIS_URL = os.getenv("REDIS_URL", "redis://christmas-redis:6379")

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("/app/logs/orchestrator.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

@dataclass
class FileChangeEvent:
    """파일 변화 이벤트"""
    file_path: str
    event_type: str
    timestamp: datetime
    data: Optional[Dict[str, Any]] = None

class JSONFileHandler(FileSystemEventHandler):
    """JSON 파일 변화 감지 핸들러"""
    
    def __init__(self, orchestrator):
        self.orchestrator = orchestrator
        self.last_modified = {}
        
    def on_modified(self, event):
        if event.is_directory:
            return
            
        file_path = event.src_path
        if not file_path.endswith('.json'):
            return
            
        # 중복 이벤트 방지 (1초 이내 동일 파일)
        current_time = time.time()
        if file_path in self.last_modified:
            if current_time - self.last_modified[file_path] < 1.0:
                return
        
        self.last_modified[file_path] = current_time
        
        # 이벤트 큐에 추가
        change_event = FileChangeEvent(
            file_path=file_path,
            event_type="modified",
            timestamp=datetime.now()
        )
        
        asyncio.create_task(self.orchestrator.handle_file_change(change_event))

class ChristmasOrchestrator:
    """크리스마스 트레이딩 오케스트레이션 시스템"""
    
    def __init__(self):
        self.data_path = Path(JSON_DATA_PATH)
        self.data_path.mkdir(exist_ok=True)
        
        self.redis_client: Optional[aioredis.Redis] = None
        self.websocket: Optional[websockets.WebSocketServerProtocol] = None
        self.scheduler = AsyncIOScheduler()
        
        self.observers = []
        self.running = False
        
        # 처리 중인 파일 추적 (중복 처리 방지)
        self.processing_files = set()
        
    async def start(self):
        """오케스트레이터 시작"""
        logger.info("🎄 Christmas Trading Orchestrator 시작 중...")
        
        # Redis 연결
        await self._connect_redis()
        
        # WebSocket 연결
        await self._connect_websocket()
        
        # 파일 감시 시작
        self._start_file_watching()
        
        # 스케줄된 작업 시작
        self._start_scheduled_tasks()
        
        self.running = True
        logger.info("🚀 Orchestrator 시작 완료!")
        
        # 메인 루프
        await self._main_loop()
    
    async def stop(self):
        """오케스트레이터 정지"""
        logger.info("🔄 Orchestrator 정지 중...")
        
        self.running = False
        
        # 파일 감시 정지
        for observer in self.observers:
            observer.stop()
            observer.join()
        
        # 스케줄러 정지
        self.scheduler.shutdown()
        
        # 연결 종료
        if self.websocket:
            await self.websocket.close()
        
        if self.redis_client:
            await self.redis_client.close()
        
        logger.info("✅ Orchestrator 정지 완료")
    
    async def _connect_redis(self):
        """Redis 연결"""
        try:
            self.redis_client = aioredis.from_url(REDIS_URL, decode_responses=True)
            await self.redis_client.ping()
            logger.info("✅ Redis 연결 성공")
        except Exception as e:
            logger.error(f"❌ Redis 연결 실패: {e}")
    
    async def _connect_websocket(self):
        """WebSocket 연결"""
        try:
            self.websocket = await websockets.connect(WEBSOCKET_URL)
            logger.info("✅ WebSocket 연결 성공")
            
            # 백그라운드에서 메시지 수신
            asyncio.create_task(self._websocket_listener())
            
        except Exception as e:
            logger.error(f"❌ WebSocket 연결 실패: {e}")
    
    def _start_file_watching(self):
        """파일 감시 시작"""
        try:
            # JSON 파일들을 감시할 디렉토리
            watch_dirs = [
                self.data_path,
            ]
            
            for watch_dir in watch_dirs:
                if watch_dir.exists():
                    observer = Observer()
                    handler = JSONFileHandler(self)
                    observer.schedule(handler, str(watch_dir), recursive=True)
                    observer.start()
                    self.observers.append(observer)
                    
                    logger.info(f"📁 파일 감시 시작: {watch_dir}")
            
        except Exception as e:
            logger.error(f"❌ 파일 감시 시작 실패: {e}")
    
    def _start_scheduled_tasks(self):
        """스케줄된 작업 시작"""
        try:
            # 정기적인 상태 확인 (5분마다)
            self.scheduler.add_job(
                self._health_check,
                'interval',
                minutes=5,
                id='health_check'
            )
            
            # JSON 파일 정리 작업 (1시간마다)
            self.scheduler.add_job(
                self._cleanup_json_files,
                'interval',
                hours=1,
                id='cleanup_json'
            )
            
            # 메트릭 수집 (1분마다)
            self.scheduler.add_job(
                self._collect_metrics,
                'interval',
                minutes=1,
                id='collect_metrics'
            )
            
            self.scheduler.start()
            logger.info("⏰ 스케줄된 작업 시작")
            
        except Exception as e:
            logger.error(f"❌ 스케줄러 시작 실패: {e}")
    
    async def handle_file_change(self, event: FileChangeEvent):
        """파일 변화 처리"""
        try:
            # 중복 처리 방지
            if event.file_path in self.processing_files:
                return
            
            self.processing_files.add(event.file_path)
            
            logger.info(f"📄 파일 변화 감지: {event.file_path}")
            
            # JSON 파일 로드 및 검증
            data = await self._load_json_file(event.file_path)
            if not data:
                return
            
            event.data = data
            
            # 파일 타입별 처리
            filename = Path(event.file_path).name
            
            if filename == "trading_signals.json":
                await self._process_trading_signals(data)
            elif filename == "market_data.json":
                await self._process_market_data(data)
            elif filename == "user_actions.json":
                await self._process_user_actions(data)
            elif filename == "ai_recommendations.json":
                await self._process_ai_recommendations(data)
            
            # Redis에 이벤트 기록
            await self._log_event_to_redis(event)
            
            # WebSocket으로 알림
            await self._notify_via_websocket(event)
            
        except Exception as e:
            logger.error(f"❌ 파일 변화 처리 오류: {e}")
        finally:
            # 처리 완료 후 제거
            self.processing_files.discard(event.file_path)
    
    async def _load_json_file(self, file_path: str) -> Optional[Dict[str, Any]]:
        """JSON 파일 로드"""
        try:
            async with aiofiles.open(file_path, 'r', encoding='utf-8') as f:
                content = await f.read()
                return json.loads(content)
        except Exception as e:
            logger.error(f"❌ JSON 파일 로드 실패 {file_path}: {e}")
            return None
    
    async def _process_trading_signals(self, data: Dict[str, Any]):
        """트레이딩 신호 처리"""
        try:
            signals = data.get('signals', [])
            
            for signal in signals:
                if signal.get('processed'):
                    continue
                
                symbol = signal.get('symbol')
                signal_type = signal.get('signal')
                confidence = signal.get('confidence', 0)
                
                logger.info(f"🔔 트레이딩 신호: {symbol} - {signal_type} (신뢰도: {confidence})")
                
                # 신뢰도가 높은 신호만 처리
                if confidence > 0.7:
                    # 백엔드 API로 신호 전송
                    await self._send_signal_to_backend(signal)
                
                # 처리 완료 표시
                signal['processed'] = True
                signal['processed_at'] = datetime.now().isoformat()
            
            # 처리된 데이터 다시 저장
            await self._save_json_file("trading_signals.json", data)
            
        except Exception as e:
            logger.error(f"❌ 트레이딩 신호 처리 오류: {e}")
    
    async def _process_market_data(self, data: Dict[str, Any]):
        """시장 데이터 처리"""
        try:
            crypto_pairs = data.get('crypto_pairs', [])
            
            # 급격한 가격 변동 감지
            for crypto in crypto_pairs:
                symbol = crypto.get('symbol')
                price_change = float(crypto.get('priceChangePercent', 0))
                
                # 5% 이상 급등/급락 시 알림
                if abs(price_change) > 5:
                    alert_data = {
                        "type": "price_alert",
                        "symbol": symbol,
                        "price_change": price_change,
                        "timestamp": datetime.now().isoformat()
                    }
                    
                    # Redis에 알림 저장
                    await self._store_alert(alert_data)
                    
                    logger.warning(f"⚠️ 급격한 가격 변동: {symbol} {price_change:+.2f}%")
            
        except Exception as e:
            logger.error(f"❌ 시장 데이터 처리 오류: {e}")
    
    async def _process_user_actions(self, data: Dict[str, Any]):
        """사용자 액션 처리"""
        try:
            actions = data.get('actions', [])
            
            for action in actions:
                if action.get('orchestrated'):
                    continue
                
                action_type = action.get('type')
                action_id = action.get('id')
                
                logger.info(f"👤 사용자 액션 처리: {action_id} - {action_type}")
                
                # 액션 타입별 오케스트레이션
                if action_type in ['buy_order', 'sell_order']:
                    # 주문 전 리스크 체크
                    risk_result = await self._check_order_risk(action)
                    
                    if risk_result['safe']:
                        # 주문 실행 명령
                        await self._execute_order_command(action)
                    else:
                        # 위험한 주문 - 거부
                        action['status'] = 'rejected'
                        action['rejection_reason'] = risk_result['reason']
                
                # 오케스트레이션 완료 표시
                action['orchestrated'] = True
                action['orchestrated_at'] = datetime.now().isoformat()
            
            # 처리된 데이터 다시 저장
            await self._save_json_file("user_actions.json", data)
            
        except Exception as e:
            logger.error(f"❌ 사용자 액션 처리 오류: {e}")
    
    async def _process_ai_recommendations(self, data: Dict[str, Any]):
        """AI 추천 처리"""
        try:
            recommendations = data.get('recommendations', [])
            
            for rec in recommendations:
                if rec.get('processed'):
                    continue
                
                symbol = rec.get('symbol')
                action = rec.get('action')
                confidence = rec.get('confidence', 0)
                
                logger.info(f"🤖 AI 추천: {symbol} - {action} (신뢰도: {confidence})")
                
                # 고신뢰도 추천만 처리
                if confidence > 0.8:
                    # 자동 실행 가능한 추천인지 확인
                    if rec.get('auto_execute', False):
                        await self._execute_ai_recommendation(rec)
                
                rec['processed'] = True
                rec['processed_at'] = datetime.now().isoformat()
            
            # 처리된 데이터 다시 저장
            await self._save_json_file("ai_recommendations.json", data)
            
        except Exception as e:
            logger.error(f"❌ AI 추천 처리 오류: {e}")
    
    async def _save_json_file(self, filename: str, data: Dict[str, Any]):
        """JSON 파일 저장"""
        try:
            file_path = self.data_path / filename
            async with aiofiles.open(file_path, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(data, indent=2, ensure_ascii=False, default=str))
        except Exception as e:
            logger.error(f"❌ JSON 파일 저장 실패 {filename}: {e}")
    
    async def _send_signal_to_backend(self, signal: Dict[str, Any]):
        """백엔드로 신호 전송"""
        try:
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{BACKEND_URL}/api/trading-signal",
                    json=signal,
                    timeout=10.0
                )
                
                if response.status_code == 200:
                    logger.info(f"✅ 신호 전송 성공: {signal.get('symbol')}")
                else:
                    logger.error(f"❌ 신호 전송 실패: {response.status_code}")
                    
        except Exception as e:
            logger.error(f"❌ 신호 전송 오류: {e}")
    
    async def _check_order_risk(self, action: Dict[str, Any]) -> Dict[str, Any]:
        """주문 리스크 체크"""
        try:
            symbol = action.get('symbol')
            quantity = action.get('quantity', 0)
            order_type = action.get('type')
            
            # 기본 안전성 검사
            if quantity <= 0:
                return {"safe": False, "reason": "Invalid quantity"}
            
            if not symbol or not order_type:
                return {"safe": False, "reason": "Missing required fields"}
            
            # 추가 리스크 검사 로직
            # 예: 포트폴리오 비중, 최대 주문 크기 등
            
            return {"safe": True, "reason": "Risk check passed"}
            
        except Exception as e:
            logger.error(f"❌ 리스크 체크 오류: {e}")
            return {"safe": False, "reason": f"Risk check error: {e}"}
    
    async def _execute_order_command(self, action: Dict[str, Any]):
        """주문 실행 명령"""
        try:
            # 백엔드로 주문 실행 요청
            async with httpx.AsyncClient() as client:
                response = await client.post(
                    f"{BACKEND_URL}/api/execute-order",
                    json=action,
                    timeout=30.0
                )
                
                if response.status_code == 200:
                    result = response.json()
                    action['execution_result'] = result
                    logger.info(f"✅ 주문 실행 성공: {action.get('id')}")
                else:
                    logger.error(f"❌ 주문 실행 실패: {response.status_code}")
                    
        except Exception as e:
            logger.error(f"❌ 주문 실행 오류: {e}")
    
    async def _execute_ai_recommendation(self, recommendation: Dict[str, Any]):
        """AI 추천 실행"""
        try:
            # AI 추천을 사용자 액션으로 변환
            user_action = {
                "type": f"{recommendation.get('action', '').lower()}_order",
                "symbol": recommendation.get('symbol'),
                "quantity": recommendation.get('quantity', 0.01),
                "source": "ai_recommendation",
                "ai_confidence": recommendation.get('confidence'),
                "timestamp": datetime.now().isoformat()
            }
            
            # 사용자 액션 파일에 추가
            await self._add_user_action(user_action)
            
            logger.info(f"🤖 AI 추천 실행: {recommendation.get('symbol')}")
            
        except Exception as e:
            logger.error(f"❌ AI 추천 실행 오류: {e}")
    
    async def _add_user_action(self, action: Dict[str, Any]):
        """사용자 액션 추가"""
        try:
            user_actions = await self._load_json_file(str(self.data_path / "user_actions.json"))
            if not user_actions:
                user_actions = {"actions": [], "timestamp": datetime.now().isoformat()}
            
            action['id'] = f"action_{datetime.now().timestamp()}"
            user_actions['actions'].append(action)
            user_actions['timestamp'] = datetime.now().isoformat()
            
            await self._save_json_file("user_actions.json", user_actions)
            
        except Exception as e:
            logger.error(f"❌ 사용자 액션 추가 오류: {e}")
    
    async def _store_alert(self, alert_data: Dict[str, Any]):
        """알림 저장"""
        try:
            if self.redis_client:
                await self.redis_client.lpush(
                    "price_alerts",
                    json.dumps(alert_data, default=str)
                )
                # 최대 100개 알림만 유지
                await self.redis_client.ltrim("price_alerts", 0, 99)
                
        except Exception as e:
            logger.error(f"❌ 알림 저장 오류: {e}")
    
    async def _log_event_to_redis(self, event: FileChangeEvent):
        """Redis에 이벤트 로그"""
        try:
            if self.redis_client:
                event_data = {
                    "file_path": event.file_path,
                    "event_type": event.event_type,
                    "timestamp": event.timestamp.isoformat()
                }
                
                await self.redis_client.lpush(
                    "orchestrator_events",
                    json.dumps(event_data, default=str)
                )
                # 최대 1000개 이벤트 유지
                await self.redis_client.ltrim("orchestrator_events", 0, 999)
                
        except Exception as e:
            logger.error(f"❌ 이벤트 로그 오류: {e}")
    
    async def _notify_via_websocket(self, event: FileChangeEvent):
        """WebSocket으로 알림"""
        try:
            if self.websocket:
                notification = {
                    "type": "file_change",
                    "file_path": event.file_path,
                    "event_type": event.event_type,
                    "timestamp": event.timestamp.isoformat()
                }
                
                await self.websocket.send(json.dumps(notification, default=str))
                
        except Exception as e:
            logger.error(f"❌ WebSocket 알림 오류: {e}")
    
    async def _websocket_listener(self):
        """WebSocket 메시지 수신"""
        try:
            async for message in self.websocket:
                data = json.loads(message)
                logger.info(f"📨 WebSocket 메시지 수신: {data.get('type')}")
                
        except Exception as e:
            logger.error(f"❌ WebSocket 수신 오류: {e}")
    
    async def _health_check(self):
        """상태 확인"""
        try:
            logger.info("💊 Health check 실행 중...")
            
            # Redis 연결 확인
            if self.redis_client:
                await self.redis_client.ping()
            
            # 백엔드 연결 확인
            async with httpx.AsyncClient() as client:
                response = await client.get(f"{BACKEND_URL}/health", timeout=5.0)
                if response.status_code != 200:
                    logger.warning(f"⚠️ 백엔드 상태 이상: {response.status_code}")
            
            logger.info("✅ Health check 완료")
            
        except Exception as e:
            logger.error(f"❌ Health check 오류: {e}")
    
    async def _cleanup_json_files(self):
        """JSON 파일 정리"""
        try:
            logger.info("🧹 JSON 파일 정리 중...")
            
            # 오래된 데이터 제거, 압축 등
            for json_file in self.data_path.glob("*.json"):
                # 파일별 정리 로직
                pass
            
            logger.info("✅ JSON 파일 정리 완료")
            
        except Exception as e:
            logger.error(f"❌ JSON 파일 정리 오류: {e}")
    
    async def _collect_metrics(self):
        """메트릭 수집"""
        try:
            if self.redis_client:
                # 시스템 메트릭 수집
                metrics = {
                    "timestamp": datetime.now().isoformat(),
                    "orchestrator_status": "running" if self.running else "stopped",
                    "observers_count": len(self.observers),
                    "processing_files_count": len(self.processing_files)
                }
                
                await self.redis_client.set(
                    "orchestrator_metrics",
                    json.dumps(metrics, default=str)
                )
                
        except Exception as e:
            logger.error(f"❌ 메트릭 수집 오류: {e}")
    
    async def _main_loop(self):
        """메인 루프"""
        try:
            while self.running:
                await asyncio.sleep(1)
                
        except KeyboardInterrupt:
            logger.info("🛑 Orchestrator 중단 요청")
        except Exception as e:
            logger.error(f"❌ 메인 루프 오류: {e}")
        finally:
            await self.stop()

async def main():
    """메인 함수"""
    orchestrator = ChristmasOrchestrator()
    await orchestrator.start()

if __name__ == "__main__":
    asyncio.run(main())