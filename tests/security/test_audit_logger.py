import os
import json
import tempfile
import time
import pytest
from datetime import datetime, timedelta
from unittest.mock import patch

from app.security.audit_logger import SecurityAuditLogger

class TestSecurityAuditLogger:
    """보안 감사 로깅 테스트 클래스"""
    
    def setup_method(self):
        """각 테스트 전 설정"""
        # 임시 디렉토리 생성
        self.temp_dir = tempfile.TemporaryDirectory()
        self.log_dir = os.path.join(self.temp_dir.name, "audit_logs")
        self.config_path = os.path.join(self.temp_dir.name, "test_audit_config.json")
        
        # 테스트 디렉토리 생성
        os.makedirs(self.log_dir, exist_ok=True)
        
        # 테스트 설정 파일 생성
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
        
        os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
        with open(self.config_path, 'w') as f:
            json.dump(config, f)
    
    def teardown_method(self):
        """각 테스트 후 정리"""
        self.temp_dir.cleanup()
    
    def test_init_with_config(self):
        """설정 파일로 초기화 테스트"""
        logger = SecurityAuditLogger(
            log_dir=self.log_dir,
            config_path=self.config_path
        )
        
        # 설정 로드 확인
        assert logger.config["enabled_events"]["authentication"] == True
        assert logger.config["enabled_events"]["authorization"] == True
        assert logger.config["log_sensitive_data"] == False
        assert logger.config["min_severity"] == "low"
        assert logger.config["retention_days"] == 7
        
        # 로그 디렉토리 초기화 확인
        assert os.path.exists(self.log_dir)
        
        # 현재 로그 파일 형식 확인
        today = datetime.now().strftime("%Y-%m-%d")
        assert f"audit_{today}.jsonl" in logger.current_log_file
    
    def test_init_without_config(self):
        """설정 파일 없이 초기화 테스트"""
        logger = SecurityAuditLogger(log_dir=self.log_dir)
        
        # 기본 설정 확인
        assert "enabled_events" in logger.config
        assert "log_sensitive_data" in logger.config
        assert "min_severity" in logger.config
    
    def test_should_log_event(self):
        """이벤트 로깅 여부 결정 테스트"""
        logger = SecurityAuditLogger(
            log_dir=self.log_dir,
            config_path=self.config_path
        )
        
        # 활성화된 이벤트 + 충분한 심각도
        assert logger._should_log_event("authentication", "medium") == True
        assert logger._should_log_event("authorization", "high") == True
        assert logger._should_log_event("security_event", "critical") == True
        
        # 활성화된 이벤트지만 낮은 심각도
        assert logger._should_log_event("authentication", "info") == False
        
        # 비활성화된 이벤트
        # 설정에서 특정 이벤트 비활성화
        logger.enabled_events["data_access"] = False
        assert logger._should_log_event("data_access", "high") == False
    
    def test_log_event(self):
        """일반 이벤트 로깅 테스트"""
        logger = SecurityAuditLogger(
            log_dir=self.log_dir,
            config_path=self.config_path
        )
        
        # 이벤트 로깅
        event_type = "security_event"
        message = "테스트 보안 이벤트"
        severity = "medium"
        user_id = "test_user"
        details = {"test_key": "test_value"}
        
        result = logger.log_event(event_type, message, severity, user_id, details)
        assert result == True
        
        # 로그 파일 확인
        log_file = logger.current_log_file
        assert os.path.exists(log_file)
        
        # 로그 내용 확인
        with open(log_file, 'r', encoding='utf-8') as f:
            log_data = json.loads(f.read().strip())
            
            assert log_data["event_type"] == event_type
            assert log_data["message"] == message
            assert log_data["severity"] == severity
            assert log_data["user_id"] == user_id
            assert log_data["details"]["test_key"] == "test_value"
            assert "id" in log_data
            assert "timestamp" in log_data
    
    def test_log_event_with_sensitive_data(self):
        """민감 데이터 포함 이벤트 로깅 테스트"""
        # 민감 정보 포함 설정으로 변경
        with open(self.config_path, 'r') as f:
            config = json.load(f)
            
        config["log_sensitive_data"] = False
        
        with open(self.config_path, 'w') as f:
            json.dump(config, f)
            
        logger = SecurityAuditLogger(
            log_dir=self.log_dir,
            config_path=self.config_path
        )
        
        # 민감 정보 포함 이벤트 로깅
        details = {
            "username": "testuser",
            "password": "secret123",
            "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            "api_key": "ak_test_12345"
        }
        
        logger.log_event("authentication", "민감 정보 테스트", "medium", "test_user", details)
        
        # 로그 내용 확인
        with open(logger.current_log_file, 'r', encoding='utf-8') as f:
            log_data = json.loads(f.read().strip())
            
            # 민감 필드는 마스킹되어야 함
            assert log_data["details"]["username"] == "testuser"
            assert log_data["details"]["password"] == "********"
            assert log_data["details"]["token"] == "********"
            assert log_data["details"]["api_key"] == "********"
    
    def test_log_authentication(self):
        """인증 이벤트 로깅 테스트"""
        logger = SecurityAuditLogger(
            log_dir=self.log_dir,
            config_path=self.config_path
        )
        
        # 성공 인증 이벤트
        logger.log_authentication(
            success=True,
            user_id="test_user",
            ip_address="192.168.1.100",
            auth_method="password"
        )
        
        # 실패 인증 이벤트
        logger.log_authentication(
            success=False,
            user_id="test_user",
            ip_address="192.168.1.101",
            auth_method="oauth"
        )
        
        # 로그 내용 확인
        with open(logger.current_log_file, 'r', encoding='utf-8') as f:
            logs = [json.loads(line) for line in f.readlines()]
            
            # 두 개의 로그 항목 확인
            assert len(logs) == 2
            
            # 첫 번째 로그 (성공)
            assert logs[0]["event_type"] == "authentication"
            assert "성공" in logs[0]["message"]
            assert logs[0]["severity"] == "info"
            assert logs[0]["details"]["success"] == True
            assert logs[0]["details"]["ip_address"] == "192.168.1.100"
            
            # 두 번째 로그 (실패)
            assert logs[1]["event_type"] == "authentication"
            assert "실패" in logs[1]["message"]
            assert logs[1]["severity"] == "medium"
            assert logs[1]["details"]["success"] == False
            assert logs[1]["details"]["auth_method"] == "oauth"
    
    def test_log_authorization(self):
        """권한 부여 이벤트 로깅 테스트"""
        logger = SecurityAuditLogger(
            log_dir=self.log_dir,
            config_path=self.config_path
        )
        
        # 권한 부여 이벤트
        logger.log_authorization(
            success=True,
            user_id="test_user",
            resource="/api/data",
            action="read"
        )
        
        # 권한 거부 이벤트
        logger.log_authorization(
            success=False,
            user_id="test_user",
            resource="/api/admin",
            action="write"
        )
        
        # 로그 내용 확인
        with open(logger.current_log_file, 'r', encoding='utf-8') as f:
            logs = [json.loads(line) for line in f.readlines()]
            
            # 두 개의 로그 항목 확인
            assert len(logs) == 2
            
            # 첫 번째 로그 (부여)
            assert logs[0]["event_type"] == "authorization"
            assert "부여" in logs[0]["message"]
            assert logs[0]["details"]["resource"] == "/api/data"
            assert logs[0]["details"]["action"] == "read"
            
            # 두 번째 로그 (거부)
            assert logs[1]["event_type"] == "authorization"
            assert "거부" in logs[1]["message"]
            assert logs[1]["details"]["resource"] == "/api/admin"
            assert logs[1]["details"]["action"] == "write"
    
    def test_get_audit_logs(self):
        """감사 로그 검색 테스트"""
        logger = SecurityAuditLogger(
            log_dir=self.log_dir,
            config_path=self.config_path
        )
        
        # 여러 이벤트 로깅
        logger.log_authentication(True, "user1", "192.168.1.1")
        logger.log_authorization(True, "user1", "/api/data", "read")
        logger.log_security_event("high", "brute_force", "무차별 대입 공격 탐지", "attacker")
        logger.log_system_change("admin", "config", "update", "시스템 설정 변경")
        logger.log_data_access("user2", "customer", "read", ["cust123", "cust456"])
        
        # 모든 로그 조회
        all_logs = logger.get_audit_logs()
        assert len(all_logs) == 5
        
        # 특정 이벤트 유형 필터링
        auth_logs = logger.get_audit_logs(event_types=["authentication", "authorization"])
        assert len(auth_logs) == 2
        assert auth_logs[0]["event_type"] in ["authentication", "authorization"]
        assert auth_logs[1]["event_type"] in ["authentication", "authorization"]
        
        # 특정 사용자 필터링
        user1_logs = logger.get_audit_logs(user_id="user1")
        assert len(user1_logs) == 2
        assert user1_logs[0]["user_id"] == "user1"
        assert user1_logs[1]["user_id"] == "user1"
        
        # 심각도 필터링
        high_logs = logger.get_audit_logs(min_severity="high")
        assert len(high_logs) == 1
        assert high_logs[0]["severity"] == "high"
        
        # 제한 테스트
        limited_logs = logger.get_audit_logs(limit=2)
        assert len(limited_logs) == 2
    
    @patch('os.path.getmtime')
    @patch('os.remove')
    def test_rotate_logs(self, mock_remove, mock_getmtime):
        """로그 로테이션 테스트"""
        logger = SecurityAuditLogger(
            log_dir=self.log_dir,
            config_path=self.config_path
        )
        
        # 테스트 로그 파일 생성
        log_files = [
            "audit_2023-01-01.jsonl",
            "audit_2023-01-15.jsonl",
            "audit_2023-02-01.jsonl",
            "audit_2023-02-15.jsonl",
            "audit_2023-03-01.jsonl"
        ]
        
        for filename in log_files:
            with open(os.path.join(self.log_dir, filename), 'w') as f:
                f.write('{"test": "data"}\n')
        
        # 파일 시간 모킹 (현재 시간으로부터 일수 계산)
        current_time = time.time()
        
        def mock_time(path):
            filename = os.path.basename(path)
            if "2023-01" in filename:  # 1월 파일은 오래된 것으로 설정
                return current_time - (8 * 86400)  # 8일 이전
            elif "2023-02-01" in filename:  # 2월 1일 파일은 경계선에 설정
                return current_time - (7 * 86400)  # 7일 이전 (경계선)
            else:
                return current_time - (3 * 86400)  # 3일 이전
        
        mock_getmtime.side_effect = mock_time
        
        # 로그 로테이션 실행 (7일 유지)
        deleted_count = logger.rotate_logs(max_days=7)
        
        # 삭제된 파일 수 확인
        assert deleted_count == 2
        
        # 삭제된 파일 확인
        expected_deleted = [
            os.path.join(self.log_dir, "audit_2023-01-01.jsonl"),
            os.path.join(self.log_dir, "audit_2023-01-15.jsonl")
        ]
        
        assert mock_remove.call_count == 2
        mock_remove.assert_any_call(expected_deleted[0])
        mock_remove.assert_any_call(expected_deleted[1])


if __name__ == "__main__":
    pytest.main(["-xvs", "test_audit_logger.py"]) 