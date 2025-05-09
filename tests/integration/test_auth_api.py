"""
Christmas 프로젝트 - 인증 API 통합 테스트
"""
import os
import pytest
from fastapi import status
from fastapi.testclient import TestClient

from app.api.main import app

# 테스트 클라이언트 생성
client = TestClient(app)

def test_api_key_creation():
    """API 키 생성 엔드포인트 테스트"""
    response = client.post(
        "/auth/api-key",
        json={"user_id": "test_user", "permissions": ["read", "write"]}
    )
    
    assert response.status_code == status.HTTP_201_CREATED
    assert "api_key" in response.json()
    assert "expires_at" in response.json()


def test_api_key_validation():
    """API 키 검증 엔드포인트 테스트"""
    # 먼저 키 생성
    create_response = client.post(
        "/auth/api-key",
        json={"user_id": "test_user", "permissions": ["read"]}
    )
    
    api_key = create_response.json()["api_key"]
    
    # 생성된 키 검증
    validate_response = client.post(
        "/auth/validate-key",
        json={"api_key": api_key}
    )
    
    assert validate_response.status_code == status.HTTP_200_OK
    assert validate_response.json()["is_valid"] is True
    assert validate_response.json()["user_id"] == "test_user"
    assert "read" in validate_response.json()["permissions"]


def test_invalid_api_key():
    """유효하지 않은 API 키 테스트"""
    response = client.post(
        "/auth/validate-key",
        json={"api_key": "invalid_key_format"}
    )
    
    assert response.status_code == status.HTTP_400_BAD_REQUEST


def test_protected_endpoint():
    """보호된 엔드포인트 접근 테스트"""
    # 먼저 키 생성
    create_response = client.post(
        "/auth/api-key",
        json={"user_id": "test_user", "permissions": ["read"]}
    )
    
    api_key = create_response.json()["api_key"]
    
    # 보호된 엔드포인트 접근 (성공 케이스)
    headers = {"X-API-Key": api_key}
    success_response = client.get(
        "/api/protected-resource",
        headers=headers
    )
    
    assert success_response.status_code == status.HTTP_200_OK
    
    # 보호된 엔드포인트 접근 (실패 케이스)
    fail_response = client.get("/api/protected-resource")
    assert fail_response.status_code == status.HTTP_401_UNAUTHORIZED 