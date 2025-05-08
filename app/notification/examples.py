"""
알림 모듈 사용 예제
이메일, 모바일 알림, 템플릿 및 알림 서비스 사용법 예시
"""

import logging
import os
import json
import time
from pathlib import Path
from datetime import datetime
from typing import Dict, Any

from app.notification.template_manager import TemplateManager, NotificationTemplate, EventType, TemplateType
from app.notification.email_notifier import EmailNotifier, EmailConfig
from app.notification.mobile_notifier import MobileNotifier, FCMConfig
from app.notification.notification_service import NotificationService, NotificationChannel, NotificationPriority

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


# 예제 1: 템플릿 관리자 사용 예시
def example_template_manager():
    """템플릿 관리자 사용 예시"""
    
    logger.info("=== 템플릿 관리자 예제 ===")
    
    # 템플릿 디렉토리 설정 (없으면 기본 템플릿만 사용)
    template_dir = os.path.join(os.path.dirname(__file__), "templates")
    os.makedirs(template_dir, exist_ok=True)
    
    # 템플릿 관리자 초기화
    template_manager = TemplateManager(template_dir)
    
    # 사용 가능한 템플릿 확인
    all_templates = template_manager.templates
    logger.info(f"기본 탬플릿 수: {len(all_templates)}")
    
    # 이벤트별 템플릿 조회
    trade_templates = template_manager.get_templates_by_event(EventType.TRADE_EXECUTED)
    logger.info(f"거래 체결 관련 템플릿 수: {len(trade_templates)}")
    
    for template in trade_templates:
        logger.info(f"- {template.id}: {template.name} ({template.template_type.name})")
    
    # 새 템플릿 생성 및 등록
    custom_template = NotificationTemplate(
        id="custom_alert_email",
        name="커스텀 알림 이메일",
        template_type=TemplateType.EMAIL,
        event_type=EventType.PRICE_ALERT,
        subject="[Christmas] {symbol} 가격 알림",
        body=(
            "안녕하세요,\n\n"
            "{symbol}의 가격이 {condition} {target_price}원 되었습니다.\n"
            "현재 가격: {current_price}원\n"
            "시간: {timestamp}\n\n"
            "감사합니다,\n"
            "Christmas 트레이딩 시스템"
        )
    )
    
    template_manager.add_template(custom_template)
    logger.info(f"커스텀 템플릿 추가됨: {custom_template.id}")
    
    # 템플릿 변수 확인
    logger.info(f"템플릿 변수: {custom_template.variables}")
    
    # 템플릿 렌더링
    context = {
        "symbol": "삼성전자",
        "condition": "이상으로",
        "target_price": 75000,
        "current_price": 75200,
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    }
    
    rendered = template_manager.render_template(custom_template.id, context)
    if rendered:
        logger.info(f"렌더링된 제목: {rendered['subject']}")
        logger.info(f"렌더링된 본문: {rendered['body']}")
    
    # 템플릿 파일 저장
    template_manager.save_templates_to_directory()
    logger.info(f"템플릿 저장 완료: {template_dir}")


# 예제 2: 이메일 알림 전송 예시
def example_email_notifier():
    """이메일 알림 전송 예시"""
    
    logger.info("\n=== 이메일 알림 예제 ===")
    
    # 설정 및 보안 정보는 실제 값으로 대체 필요
    # 이 예제에서는 동작하지 않음
    email_config = EmailConfig(
        smtp_server="smtp.gmail.com",
        smtp_port=465,
        sender_email="your-email@gmail.com",  # 실제 이메일로 변경
        sender_password="your-password",       # 실제 비밀번호 또는 앱 비밀번호로 변경
        sender_name="Christmas Trading Bot"
    )
    
    try:
        # 이메일 알림 전송 객체 초기화
        email_notifier = EmailNotifier(config=email_config)
        
        # 간단한 이메일 전송
        success = email_notifier.send_email(
            recipient_email="recipient@example.com",  # 수신자 이메일로 변경
            subject="Christmas 트레이딩 봇 테스트",
            text_content="이것은 테스트 이메일입니다.",
            html_content="<p>이것은 <strong>테스트</strong> 이메일입니다.</p>"
        )
        
        if success:
            logger.info("이메일 전송 성공")
        else:
            logger.warning("이메일 전송 실패")
        
        # 템플릿 기반 이메일 전송
        context = {
            "symbol": "삼성전자",
            "position_type": "매수",
            "executed_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "price": 75000,
            "quantity": 10,
            "amount": 750000
        }
        
        success = email_notifier.send_template_email(
            recipient_email="recipient@example.com",  # 수신자 이메일로 변경
            template_id="trade_executed_email",
            context=context
        )
        
        if success:
            logger.info("템플릿 이메일 전송 성공")
        else:
            logger.warning("템플릿 이메일 전송 실패")
            
    except Exception as e:
        logger.error(f"이메일 알림 예제 실행 오류: {str(e)}")
        logger.info("이 예제는 실제 SMTP 서버 정보와 자격 증명이 필요합니다.")


# 예제 3: 모바일 푸시 알림 전송 예시
def example_mobile_notifier():
    """모바일 푸시 알림 전송 예시"""
    
    logger.info("\n=== 모바일 푸시 알림 예제 ===")
    
    # 설정 및 보안 정보는 실제 값으로 대체 필요
    # 이 예제에서는 동작하지 않음
    fcm_config = FCMConfig(
        server_key="your-fcm-server-key"  # Firebase 콘솔에서 서버 키 가져옴
    )
    
    try:
        # 모바일 알림 전송 객체 초기화
        mobile_notifier = MobileNotifier(config=fcm_config)
        
        # 단일 기기로 푸시 알림 전송
        device_token = "sample-device-token"  # 실제 기기 토큰으로 변경
        
        success = mobile_notifier.send_push_notification(
            token=device_token,
            title="거래 알림",
            body="삼성전자 매수 주문이 체결되었습니다.",
            data={"type": "trade", "symbol": "삼성전자"}
        )
        
        if success:
            logger.info("푸시 알림 전송 성공")
        else:
            logger.warning("푸시 알림 전송 실패")
        
        # 템플릿 기반 푸시 알림 전송
        context = {
            "symbol": "삼성전자",
            "position_type": "매수",
            "price": 75000
        }
        
        success = mobile_notifier.send_template_notification(
            token=device_token,
            template_id="trade_executed_push",
            context=context
        )
        
        if success:
            logger.info("템플릿 푸시 알림 전송 성공")
        else:
            logger.warning("템플릿 푸시 알림 전송 실패")
            
    except Exception as e:
        logger.error(f"모바일 알림 예제 실행 오류: {str(e)}")
        logger.info("이 예제는 실제 FCM 서버 키와 유효한 기기 토큰이 필요합니다.")


# 예제 4: 알림 서비스 예시
def example_notification_service():
    """알림 서비스 통합 사용 예시"""
    
    logger.info("\n=== 알림 서비스 예제 ===")
    
    # 설정 파일 생성 (실제 사용 시 수정 필요)
    config = {
        "email": {
            "enabled": True,
            "smtp_server": "smtp.gmail.com",
            "smtp_port": 465,
            "sender_email": "your-email@gmail.com",  # 실제 이메일로 변경
            "sender_password": "your-password",      # 실제 비밀번호로 변경
            "sender_name": "Christmas Trading Bot",
            "use_ssl": True
        },
        "push": {
            "enabled": True,
            "server_key": "your-fcm-server-key"  # Firebase 콘솔에서 서버 키 가져옴
        },
        "default_subscriptions": {
            "TRADE_EXECUTED": ["EMAIL", "PUSH"],
            "STOP_LOSS_TRIGGERED": ["EMAIL", "PUSH"],
            "TAKE_PROFIT_TRIGGERED": ["EMAIL", "PUSH"],
            "SIGNAL_GENERATED": ["EMAIL"],
            "SYSTEM_ERROR": ["EMAIL"]
        },
        "admin_email": "admin@example.com"  # 관리자 이메일로 변경
    }
    
    config_dir = os.path.join(os.path.dirname(__file__), "config")
    os.makedirs(config_dir, exist_ok=True)
    config_path = os.path.join(config_dir, "notification_config.json")
    
    with open(config_path, 'w', encoding='utf-8') as file:
        json.dump(config, file, indent=2)
    
    # 알림 서비스 초기화
    notification_service = NotificationService(
        config_path=config_path,
        worker_count=2
    )
    
    # 알림 서비스 시작
    notification_service.start()
    
    try:
        # 사용자 구독 설정
        user_id = "user123"
        notification_service.subscribe(
            user_id=user_id,
            event_type=EventType.TRADE_EXECUTED,
            channels=[NotificationChannel.EMAIL, NotificationChannel.PUSH]
        )
        
        notification_service.subscribe(
            user_id=user_id,
            event_type=EventType.SIGNAL_GENERATED,
            channels=[NotificationChannel.EMAIL]
        )
        
        # 구독 정보 확인
        subscriptions = notification_service.get_subscriptions(user_id)
        logger.info(f"사용자 구독 정보: {subscriptions}")
        
        # 알림 전송 예시 1: 거래 체결 알림
        trade_data = {
            "symbol": "삼성전자",
            "position_type": "매수",
            "price": 75000,
            "quantity": 10,
            "executed_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        recipient = {
            "user_id": user_id,
            "email": "user@example.com", 
            "device_token": "sample-device-token"  # 실제 기기 토큰으로 변경
        }
        
        notification_service.notify(
            recipient=recipient,
            event_type=EventType.TRADE_EXECUTED,
            context=trade_data
        )
        
        logger.info("거래 체결 알림 요청됨 (백그라운드에서 처리)")
        
        # 알림 전송 예시 2: 시스템 오류 알림
        notification_service.notify_system_error(
            error_type="데이터베이스 오류",
            error_message="데이터베이스 연결 실패",
            module="app.storage.database",
            function="connect_db"
        )
        
        logger.info("시스템 오류 알림 요청됨 (백그라운드에서 처리)")
        
        # 알림 전송 예시 3: 매매 신호 알림
        signal_data = {
            "symbol": "삼성전자",
            "signal_type": "매수",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "price": 74500, 
            "confidence": 85,
            "strategy_name": "볼린저 밴드",
            "signal_color": "#28a745",
            "action": "주문",
            "status": "완료됨"
        }
        
        notification_service.notify(
            recipient=recipient,
            event_type=EventType.SIGNAL_GENERATED,
            context=signal_data,
            priority=NotificationPriority.HIGH
        )
        
        logger.info("매매 신호 알림 요청됨 (백그라운드에서 처리)")
        
        # 잠시 대기 (워커가 알림을 처리할 시간 제공)
        logger.info("알림 처리를 위해 5초 대기...")
        time.sleep(5)
        
    finally:
        # 알림 서비스 종료
        notification_service.stop()
        logger.info("알림 서비스 중지됨")


# 메인 실행
if __name__ == "__main__":
    try:
        # 템플릿 관리자 예제 실행
        example_template_manager()
        
        # 이메일 알림 예제 (실제 이메일 전송하지 않음)
        example_email_notifier()
        
        # 모바일 푸시 알림 예제 (실제 알림 전송하지 않음)
        example_mobile_notifier()
        
        # 알림 서비스 예제 (실제 알림 전송하지 않음)
        example_notification_service()
        
    except Exception as e:
        logger.error(f"예제 실행 중 오류 발생: {str(e)}")
        raise 