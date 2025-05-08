"""
Christmas 프로젝트 - 모바일 푸시 알림 모듈
FCM(Firebase Cloud Messaging)을 사용하여 모바일 푸시 알림을 전송하는 기능 제공
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
class FCMConfig:
    """Firebase Cloud Messaging 설정"""
    server_key: str
    api_url: str = "https://fcm.googleapis.com/fcm/send"
    timeout: int = 10
    
    @classmethod
    def from_dict(cls, config_dict: Dict[str, Any]) -> 'FCMConfig':
        """딕셔너리에서 설정 객체 생성"""
        return cls(
            server_key=config_dict["server_key"],
            api_url=config_dict.get("api_url", "https://fcm.googleapis.com/fcm/send"),
            timeout=config_dict.get("timeout", 10)
        )
    
    @classmethod
    def from_json(cls, json_path: Union[str, Path]) -> 'FCMConfig':
        """JSON 파일에서 설정 객체 생성"""
        try:
            with open(json_path, 'r', encoding='utf-8') as file:
                config_dict = json.load(file)
            return cls.from_dict(config_dict)
        except Exception as e:
            logger.error(f"FCM 설정 파일 로드 중 오류 발생: {str(e)}")
            raise


class MobileNotifier:
    """모바일 푸시 알림 전송 클래스"""
    
    def __init__(
        self, 
        config: FCMConfig,
        template_manager: Optional[TemplateManager] = None,
        templates_dir: Optional[str] = None
    ):
        """
        모바일 알림 전송 객체 초기화
        
        Args:
            config: FCM 설정
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
        
        # FCM 요청 헤더
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': f'key={config.server_key}'
        }
        
        logger.info("모바일 푸시 알림 모듈 초기화 완료")
    
    def send_push_notification(
        self,
        token: str,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
        notification_options: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        단일 기기로 푸시 알림 전송
        
        Args:
            token: 수신 기기의 FCM 토큰
            title: 알림 제목
            body: 알림 본문
            data: 추가 데이터 (선택 사항)
            notification_options: 추가 알림 옵션 (선택 사항)
            
        Returns:
            전송 성공 여부
        """
        try:
            # 기본 알림 메시지 구성
            message = {
                "to": token,
                "notification": {
                    "title": title,
                    "body": body,
                    "sound": "default",
                }
            }
            
            # 추가 알림 옵션 적용
            if notification_options:
                message["notification"].update(notification_options)
            
            # 추가 데이터 적용
            if data:
                message["data"] = data
            
            # FCM 서버로 요청 전송
            response = requests.post(
                self.config.api_url, 
                headers=self.headers, 
                json=message,
                timeout=self.config.timeout
            )
            
            # 응답 확인
            if response.status_code == 200:
                result = response.json()
                
                if result.get("success") == 1:
                    logger.info(f"푸시 알림 전송 성공: {title}")
                    return True
                else:
                    logger.warning(f"푸시 알림 전송 실패: {result}")
                    return False
            else:
                logger.error(f"FCM 서버 응답 오류: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"푸시 알림 전송 중 오류 발생: {str(e)}")
            return False
    
    def send_push_to_multiple_devices(
        self,
        tokens: List[str],
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
        notification_options: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        여러 기기로 동일한 푸시 알림 전송
        
        Args:
            tokens: 수신 기기의 FCM 토큰 목록
            title: 알림 제목
            body: 알림 본문
            data: 추가 데이터 (선택 사항)
            notification_options: 추가 알림 옵션 (선택 사항)
            
        Returns:
            전송 결과 (전송 성공 여부, 성공/실패 수)
        """
        try:
            # 기본 알림 메시지 구성
            message = {
                "registration_ids": tokens,
                "notification": {
                    "title": title,
                    "body": body,
                    "sound": "default",
                }
            }
            
            # 추가 알림 옵션 적용
            if notification_options:
                message["notification"].update(notification_options)
            
            # 추가 데이터 적용
            if data:
                message["data"] = data
            
            # FCM 서버로 요청 전송
            response = requests.post(
                self.config.api_url, 
                headers=self.headers, 
                json=message,
                timeout=self.config.timeout
            )
            
            # 응답 확인
            if response.status_code == 200:
                result = response.json()
                success_count = sum(1 for r in result.get("results", []) if "error" not in r)
                failure_count = len(tokens) - success_count
                
                logger.info(f"푸시 알림 일괄 전송 결과: {success_count}개 성공, {failure_count}개 실패")
                
                return {
                    "success": success_count > 0,
                    "total": len(tokens),
                    "success_count": success_count,
                    "failure_count": failure_count,
                    "results": result.get("results", [])
                }
            else:
                logger.error(f"FCM 서버 응답 오류: {response.status_code} - {response.text}")
                return {
                    "success": False,
                    "total": len(tokens),
                    "success_count": 0,
                    "failure_count": len(tokens),
                    "error": response.text
                }
                
        except Exception as e:
            logger.error(f"푸시 알림 일괄 전송 중 오류 발생: {str(e)}")
            return {
                "success": False,
                "total": len(tokens),
                "success_count": 0,
                "failure_count": len(tokens),
                "error": str(e)
            }
    
    def send_template_notification(
        self,
        token: str,
        template_id: str,
        context: Dict[str, Any],
        data: Optional[Dict[str, Any]] = None,
        notification_options: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        템플릿 기반 푸시 알림 전송
        
        Args:
            token: 수신 기기의 FCM 토큰
            template_id: 템플릿 ID
            context: 템플릿 컨텍스트
            data: 추가 데이터 (선택 사항)
            notification_options: 추가 알림 옵션 (선택 사항)
            
        Returns:
            전송 성공 여부
        """
        # 템플릿 렌더링
        rendered = self.template_manager.render_template(template_id, context)
        if not rendered:
            logger.error(f"템플릿을 찾을 수 없거나 렌더링할 수 없음: {template_id}")
            return False
        
        # 렌더링된 템플릿으로 알림 전송
        return self.send_push_notification(
            token=token,
            title=rendered["subject"],
            body=rendered["body"],
            data=data,
            notification_options=notification_options
        )
    
    def send_event_notification(
        self,
        token: str,
        event_type: EventType,
        context: Dict[str, Any],
        data: Optional[Dict[str, Any]] = None,
        notification_options: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        이벤트 기반 푸시 알림 전송
        
        Args:
            token: 수신 기기의 FCM 토큰
            event_type: 이벤트 유형
            context: 템플릿 컨텍스트
            data: 추가 데이터 (선택 사항)
            notification_options: 추가 알림 옵션 (선택 사항)
            
        Returns:
            전송 성공 여부
        """
        # 이벤트 유형에 맞는 푸시 템플릿 찾기
        push_templates = self.template_manager.get_templates_by_event(event_type)
        push_templates = [t for t in push_templates if t.template_type == TemplateType.PUSH]
        
        if not push_templates:
            logger.warning(f"이벤트 {event_type.name}에 대한 푸시 템플릿을 찾을 수 없음")
            return False
        
        # 첫 번째 템플릿 사용
        template = push_templates[0]
        
        # 템플릿 기반 푸시 알림 전송
        return self.send_template_notification(
            token=token,
            template_id=template.id,
            context=context,
            data=data,
            notification_options=notification_options
        )
    
    def send_topic_notification(
        self,
        topic: str,
        title: str,
        body: str,
        data: Optional[Dict[str, Any]] = None,
        notification_options: Optional[Dict[str, Any]] = None
    ) -> bool:
        """
        토픽 기반 푸시 알림 전송 (구독 중인 모든 기기에 전송)
        
        Args:
            topic: 알림 토픽 이름
            title: 알림 제목
            body: 알림 본문
            data: 추가 데이터 (선택 사항)
            notification_options: 추가 알림 옵션 (선택 사항)
            
        Returns:
            전송 성공 여부
        """
        try:
            # 기본 알림 메시지 구성
            message = {
                "to": f"/topics/{topic}",
                "notification": {
                    "title": title,
                    "body": body,
                    "sound": "default",
                }
            }
            
            # 추가 알림 옵션 적용
            if notification_options:
                message["notification"].update(notification_options)
            
            # 추가 데이터 적용
            if data:
                message["data"] = data
            
            # FCM 서버로 요청 전송
            response = requests.post(
                self.config.api_url, 
                headers=self.headers, 
                json=message,
                timeout=self.config.timeout
            )
            
            # 응답 확인
            if response.status_code == 200:
                result = response.json()
                
                if result.get("message_id"):
                    logger.info(f"토픽 푸시 알림 전송 성공: {topic} - {title}")
                    return True
                else:
                    logger.warning(f"토픽 푸시 알림 전송 실패: {result}")
                    return False
            else:
                logger.error(f"FCM 서버 응답 오류: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"토픽 푸시 알림 전송 중 오류 발생: {str(e)}")
            return False
    
    def subscribe_to_topic(self, tokens: List[str], topic: str) -> bool:
        """
        FCM 토픽에 기기 등록
        
        Args:
            tokens: 등록할 기기의 FCM 토큰 목록
            topic: 토픽 이름
            
        Returns:
            등록 성공 여부
        """
        try:
            url = "https://iid.googleapis.com/iid/v1:batchAdd"
            payload = {
                "to": f"/topics/{topic}",
                "registration_tokens": tokens
            }
            
            response = requests.post(
                url,
                headers=self.headers,
                json=payload,
                timeout=self.config.timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                success_count = result.get("success", 0)
                failure_count = result.get("failure", 0)
                
                logger.info(f"토픽 등록 결과: {topic} - 성공: {success_count}, 실패: {failure_count}")
                return success_count > 0
            else:
                logger.error(f"토픽 등록 실패: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"토픽 등록 중 오류 발생: {str(e)}")
            return False
    
    def unsubscribe_from_topic(self, tokens: List[str], topic: str) -> bool:
        """
        FCM 토픽에서 기기 제거
        
        Args:
            tokens: 제거할 기기의 FCM 토큰 목록
            topic: 토픽 이름
            
        Returns:
            제거 성공 여부
        """
        try:
            url = "https://iid.googleapis.com/iid/v1:batchRemove"
            payload = {
                "to": f"/topics/{topic}",
                "registration_tokens": tokens
            }
            
            response = requests.post(
                url,
                headers=self.headers,
                json=payload,
                timeout=self.config.timeout
            )
            
            if response.status_code == 200:
                result = response.json()
                success_count = result.get("success", 0)
                failure_count = result.get("failure", 0)
                
                logger.info(f"토픽 제거 결과: {topic} - 성공: {success_count}, 실패: {failure_count}")
                return success_count > 0
            else:
                logger.error(f"토픽 제거 실패: {response.status_code} - {response.text}")
                return False
                
        except Exception as e:
            logger.error(f"토픽 제거 중 오류 발생: {str(e)}")
            return False 