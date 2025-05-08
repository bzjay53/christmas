#!/usr/bin/env python
"""
텔레그램 알림 사용 예제
"""

import os
import sys
import logging
import json
import time
from datetime import datetime
from typing import Dict, Any
import argparse

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 프로젝트 루트 경로 추가
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from app.notification.telegram_notifier import TelegramNotifier, TelegramConfig
from app.notification.template_manager import TemplateManager, EventType
from app.notification.notification_service import NotificationService, NotificationChannel, NotificationPriority


def example_telegram_direct():
    """텔레그램 알림 직접 사용 예제"""
    
    logger.info("=== 텔레그램 알림 직접 사용 예제 ===")
    
    # 봇 토큰 가져오기 (환경 변수 또는 설정 파일)
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    if not bot_token:
        logger.error("환경 변수 TELEGRAM_BOT_TOKEN이 설정되지 않았습니다.")
        return False
    
    # 텔레그램 설정
    telegram_config = TelegramConfig(bot_token=bot_token)
    
    # 템플릿 디렉토리
    template_dir = os.path.join(os.path.dirname(__file__), 'templates')
    os.makedirs(template_dir, exist_ok=True)
    
    # 텔레그램 알림 객체 초기화
    notifier = TelegramNotifier(
        config=telegram_config,
        templates_dir=template_dir
    )
    
    # 채팅 ID 파일 로드
    chat_file = os.path.join(os.path.dirname(__file__), 'config', 'telegram_chats.json')
    if os.path.exists(chat_file):
        try:
            with open(chat_file, 'r', encoding='utf-8') as file:
                chat_data = json.load(file)
                chat_ids = chat_data.get('chat_ids', [])
                
                # 채팅 ID 등록
                for chat_id in chat_ids:
                    notifier.add_chat_id(chat_id)
                    
                logger.info(f"{len(chat_ids)}개의 채팅 ID를 로드했습니다.")
        except Exception as e:
            logger.error(f"채팅 ID 로드 중 오류 발생: {str(e)}")
    
    if not notifier.chat_ids:
        logger.warning("등록된 채팅 ID가 없습니다. config/telegram_chats.json 파일을 확인하거나 텔레그램 봇으로 /register 명령을 사용하세요.")
        logger.info("테스트를 위해 채팅 ID를 직접 입력하세요:")
        chat_id = input("채팅 ID: ")
        notifier.add_chat_id(chat_id)
    
    # 간단한 메시지 전송
    logger.info("간단한 메시지 전송 중...")
    test_message = (
        "<b>Christmas 트레이딩 봇 테스트</b>\n\n"
        "이것은 텔레그램 알림 테스트 메시지입니다.\n"
        "현재 시간: " + datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    )
    
    results = notifier.send_message_to_all(test_message)
    if results:
        success_count = sum(1 for result in results.values() if result)
        logger.info(f"메시지 전송 결과: {success_count}/{len(results)}개 성공")
    
    # 트레이드 실행 알림 예제
    logger.info("트레이드 실행 알림 전송 중...")
    trade_context = {
        "symbol": "삼성전자",
        "position_type": "매수",
        "executed_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        "price": 75000,
        "quantity": 10,
        "amount": 750000
    }
    
    results = notifier.send_event_to_all(EventType.TRADE_EXECUTED, trade_context)
    if results:
        success_count = sum(1 for result in results.values() if result)
        logger.info(f"트레이드 알림 전송 결과: {success_count}/{len(results)}개 성공")
    
    return True


def example_notification_service():
    """알림 서비스를 통한 텔레그램 알림 예제"""
    
    logger.info("\n=== 알림 서비스를 통한 텔레그램 알림 예제 ===")
    
    # 설정 파일 경로
    config_path = os.path.join(os.path.dirname(__file__), 'config', 'notification_config.json')
    
    # 봇 토큰 환경 변수 확인
    bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', '')
    if not bot_token:
        logger.error("환경 변수 TELEGRAM_BOT_TOKEN이 설정되지 않았습니다.")
        return False
    
    # 설정 파일에 봇 토큰 추가
    try:
        with open(config_path, 'r', encoding='utf-8') as file:
            config = json.load(file)
        
        # 봇 토큰 설정
        if 'telegram' not in config:
            config['telegram'] = {}
        
        config['telegram']['bot_token'] = bot_token
        config['telegram']['enabled'] = True
        
        with open(config_path, 'w', encoding='utf-8') as file:
            json.dump(config, file, indent=2)
            
        logger.info(f"설정 파일에 봇 토큰 저장 완료: {config_path}")
    except Exception as e:
        logger.error(f"설정 파일 수정 중 오류 발생: {str(e)}")
    
    # 알림 서비스 초기화
    notification_service = NotificationService(
        config_path=config_path,
        worker_count=2
    )
    
    # 알림 서비스 시작
    notification_service.start()
    
    try:
        # 트레이드 실행 알림 예제
        logger.info("트레이드 실행 알림 전송 중...")
        trade_data = {
            "symbol": "삼성전자",
            "position_type": "매수",
            "price": 75000,
            "quantity": 10,
            "executed_time": datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        }
        
        # 알림 전송
        result = notification_service.notify_trade_execution("user123", trade_data)
        logger.info(f"트레이드 알림 전송 요청 결과: {'성공' if result else '실패'}")
        
        # 손절매 알림 예제
        logger.info("손절매 알림 전송 중...")
        stop_loss_context = {
            "symbol": "삼성전자",
            "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            "entry_price": 78000,
            "exit_price": 75000,
            "loss_amount": -3000,
            "loss_pct": -3.85
        }
        
        # 알림 전송
        result = notification_service.notify(
            recipient={"user_id": "user123"},
            event_type=EventType.STOP_LOSS_TRIGGERED,
            context=stop_loss_context,
            channels=[NotificationChannel.TELEGRAM],
            priority=NotificationPriority.HIGH
        )
        logger.info(f"손절매 알림 전송 요청 결과: {'성공' if result else '실패'}")
        
        # 시스템 오류 알림 예제
        logger.info("시스템 오류 알림 전송 중...")
        result = notification_service.notify_system_error(
            error_type="데이터베이스 오류",
            error_message="데이터베이스 연결 실패",
            module="app.storage.database",
            function="connect_db"
        )
        logger.info(f"시스템 오류 알림 전송 요청 결과: {'성공' if result else '실패'}")
        
        # 알림 처리를 위해 대기
        logger.info("알림 처리를 위해 5초 대기...")
        time.sleep(5)
        
    finally:
        # 알림 서비스 종료
        notification_service.stop()
        logger.info("알림 서비스 종료됨")
    
    return True


def main():
    """메인 함수"""
    parser = argparse.ArgumentParser(description="텔레그램 알림 예제")
    parser.add_argument('--direct', action='store_true', help='텔레그램 알림 직접 사용 예제')
    parser.add_argument('--service', action='store_true', help='알림 서비스를 통한 텔레그램 알림 예제')
    
    args = parser.parse_args()
    
    # 기본적으로 두 예제 모두 실행
    run_direct = True
    run_service = True
    
    # 명령줄 인수가 있으면 지정된 예제만 실행
    if args.direct or args.service:
        run_direct = args.direct
        run_service = args.service
    
    success = True
    
    try:
        # 직접 사용 예제
        if run_direct:
            if not example_telegram_direct():
                success = False
        
        # 알림 서비스 예제
        if run_service:
            if not example_notification_service():
                success = False
        
        return 0 if success else 1
        
    except KeyboardInterrupt:
        logger.info("사용자에 의해 프로그램이 중단되었습니다.")
        return 0
    except Exception as e:
        logger.error(f"예제 실행 중 오류 발생: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1


if __name__ == "__main__":
    sys.exit(main()) 