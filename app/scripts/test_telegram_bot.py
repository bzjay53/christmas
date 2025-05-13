#!/usr/bin/env python
# -*- coding: utf-8 -*-

import os
import sys
import json
import logging
import requests
import time
from dotenv import load_dotenv

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[logging.StreamHandler()]
)
logger = logging.getLogger("telegram_bot_test")

# 프로젝트 루트 경로 설정
current_dir = os.path.dirname(os.path.abspath(__file__))
project_root = os.path.abspath(os.path.join(current_dir, "../.."))
sys.path.insert(0, project_root)

# 환경 변수 로드
load_dotenv()

from app.notification.telegram_notifier import TelegramNotifier, TelegramConfig
from app.notification.template_manager import TemplateManager


def test_bot_info():
    """텔레그램 봇 정보 테스트"""
    logger.info("텔레그램 봇 정보 테스트 시작...")
    
    try:
        # 환경 변수에서 봇 토큰 가져오기
        bot_token = os.environ.get("TELEGRAM_BOT_TOKEN")
        
        if not bot_token:
            logger.error("환경 변수에 TELEGRAM_BOT_TOKEN이 설정되지 않았습니다.")
            return False
        
        # API URL 설정
        api_url = f"https://api.telegram.org/bot{bot_token}/getMe"
        
        # 봇 정보 요청
        response = requests.get(api_url, timeout=10)
        
        if response.status_code != 200:
            logger.error(f"봇 정보 요청 실패: {response.status_code} - {response.text}")
            return False
        
        # 응답 파싱
        result = response.json()
        
        if not result.get("ok"):
            logger.error(f"봇 정보 조회 실패: {result.get('description')}")
            return False
        
        # 봇 정보 출력
        bot_info = result.get("result", {})
        bot_name = bot_info.get("username")
        bot_first_name = bot_info.get("first_name")
        bot_id = bot_info.get("id")
        
        logger.info(f"봇 정보 조회 성공:")
        logger.info(f"  - 아이디: {bot_id}")
        logger.info(f"  - 이름: {bot_first_name}")
        logger.info(f"  - 사용자명: @{bot_name}")
        
        # 테스트 성공
        return True
        
    except Exception as e:
        logger.error(f"봇 정보 테스트 중 오류 발생: {str(e)}")
        return False


def test_send_message():
    """메시지 전송 테스트"""
    logger.info("텔레그램 메시지 전송 테스트 시작...")
    
    try:
        # 환경 변수에서 봇 토큰 가져오기
        bot_token = os.environ.get("TELEGRAM_BOT_TOKEN")
        
        if not bot_token:
            logger.error("환경 변수에 TELEGRAM_BOT_TOKEN이 설정되지 않았습니다.")
            return False
        
        # 텔레그램 설정
        config = TelegramConfig(bot_token=bot_token)
        
        # 템플릿 디렉토리 설정
        templates_dir = os.path.join(project_root, "app", "notification", "templates")
        template_manager = TemplateManager(templates_dir)
        
        # 알림 객체 생성
        notifier = TelegramNotifier(config=config, template_manager=template_manager)
        
        # 테스트 메시지 내용
        test_message = (
            "<b>테스트 메시지</b>\n\n"
            "이것은 Christmas 프로젝트 베타 테스트 환경에서 보낸 테스트 메시지입니다.\n"
            f"시간: {time.strftime('%Y-%m-%d %H:%M:%S')}\n"
            "이 메시지가 보이면 텔레그램 봇 연결이 정상적으로 작동하는 것입니다."
        )
        
        # 자신에게 메시지 전송 테스트 (기본적으로 봇은 자신에게 메시지를 보낼 수 없으므로 설정된 관리자 ID 필요)
        admin_chat_id = os.environ.get("TELEGRAM_ADMIN_CHAT_ID")
        
        if not admin_chat_id:
            logger.warning("환경 변수에 TELEGRAM_ADMIN_CHAT_ID가 설정되지 않았습니다.")
            logger.warning("테스트 메시지 전송을 건너뜁니다.")
            return True
        
        # 메시지 전송
        logger.info(f"관리자 채팅 ID {admin_chat_id}로 테스트 메시지 전송 시도...")
        response = notifier.send_message(admin_chat_id, test_message)
        
        if not response:
            logger.error("메시지 전송 실패")
            return False
        
        logger.info("메시지 전송 성공")
        
        # 테스트 성공
        return True
        
    except Exception as e:
        logger.error(f"메시지 전송 테스트 중 오류 발생: {str(e)}")
        return False


def test_notification_template():
    """알림 템플릿 테스트"""
    logger.info("알림 템플릿 테스트 시작...")
    
    try:
        # 환경 변수에서 봇 토큰 가져오기
        bot_token = os.environ.get("TELEGRAM_BOT_TOKEN")
        
        if not bot_token:
            logger.error("환경 변수에 TELEGRAM_BOT_TOKEN이 설정되지 않았습니다.")
            return False
        
        # 텔레그램 설정
        config = TelegramConfig(bot_token=bot_token)
        
        # 템플릿 디렉토리 설정
        templates_dir = os.path.join(project_root, "app", "notification", "templates")
        template_manager = TemplateManager(templates_dir)
        
        # 템플릿 목록 확인
        templates = template_manager.list_templates()
        logger.info(f"사용 가능한 템플릿: {templates}")
        
        if not templates:
            logger.warning("사용 가능한 템플릿이 없습니다.")
            return True
        
        # 첫 번째 템플릿 테스트
        template_name = templates[0]
        logger.info(f"템플릿 '{template_name}' 테스트...")
        
        # 테스트 데이터
        test_data = {
            "user": "테스트 사용자",
            "event": "시스템 테스트",
            "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
            "details": "베타 테스트 환경에서 실행된 템플릿 테스트입니다."
        }
        
        # 템플릿 렌더링
        rendered = template_manager.render_template(template_name, test_data)
        logger.info(f"템플릿 렌더링 결과:\n{rendered}")
        
        # 테스트 성공
        return True
        
    except Exception as e:
        logger.error(f"알림 템플릿 테스트 중 오류 발생: {str(e)}")
        return False


if __name__ == "__main__":
    logger.info("텔레그램 봇 테스트 스크립트 실행")
    
    bot_info_test_result = test_bot_info()
    logger.info(f"봇 정보 테스트 결과: {'성공' if bot_info_test_result else '실패'}")
    
    message_test_result = test_send_message()
    logger.info(f"메시지 전송 테스트 결과: {'성공' if message_test_result else '실패'}")
    
    template_test_result = test_notification_template()
    logger.info(f"알림 템플릿 테스트 결과: {'성공' if template_test_result else '실패'}")
    
    if bot_info_test_result and message_test_result and template_test_result:
        logger.info("모든 테스트가 성공적으로 완료되었습니다.")
        sys.exit(0)
    else:
        logger.error("일부 테스트가 실패했습니다.")
        sys.exit(1) 