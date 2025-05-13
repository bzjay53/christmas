"""
보안 감사 로깅 모듈

시스템 보안 활동에 대한 감사 로그를 생성하고 관리하는 기능을 제공합니다.
"""
import logging
import json
import os
import time
from datetime import datetime
from typing import Dict, List, Optional, Any, Union
import uuid

logger = logging.getLogger(__name__)

class SecurityAuditLogger:
    """보안 감사 로깅을 위한 클래스"""
    
    def __init__(self, log_dir: str = "security/audit_logs", config_path: Optional[str] = None):
        """
        보안 감사 로거 초기화
        
        Args:
            log_dir: 로그 파일 저장 디렉토리
            config_path: 설정 파일 경로
        """
        self.log_dir = log_dir
        self.config_path = config_path
        self.config = self._load_config()
        
        # 로그 디렉토리 생성
        os.makedirs(self.log_dir, exist_ok=True)
        
        # 로그 파일 형식 설정
        today = datetime.now().strftime("%Y-%m-%d")
        self.current_log_file = f"{self.log_dir}/audit_{today}.jsonl"
        
        # 활성화된 로깅 이벤트 유형
        self.enabled_events = self.config.get("enabled_events", {})
        
    def _load_config(self) -> Dict[str, Any]:
        """설정 파일 로드"""
        if not self.config_path:
            # 기본 설정 사용
            return {
                "enabled_events": {
                    "authentication": True,
                    "authorization": True,
                    "data_access": True,
                    "system_change": True,
                    "security_event": True
                },
                "log_sensitive_data": False,
                "min_severity": "low",
                "retention_days": 90
            }
        
        try:
            with open(self.config_path, 'r') as f:
                return json.load(f)
        except Exception as e:
            logger.error(f"보안 감사 설정 파일 로드 실패: {e}")
            return {}
    
    def _get_severity_level(self, severity: str) -> int:
        """심각도 문자열을 숫자 레벨로 변환"""
        levels = {
            "critical": 5,
            "high": 4,
            "medium": 3,
            "low": 2,
            "info": 1
        }
        return levels.get(severity.lower(), 0)
    
    def _should_log_event(self, event_type: str, severity: str) -> bool:
        """이벤트 로깅 여부 결정"""
        # 이벤트 유형이 활성화되어 있는지 확인
        if not self.enabled_events.get(event_type, False):
            return False
            
        # 최소 심각도 확인
        min_severity = self.config.get("min_severity", "low")
        event_level = self._get_severity_level(severity)
        min_level = self._get_severity_level(min_severity)
        
        return event_level >= min_level
    
    def log_event(self, event_type: str, message: str, severity: str = "info", 
                  user_id: Optional[str] = None, details: Optional[Dict[str, Any]] = None) -> bool:
        """
        보안 이벤트 로깅
        
        Args:
            event_type: 이벤트 유형 (authentication, authorization, data_access, system_change, security_event)
            message: 이벤트 메시지
            severity: 심각도 (critical, high, medium, low, info)
            user_id: 관련 사용자 ID
            details: 이벤트 상세 정보
            
        Returns:
            로깅 성공 여부
        """
        if not self._should_log_event(event_type, severity):
            return False
            
        # 로그 레코드 생성
        log_record = {
            "id": str(uuid.uuid4()),
            "timestamp": datetime.now().isoformat(),
            "event_type": event_type,
            "severity": severity,
            "message": message,
            "user_id": user_id,
            "ip_address": details.get("ip_address") if details else None,
            "details": details or {}
        }
        
        # 민감 정보 포함 여부 확인
        if not self.config.get("log_sensitive_data", False):
            if "password" in log_record["details"]:
                log_record["details"]["password"] = "********"
            if "token" in log_record["details"]:
                log_record["details"]["token"] = "********"
            if "api_key" in log_record["details"]:
                log_record["details"]["api_key"] = "********"
                
        # 로그 파일에 추가
        try:
            with open(self.current_log_file, 'a', encoding='utf-8') as f:
                f.write(json.dumps(log_record) + '\n')
            return True
        except Exception as e:
            logger.error(f"감사 로그 기록 실패: {e}")
            return False
    
    def log_authentication(self, success: bool, user_id: str, ip_address: Optional[str] = None,
                         auth_method: str = "password", details: Optional[Dict[str, Any]] = None) -> bool:
        """
        인증 이벤트 로깅
        
        Args:
            success: 인증 성공 여부
            user_id: 사용자 ID
            ip_address: 접속 IP 주소
            auth_method: 인증 방식
            details: 추가 세부 정보
            
        Returns:
            로깅 성공 여부
        """
        severity = "info" if success else "medium"
        message = f"인증 {'성공' if success else '실패'}: 사용자 '{user_id}', 방식: {auth_method}"
        
        event_details = details or {}
        event_details.update({
            "success": success,
            "auth_method": auth_method,
            "ip_address": ip_address
        })
        
        return self.log_event("authentication", message, severity, user_id, event_details)
    
    def log_authorization(self, success: bool, user_id: str, resource: str, 
                        action: str, details: Optional[Dict[str, Any]] = None) -> bool:
        """
        권한 부여 이벤트 로깅
        
        Args:
            success: 권한 부여 성공 여부
            user_id: 사용자 ID
            resource: 접근 자원
            action: 수행 작업
            details: 추가 세부 정보
            
        Returns:
            로깅 성공 여부
        """
        severity = "info" if success else "medium"
        message = f"권한 {'부여' if success else '거부'}: 사용자 '{user_id}', 자원: {resource}, 작업: {action}"
        
        event_details = details or {}
        event_details.update({
            "success": success,
            "resource": resource,
            "action": action
        })
        
        return self.log_event("authorization", message, severity, user_id, event_details)
    
    def log_data_access(self, user_id: str, data_type: str, operation: str, 
                      record_ids: Optional[List[str]] = None, 
                      details: Optional[Dict[str, Any]] = None) -> bool:
        """
        데이터 접근 이벤트 로깅
        
        Args:
            user_id: 사용자 ID
            data_type: 데이터 유형
            operation: 수행 작업 (read, write, update, delete)
            record_ids: 접근한 레코드 ID 목록
            details: 추가 세부 정보
            
        Returns:
            로깅 성공 여부
        """
        severity = "info"
        if operation.lower() in ["delete", "update"]:
            severity = "low"
            
        message = f"데이터 접근: 사용자 '{user_id}', 데이터: {data_type}, 작업: {operation}"
        
        event_details = details or {}
        event_details.update({
            "data_type": data_type,
            "operation": operation,
            "record_ids": record_ids or []
        })
        
        return self.log_event("data_access", message, severity, user_id, event_details)
    
    def log_system_change(self, user_id: str, component: str, change_type: str, 
                        description: str, details: Optional[Dict[str, Any]] = None) -> bool:
        """
        시스템 변경 이벤트 로깅
        
        Args:
            user_id: 사용자 ID
            component: 변경된 시스템 컴포넌트
            change_type: 변경 유형 (configuration, upgrade, install, etc)
            description: 변경 내용 설명
            details: 추가 세부 정보
            
        Returns:
            로깅 성공 여부
        """
        severity = "medium"
        message = f"시스템 변경: 컴포넌트: {component}, 유형: {change_type}, 설명: {description}"
        
        event_details = details or {}
        event_details.update({
            "component": component,
            "change_type": change_type,
            "description": description
        })
        
        return self.log_event("system_change", message, severity, user_id, event_details)
    
    def log_security_event(self, severity: str, event_name: str, description: str, 
                         user_id: Optional[str] = None, details: Optional[Dict[str, Any]] = None) -> bool:
        """
        보안 이벤트 로깅
        
        Args:
            severity: 심각도
            event_name: 이벤트 이름
            description: 이벤트 설명
            user_id: 관련 사용자 ID
            details: 추가 세부 정보
            
        Returns:
            로깅 성공 여부
        """
        message = f"보안 이벤트: {event_name} - {description}"
        
        event_details = details or {}
        event_details.update({
            "event_name": event_name,
            "description": description
        })
        
        return self.log_event("security_event", message, severity, user_id, event_details)
    
    def get_audit_logs(self, start_time: Optional[datetime] = None, 
                      end_time: Optional[datetime] = None,
                      event_types: Optional[List[str]] = None,
                      user_id: Optional[str] = None,
                      min_severity: Optional[str] = None,
                      limit: int = 100) -> List[Dict[str, Any]]:
        """
        감사 로그 검색
        
        Args:
            start_time: 시작 시간
            end_time: 종료 시간
            event_types: 검색할 이벤트 유형 목록
            user_id: 특정 사용자 ID
            min_severity: 최소 심각도
            limit: 반환할 최대 로그 수
            
        Returns:
            필터링된 감사 로그 목록
        """
        logs = []
        min_level = self._get_severity_level(min_severity) if min_severity else 0
        
        # 로그 파일 결정
        log_files = []
        if start_time and end_time:
            # 시작일과 종료일 사이의 모든 로그 파일 수집
            current_date = start_time.date()
            while current_date <= end_time.date():
                date_str = current_date.strftime("%Y-%m-%d")
                log_file = f"{self.log_dir}/audit_{date_str}.jsonl"
                if os.path.exists(log_file):
                    log_files.append(log_file)
                current_date = current_date.replace(day=current_date.day + 1)
        else:
            # 현재 로그 파일만 사용
            if os.path.exists(self.current_log_file):
                log_files.append(self.current_log_file)
        
        # 로그 파일에서 데이터 로드 및 필터링
        for log_file in log_files:
            try:
                with open(log_file, 'r', encoding='utf-8') as f:
                    for line in f:
                        try:
                            log_entry = json.loads(line.strip())
                            
                            # 시간 필터링
                            if start_time and datetime.fromisoformat(log_entry["timestamp"]) < start_time:
                                continue
                            if end_time and datetime.fromisoformat(log_entry["timestamp"]) > end_time:
                                continue
                                
                            # 이벤트 유형 필터링
                            if event_types and log_entry["event_type"] not in event_types:
                                continue
                                
                            # 사용자 ID 필터링
                            if user_id and log_entry.get("user_id") != user_id:
                                continue
                                
                            # 심각도 필터링
                            if min_level > 0 and self._get_severity_level(log_entry["severity"]) < min_level:
                                continue
                                
                            logs.append(log_entry)
                            
                            # 제한 확인
                            if len(logs) >= limit:
                                break
                                
                        except json.JSONDecodeError:
                            logger.warning(f"잘못된 로그 항목 발견: {line}")
                            continue
                            
                    # 제한 확인
                    if len(logs) >= limit:
                        break
                        
            except Exception as e:
                logger.error(f"로그 파일 읽기 실패: {log_file}, 오류: {e}")
                continue
                
        return logs
    
    def rotate_logs(self, max_days: Optional[int] = None) -> int:
        """
        오래된 로그 파일 정리
        
        Args:
            max_days: 보관할 최대 일수
            
        Returns:
            삭제된 파일 수
        """
        if max_days is None:
            max_days = self.config.get("retention_days", 90)
            
        if max_days <= 0:
            return 0
            
        deleted_count = 0
        current_time = time.time()
        max_age = max_days * 86400  # 일 -> 초 변환
        
        for filename in os.listdir(self.log_dir):
            if filename.startswith("audit_") and filename.endswith(".jsonl"):
                file_path = os.path.join(self.log_dir, filename)
                file_age = current_time - os.path.getmtime(file_path)
                
                if file_age > max_age:
                    try:
                        os.remove(file_path)
                        deleted_count += 1
                        logger.info(f"오래된 감사 로그 삭제됨: {filename}")
                    except Exception as e:
                        logger.error(f"로그 파일 삭제 실패: {filename}, 오류: {e}")
                        
        return deleted_count 