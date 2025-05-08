#!/usr/bin/env python
"""
Christmas 프로젝트 - 텔레그램 봇 모듈
텔레그램 봇을 통해 알림을 전송하고 명령을 처리하는 기능 제공
"""

import os
import sys
import logging
import json
import time
import threading
import signal
import asyncio
from typing import Dict, List, Any, Optional, Union, Set, Callable
from pathlib import Path
import traceback

import requests
from telegram import Update, Bot, ParseMode
from telegram.ext import (
    Updater, CommandHandler, MessageHandler, CallbackContext,
    Filters, ConversationHandler, CallbackQueryHandler
)

# 프로젝트 루트 경로 추가
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../../')))

from app.notification.telegram_notifier import TelegramNotifier, TelegramConfig
from app.notification.template_manager import TemplateManager, EventType
from app.notification.notification_service import NotificationService, NotificationChannel, NotificationPriority

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# 대화 상태 정의
START, REGISTER, UNREGISTER = range(3)

class TelegramBotService:
    """텔레그램 봇 서비스"""
    
    def __init__(self, config_path: Optional[str] = None):
        """
        텔레그램 봇 서비스 초기화
        
        Args:
            config_path: 알림 설정 JSON 파일 경로
        """
        self.config_path = config_path or os.path.join(
            os.path.dirname(__file__), 'config', 'notification_config.json'
        )
        
        # 설정 로드
        self.config = self._load_config()
        
        # 봇 토큰 가져오기 (환경변수 또는 설정 파일)
        self.bot_token = os.environ.get('TELEGRAM_BOT_TOKEN', self.config.get('telegram', {}).get('bot_token', ''))
        
        if not self.bot_token:
            logger.error("텔레그램 봇 토큰이 설정되지 않았습니다.")
            raise ValueError("텔레그램 봇 토큰이 필요합니다.")
        
        # 텔레그램 설정
        self.telegram_config = TelegramConfig(bot_token=self.bot_token)
        
        # 템플릿 관리자
        template_dir = os.path.join(os.path.dirname(__file__), 'templates')
        self.template_manager = TemplateManager(template_dir)
        
        # 텔레그램 알림 전송 객체
        self.telegram_notifier = TelegramNotifier(
            config=self.telegram_config,
            template_manager=self.template_manager
        )
        
        # 허용된 사용자 목록 (빈 리스트면 모든 사용자 허용)
        self.allowed_users = self.config.get('telegram', {}).get('allowed_users', [])
        
        # 등록된 채팅 ID
        self.load_registered_chats()
        
        # 텔레그램 updater 및 dispatcher
        self.updater = Updater(self.bot_token, use_context=True)
        self.dispatcher = self.updater.dispatcher
        
        # 명령 핸들러 등록
        self._register_handlers()
        
        # 종료 시그널 핸들러
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
        logger.info("텔레그램 봇 서비스 초기화 완료")
    
    def _load_config(self) -> Dict[str, Any]:
        """알림 설정 로드"""
        default_config = {
            "telegram": {
                "enabled": True,
                "bot_token": "",
                "allowed_users": [],
                "admin_users": []
            }
        }
        
        try:
            with open(self.config_path, 'r', encoding='utf-8') as file:
                config = json.load(file)
                
            # telegram 섹션이 없으면 기본값 추가
            if 'telegram' not in config:
                config['telegram'] = default_config['telegram']
                
            return config
            
        except Exception as e:
            logger.error(f"설정 파일 로드 중 오류 발생: {str(e)}. 기본 설정을 사용합니다.")
            return default_config
    
    def _register_handlers(self) -> None:
        """명령 핸들러 등록"""
        # 명령 핸들러
        self.dispatcher.add_handler(CommandHandler("start", self.cmd_start))
        self.dispatcher.add_handler(CommandHandler("help", self.cmd_help))
        self.dispatcher.add_handler(CommandHandler("register", self.cmd_register))
        self.dispatcher.add_handler(CommandHandler("unregister", self.cmd_unregister))
        self.dispatcher.add_handler(CommandHandler("status", self.cmd_status))
        
        # 오류 핸들러
        self.dispatcher.add_error_handler(self.error_handler)
        
        # 일반 메시지 핸들러
        self.dispatcher.add_handler(MessageHandler(Filters.text & ~Filters.command, self.handle_message))
    
    def _signal_handler(self, sig, frame) -> None:
        """시그널 핸들러"""
        logger.info("종료 신호를 받았습니다. 텔레그램 봇 종료 중...")
        self.stop()
    
    def is_user_allowed(self, user_id: int) -> bool:
        """사용자 ID 허용 여부 확인"""
        # 허용된 사용자가 없으면 모든 사용자 허용
        if not self.allowed_users:
            return True
        
        # 사용자 ID가 허용 목록에 있는지 확인
        return str(user_id) in self.allowed_users
    
    def load_registered_chats(self) -> None:
        """등록된 채팅 ID 로드"""
        chat_file = os.path.join(os.path.dirname(__file__), 'config', 'telegram_chats.json')
        
        try:
            if os.path.exists(chat_file):
                with open(chat_file, 'r', encoding='utf-8') as file:
                    chat_data = json.load(file)
                    chat_ids = chat_data.get('chat_ids', [])
                    
                    # 채팅 ID를 알림 전송 객체에 등록
                    for chat_id in chat_ids:
                        self.telegram_notifier.add_chat_id(chat_id)
                    
                    logger.info(f"{len(chat_ids)}개의 등록된 채팅 ID를 로드했습니다.")
            else:
                logger.info("등록된 채팅 ID가 없습니다.")
                
        except Exception as e:
            logger.error(f"채팅 ID 로드 중 오류 발생: {str(e)}")
    
    def save_registered_chats(self) -> None:
        """등록된 채팅 ID 저장"""
        chat_file = os.path.join(os.path.dirname(__file__), 'config', 'telegram_chats.json')
        
        try:
            os.makedirs(os.path.dirname(chat_file), exist_ok=True)
            
            with open(chat_file, 'w', encoding='utf-8') as file:
                chat_data = {
                    'chat_ids': list(self.telegram_notifier.chat_ids)
                }
                json.dump(chat_data, file, indent=2)
                
            logger.info(f"{len(self.telegram_notifier.chat_ids)}개의 채팅 ID를 저장했습니다.")
                
        except Exception as e:
            logger.error(f"채팅 ID 저장 중 오류 발생: {str(e)}")
    
    def start(self) -> None:
        """봇 서비스 시작"""
        logger.info("텔레그램 봇 서비스 시작 중...")
        self.updater.start_polling()
        self.updater.idle()
    
    def stop(self) -> None:
        """봇 서비스 중지"""
        logger.info("텔레그램 봇 서비스 중지 중...")
        self.save_registered_chats()
        self.updater.stop()
    
    def cmd_start(self, update: Update, context: CallbackContext) -> None:
        """시작 명령 처리"""
        user = update.effective_user
        chat_id = update.effective_chat.id
        
        # 사용자 검증
        if not self.is_user_allowed(user.id):
            update.message.reply_text(
                f"죄송합니다, {user.first_name}님. 이 봇을 사용할 권한이 없습니다."
            )
            return
        
        update.message.reply_text(
            f"안녕하세요, {user.first_name}님! Christmas 트레이딩 봇입니다.\n\n"
            "이 봇은 자동 매매 시스템의 알림을 전송합니다.\n"
            "알림을 받으려면 /register 명령을 사용하세요.\n"
            "사용 가능한 명령 목록을 확인하려면 /help 명령을 사용하세요."
        )
    
    def cmd_help(self, update: Update, context: CallbackContext) -> None:
        """도움말 명령 처리"""
        user = update.effective_user
        
        # 사용자 검증
        if not self.is_user_allowed(user.id):
            update.message.reply_text(
                f"죄송합니다, {user.first_name}님. 이 봇을 사용할 권한이 없습니다."
            )
            return
        
        update.message.reply_text(
            "다음 명령을 사용할 수 있습니다:\n\n"
            "/start - 봇 시작 및 소개\n"
            "/help - 이 도움말 표시\n"
            "/register - 알림 받기 등록\n"
            "/unregister - 알림 받기 해제\n"
            "/status - 현재 상태 확인"
        )
    
    def cmd_register(self, update: Update, context: CallbackContext) -> None:
        """알림 등록 명령 처리"""
        user = update.effective_user
        chat_id = update.effective_chat.id
        
        # 사용자 검증
        if not self.is_user_allowed(user.id):
            update.message.reply_text(
                f"죄송합니다, {user.first_name}님. 이 봇을 사용할 권한이 없습니다."
            )
            return
        
        # 채팅 ID 등록
        self.telegram_notifier.add_chat_id(chat_id)
        self.save_registered_chats()
        
        update.message.reply_text(
            f"{user.first_name}님, 알림 수신이 등록되었습니다.\n"
            "이제 자동 매매 시스템의 알림을 받을 수 있습니다."
        )
    
    def cmd_unregister(self, update: Update, context: CallbackContext) -> None:
        """알림 해제 명령 처리"""
        user = update.effective_user
        chat_id = update.effective_chat.id
        
        # 사용자 검증
        if not self.is_user_allowed(user.id):
            update.message.reply_text(
                f"죄송합니다, {user.first_name}님. 이 봇을 사용할 권한이 없습니다."
            )
            return
        
        # 채팅 ID 제거
        self.telegram_notifier.remove_chat_id(chat_id)
        self.save_registered_chats()
        
        update.message.reply_text(
            f"{user.first_name}님, 알림 수신이 해제되었습니다.\n"
            "더 이상 자동 매매 시스템의 알림을 받지 않습니다."
        )
    
    def cmd_status(self, update: Update, context: CallbackContext) -> None:
        """상태 확인 명령 처리"""
        user = update.effective_user
        chat_id = update.effective_chat.id
        
        # 사용자 검증
        if not self.is_user_allowed(user.id):
            update.message.reply_text(
                f"죄송합니다, {user.first_name}님. 이 봇을 사용할 권한이 없습니다."
            )
            return
        
        # 현재 등록 상태 확인
        is_registered = str(chat_id) in self.telegram_notifier.chat_ids
        
        status_text = (
            f"<b>Christmas 트레이딩 봇 상태</b>\n\n"
            f"사용자: {user.first_name} (ID: {user.id})\n"
            f"알림 등록 상태: {'등록됨' if is_registered else '미등록'}\n"
            f"등록된 채팅 수: {len(self.telegram_notifier.chat_ids)}개\n\n"
        )
        
        update.message.reply_text(status_text, parse_mode=ParseMode.HTML)
    
    def handle_message(self, update: Update, context: CallbackContext) -> None:
        """일반 메시지 처리"""
        user = update.effective_user
        
        # 사용자 검증
        if not self.is_user_allowed(user.id):
            return
        
        # 메시지 내용
        message_text = update.message.text
        
        # 간단한 응답
        update.message.reply_text(
            f"{user.first_name}님, 명령을 사용하려면 / 문자로 시작하는 명령어를 입력하세요.\n"
            "사용 가능한 명령 목록을 확인하려면 /help를 입력하세요."
        )
    
    def error_handler(self, update: Update, context: CallbackContext) -> None:
        """오류 핸들러"""
        logger.error(f"봇 오류 발생: {context.error}")
        
        # 오류 추적 정보
        tb_list = traceback.format_exception(None, context.error, context.error.__traceback__)
        tb_string = ''.join(tb_list)
        logger.error(f"상세 오류 내용:\n{tb_string}")
        
        # 관리자에게만 오류 정보 전송
        admin_users = self.config.get('telegram', {}).get('admin_users', [])
        if admin_users:
            error_message = (
                f"<b>봇 오류 발생</b>\n\n"
                f"오류: {context.error}\n"
                f"시간: {time.strftime('%Y-%m-%d %H:%M:%S')}"
            )
            
            for admin_id in admin_users:
                try:
                    self.telegram_notifier.send_message(admin_id, error_message)
                except Exception as e:
                    logger.error(f"관리자에게 오류 알림 전송 실패: {str(e)}")
        
        # 사용자에게는 간단한 오류 메시지만 전송
        if update and update.effective_chat:
            try:
                update.effective_message.reply_text(
                    "죄송합니다. 명령을 처리하는 중 오류가 발생했습니다."
                )
            except Exception:
                pass


def send_test_notification(bot_service: TelegramBotService) -> None:
    """테스트 알림 전송"""
    try:
        logger.info("테스트 알림 전송 중...")
        
        # 테스트 메시지
        test_message = (
            "<b>Christmas 트레이딩 봇 테스트</b>\n\n"
            "이것은 테스트 메시지입니다.\n"
            "알림 시스템이 정상적으로 작동하고 있습니다."
        )
        
        # 모든 등록된 채팅에 전송
        results = bot_service.telegram_notifier.send_message_to_all(test_message)
        
        if results:
            logger.info(f"테스트 알림 전송 완료: {sum(results.values())}개 성공, {len(results) - sum(results.values())}개 실패")
        else:
            logger.warning("등록된 채팅이 없어 테스트 알림을 전송할 수 없습니다.")
            
    except Exception as e:
        logger.error(f"테스트 알림 전송 중 오류 발생: {str(e)}")


def main():
    """메인 함수"""
    try:
        # 환경변수 확인
        env = os.environ.get('CHRISTMAS_ENV', 'development')
        logger.info(f"환경: {env}")
        
        # 설정 파일 경로
        config_dir = os.path.join(os.path.dirname(__file__), 'config')
        config_path = os.path.join(config_dir, 'notification_config.json')
        
        # 봇 서비스 생성
        bot_service = TelegramBotService(config_path)
        
        # 서비스 시작
        if len(sys.argv) > 1 and sys.argv[1] == '--test':
            # 테스트 모드
            send_test_notification(bot_service)
        else:
            # 일반 실행
            bot_service.start()
            
    except KeyboardInterrupt:
        logger.info("사용자에 의해 프로그램이 중단되었습니다.")
    except Exception as e:
        logger.error(f"프로그램 실행 중 오류 발생: {str(e)}")
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main() 