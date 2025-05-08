"""
Christmas 프로젝트 - 텔레그램 알림 모듈
텔레그램 봇 API를 사용하여 알림을 전송하는 기능 제공
"""

import logging
import json
import time
import requests
from dataclasses import dataclass
from typing import Dict, List, Any, Optional, Union
from pathlib import Path
import os

from app.notification.template_manager import NotificationTemplate, TemplateManager, EventType, TemplateType

logger = logging.getLogger(__name__)


@dataclass
class TelegramConfig:
    """텔레그램 봇 설정"""
    bot_token: str
    api_base_url: str = "https://api.telegram.org/bot"
    timeout: int = 10
    
    @property
    def api_url(self) -> str:
        """텔레그램 API URL"""
        return f"{self.api_base_url}{self.bot_token}"
    
    @classmethod
    def from_dict(cls, config_dict: Dict[str, Any]) -> 'TelegramConfig':
        """딕셔너리에서 설정 객체 생성"""
        return cls(
            bot_token=config_dict["bot_token"],
            api_base_url=config_dict.get("api_base_url", "https://api.telegram.org/bot"),
            timeout=config_dict.get("timeout", 10)
        )
    
    @classmethod
    def from_json(cls, json_path: Union[str, Path]) -> 'TelegramConfig':
        """JSON 파일에서 설정 객체 생성"""
        try:
            with open(json_path, 'r', encoding='utf-8') as file:
                config_dict = json.load(file)
            return cls.from_dict(config_dict)
        except Exception as e:
            logger.error(f"텔레그램 설정 파일 로드 중 오류 발생: {str(e)}")
            raise


class TelegramNotifier:
    """텔레그램 알림 전송 클래스"""
    
    def __init__(
        self, 
        config: TelegramConfig,
        template_manager: Optional[TemplateManager] = None,
        templates_dir: Optional[str] = None
    ):
        """
        텔레그램 알림 전송 객체 초기화
        
        Args:
            config: 텔레그램 봇 설정
            template_manager: 템플릿 관리자 (없으면 생성)
            templates_dir: 템플릿 디렉토리 (template_manager가 None인 경우 사용)
        """
        self.config = config
        
        # 템플릿 관리자 설정
        if template_manager:
            self.template_manager = template_manager
        elif templates_dir:
            self.template_manager = TemplateManager(templates_dir)
        else:
            self.template_manager = TemplateManager()
        
        # 텔레그램 API 헤더
        self.headers = {
            'Content-Type': 'application/json'
        }
        
        # 채팅 ID 캐시
        self.chat_ids = set()
        
        logger.info("텔레그램 알림 모듈 초기화 완료")
        
        # 봇 정보 확인
        self._check_bot_info()
    
    def _check_bot_info(self) -> None:
        """텔레그램 봇 정보 확인"""
        try:
            url = f"{self.config.api_url}/getMe"
            response = requests.get(url, timeout=self.config.timeout)
            
            if response.status_code == 200:
                result = response.json()
                if result.get("ok"):
                    bot_info = result.get("result", {})
                    bot_name = bot_info.get("username")
                    logger.info(f"텔레그램 봇 연결 성공: {bot_name}")
                else:
                    logger.warning(f"텔레그램 봇 정보 조회 실패: {result.get('description')}")
            else:
                logger.error(f"텔레그램 API 응답 오류: {response.status_code} - {response.text}")
                
        except Exception as e:
            logger.error(f"텔레그램 봇 정보 확인 중 오류 발생: {str(e)}")
    
    def add_chat_id(self, chat_id: Union[int, str]) -> None:
        """
        알림을 보낼 채팅 ID 추가
        
        Args:
            chat_id: 추가할 채팅 ID
        """
        self.chat_ids.add(str(chat_id))
        logger.debug(f"채팅 ID 추가됨: {chat_id}")
    
    def remove_chat_id(self, chat_id: Union[int, str]) -> None:
        """
        알림을 보낼 채팅 ID 제거
        
        Args:
            chat_id: 제거할 채팅 ID
        """
        chat_id_str = str(chat_id)
        if chat_id_str in self.chat_ids:
            self.chat_ids.remove(chat_id_str)
            logger.debug(f"채팅 ID 제거됨: {chat_id}")
    
    def send_message(
        self, 
        chat_id: Union[int, str], 
        text: str,
        parse_mode: Optional[str] = "HTML",
        disable_web_page_preview: bool = True
    ) -> bool:
        """
        텔레그램 메시지 전송
        
        Args:
            chat_id: 수신자 채팅 ID
            text: 전송할 텍스트
            parse_mode: 텍스트 파싱 모드 ("HTML" 또는 "Markdown")
            disable_web_page_preview: 웹 페이지 미리보기 비활성화 여부
            
        Returns:
            전송 성공 여부
        """
        try:
            url = f"{self.config.api_url}/sendMessage"
            
            data = {
                "chat_id": chat_id,
                "text": text,
                "parse_mode": parse_mode,
                "disable_web_page_preview": disable_web_page_preview
            }
            
            response = requests.post(
                url, 
                headers=self.headers, 
                json=data,
                timeout=self.config.timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                if result.get("ok"):
                    logger.info(f"텔레그램 메시지 전송 성공: chat_id={chat_id}")
                    return True
                else:
                    logger.warning(f"텔레그램 메시지 전송 실패: {result.get('description')}")
                    return False
            else:
                logger.error(f"텔레그램 API 응답 오류: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"텔레그램 메시지 전송 중 오류 발생: {str(e)}")
            return False
    
    def send_message_to_all(
        self, 
        text: str,
        parse_mode: Optional[str] = "HTML",
        disable_web_page_preview: bool = True
    ) -> Dict[str, bool]:
        """
        모든 등록된 채팅에 메시지 전송
        
        Args:
            text: 전송할 텍스트
            parse_mode: 텍스트 파싱 모드 ("HTML" 또는 "Markdown")
            disable_web_page_preview: 웹 페이지 미리보기 비활성화 여부
            
        Returns:
            채팅 ID별 전송 결과를 담은 사전
        """
        results = {}
        
        if not self.chat_ids:
            logger.warning("등록된 채팅 ID가 없습니다.")
            return results
        
        for chat_id in self.chat_ids:
            success = self.send_message(
                chat_id=chat_id,
                text=text,
                parse_mode=parse_mode,
                disable_web_page_preview=disable_web_page_preview
            )
            results[chat_id] = success
        
        # 결과 요약
        success_count = sum(1 for result in results.values() if result)
        logger.info(f"텔레그램 일괄 메시지 전송 완료: {success_count}/{len(self.chat_ids)}개 성공")
        
        return results
    
    def send_template_message(
        self,
        chat_id: Union[int, str],
        template_id: str,
        context: Dict[str, Any],
        parse_mode: Optional[str] = "HTML"
    ) -> bool:
        """
        템플릿 기반 텔레그램 메시지 전송
        
        Args:
            chat_id: 수신자 채팅 ID
            template_id: 템플릿 ID
            context: 템플릿 컨텍스트
            parse_mode: 텍스트 파싱 모드 ("HTML" 또는 "Markdown")
            
        Returns:
            전송 성공 여부
        """
        # 템플릿 렌더링
        rendered = self.template_manager.render_template(template_id, context)
        if not rendered:
            logger.error(f"템플릿을 찾을 수 없거나 렌더링할 수 없음: {template_id}")
            return False
        
        # HTML 본문이 있으면 사용, 없으면 일반 텍스트 사용
        message_text = rendered.get("html_body") or rendered.get("body")
        
        # 제목을 본문 앞에 추가
        message_text = f"<b>{rendered['subject']}</b>\n\n{message_text}" if parse_mode == "HTML" else f"*{rendered['subject']}*\n\n{message_text}"
        
        # 메시지 전송
        return self.send_message(
            chat_id=chat_id,
            text=message_text,
            parse_mode=parse_mode
        )
    
    def send_template_to_all(
        self,
        template_id: str,
        context: Dict[str, Any],
        parse_mode: Optional[str] = "HTML"
    ) -> Dict[str, bool]:
        """
        모든 등록된 채팅에 템플릿 기반 메시지 전송
        
        Args:
            template_id: 템플릿 ID
            context: 템플릿 컨텍스트
            parse_mode: 텍스트 파싱 모드 ("HTML" 또는 "Markdown")
            
        Returns:
            채팅 ID별 전송 결과를 담은 사전
        """
        results = {}
        
        if not self.chat_ids:
            logger.warning("등록된 채팅 ID가 없습니다.")
            return results
        
        # 템플릿 렌더링
        rendered = self.template_manager.render_template(template_id, context)
        if not rendered:
            logger.error(f"템플릿을 찾을 수 없거나 렌더링할 수 없음: {template_id}")
            return {chat_id: False for chat_id in self.chat_ids}
        
        # HTML 본문이 있으면 사용, 없으면 일반 텍스트 사용
        message_text = rendered.get("html_body") or rendered.get("body")
        
        # 제목을 본문 앞에 추가
        message_text = f"<b>{rendered['subject']}</b>\n\n{message_text}" if parse_mode == "HTML" else f"*{rendered['subject']}*\n\n{message_text}"
        
        # 모든 채팅에 전송
        for chat_id in self.chat_ids:
            success = self.send_message(
                chat_id=chat_id,
                text=message_text,
                parse_mode=parse_mode
            )
            results[chat_id] = success
        
        # 결과 요약
        success_count = sum(1 for result in results.values() if result)
        logger.info(f"텔레그램 일괄 템플릿 메시지 전송 완료: {success_count}/{len(self.chat_ids)}개 성공")
        
        return results
    
    def send_event_notification(
        self,
        chat_id: Union[int, str],
        event_type: EventType,
        context: Dict[str, Any],
        parse_mode: Optional[str] = "HTML"
    ) -> bool:
        """
        이벤트 기반 텔레그램 알림 전송
        
        Args:
            chat_id: 수신자 채팅 ID
            event_type: 이벤트 유형
            context: 템플릿 컨텍스트
            parse_mode: 텍스트 파싱 모드 ("HTML" 또는 "Markdown")
            
        Returns:
            전송 성공 여부
        """
        # 이벤트 유형에 맞는 템플릿 찾기
        templates = self.template_manager.get_templates_by_event(event_type)
        
        # 텔레그램용 템플릿이 있으면 사용
        telegram_templates = [t for t in templates if hasattr(t, 'telegram_template') and t.telegram_template]
        
        # 없으면 이메일 템플릿 중 HTML이 있는 것 사용
        if not telegram_templates:
            email_templates = [t for t in templates if t.template_type.name == "EMAIL" and t.html_body]
            if email_templates:
                template = email_templates[0]
            else:
                # 기본 텍스트 템플릿 사용
                template = next((t for t in templates), None)
        else:
            template = telegram_templates[0]
        
        if not template:
            logger.warning(f"이벤트 {event_type.name}에 대한 적절한 템플릿을 찾을 수 없음")
            
            # 기본 메시지 생성
            event_name = event_type.name.replace('_', ' ').title()
            text = f"<b>{event_name} 알림</b>\n\n"
            
            # 컨텍스트 정보 추가
            for key, value in context.items():
                text += f"<b>{key}:</b> {value}\n"
                
            return self.send_message(chat_id=chat_id, text=text, parse_mode=parse_mode)
        
        # 템플릿 기반 메시지 전송
        return self.send_template_message(
            chat_id=chat_id,
            template_id=template.id,
            context=context,
            parse_mode=parse_mode
        )
    
    def send_event_to_all(
        self,
        event_type: EventType,
        context: Dict[str, Any],
        parse_mode: Optional[str] = "HTML"
    ) -> Dict[str, bool]:
        """
        모든 등록된 채팅에 이벤트 기반 알림 전송
        
        Args:
            event_type: 이벤트 유형
            context: 템플릿 컨텍스트
            parse_mode: 텍스트 파싱 모드 ("HTML" 또는 "Markdown")
            
        Returns:
            채팅 ID별 전송 결과를 담은 사전
        """
        results = {}
        
        if not self.chat_ids:
            logger.warning("등록된 채팅 ID가 없습니다.")
            return results
        
        # 이벤트 유형에 맞는 템플릿 찾기 및 메시지 생성 로직은 모든 채팅에 동일하게 적용
        # 이벤트 유형에 맞는 템플릿 찾기
        templates = self.template_manager.get_templates_by_event(event_type)
        
        # 텔레그램용 템플릿이 있으면 사용
        telegram_templates = [t for t in templates if hasattr(t, 'telegram_template') and t.telegram_template]
        
        # 없으면 이메일 템플릿 중 HTML이 있는 것 사용
        if not telegram_templates:
            email_templates = [t for t in templates if t.template_type.name == "EMAIL" and t.html_body]
            if email_templates:
                template = email_templates[0]
            else:
                # 기본 텍스트 템플릿 사용
                template = next((t for t in templates), None)
        else:
            template = telegram_templates[0]
        
        if not template:
            logger.warning(f"이벤트 {event_type.name}에 대한 적절한 템플릿을 찾을 수 없음")
            
            # 기본 메시지 생성
            event_name = event_type.name.replace('_', ' ').title()
            text = f"<b>{event_name} 알림</b>\n\n"
            
            # 컨텍스트 정보 추가
            for key, value in context.items():
                text += f"<b>{key}:</b> {value}\n"
                
            # 모든 채팅에 메시지 전송
            for chat_id in self.chat_ids:
                success = self.send_message(
                    chat_id=chat_id,
                    text=text,
                    parse_mode=parse_mode
                )
                results[chat_id] = success
        else:
            # 템플릿 기반 메시지 생성 및 전송
            rendered = self.template_manager.render_template(template.id, context)
            if rendered:
                # HTML 본문이 있으면 사용, 없으면 일반 텍스트 사용
                message_text = rendered.get("html_body") or rendered.get("body")
                
                # 제목을 본문 앞에 추가
                message_text = f"<b>{rendered['subject']}</b>\n\n{message_text}" if parse_mode == "HTML" else f"*{rendered['subject']}*\n\n{message_text}"
                
                # 모든 채팅에 메시지 전송
                for chat_id in self.chat_ids:
                    success = self.send_message(
                        chat_id=chat_id,
                        text=message_text,
                        parse_mode=parse_mode
                    )
                    results[chat_id] = success
            else:
                logger.error(f"템플릿 렌더링 실패: {template.id}")
                results = {chat_id: False for chat_id in self.chat_ids}
        
        # 결과 요약
        success_count = sum(1 for result in results.values() if result)
        logger.info(f"텔레그램 일괄 이벤트 알림 전송 완료: {success_count}/{len(self.chat_ids)}개 성공")
        
        return results 