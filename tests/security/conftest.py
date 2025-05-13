"""
보안 테스트 공통 픽스처

보안 모듈 테스트를 위한 공통 테스트 픽스처를 제공합니다.
"""
import os
import json
import tempfile
import pytest
import sys
from datetime import datetime
from typing import Dict, Any, List, Optional

# Docker 환경에서 app 모듈 임포트를 위한 경로 추가
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

try:
    from app.security.vulnerability_scanner import VulnerabilityScanner
    from app.security.access_control import AccessControl
    from app.security.data_protection import DataProtection, DataEncryption
    from app.security.audit_logger import SecurityAuditLogger
except ImportError as e:
    print(f"임포트 오류: {e}")
    # 테스트용 더미 클래스
    class VulnerabilityScanner:
        def __init__(self, config_path=None): pass
    
    class AccessControl:
        def __init__(self, config_path=None): pass
    
    class DataProtection:
        def __init__(self, config_path=None): pass
    
    class DataEncryption:
        def __init__(self): pass
    
    class SecurityAuditLogger:
        def __init__(self, log_dir=None, config_path=None): pass

@pytest.fixture
def temp_dir():
    """임시 디렉토리 생성"""
    temp_dir = tempfile.TemporaryDirectory()
    yield temp_dir.name
    temp_dir.cleanup()

@pytest.fixture
def security_config_path(temp_dir):
    """테스트용 보안 설정 파일 경로"""
    config_path = os.path.join(temp_dir, "test_security_config.json")
    return config_path

@pytest.fixture
def sample_vulnerability_config(security_config_path):
    """취약점 스캐너 샘플 설정"""
    config = {
        "scan_targets": ["app", "tests"],
        "excluded_paths": ["__pycache__", "node_modules", ".venv"],
        "report_path": os.path.join(os.path.dirname(security_config_path), "security/reports"),
        "severity_threshold": "medium",
        "scan_tools": {
            "bandit": True,
            "safety": True,
            "dependency_check": False
        }
    }
    
    os.makedirs(os.path.dirname(security_config_path), exist_ok=True)
    with open(security_config_path, 'w') as f:
        json.dump(config, f)
        
    return security_config_path

@pytest.fixture
def sample_access_control_config(security_config_path):
    """접근 제어 샘플 설정"""
    config = {
        "roles": {
            "admin": ["all_permissions"],
            "manager": ["read_data", "write_data", "manage_users"],
            "user": ["read_data", "write_data"],
            "guest": ["read_data"]
        },
        "default_role": "guest",
        "session_timeout": 1,  # 1초 (테스트용)
        "max_failed_attempts": 3,
        "lockout_duration": 30
    }
    
    os.makedirs(os.path.dirname(security_config_path), exist_ok=True)
    with open(security_config_path, 'w') as f:
        json.dump(config, f)
        
    return security_config_path

@pytest.fixture
def sample_data_protection_config(security_config_path):
    """데이터 보호 샘플 설정"""
    config = {
        "key_path": os.path.join(os.path.dirname(security_config_path), "security/keys/test_data_protection.key"),
        "sensitive_fields": [
            "password", "api_key", "secret_key", "token", "credit_card",
            "ssn", "account_number", "private_key"
        ],
        "masking_char": "*",
        "visible_chars": 4
    }
    
    os.makedirs(os.path.dirname(security_config_path), exist_ok=True)
    key_dir = os.path.join(os.path.dirname(security_config_path), "security/keys")
    os.makedirs(key_dir, exist_ok=True)
    
    with open(security_config_path, 'w') as f:
        json.dump(config, f)
        
    return security_config_path

@pytest.fixture
def sample_audit_config(security_config_path):
    """감사 로깅 샘플 설정"""
    config = {
        "enabled_events": {
            "authentication": True,
            "authorization": True,
            "data_access": True,
            "system_change": True,
            "security_event": True
        },
        "log_sensitive_data": False,
        "min_severity": "low",
        "retention_days": 7  # 테스트용으로 짧게 설정
    }
    
    os.makedirs(os.path.dirname(security_config_path), exist_ok=True)
    with open(security_config_path, 'w') as f:
        json.dump(config, f)
        
    return security_config_path

@pytest.fixture
def vulnerability_scanner(sample_vulnerability_config):
    """취약점 스캐너 인스턴스"""
    return VulnerabilityScanner(config_path=sample_vulnerability_config)

@pytest.fixture
def access_control(sample_access_control_config):
    """접근 제어 인스턴스"""
    return AccessControl(config_path=sample_access_control_config)

@pytest.fixture
def data_protection(sample_data_protection_config):
    """데이터 보호 인스턴스"""
    return DataProtection(config_path=sample_data_protection_config)

@pytest.fixture
def data_encryption():
    """데이터 암호화 인스턴스"""
    return DataEncryption()

@pytest.fixture
def audit_logger(temp_dir, sample_audit_config):
    """감사 로거 인스턴스"""
    log_dir = os.path.join(temp_dir, "security/audit_logs")
    os.makedirs(log_dir, exist_ok=True)
    return SecurityAuditLogger(log_dir=log_dir, config_path=sample_audit_config)

@pytest.fixture
def sample_sensitive_data():
    """테스트용 민감 데이터"""
    return {
        "user": {
            "id": "user123",
            "name": "Test User",
            "email": "test@example.com",
            "password": "P@ssw0rd123!",
            "api_key": "ak_test_1234567890abcdef",
            "credit_card": "4111111111111111"
        },
        "transaction": {
            "id": "tx_12345",
            "amount": 1000.0,
            "account_number": "9876543210",
            "timestamp": datetime.now().isoformat()
        }
    }

@pytest.fixture
def sample_user_roles():
    """테스트용 사용자 역할 데이터"""
    return {
        "admin_user": ["admin"],
        "manager_user": ["manager"],
        "regular_user": ["user"],
        "multi_role_user": ["user", "manager"]
    }

@pytest.fixture
def sample_audit_events():
    """테스트용 감사 이벤트 데이터"""
    return [
        {
            "event_type": "authentication",
            "message": "인증 성공: 사용자 'test_user'",
            "severity": "info",
            "user_id": "test_user",
            "details": {
                "success": True,
                "auth_method": "password",
                "ip_address": "192.168.1.100"
            }
        },
        {
            "event_type": "authorization",
            "message": "권한 부여: 자원 접근",
            "severity": "info",
            "user_id": "test_user",
            "details": {
                "success": True,
                "resource": "/api/data",
                "action": "read"
            }
        },
        {
            "event_type": "security_event",
            "message": "비정상 접근 시도",
            "severity": "high",
            "details": {
                "event_name": "multiple_failed_login",
                "description": "여러 번의 로그인 실패 감지",
                "ip_address": "192.168.1.200"
            }
        }
    ] 