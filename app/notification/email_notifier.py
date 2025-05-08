"""
Christmas 프로젝트 - 이메일 알림 모듈
SMTP 프로토콜을 사용하여 이메일 알림을 전송하는 기능 제공
"""

import smtplib
import logging
import ssl
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from dataclasses import dataclass
from typing import Dict, List, Any, Optional, Union
from pathlib import Path
import os
import json

from app.notification.template_manager import NotificationTemplate, TemplateManager, EventType

logger = logging.getLogger(__name__)


@dataclass
class EmailConfig:
    """이메일 서버 설정"""
    smtp_server: str
    smtp_port: int
    sender_email: str
    sender_password: str
    sender_name: Optional[str] = None
    use_ssl: bool = True
    use_tls: bool = False
    timeout: int = 30
    
    @classmethod
    def from_dict(cls, config_dict: Dict[str, Any]) -> 'EmailConfig':
        """딕셔너리에서 설정 객체 생성"""
        return cls(
            smtp_server=config_dict["smtp_server"],
            smtp_port=config_dict["smtp_port"],
            sender_email=config_dict["sender_email"],
            sender_password=config_dict["sender_password"],
            sender_name=config_dict.get("sender_name"),
            use_ssl=config_dict.get("use_ssl", True),
            use_tls=config_dict.get("use_tls", False),
            timeout=config_dict.get("timeout", 30)
        )
    
    @classmethod
    def from_json(cls, json_path: Union[str, Path]) -> 'EmailConfig':
        """JSON 파일에서 설정 객체 생성"""
        try:
            with open(json_path, 'r', encoding='utf-8') as file:
                config_dict = json.load(file)
            return cls.from_dict(config_dict)
        except Exception as e:
            logger.error(f"이메일 설정 파일 로드 중 오류 발생: {str(e)}")
            raise


class EmailNotifier:
    """이메일 알림 전송 클래스"""
    
    def __init__(
        self, 
        config: EmailConfig,
        template_manager: Optional[TemplateManager] = None,
        templates_dir: Optional[str] = None
    ):
        """
        이메일 알림 전송 객체 초기화
        
        Args:
            config: 이메일 서버 설정
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
            # 템플릿 관리자 기본 인스턴스 생성
            self.template_manager = TemplateManager()
        
        logger.info(f"이메일 알림 모듈 초기화: {config.smtp_server}:{config.smtp_port}")
    
    def _create_smtp_connection(self) -> Union[smtplib.SMTP, smtplib.SMTP_SSL]:
        """SMTP 서버 연결 생성"""
        context = ssl.create_default_context()
        
        if self.config.use_ssl:
            server = smtplib.SMTP_SSL(
                self.config.smtp_server, 
                self.config.smtp_port, 
                timeout=self.config.timeout,
                context=context
            )
        else:
            server = smtplib.SMTP(
                self.config.smtp_server, 
                self.config.smtp_port,
                timeout=self.config.timeout
            )
            
            if self.config.use_tls:
                server.starttls(context=context)
        
        server.login(self.config.sender_email, self.config.sender_password)
        return server
    
    def send_email(
        self, 
        recipient_email: str, 
        subject: str, 
        text_content: str, 
        html_content: Optional[str] = None,
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None
    ) -> bool:
        """
        이메일 전송
        
        Args:
            recipient_email: 수신자 이메일 주소
            subject: 이메일 제목
            text_content: 일반 텍스트 본문
            html_content: HTML 본문 (선택 사항)
            cc: 참조 수신자 목록 (선택 사항)
            bcc: 숨은 참조 수신자 목록 (선택 사항)
            
        Returns:
            전송 성공 여부
        """
        try:
            # 메시지 생성
            message = MIMEMultipart("alternative")
            message["Subject"] = subject
            message["From"] = f"{self.config.sender_name} <{self.config.sender_email}>" \
                if self.config.sender_name else self.config.sender_email
            message["To"] = recipient_email
            
            # CC, BCC 추가
            if cc:
                message["Cc"] = ", ".join(cc)
            if bcc:
                message["Bcc"] = ", ".join(bcc)
            
            # 본문 추가
            part1 = MIMEText(text_content, "plain", "utf-8")
            message.attach(part1)
            
            # HTML 본문이 있는 경우 추가
            if html_content:
                part2 = MIMEText(html_content, "html", "utf-8")
                message.attach(part2)
            
            # 모든 수신자 목록 생성
            recipients = [recipient_email]
            if cc:
                recipients.extend(cc)
            if bcc:
                recipients.extend(bcc)
            
            # SMTP 서버에 연결하여 메시지 전송
            with self._create_smtp_connection() as server:
                server.sendmail(self.config.sender_email, recipients, message.as_string())
            
            logger.info(f"이메일 전송 성공: {subject} -> {recipient_email}")
            return True
            
        except Exception as e:
            logger.error(f"이메일 전송 실패: {str(e)}")
            return False
    
    def send_template_email(
        self, 
        recipient_email: str, 
        template_id: str, 
        context: Dict[str, Any],
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None
    ) -> bool:
        """
        템플릿 기반 이메일 전송
        
        Args:
            recipient_email: 수신자 이메일 주소
            template_id: 템플릿 ID
            context: 템플릿 컨텍스트
            cc: 참조 수신자 목록 (선택 사항)
            bcc: 숨은 참조 수신자 목록 (선택 사항)
            
        Returns:
            전송 성공 여부
        """
        # 템플릿 렌더링
        rendered = self.template_manager.render_template(template_id, context)
        if not rendered:
            logger.error(f"템플릿을 찾을 수 없거나 렌더링할 수 없음: {template_id}")
            return False
        
        # 이메일 전송
        return self.send_email(
            recipient_email=recipient_email,
            subject=rendered["subject"],
            text_content=rendered["body"],
            html_content=rendered.get("html_body"),
            cc=cc,
            bcc=bcc
        )
    
    def send_event_notification(
        self, 
        recipient_email: str, 
        event_type: EventType, 
        context: Dict[str, Any],
        cc: Optional[List[str]] = None,
        bcc: Optional[List[str]] = None
    ) -> bool:
        """
        이벤트 기반 알림 전송
        
        Args:
            recipient_email: 수신자 이메일 주소
            event_type: 이벤트 유형
            context: 템플릿 컨텍스트
            cc: 참조 수신자 목록 (선택 사항)
            bcc: 숨은 참조 수신자 목록 (선택 사항)
            
        Returns:
            전송 성공 여부
        """
        # 이벤트 유형에 맞는 이메일 템플릿 찾기
        email_templates = self.template_manager.get_templates_by_event(event_type)
        email_templates = [t for t in email_templates if t.template_type.name == "EMAIL"]
        
        if not email_templates:
            logger.warning(f"이벤트 {event_type.name}에 대한 이메일 템플릿을 찾을 수 없음")
            return False
        
        # 첫 번째 템플릿 사용
        template = email_templates[0]
        
        # 템플릿 기반 이메일 전송
        return self.send_template_email(
            recipient_email=recipient_email,
            template_id=template.id,
            context=context,
            cc=cc,
            bcc=bcc
        )
    
    def send_batch_emails(
        self, 
        recipients: List[str], 
        template_id: str, 
        contexts: Optional[List[Dict[str, Any]]] = None,
        common_context: Optional[Dict[str, Any]] = None
    ) -> Dict[str, bool]:
        """
        일괄 이메일 전송
        
        Args:
            recipients: 수신자 이메일 주소 목록
            template_id: 템플릿 ID
            contexts: 수신자별 컨텍스트 목록 (None이면 common_context 사용)
            common_context: 모든 수신자에게 공통 적용되는 컨텍스트
            
        Returns:
            수신자별 전송 결과를 담은 사전
        """
        results = {}
        common_context = common_context or {}
        
        for i, recipient in enumerate(recipients):
            # 컨텍스트 생성
            if contexts and i < len(contexts):
                # 개별 컨텍스트와 공통 컨텍스트 병합
                context = {**common_context, **contexts[i]}
            else:
                context = common_context
            
            # 이메일 전송
            success = self.send_template_email(recipient, template_id, context)
            results[recipient] = success
        
        # 전송 결과 요약
        success_count = sum(1 for result in results.values() if result)
        logger.info(f"일괄 이메일 전송 완료: {success_count}/{len(recipients)}개 성공")
        
        return results 