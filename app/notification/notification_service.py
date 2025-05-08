"""
Christmas 프로젝트 - 알림 서비스 모듈
다양한 알림 채널을 통합 관리하는 서비스 제공
"""

import logging
import threading
import queue
import time
from typing import Dict, List, Any, Optional, Union, Set
from enum import Enum, auto
import json
from pathlib import Path
import os

from app.notification.template_manager import TemplateManager, EventType
from app.notification.email_notifier import EmailNotifier, EmailConfig
from app.notification.mobile_notifier import MobileNotifier, FCMConfig

logger = logging.getLogger(__name__)


class NotificationChannel(Enum):
    """알림 채널 유형"""
    EMAIL = auto()  # 이메일
    PUSH = auto()   # 모바일 푸시
    SMS = auto()    # SMS
    WEB = auto()    # 웹 알림
    ALL = auto()    # 모든 채널


class NotificationPriority(Enum):
    """알림 우선순위"""
    LOW = auto()
    NORMAL = auto()
    HIGH = auto()
    URGENT = auto()


class NotificationService:
    """통합 알림 서비스 클래스"""
    
    def __init__(
        self,
        config_path: Optional[str] = None,
        template_dir: Optional[str] = None,
        worker_count: int = 2,
        queue_size: int = 100
    ):
        """
        알림 서비스 초기화
        
        Args:
            config_path: 알림 설정 JSON 파일 경로
            template_dir: 템플릿 디렉토리 경로
            worker_count: 알림 처리 워커 스레드 수
            queue_size: 알림 큐 크기
        """
        # 템플릿 관리자 초기화
        self.template_manager = TemplateManager(template_dir)
        
        # 설정 로드
        self.config = self._load_config(config_path)
        
        # 알림 처리 큐
        self.notification_queue = queue.Queue(maxsize=queue_size)
        
        # 알림 전송 채널 초기화
        self.email_notifier = self._initialize_email_notifier()
        self.mobile_notifier = self._initialize_mobile_notifier()
        
        # 구독 정보
        self.subscriptions: Dict[str, Dict[EventType, Set[NotificationChannel]]] = {}
        
        # 워커 스레드
        self.worker_threads = []
        self.running = False
        self.worker_count = worker_count
        
        logger.info(f"알림 서비스 초기화 완료 (워커: {worker_count}개, 큐 크기: {queue_size})")
    
    def _load_config(self, config_path: Optional[str]) -> Dict[str, Any]:
        """알림 설정 로드"""
        default_config = {
            "email": {
                "enabled": False,
                "smtp_server": "smtp.gmail.com",
                "smtp_port": 465,
                "sender_email": "",
                "sender_password": "",
                "sender_name": "Christmas 트레이딩 봇",
                "use_ssl": True
            },
            "push": {
                "enabled": False,
                "server_key": "",
                "api_url": "https://fcm.googleapis.com/fcm/send"
            },
            "sms": {
                "enabled": False
            },
            "web": {
                "enabled": False
            },
            "default_subscriptions": {
                "TRADE_EXECUTED": ["EMAIL", "PUSH"],
                "STOP_LOSS_TRIGGERED": ["EMAIL", "PUSH"],
                "TAKE_PROFIT_TRIGGERED": ["EMAIL", "PUSH"],
                "SIGNAL_GENERATED": ["EMAIL"],
                "SYSTEM_ERROR": ["EMAIL", "PUSH"]
            }
        }
        
        if not config_path:
            logger.warning("알림 설정 파일이 지정되지 않았습니다. 기본 설정을 사용합니다.")
            return default_config
        
        try:
            with open(config_path, 'r', encoding='utf-8') as file:
                config = json.load(file)
                
            # 기본 설정과 병합
            merged_config = default_config.copy()
            
            for section in ['email', 'push', 'sms', 'web']:
                if section in config:
                    merged_config[section].update(config[section])
            
            if 'default_subscriptions' in config:
                merged_config['default_subscriptions'] = config['default_subscriptions']
            
            logger.info(f"알림 설정 로드 완료: {config_path}")
            return merged_config
            
        except Exception as e:
            logger.error(f"알림 설정 로드 중 오류 발생: {str(e)}. 기본 설정을 사용합니다.")
            return default_config
    
    def _initialize_email_notifier(self) -> Optional[EmailNotifier]:
        """이메일 알림 모듈 초기화"""
        if not self.config['email']['enabled'] or not self.config['email']['sender_email']:
            logger.info("이메일 알림이 비활성화되었습니다.")
            return None
        
        try:
            email_config = EmailConfig(
                smtp_server=self.config['email']['smtp_server'],
                smtp_port=self.config['email']['smtp_port'],
                sender_email=self.config['email']['sender_email'],
                sender_password=self.config['email']['sender_password'],
                sender_name=self.config['email']['sender_name'],
                use_ssl=self.config['email']['use_ssl']
            )
            
            return EmailNotifier(
                config=email_config,
                template_manager=self.template_manager
            )
            
        except Exception as e:
            logger.error(f"이메일 알림 모듈 초기화 오류: {str(e)}")
            return None
    
    def _initialize_mobile_notifier(self) -> Optional[MobileNotifier]:
        """모바일 푸시 알림 모듈 초기화"""
        if not self.config['push']['enabled'] or not self.config['push']['server_key']:
            logger.info("모바일 푸시 알림이 비활성화되었습니다.")
            return None
        
        try:
            fcm_config = FCMConfig(
                server_key=self.config['push']['server_key'],
                api_url=self.config['push']['api_url']
            )
            
            return MobileNotifier(
                config=fcm_config,
                template_manager=self.template_manager
            )
            
        except Exception as e:
            logger.error(f"모바일 푸시 알림 모듈 초기화 오류: {str(e)}")
            return None
    
    def start(self) -> None:
        """알림 서비스 시작"""
        if self.running:
            logger.warning("알림 서비스가 이미 실행 중입니다.")
            return
        
        self.running = True
        
        # 워커 스레드 시작
        for i in range(self.worker_count):
            thread = threading.Thread(
                target=self._notification_worker,
                name=f"notification-worker-{i}",
                daemon=True
            )
            thread.start()
            self.worker_threads.append(thread)
        
        logger.info(f"알림 서비스 시작됨 (워커 {self.worker_count}개)")
    
    def stop(self) -> None:
        """알림 서비스 중지"""
        if not self.running:
            return
        
        logger.info("알림 서비스 중지 중...")
        self.running = False
        
        # 워커 스레드가 종료될 때까지 대기
        for thread in self.worker_threads:
            thread.join(timeout=2.0)
        
        self.worker_threads.clear()
        logger.info("알림 서비스 중지됨")
    
    def _notification_worker(self) -> None:
        """알림 처리 워커 스레드"""
        thread_name = threading.current_thread().name
        logger.info(f"알림 워커 스레드 시작: {thread_name}")
        
        while self.running:
            try:
                # 큐에서 알림 항목 가져오기 (1초 타임아웃)
                try:
                    notification_item = self.notification_queue.get(timeout=1.0)
                except queue.Empty:
                    continue
                
                # 알림 처리
                try:
                    self._process_notification(notification_item)
                except Exception as e:
                    logger.error(f"알림 처리 중 오류 발생: {str(e)}")
                finally:
                    self.notification_queue.task_done()
                    
            except Exception as e:
                logger.error(f"알림 워커 스레드 오류: {str(e)}")
                time.sleep(1.0)  # 오류 발생 시 잠시 대기
        
        logger.info(f"알림 워커 스레드 종료: {thread_name}")
    
    def _process_notification(self, notification_item: Dict[str, Any]) -> None:
        """
        알림 처리
        
        Args:
            notification_item: 알림 정보
        """
        event_type = notification_item.get("event_type")
        channels = notification_item.get("channels", [])
        recipient = notification_item.get("recipient")
        context = notification_item.get("context", {})
        
        if not event_type or not recipient:
            logger.warning(f"알림 처리 실패: 필수 정보 누락 (event_type: {event_type}, recipient: {recipient})")
            return
        
        logger.debug(f"알림 처리 중: {event_type}, 수신자: {recipient}, 채널: {channels}")
        
        # 이메일 알림
        if NotificationChannel.EMAIL in channels and self.email_notifier:
            if isinstance(recipient, dict) and 'email' in recipient:
                email = recipient['email']
                try:
                    self.email_notifier.send_event_notification(
                        recipient_email=email,
                        event_type=event_type,
                        context=context
                    )
                except Exception as e:
                    logger.error(f"이메일 알림 전송 실패: {str(e)}")
            else:
                logger.warning(f"이메일 알림 전송 실패: 유효한 이메일 주소가 없습니다.")
        
        # 모바일 푸시 알림
        if NotificationChannel.PUSH in channels and self.mobile_notifier:
            if isinstance(recipient, dict) and 'device_token' in recipient:
                token = recipient['device_token']
                try:
                    self.mobile_notifier.send_event_notification(
                        token=token,
                        event_type=event_type,
                        context=context
                    )
                except Exception as e:
                    logger.error(f"푸시 알림 전송 실패: {str(e)}")
            else:
                logger.warning(f"푸시 알림 전송 실패: 유효한 기기 토큰이 없습니다.")
        
        # 기타 채널 추가 가능
    
    def notify(
        self,
        recipient: Union[str, Dict[str, Any]],
        event_type: EventType,
        context: Dict[str, Any],
        channels: Optional[List[NotificationChannel]] = None,
        priority: NotificationPriority = NotificationPriority.NORMAL
    ) -> bool:
        """
        알림 전송 요청
        
        Args:
            recipient: 수신자 정보 (이메일 주소 또는 {'email': '...', 'device_token': '...'} 형태)
            event_type: 이벤트 유형
            context: 템플릿 컨텍스트
            channels: 알림 채널 목록 (None이면 기본 구독 정보 사용)
            priority: 알림 우선순위
            
        Returns:
            요청 성공 여부
        """
        # 수신자 정보 정규화
        if isinstance(recipient, str):
            # 이메일 주소로 가정
            recipient = {"email": recipient}
        
        # 사용자 ID
        user_id = recipient.get("user_id", "anonymous")
        
        # 채널 결정
        if channels is None:
            # 기본 구독 정보 확인
            if user_id in self.subscriptions and event_type in self.subscriptions[user_id]:
                channels = list(self.subscriptions[user_id][event_type])
            else:
                # 설정에서 기본 구독 정보 가져오기
                default_channels = self.config.get('default_subscriptions', {}).get(event_type.name, ['EMAIL'])
                channels = [getattr(NotificationChannel, ch) for ch in default_channels if hasattr(NotificationChannel, ch)]
        
        if NotificationChannel.ALL in channels:
            channels = [NotificationChannel.EMAIL, NotificationChannel.PUSH, NotificationChannel.SMS, NotificationChannel.WEB]
        
        # 알림 큐에 추가
        try:
            notification_item = {
                "recipient": recipient,
                "event_type": event_type,
                "context": context,
                "channels": channels,
                "priority": priority,
                "timestamp": time.time()
            }
            
            block = priority == NotificationPriority.URGENT
            self.notification_queue.put(notification_item, block=block, timeout=2.0 if block else None)
            
            logger.debug(f"알림 큐에 추가됨: {event_type.name}, 우선순위: {priority.name}")
            return True
            
        except queue.Full:
            logger.error(f"알림 큐가 가득 찼습니다. 알림이 삭제됩니다: {event_type.name}")
            return False
        except Exception as e:
            logger.error(f"알림 큐 추가 중 오류 발생: {str(e)}")
            return False
    
    def subscribe(self, user_id: str, event_type: EventType, channels: List[NotificationChannel]) -> None:
        """
        이벤트 구독 등록
        
        Args:
            user_id: 사용자 ID
            event_type: 이벤트 유형
            channels: 알림 채널 목록
        """
        if user_id not in self.subscriptions:
            self.subscriptions[user_id] = {}
        
        if event_type not in self.subscriptions[user_id]:
            self.subscriptions[user_id][event_type] = set()
        
        for channel in channels:
            self.subscriptions[user_id][event_type].add(channel)
        
        logger.debug(f"구독 등록: 사용자 {user_id}, 이벤트 {event_type.name}, 채널: {[ch.name for ch in channels]}")
    
    def unsubscribe(self, user_id: str, event_type: EventType, channels: Optional[List[NotificationChannel]] = None) -> None:
        """
        이벤트 구독 해제
        
        Args:
            user_id: 사용자 ID
            event_type: 이벤트 유형
            channels: 알림 채널 목록 (None이면 모든 채널 해제)
        """
        if user_id not in self.subscriptions or event_type not in self.subscriptions[user_id]:
            return
        
        if channels is None:
            # 모든 채널 구독 해제
            del self.subscriptions[user_id][event_type]
            
            # 사용자의 모든 구독이 해제되었으면 사용자 항목 자체를 삭제
            if not self.subscriptions[user_id]:
                del self.subscriptions[user_id]
        else:
            # 지정된 채널만 구독 해제
            for channel in channels:
                self.subscriptions[user_id][event_type].discard(channel)
            
            # 모든 채널이 해제되었으면 이벤트 항목 삭제
            if not self.subscriptions[user_id][event_type]:
                del self.subscriptions[user_id][event_type]
                
                # 사용자의 모든 구독이 해제되었으면 사용자 항목 자체를 삭제
                if not self.subscriptions[user_id]:
                    del self.subscriptions[user_id]
        
        logger.debug(f"구독 해제: 사용자 {user_id}, 이벤트 {event_type.name}, 채널: {[ch.name for ch in (channels or [])]}")
    
    def get_subscriptions(self, user_id: str) -> Dict[str, List[str]]:
        """
        사용자의 구독 정보 조회
        
        Args:
            user_id: 사용자 ID
            
        Returns:
            이벤트별 구독 채널 목록
        """
        if user_id not in self.subscriptions:
            return {}
        
        result = {}
        for event_type, channels in self.subscriptions[user_id].items():
            result[event_type.name] = [ch.name for ch in channels]
        
        return result
    
    def notify_system_error(self, error_type: str, error_message: str, module: str, function: str) -> bool:
        """
        시스템 오류 알림 전송 편의 메서드
        
        Args:
            error_type: 오류 유형
            error_message: 오류 메시지
            module: 오류 발생 모듈
            function: 오류 발생 함수
            
        Returns:
            알림 요청 성공 여부
        """
        # 시스템 관리자 수신자 설정
        admin_email = self.config.get("admin_email", "admin@example.com")
        
        # 컨텍스트 구성
        context = {
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "error_type": error_type,
            "error_message": error_message,
            "module": module,
            "function": function
        }
        
        # 알림 전송
        return self.notify(
            recipient=admin_email,
            event_type=EventType.SYSTEM_ERROR,
            context=context,
            priority=NotificationPriority.HIGH
        )
    
    def notify_trade_execution(self, user_id: str, trade_data: Dict[str, Any]) -> bool:
        """
        거래 체결 알림 전송 편의 메서드
        
        Args:
            user_id: 사용자 ID
            trade_data: 거래 데이터
            
        Returns:
            알림 요청 성공 여부
        """
        # 사용자 정보 가져오기 (실제 구현에서는 사용자 정보 서비스에서 조회)
        # TODO: 실제 사용자 정보 조회 구현
        user_info = {"email": f"{user_id}@example.com", "user_id": user_id}
        
        # 컨텍스트 구성
        context = {
            "symbol": trade_data.get("symbol", ""),
            "position_type": trade_data.get("position_type", "매수"),
            "executed_time": trade_data.get("executed_time", time.strftime("%Y-%m-%d %H:%M:%S")),
            "price": trade_data.get("price", 0),
            "quantity": trade_data.get("quantity", 0),
            "amount": trade_data.get("price", 0) * trade_data.get("quantity", 0)
        }
        
        # 알림 전송
        return self.notify(
            recipient=user_info,
            event_type=EventType.TRADE_EXECUTED,
            context=context
        ) 