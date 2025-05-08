"""
Christmas 프로젝트 - 알림 템플릿 관리 모듈
다양한 알림 템플릿을 정의하고 관리하는 기능 제공
"""

from dataclasses import dataclass, field
from typing import Dict, Any, Optional, List
import json
import os
import logging
from pathlib import Path
from enum import Enum, auto
from datetime import datetime
import re

logger = logging.getLogger(__name__)


class TemplateType(Enum):
    """알림 템플릿 유형"""
    EMAIL = auto()
    PUSH = auto()
    SMS = auto()


class EventType(Enum):
    """알림 이벤트 유형"""
    TRADE_EXECUTED = auto()
    ORDER_PLACED = auto()
    ORDER_CANCELLED = auto()
    SIGNAL_GENERATED = auto()
    STOP_LOSS_TRIGGERED = auto()
    TAKE_PROFIT_TRIGGERED = auto()
    ACCOUNT_BALANCE_LOW = auto()
    SYSTEM_ERROR = auto()
    STRATEGY_STATUS_CHANGED = auto()
    PRICE_ALERT = auto()
    PERFORMANCE_REPORT = auto()


@dataclass
class NotificationTemplate:
    """알림 템플릿 데이터 클래스"""
    id: str
    name: str
    template_type: TemplateType
    event_type: EventType
    subject: str
    body: str
    html_body: Optional[str] = None
    variables: List[str] = field(default_factory=list)
    created_at: datetime = field(default_factory=datetime.now)
    updated_at: datetime = field(default_factory=datetime.now)
    is_active: bool = True
    
    def __post_init__(self):
        """초기화 후 처리"""
        # 템플릿 변수 자동 추출
        if not self.variables:
            # {variable_name} 패턴 찾기
            var_pattern = r'\{([a-zA-Z0-9_]+)\}'
            
            # 제목과 본문에서 변수 추출
            subject_vars = re.findall(var_pattern, self.subject)
            body_vars = re.findall(var_pattern, self.body)
            html_vars = re.findall(var_pattern, self.html_body or "")
            
            # 중복 제거하고 저장
            self.variables = list(set(subject_vars + body_vars + html_vars))
    
    def render(self, context: Dict[str, Any]) -> Dict[str, str]:
        """
        템플릿을 렌더링합니다.
        
        Args:
            context: 템플릿 변수를 대체할 컨텍스트
            
        Returns:
            렌더링된 제목과 본문을 포함한 dict
        """
        # 주어진 컨텍스트로 변수 대체
        rendered_subject = self.subject
        rendered_body = self.body
        rendered_html = self.html_body
        
        # 모든 변수 대체
        for var in self.variables:
            if var in context:
                placeholder = f"{{{var}}}"
                value = str(context[var])
                rendered_subject = rendered_subject.replace(placeholder, value)
                rendered_body = rendered_body.replace(placeholder, value)
                if rendered_html:
                    rendered_html = rendered_html.replace(placeholder, value)
        
        return {
            "subject": rendered_subject,
            "body": rendered_body,
            "html_body": rendered_html
        }
    
    def to_dict(self) -> Dict[str, Any]:
        """템플릿을 사전으로 변환"""
        return {
            "id": self.id,
            "name": self.name,
            "template_type": self.template_type.name,
            "event_type": self.event_type.name,
            "subject": self.subject,
            "body": self.body,
            "html_body": self.html_body,
            "variables": self.variables,
            "created_at": self.created_at.isoformat(),
            "updated_at": self.updated_at.isoformat(),
            "is_active": self.is_active
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'NotificationTemplate':
        """사전에서 템플릿 객체 생성"""
        # datetime 문자열을 datetime 객체로 변환
        created_at = datetime.fromisoformat(data["created_at"]) if isinstance(data["created_at"], str) else data["created_at"]
        updated_at = datetime.fromisoformat(data["updated_at"]) if isinstance(data["updated_at"], str) else data["updated_at"]
        
        # Enum 값 변환
        template_type = TemplateType[data["template_type"]] if isinstance(data["template_type"], str) else data["template_type"]
        event_type = EventType[data["event_type"]] if isinstance(data["event_type"], str) else data["event_type"]
        
        return cls(
            id=data["id"],
            name=data["name"],
            template_type=template_type,
            event_type=event_type,
            subject=data["subject"],
            body=data["body"],
            html_body=data.get("html_body"),
            variables=data.get("variables", []),
            created_at=created_at,
            updated_at=updated_at,
            is_active=data.get("is_active", True)
        )


class TemplateManager:
    """알림 템플릿 관리 클래스"""
    
    def __init__(self, templates_dir: Optional[str] = None):
        """
        템플릿 관리자 초기화
        
        Args:
            templates_dir: 템플릿 JSON 파일이 저장된 디렉토리 경로 (없으면 기본 템플릿만 사용)
        """
        self.templates: Dict[str, NotificationTemplate] = {}
        self.templates_dir = templates_dir
        
        # 기본 템플릿 로드
        self._initialize_default_templates()
        
        # 사용자 정의 템플릿 로드
        if templates_dir:
            self._load_templates_from_directory()
    
    def _initialize_default_templates(self) -> None:
        """기본 템플릿 초기화"""
        default_templates = [
            # 주문 체결 알림
            NotificationTemplate(
                id="trade_executed_email",
                name="주문 체결 이메일",
                template_type=TemplateType.EMAIL,
                event_type=EventType.TRADE_EXECUTED,
                subject="[Christmas] {symbol} 주문이 체결되었습니다",
                body=(
                    "안녕하세요,\n\n"
                    "{symbol} {position_type} 주문이 {executed_time}에 체결되었습니다.\n"
                    "체결 가격: {price}원\n"
                    "체결 수량: {quantity}주\n"
                    "주문 금액: {amount}원\n\n"
                    "감사합니다,\n"
                    "Christmas 트레이딩 시스템"
                ),
                html_body=(
                    "<div style='font-family: Arial, sans-serif; max-width: 600px;'>"
                    "<h2 style='color: #0056b3;'>{symbol} 주문 체결</h2>"
                    "<p>안녕하세요,</p>"
                    "<p><strong>{symbol}</strong> {position_type} 주문이 <strong>{executed_time}</strong>에 체결되었습니다.</p>"
                    "<ul>"
                    "<li>체결 가격: <strong>{price}원</strong></li>"
                    "<li>체결 수량: <strong>{quantity}주</strong></li>"
                    "<li>주문 금액: <strong>{amount}원</strong></li>"
                    "</ul>"
                    "<p>감사합니다,<br>Christmas 트레이딩 시스템</p>"
                    "</div>"
                )
            ),
            
            # 매매 신호 생성 알림
            NotificationTemplate(
                id="signal_generated_email",
                name="매매 신호 이메일",
                template_type=TemplateType.EMAIL,
                event_type=EventType.SIGNAL_GENERATED,
                subject="[Christmas] {symbol} {signal_type} 신호가 발생했습니다",
                body=(
                    "안녕하세요,\n\n"
                    "{strategy_name} 전략에서 {symbol}에 대한 {signal_type} 신호가 발생했습니다.\n"
                    "시간: {timestamp}\n"
                    "가격: {price}원\n"
                    "신뢰도: {confidence}%\n\n"
                    "이 신호를 기반으로 {action}이 {status}.\n\n"
                    "감사합니다,\n"
                    "Christmas 트레이딩 시스템"
                ),
                html_body=(
                    "<div style='font-family: Arial, sans-serif; max-width: 600px;'>"
                    "<h2 style='color: #0056b3;'>{symbol} {signal_type} 신호 발생</h2>"
                    "<p>안녕하세요,</p>"
                    "<p><strong>{strategy_name}</strong> 전략에서 <strong>{symbol}</strong>에 대한 "
                    "<span style='color: {signal_color};'><strong>{signal_type}</strong></span> 신호가 발생했습니다.</p>"
                    "<ul>"
                    "<li>시간: <strong>{timestamp}</strong></li>"
                    "<li>가격: <strong>{price}원</strong></li>"
                    "<li>신뢰도: <strong>{confidence}%</strong></li>"
                    "</ul>"
                    "<p>이 신호를 기반으로 {action}이 {status}.</p>"
                    "<p>감사합니다,<br>Christmas 트레이딩 시스템</p>"
                    "</div>"
                )
            ),
            
            # 손절 알림
            NotificationTemplate(
                id="stop_loss_triggered_email",
                name="손절 알림 이메일",
                template_type=TemplateType.EMAIL,
                event_type=EventType.STOP_LOSS_TRIGGERED,
                subject="[Christmas] {symbol} 손절매가 실행되었습니다",
                body=(
                    "안녕하세요,\n\n"
                    "{symbol}에 대한 손절매가 실행되었습니다.\n"
                    "시간: {timestamp}\n"
                    "진입 가격: {entry_price}원\n"
                    "손절 가격: {exit_price}원\n"
                    "손실: {loss_amount}원 ({loss_pct}%)\n\n"
                    "감사합니다,\n"
                    "Christmas 트레이딩 시스템"
                ),
                html_body=(
                    "<div style='font-family: Arial, sans-serif; max-width: 600px;'>"
                    "<h2 style='color: #d9534f;'>{symbol} 손절매 실행</h2>"
                    "<p>안녕하세요,</p>"
                    "<p><strong>{symbol}</strong>에 대한 손절매가 실행되었습니다.</p>"
                    "<ul>"
                    "<li>시간: <strong>{timestamp}</strong></li>"
                    "<li>진입 가격: <strong>{entry_price}원</strong></li>"
                    "<li>손절 가격: <strong>{exit_price}원</strong></li>"
                    "<li>손실: <strong style='color: #d9534f;'>{loss_amount}원 ({loss_pct}%)</strong></li>"
                    "</ul>"
                    "<p>감사합니다,<br>Christmas 트레이딩 시스템</p>"
                    "</div>"
                )
            ),
            
            # 성과 보고서 알림
            NotificationTemplate(
                id="performance_report_email",
                name="성과 보고서 이메일",
                template_type=TemplateType.EMAIL,
                event_type=EventType.PERFORMANCE_REPORT,
                subject="[Christmas] {period} 성과 보고서",
                body=(
                    "안녕하세요,\n\n"
                    "{period} 트레이딩 성과 보고서입니다.\n\n"
                    "기간: {start_date} ~ {end_date}\n"
                    "총 수익: {total_profit}원 ({profit_pct}%)\n"
                    "총 거래 수: {trade_count}회\n"
                    "승률: {win_rate}%\n"
                    "최대 낙폭: {max_drawdown}%\n\n"
                    "자세한 내용은 대시보드에서 확인해주세요.\n\n"
                    "감사합니다,\n"
                    "Christmas 트레이딩 시스템"
                ),
                html_body=(
                    "<div style='font-family: Arial, sans-serif; max-width: 600px;'>"
                    "<h2 style='color: #0056b3;'>{period} 성과 보고서</h2>"
                    "<p>안녕하세요,</p>"
                    "<p><strong>{period}</strong> 트레이딩 성과 보고서입니다.</p>"
                    "<table style='width: 100%; border-collapse: collapse; margin: 20px 0;'>"
                    "<tr style='background-color: #f8f9fa;'>"
                    "<td style='padding: 10px; border: 1px solid #ddd;'>기간</td>"
                    "<td style='padding: 10px; border: 1px solid #ddd;'><strong>{start_date} ~ {end_date}</strong></td>"
                    "</tr>"
                    "<tr>"
                    "<td style='padding: 10px; border: 1px solid #ddd;'>총 수익</td>"
                    "<td style='padding: 10px; border: 1px solid #ddd;'><strong style='color: {profit_color};'>{total_profit}원 ({profit_pct}%)</strong></td>"
                    "</tr>"
                    "<tr style='background-color: #f8f9fa;'>"
                    "<td style='padding: 10px; border: 1px solid #ddd;'>총 거래 수</td>"
                    "<td style='padding: 10px; border: 1px solid #ddd;'><strong>{trade_count}회</strong></td>"
                    "</tr>"
                    "<tr>"
                    "<td style='padding: 10px; border: 1px solid #ddd;'>승률</td>"
                    "<td style='padding: 10px; border: 1px solid #ddd;'><strong>{win_rate}%</strong></td>"
                    "</tr>"
                    "<tr style='background-color: #f8f9fa;'>"
                    "<td style='padding: 10px; border: 1px solid #ddd;'>최대 낙폭</td>"
                    "<td style='padding: 10px; border: 1px solid #ddd;'><strong>{max_drawdown}%</strong></td>"
                    "</tr>"
                    "</table>"
                    "<p>자세한 내용은 <a href='{dashboard_url}' style='color: #0056b3;'>대시보드</a>에서 확인해주세요.</p>"
                    "<p>감사합니다,<br>Christmas 트레이딩 시스템</p>"
                    "</div>"
                )
            ),
            
            # 모바일 알림 템플릿
            NotificationTemplate(
                id="trade_executed_push",
                name="주문 체결 푸시 알림",
                template_type=TemplateType.PUSH,
                event_type=EventType.TRADE_EXECUTED,
                subject="주문 체결: {symbol}",
                body="{symbol} {position_type}이(가) {price}원에 체결되었습니다."
            ),
            
            # 시스템 오류 알림
            NotificationTemplate(
                id="system_error_email",
                name="시스템 오류 이메일",
                template_type=TemplateType.EMAIL,
                event_type=EventType.SYSTEM_ERROR,
                subject="[Christmas] 시스템 오류 발생",
                body=(
                    "안녕하세요,\n\n"
                    "시스템에서 오류가 발생했습니다:\n\n"
                    "시간: {timestamp}\n"
                    "오류 유형: {error_type}\n"
                    "오류 메시지: {error_message}\n\n"
                    "모듈: {module}\n"
                    "함수: {function}\n\n"
                    "이 문제가 지속되면 개발팀에 문의하세요.\n\n"
                    "감사합니다,\n"
                    "Christmas 트레이딩 시스템"
                ),
                html_body=(
                    "<div style='font-family: Arial, sans-serif; max-width: 600px;'>"
                    "<h2 style='color: #d9534f;'>시스템 오류 발생</h2>"
                    "<p>안녕하세요,</p>"
                    "<p>시스템에서 오류가 발생했습니다:</p>"
                    "<div style='background-color: #f8f9fa; padding: 15px; border-left: 5px solid #d9534f;'>"
                    "<p><strong>시간:</strong> {timestamp}</p>"
                    "<p><strong>오류 유형:</strong> {error_type}</p>"
                    "<p><strong>오류 메시지:</strong> {error_message}</p>"
                    "<p><strong>모듈:</strong> {module}</p>"
                    "<p><strong>함수:</strong> {function}</p>"
                    "</div>"
                    "<p>이 문제가 지속되면 개발팀에 문의하세요.</p>"
                    "<p>감사합니다,<br>Christmas 트레이딩 시스템</p>"
                    "</div>"
                )
            )
        ]
        
        # 기본 템플릿 등록
        for template in default_templates:
            self.add_template(template)
    
    def _load_templates_from_directory(self) -> None:
        """디렉토리에서 템플릿 로드"""
        if not self.templates_dir or not os.path.exists(self.templates_dir):
            logger.warning(f"템플릿 디렉토리가 존재하지 않습니다: {self.templates_dir}")
            return
        
        template_dir_path = Path(self.templates_dir)
        template_files = list(template_dir_path.glob("*.json"))
        
        for file_path in template_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as file:
                    template_data = json.load(file)
                    
                    # 단일 템플릿 또는 템플릿 목록 처리
                    if isinstance(template_data, list):
                        for item in template_data:
                            template = NotificationTemplate.from_dict(item)
                            self.add_template(template)
                    else:
                        template = NotificationTemplate.from_dict(template_data)
                        self.add_template(template)
                        
                logger.info(f"템플릿 파일 로드 완료: {file_path}")
                
            except Exception as e:
                logger.error(f"템플릿 파일 로드 중 오류 발생: {file_path}: {str(e)}")
    
    def add_template(self, template: NotificationTemplate) -> None:
        """
        템플릿 추가
        
        Args:
            template: 추가할 알림 템플릿
        """
        self.templates[template.id] = template
        logger.debug(f"템플릿 추가됨: {template.id} ({template.name})")
    
    def get_template(self, template_id: str) -> Optional[NotificationTemplate]:
        """
        템플릿 ID로 템플릿 검색
        
        Args:
            template_id: 템플릿 ID
            
        Returns:
            찾은 템플릿 또는 None
        """
        return self.templates.get(template_id)
    
    def get_templates_by_event(self, event_type: EventType) -> List[NotificationTemplate]:
        """
        이벤트 유형별 템플릿 검색
        
        Args:
            event_type: 이벤트 유형
            
        Returns:
            해당 이벤트 유형의 활성화된 템플릿 목록
        """
        return [t for t in self.templates.values() 
                if t.event_type == event_type and t.is_active]
    
    def get_templates_by_type(self, template_type: TemplateType) -> List[NotificationTemplate]:
        """
        템플릿 유형별 템플릿 검색
        
        Args:
            template_type: 템플릿 유형
            
        Returns:
            해당 템플릿 유형의 활성화된 템플릿 목록
        """
        return [t for t in self.templates.values() 
                if t.template_type == template_type and t.is_active]
    
    def update_template(self, template_id: str, 
                      updates: Dict[str, Any]) -> Optional[NotificationTemplate]:
        """
        기존 템플릿 업데이트
        
        Args:
            template_id: 업데이트할 템플릿 ID
            updates: 업데이트할 필드와 값
            
        Returns:
            업데이트된 템플릿 또는 None
        """
        if template_id not in self.templates:
            logger.warning(f"업데이트할 템플릿을 찾을 수 없음: {template_id}")
            return None
        
        template = self.templates[template_id]
        template_dict = template.to_dict()
        
        # 업데이트 적용
        for key, value in updates.items():
            if key in template_dict:
                template_dict[key] = value
        
        # 업데이트 시간 갱신
        template_dict["updated_at"] = datetime.now().isoformat()
        
        # 새 템플릿 생성 및 등록
        updated_template = NotificationTemplate.from_dict(template_dict)
        self.templates[template_id] = updated_template
        
        logger.info(f"템플릿 업데이트됨: {template_id}")
        return updated_template
    
    def delete_template(self, template_id: str) -> bool:
        """
        템플릿 삭제
        
        Args:
            template_id: 삭제할 템플릿 ID
            
        Returns:
            삭제 성공 여부
        """
        if template_id in self.templates:
            del self.templates[template_id]
            logger.info(f"템플릿 삭제됨: {template_id}")
            return True
        
        logger.warning(f"삭제할 템플릿을 찾을 수 없음: {template_id}")
        return False
    
    def save_templates_to_directory(self) -> bool:
        """
        모든 템플릿을 디렉토리에 저장
        
        Returns:
            저장 성공 여부
        """
        if not self.templates_dir:
            logger.warning("템플릿 저장 디렉토리가 설정되지 않았습니다.")
            return False
        
        # 디렉토리 생성
        os.makedirs(self.templates_dir, exist_ok=True)
        
        try:
            # 모든 템플릿을 하나의 파일에 저장
            templates_file = os.path.join(self.templates_dir, "templates.json")
            templates_data = [t.to_dict() for t in self.templates.values()]
            
            with open(templates_file, 'w', encoding='utf-8') as file:
                json.dump(templates_data, file, indent=2, ensure_ascii=False)
            
            logger.info(f"템플릿 {len(templates_data)}개가 저장됨: {templates_file}")
            return True
            
        except Exception as e:
            logger.error(f"템플릿 저장 중 오류 발생: {str(e)}")
            return False
    
    def render_template(self, template_id: str, context: Dict[str, Any]) -> Optional[Dict[str, str]]:
        """
        템플릿 ID와 컨텍스트로 템플릿 렌더링
        
        Args:
            template_id: 렌더링할 템플릿 ID
            context: 템플릿 변수를 대체할 컨텍스트
            
        Returns:
            렌더링된 텍스트를 포함한 사전 또는 None
        """
        template = self.get_template(template_id)
        if not template:
            logger.warning(f"렌더링할 템플릿을 찾을 수 없음: {template_id}")
            return None
        
        return template.render(context) 