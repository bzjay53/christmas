#!/usr/bin/env python3
"""
Christmas Trading Usage Monitor MCP Server
통합 사용량 모니터링 및 알림 시스템

기능:
- AI API 사용량 모니터링 (OpenAI, Gemini, Claude)
- Trading API 사용량 추적 (KIS API)
- 시스템 리소스 모니터링
- 실시간 알림 및 대시보드
"""

import asyncio
import json
import sys
import time
from datetime import datetime, timedelta
from typing import Any, Dict, List, Optional, Tuple
import sqlite3
import os
from dataclasses import dataclass, asdict
import logging
from collections import defaultdict
import psutil
import requests

# 모니터링 데이터 클래스
@dataclass
class UsageMetric:
    timestamp: datetime
    service_name: str
    metric_type: str  # 'api_call', 'token_usage', 'resource_usage'
    value: float
    metadata: Dict[str, Any] = None

@dataclass  
class AlertThreshold:
    service_name: str
    metric_type: str
    threshold_value: float
    alert_type: str  # 'warning', 'critical'
    notification_channels: List[str]  # ['telegram', 'email', 'webhook']

class ChristmasUsageMonitor:
    def __init__(self, db_path: str = "usage_monitor.db"):
        self.db_path = db_path
        self.setup_database()
        self.setup_logging()
        
        # 서비스별 사용량 카운터
        self.usage_counters = defaultdict(lambda: defaultdict(int))
        self.last_reset = datetime.now()
        
        # 알림 임계치 설정
        self.alert_thresholds = [
            AlertThreshold("openai", "token_usage", 80.0, "warning", ["telegram"]),
            AlertThreshold("openai", "token_usage", 95.0, "critical", ["telegram", "webhook"]),
            AlertThreshold("kis_api", "api_call", 90.0, "warning", ["telegram"]),
            AlertThreshold("system", "memory_usage", 80.0, "warning", ["telegram"]),
            AlertThreshold("system", "cpu_usage", 90.0, "critical", ["telegram"]),
        ]
        
        # MCP 서버 설정
        self.name = "christmas-usage-monitor"
        self.version = "1.0.0"

    def setup_database(self):
        """데이터베이스 초기화"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 사용량 메트릭 테이블
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS usage_metrics (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME,
                service_name TEXT,
                metric_type TEXT,
                value REAL,
                metadata TEXT
            )
        ''')
        
        # 알림 히스토리 테이블
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS alert_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                timestamp DATETIME,
                service_name TEXT,
                alert_type TEXT,
                message TEXT,
                resolved BOOLEAN DEFAULT FALSE
            )
        ''')
        
        conn.commit()
        conn.close()

    def setup_logging(self):
        """로깅 설정"""
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('/root/dev/christmas-trading/logs/usage_monitor.log'),
                logging.StreamHandler()
            ]
        )
        self.logger = logging.getLogger(__name__)

    async def track_usage(self, service_name: str, metric_type: str, value: float, metadata: Dict = None):
        """사용량 추적"""
        metric = UsageMetric(
            timestamp=datetime.now(),
            service_name=service_name,
            metric_type=metric_type,
            value=value,
            metadata=metadata or {}
        )
        
        # 데이터베이스에 저장
        await self._save_metric(metric)
        
        # 실시간 카운터 업데이트
        self.usage_counters[service_name][metric_type] += value
        
        # 임계치 확인 및 알림
        await self._check_thresholds(metric)
        
        self.logger.info(f"Usage tracked: {service_name}.{metric_type} = {value}")

    async def _save_metric(self, metric: UsageMetric):
        """메트릭을 데이터베이스에 저장"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO usage_metrics (timestamp, service_name, metric_type, value, metadata)
            VALUES (?, ?, ?, ?, ?)
        ''', (
            metric.timestamp,
            metric.service_name,
            metric.metric_type,
            metric.value,
            json.dumps(metric.metadata) if metric.metadata else None
        ))
        
        conn.commit()
        conn.close()

    async def _check_thresholds(self, metric: UsageMetric):
        """임계치 확인 및 알림 발송"""
        for threshold in self.alert_thresholds:
            if (threshold.service_name == metric.service_name and 
                threshold.metric_type == metric.metric_type):
                
                # 현재 사용량 계산
                current_usage = await self._get_current_usage(
                    metric.service_name, metric.metric_type
                )
                
                if current_usage >= threshold.threshold_value:
                    await self._send_alert(threshold, current_usage, metric)

    async def _get_current_usage(self, service_name: str, metric_type: str) -> float:
        """현재 사용량 조회"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 최근 1시간 사용량
        one_hour_ago = datetime.now() - timedelta(hours=1)
        cursor.execute('''
            SELECT SUM(value) FROM usage_metrics 
            WHERE service_name = ? AND metric_type = ? AND timestamp >= ?
        ''', (service_name, metric_type, one_hour_ago))
        
        result = cursor.fetchone()
        conn.close()
        
        return result[0] if result[0] else 0.0

    async def _send_alert(self, threshold: AlertThreshold, current_usage: float, metric: UsageMetric):
        """알림 발송"""
        message = f"🚨 {threshold.alert_type.upper()} ALERT\n"
        message += f"Service: {threshold.service_name}\n"
        message += f"Metric: {threshold.metric_type}\n"
        message += f"Current: {current_usage:.2f}\n"
        message += f"Threshold: {threshold.threshold_value:.2f}\n"
        message += f"Time: {datetime.now().strftime('%H:%M:%S')}"
        
        # 텔레그램 알림
        if "telegram" in threshold.notification_channels:
            await self._send_telegram_alert(message)
        
        # 웹훅 알림
        if "webhook" in threshold.notification_channels:
            await self._send_webhook_alert(message, threshold)
        
        # 알림 히스토리 저장
        await self._save_alert(threshold.service_name, threshold.alert_type, message)

    async def _send_telegram_alert(self, message: str):
        """텔레그램 알림 발송"""
        # 텔레그램 봇 설정은 환경변수에서 가져옴
        bot_token = os.getenv('TELEGRAM_BOT_TOKEN')
        chat_id = os.getenv('TELEGRAM_CHAT_ID')
        
        if bot_token and chat_id:
            url = f"https://api.telegram.org/bot{bot_token}/sendMessage"
            data = {
                "chat_id": chat_id,
                "text": message,
                "parse_mode": "Markdown"
            }
            
            try:
                response = requests.post(url, json=data, timeout=10)
                if response.status_code == 200:
                    self.logger.info("Telegram alert sent successfully")
                else:
                    self.logger.error(f"Failed to send Telegram alert: {response.status_code}")
            except Exception as e:
                self.logger.error(f"Telegram alert error: {e}")

    async def _send_webhook_alert(self, message: str, threshold: AlertThreshold):
        """웹훅 알림 발송"""
        webhook_url = os.getenv('ALERT_WEBHOOK_URL')
        
        if webhook_url:
            payload = {
                "alert_type": threshold.alert_type,
                "service": threshold.service_name,
                "metric": threshold.metric_type,
                "message": message,
                "timestamp": datetime.now().isoformat()
            }
            
            try:
                response = requests.post(webhook_url, json=payload, timeout=10)
                if response.status_code == 200:
                    self.logger.info("Webhook alert sent successfully")
                else:
                    self.logger.error(f"Failed to send webhook alert: {response.status_code}")
            except Exception as e:
                self.logger.error(f"Webhook alert error: {e}")

    async def _save_alert(self, service_name: str, alert_type: str, message: str):
        """알림 히스토리 저장"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            INSERT INTO alert_history (timestamp, service_name, alert_type, message)
            VALUES (?, ?, ?, ?)
        ''', (datetime.now(), service_name, alert_type, message))
        
        conn.commit()
        conn.close()

    async def get_usage_dashboard(self) -> Dict[str, Any]:
        """사용량 대시보드 데이터 생성"""
        dashboard_data = {
            "current_time": datetime.now().isoformat(),
            "services": {},
            "system_resources": await self._get_system_resources(),
            "recent_alerts": await self._get_recent_alerts(),
            "usage_trends": await self._get_usage_trends()
        }
        
        # 서비스별 사용량 현황
        for service_name in ["openai", "gemini", "kis_api", "claude"]:
            dashboard_data["services"][service_name] = await self._get_service_usage(service_name)
        
        return dashboard_data

    async def _get_system_resources(self) -> Dict[str, float]:
        """시스템 리소스 사용량 조회"""
        return {
            "cpu_usage": psutil.cpu_percent(interval=1),
            "memory_usage": psutil.virtual_memory().percent,
            "disk_usage": psutil.disk_usage('/').percent,
            "network_io": sum(psutil.net_io_counters()[:2])
        }

    async def _get_service_usage(self, service_name: str) -> Dict[str, Any]:
        """서비스별 사용량 조회"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        # 최근 24시간 사용량
        yesterday = datetime.now() - timedelta(days=1)
        cursor.execute('''
            SELECT metric_type, SUM(value) FROM usage_metrics 
            WHERE service_name = ? AND timestamp >= ?
            GROUP BY metric_type
        ''', (service_name, yesterday))
        
        usage_data = {row[0]: row[1] for row in cursor.fetchall()}
        conn.close()
        
        return {
            "daily_usage": usage_data,
            "status": "active" if usage_data else "inactive",
            "last_activity": await self._get_last_activity(service_name)
        }

    async def _get_last_activity(self, service_name: str) -> Optional[str]:
        """마지막 활동 시간 조회"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT MAX(timestamp) FROM usage_metrics WHERE service_name = ?
        ''', (service_name,))
        
        result = cursor.fetchone()
        conn.close()
        
        return result[0] if result[0] else None

    async def _get_recent_alerts(self, limit: int = 10) -> List[Dict[str, Any]]:
        """최근 알림 조회"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()
        
        cursor.execute('''
            SELECT timestamp, service_name, alert_type, message 
            FROM alert_history 
            ORDER BY timestamp DESC 
            LIMIT ?
        ''', (limit,))
        
        alerts = []
        for row in cursor.fetchall():
            alerts.append({
                "timestamp": row[0],
                "service": row[1],
                "type": row[2],
                "message": row[3]
            })
        
        conn.close()
        return alerts

    async def _get_usage_trends(self) -> Dict[str, List[Tuple[str, float]]]:
        """사용량 트렌드 데이터"""
        conn = sqlite3.connect(self.db_path)     
        cursor = conn.cursor()
        
        # 최근 7일간 시간별 사용량
        week_ago = datetime.now() - timedelta(days=7)
        cursor.execute('''
            SELECT 
                service_name,
                strftime('%Y-%m-%d %H:00:00', timestamp) as hour,
                SUM(value) as total_usage
            FROM usage_metrics 
            WHERE timestamp >= ?
            GROUP BY service_name, hour
            ORDER BY hour
        ''', (week_ago,))
        
        trends = defaultdict(list)
        for row in cursor.fetchall():
            service, hour, usage = row
            trends[service].append((hour, usage))
        
        conn.close()
        return dict(trends)

    # MCP 서버 프로토콜 구현
    async def handle_request(self, request: Dict[str, Any]) -> Dict[str, Any]:
        """MCP 요청 처리"""
        try:
            method = request.get("method")
            params = request.get("params", {})
            
            if method == "tools/list":
                return self._list_tools()
            elif method == "tools/call":
                return await self._call_tool(params)
            elif method == "ping":
                return {"jsonrpc": "2.0", "result": "pong"}
            else:
                return self._error_response(f"Unknown method: {method}")
                
        except Exception as e:
            return self._error_response(str(e))

    def _list_tools(self) -> Dict[str, Any]:
        """사용 가능한 도구 목록"""
        return {
            "jsonrpc": "2.0",
            "result": {
                "tools": [
                    {
                        "name": "usage_dashboard",
                        "description": "크리스마스 트레이딩 통합 사용량 대시보드",
                        "inputSchema": {
                            "type": "object",
                            "properties": {}
                        }
                    },
                    {
                        "name": "track_usage",
                        "description": "사용량 수동 추적",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "service": {"type": "string", "description": "서비스 이름"},
                                "metric": {"type": "string", "description": "메트릭 타입"},
                                "value": {"type": "number", "description": "사용량 값"}
                            },
                            "required": ["service", "metric", "value"]
                        }
                    },
                    {
                        "name": "set_alert_threshold",
                        "description": "알림 임계치 설정",
                        "inputSchema": {
                            "type": "object",
                            "properties": {
                                "service": {"type": "string"},
                                "metric": {"type": "string"},
                                "threshold": {"type": "number"},
                                "alert_type": {"type": "string"}
                            },
                            "required": ["service", "metric", "threshold"]
                        }
                    }
                ]
            }
        }

    async def _call_tool(self, params: Dict[str, Any]) -> Dict[str, Any]:
        """도구 호출 처리"""
        tool_name = params.get("name")
        arguments = params.get("arguments", {})
        
        if tool_name == "usage_dashboard":
            dashboard = await self.get_usage_dashboard()
            return {
                "jsonrpc": "2.0",
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": f"## 🎄 Christmas Trading Usage Dashboard\n\n```json\n{json.dumps(dashboard, indent=2, default=str)}\n```"
                        }
                    ]
                }
            }
        elif tool_name == "track_usage":
            await self.track_usage(
                arguments["service"],
                arguments["metric"], 
                arguments["value"]
            )
            return {
                "jsonrpc": "2.0",
                "result": {
                    "content": [
                        {
                            "type": "text",
                            "text": f"✅ Usage tracked: {arguments['service']}.{arguments['metric']} = {arguments['value']}"
                        }
                    ]
                }
            }
        else:
            return self._error_response(f"Unknown tool: {tool_name}")

    def _error_response(self, message: str) -> Dict[str, Any]:
        """에러 응답 생성"""
        return {
            "jsonrpc": "2.0",
            "error": {
                "code": -32000,
                "message": message
            }
        }

    async def start_monitoring(self, interval: int = 30):
        """백그라운드 모니터링 시작"""
        self.logger.info("Starting Christmas Trading usage monitoring...")
        
        while True:
            try:
                # 시스템 리소스 추적
                resources = await self._get_system_resources()
                for metric_name, value in resources.items():
                    await self.track_usage("system", metric_name, value)
                
                # 주기적 대시보드 업데이트
                if datetime.now().minute % 10 == 0:  # 10분마다
                    dashboard = await self.get_usage_dashboard()
                    self.logger.info(f"Dashboard updated: {len(dashboard['services'])} services monitored")
                
                await asyncio.sleep(interval)
                
            except Exception as e:
                self.logger.error(f"Monitoring error: {e}")
                await asyncio.sleep(interval)

async def main():
    """메인 함수"""
    monitor = ChristmasUsageMonitor()
    
    # 백그라운드 모니터링 시작
    monitoring_task = asyncio.create_task(monitor.start_monitoring())
    
    # MCP 서버 실행
    while True:
        try:
            line = await asyncio.to_thread(sys.stdin.readline)
            if not line:
                break
                
            request = json.loads(line.strip())
            response = await monitor.handle_request(request)
            
            print(json.dumps(response), flush=True)
            
        except json.JSONDecodeError:
            error_response = monitor._error_response("Invalid JSON")
            print(json.dumps(error_response), flush=True)
        except Exception as e:
            error_response = monitor._error_response(str(e))
            print(json.dumps(error_response), flush=True)

if __name__ == "__main__":
    asyncio.run(main())