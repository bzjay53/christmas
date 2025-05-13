import os
import json
import tempfile
import pytest
from base64 import b64encode

from app.security.data_protection import DataProtection, DataEncryption

class TestDataEncryption:
    """데이터 암호화 테스트 클래스"""
    
    def setup_method(self):
        """각 테스트 전 설정"""
        # 임시 디렉토리 생성
        self.temp_dir = tempfile.TemporaryDirectory()
        self.key_path = os.path.join(self.temp_dir.name, "test_encryption.key")
    
    def teardown_method(self):
        """각 테스트 후 정리"""
        self.temp_dir.cleanup()
    
    def test_init_without_key(self):
        """키 없이 초기화 테스트"""
        encryption = DataEncryption(key_path=self.key_path)
        
        # 키 파일 생성 확인
        assert os.path.exists(self.key_path)
        
        # 암호화/복호화 기능 확인
        plaintext = "테스트 메시지"
        encrypted = encryption.encrypt(plaintext)
        decrypted = encryption.decrypt(encrypted).decode('utf-8')
        
        assert plaintext == decrypted
    
    def test_init_with_key(self):
        """키를 제공하여 초기화 테스트"""
        # 첫 번째 인스턴스 생성
        encryption1 = DataEncryption(key_path=self.key_path)
        
        # 두 번째 인스턴스 생성 (같은 키 사용)
        encryption2 = DataEncryption(key_path=self.key_path)
        
        # 첫 번째 인스턴스로 암호화, 두 번째로 복호화
        plaintext = "다른 인스턴스 간 테스트"
        encrypted = encryption1.encrypt(plaintext)
        decrypted = encryption2.decrypt(encrypted).decode('utf-8')
        
        assert plaintext == decrypted
        
        # 직접 키 제공 테스트
        encryption3 = DataEncryption(key=encryption1.key)
        decrypted = encryption3.decrypt(encrypted).decode('utf-8')
        assert plaintext == decrypted
    
    def test_encrypt_to_string(self):
        """문자열 암호화 테스트"""
        encryption = DataEncryption()
        
        plaintext = "암호화할 문자열"
        encrypted = encryption.encrypt_to_string(plaintext)
        
        # base64 문자열 형식 확인
        assert isinstance(encrypted, str)
        
        # 복호화 확인
        decrypted = encryption.decrypt_from_string(encrypted)
        assert plaintext == decrypted
    
    def test_derive_key_from_password(self):
        """비밀번호로부터 키 유도 테스트"""
        password = "강력한비밀번호123!"
        
        # salt 없이 키 유도
        key_data1 = DataEncryption.derive_key_from_password(password)
        
        assert "key" in key_data1
        assert "salt" in key_data1
        
        # 동일 salt로 키 유도
        key_data2 = DataEncryption.derive_key_from_password(password, key_data1["salt"])
        
        # 같은 salt로 유도된 키는 동일해야 함
        assert key_data1["key"] == key_data2["key"]
        
        # 다른 salt로 키 유도
        key_data3 = DataEncryption.derive_key_from_password(password)
        
        # 다른 salt로 유도된 키는 달라야 함
        assert key_data1["key"] != key_data3["key"]


class TestDataProtection:
    """데이터 보호 테스트 클래스"""
    
    def setup_method(self):
        """각 테스트 전 설정"""
        # 임시 설정 파일 생성
        self.temp_dir = tempfile.TemporaryDirectory()
        self.config_path = os.path.join(self.temp_dir.name, "test_data_protection_config.json")
        
        # 키 저장 경로
        self.key_path = os.path.join(self.temp_dir.name, "security/keys/data_protection.key")
        os.makedirs(os.path.dirname(self.key_path), exist_ok=True)
        
        # 테스트 설정 파일 생성
        config = {
            "key_path": self.key_path,
            "sensitive_fields": [
                "password", "api_key", "secret_key", "token", "credit_card",
                "ssn", "account_number", "private_key", "email", "phone"
            ],
            "masking_char": "*",
            "visible_chars": 4
        }
        
        os.makedirs(os.path.dirname(self.config_path), exist_ok=True)
        with open(self.config_path, 'w') as f:
            json.dump(config, f)
    
    def teardown_method(self):
        """각 테스트 후 정리"""
        self.temp_dir.cleanup()
    
    def test_init_with_config(self):
        """설정 파일로 초기화 테스트"""
        dp = DataProtection(config_path=self.config_path)
        
        # 설정 로드 확인
        assert dp.config["key_path"] == self.key_path
        assert "password" in dp.config["sensitive_fields"]
        assert "credit_card" in dp.config["sensitive_fields"]
        
        # 암호화 인스턴스 초기화 확인
        assert dp.encryption is not None
    
    def test_init_without_config(self):
        """설정 파일 없이 초기화 테스트"""
        dp = DataProtection()
        
        # 기본 설정 확인
        assert "key_path" in dp.config
        assert "sensitive_fields" in dp.config
        assert "masking_char" in dp.config
    
    def test_mask_sensitive_data(self):
        """민감 데이터 마스킹 테스트"""
        dp = DataProtection(config_path=self.config_path)
        
        # 일반 문자열 마스킹
        masked = dp.mask_sensitive_data("my-secure-password")
        assert "word" in masked
        assert "*" in masked
        assert masked != "my-secure-password"
        
        # 크레딧 카드 마스킹
        card_number = "4111111111111111"
        masked_card = dp.mask_sensitive_data(card_number, "credit_card")
        assert "1111" in masked_card
        assert "*" in masked_card
        
        # 이메일 마스킹
        email = "test@example.com"
        masked_email = dp.mask_sensitive_data(email, "email")
        assert "t" in masked_email
        assert "@example.com" in masked_email
        assert "*" in masked_email
        
        # 전화번호 마스킹
        phone = "010-1234-5678"
        masked_phone = dp.mask_sensitive_data(phone, "phone")
        assert "5678" in masked_phone
        assert "*" in masked_phone
    
    def test_protect_json_data(self):
        """JSON 데이터 보호 테스트"""
        dp = DataProtection(config_path=self.config_path)
        
        # 테스트 데이터
        test_data = {
            "name": "Test User",
            "email": "test@example.com",
            "password": "secure123!",
            "details": {
                "credit_card": "4111111111111111",
                "phone": "010-1234-5678"
            },
            "public_info": {
                "bio": "This is public information"
            }
        }
        
        protected_data = dp.protect_json_data(test_data)
        
        # 민감 필드 마스킹 확인
        assert protected_data["name"] == "Test User"  # 변경 없음
        assert protected_data["password"] != "secure123!"
        assert "123!" in protected_data["password"]
        assert "*" in protected_data["password"]
        
        # 중첩 객체 내 민감 필드 마스킹 확인
        assert "1111" in protected_data["details"]["credit_card"]
        assert "*" in protected_data["details"]["credit_card"]
        assert "5678" in protected_data["details"]["phone"]
        assert "*" in protected_data["details"]["phone"]
        
        # 비민감 필드 확인
        assert protected_data["public_info"]["bio"] == "This is public information"
    
    def test_encrypt_decrypt_sensitive_data(self):
        """민감 데이터 암호화/복호화 테스트"""
        dp = DataProtection(config_path=self.config_path)
        
        # 테스트 데이터
        test_data = {
            "username": "testuser",
            "password": "secure123!",
            "api_key": "ak_test_1234567890abcdef",
            "details": {
                "secret_key": "sk_test_abcdefghijklmnopqrst",
                "normal_field": "This is not sensitive"
            }
        }
        
        # 암호화
        encrypted_data = dp.encrypt_sensitive_data(test_data)
        
        # 민감 필드 암호화 확인
        assert encrypted_data["username"] == "testuser"  # 변경 없음
        assert encrypted_data["password"] != "secure123!"
        assert isinstance(encrypted_data["password"], str)
        
        # 중첩 객체 내 민감 필드 암호화 확인
        assert encrypted_data["details"]["secret_key"] != "sk_test_abcdefghijklmnopqrst"
        assert encrypted_data["details"]["normal_field"] == "This is not sensitive"
        
        # 복호화
        decrypted_data = dp.decrypt_sensitive_data(encrypted_data)
        
        # 원본 데이터와 비교
        assert decrypted_data["username"] == test_data["username"]
        assert decrypted_data["password"] == test_data["password"]
        assert decrypted_data["api_key"] == test_data["api_key"]
        assert decrypted_data["details"]["secret_key"] == test_data["details"]["secret_key"]
        assert decrypted_data["details"]["normal_field"] == test_data["details"]["normal_field"]


if __name__ == "__main__":
    pytest.main(["-xvs", "test_data_protection.py"]) 