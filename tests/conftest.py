"""테스트를 위한 공통 Pytest 설정 및 fixture."""
import os
import sys
import pytest
from pathlib import Path

# 프로젝트 루트 디렉토리를 파이썬 path에 추가
ROOT_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(ROOT_DIR))

@pytest.fixture
def app_config():
    """애플리케이션 테스트 설정 fixture."""
    return {
        "debug": True,
        "testing": True,
        "database_url": "sqlite:///:memory:"
    }

@pytest.fixture
def test_data_dir():
    """테스트 데이터 디렉토리 경로 반환."""
    return ROOT_DIR / "tests" / "data" 