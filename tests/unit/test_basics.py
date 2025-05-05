"""기본적인 단위 테스트."""
import pytest
from pathlib import Path

def test_project_structure():
    """프로젝트의 기본 디렉토리 구조 테스트."""
    root_dir = Path(__file__).parent.parent.parent
    required_dirs = ["app", "tests", "docs", "config", "scripts"]
    
    for dir_name in required_dirs:
        dir_path = root_dir / dir_name
        assert dir_path.exists(), f"필수 디렉토리 {dir_name}이(가) 없습니다."
        assert dir_path.is_dir(), f"{dir_name}은(는) 디렉토리가 아닙니다."

def test_app_config(app_config):
    """애플리케이션 설정 테스트."""
    assert app_config["debug"] is True
    assert app_config["testing"] is True
    assert "database_url" in app_config

def test_imports():
    """주요 모듈 임포트 테스트."""
    # 이 테스트는 임포트 자체가 가능한지 확인합니다
    try:
        import app
        assert True
    except ImportError:
        pytest.fail("'app' 패키지를 임포트할 수 없습니다.") 