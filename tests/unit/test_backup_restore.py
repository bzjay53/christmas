"""백업 및 복구 스크립트 단위 테스트."""
import os
import json
import tempfile
import shutil
import pytest
from pathlib import Path
from unittest.mock import patch, MagicMock, call

# 프로젝트 루트 경로 추가
import sys
ROOT_DIR = Path(__file__).parent.parent.parent
sys.path.insert(0, str(ROOT_DIR))

from scripts.backup import (
    ensure_backup_dir, backup_database, backup_config_files,
    create_backup_manifest, compute_file_hash, clean_old_backups
)
from scripts.restore import (
    verify_backup_files, restore_database, restore_config_files
)


class TestBackupModule:
    """백업 모듈 테스트 클래스."""

    @pytest.fixture
    def temp_dir(self):
        """임시 디렉토리 생성 fixture."""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir)

    def test_ensure_backup_dir(self, temp_dir):
        """백업 디렉토리 생성 테스트."""
        backup_dir = os.path.join(temp_dir, "backups")
        
        # 디렉토리가 없을 때 생성
        ensure_backup_dir(backup_dir)
        assert os.path.exists(backup_dir)
        assert os.path.isdir(backup_dir)
        
        # 이미 존재하는 디렉토리에 대해서도 오류 없이 실행
        ensure_backup_dir(backup_dir)
        assert os.path.exists(backup_dir)

    @patch('scripts.backup.subprocess.run')
    def test_backup_database(self, mock_run, temp_dir):
        """데이터베이스 백업 테스트."""
        # 모의 프로세스 결과 설정
        mock_process = MagicMock()
        mock_process.returncode = 0
        mock_run.return_value = mock_process
        
        # 테스트 매개변수
        db_host = "test_host"
        db_port = 5432
        db_user = "test_user"
        db_password = "test_password"
        db_name = "test_db"
        backup_path = os.path.join(temp_dir, "db_backup.dump")
        
        # 함수 호출
        result = backup_database(
            db_host, db_port, db_user, db_password, db_name, backup_path
        )
        
        # 검증
        assert result == backup_path
        mock_run.assert_called_once()
        
        # pg_dump 명령어 및 환경 변수 검증
        args, kwargs = mock_run.call_args
        assert args[0][0] == "pg_dump"
        assert "-h" in args[0] and db_host in args[0]
        assert "-U" in args[0] and db_user in args[0]
        assert "-d" in args[0] and db_name in args[0]
        assert "-f" in args[0] and backup_path in args[0]
        assert kwargs['env']['PGPASSWORD'] == db_password

    def test_backup_config_files(self, temp_dir):
        """설정 파일 백업 테스트."""
        # 테스트 설정 디렉토리 생성
        config_dir = os.path.join(temp_dir, "config")
        os.makedirs(config_dir)
        
        # 테스트 설정 파일 생성
        with open(os.path.join(config_dir, "test.conf"), "w") as f:
            f.write("test=value")
        
        # 백업 경로 설정
        backup_path = os.path.join(temp_dir, "config_backup.tar.gz")
        
        # 함수 호출
        result = backup_config_files(config_dir, backup_path)
        
        # 검증
        assert result == backup_path
        assert os.path.exists(backup_path)
        assert os.path.isfile(backup_path)

    def test_compute_file_hash(self, temp_dir):
        """파일 해시 계산 테스트."""
        # 테스트 파일 생성
        test_file = os.path.join(temp_dir, "test.txt")
        with open(test_file, "w") as f:
            f.write("test content")
        
        # 함수 호출
        hash_value = compute_file_hash(test_file)
        
        # 검증
        assert isinstance(hash_value, str)
        assert len(hash_value) == 64  # SHA-256 해시는 64자

    def test_create_backup_manifest(self, temp_dir):
        """백업 매니페스트 생성 테스트."""
        # 테스트 파일 생성
        test_files = []
        for i in range(3):
            file_path = os.path.join(temp_dir, f"test{i}.txt")
            with open(file_path, "w") as f:
                f.write(f"test content {i}")
            test_files.append(file_path)
        
        # 매니페스트 경로 설정
        manifest_path = os.path.join(temp_dir, "manifest.json")
        
        # 함수 호출
        create_backup_manifest(test_files, manifest_path)
        
        # 검증
        assert os.path.exists(manifest_path)
        with open(manifest_path, "r") as f:
            manifest = json.load(f)
        
        assert "timestamp" in manifest
        assert "version" in manifest
        assert "files" in manifest
        assert len(manifest["files"]) == 3
        
        for file_info in manifest["files"]:
            assert "path" in file_info
            assert "size" in file_info
            assert "sha256" in file_info

    @patch('os.path.getmtime')
    @patch('os.remove')
    def test_clean_old_backups(self, mock_remove, mock_getmtime, temp_dir):
        """오래된 백업 삭제 테스트."""
        import datetime
        
        # 테스트 파일 생성
        test_files = []
        for i in range(5):
            file_path = os.path.join(temp_dir, f"backup_{i}.txt")
            with open(file_path, "w") as f:
                f.write(f"backup content {i}")
            test_files.append(file_path)
        
        # 파일 수정 시간 모의 설정 (일부는 오래된 파일, 일부는 최신 파일)
        now = datetime.datetime.now().timestamp()
        old_time = (datetime.datetime.now() - datetime.timedelta(days=31)).timestamp()
        
        mock_getmtime.side_effect = lambda file_path: old_time if file_path.endswith(("0.txt", "1.txt", "2.txt")) else now
        
        # 함수 호출
        clean_old_backups(temp_dir, 30)
        
        # 검증
        assert mock_remove.call_count == 3
        mock_remove.assert_has_calls([
            call(os.path.join(temp_dir, "backup_0.txt")),
            call(os.path.join(temp_dir, "backup_1.txt")),
            call(os.path.join(temp_dir, "backup_2.txt")),
        ], any_order=True)


class TestRestoreModule:
    """복구 모듈 테스트 클래스."""

    @pytest.fixture
    def temp_dir(self):
        """임시 디렉토리 생성 fixture."""
        temp_dir = tempfile.mkdtemp()
        yield temp_dir
        shutil.rmtree(temp_dir)

    @pytest.fixture
    def test_manifest(self, temp_dir):
        """테스트용 매니페스트 및 백업 파일 생성 fixture."""
        # 백업 파일 생성
        test_files = []
        for i in range(3):
            file_path = os.path.join(temp_dir, f"backup_{i}.txt")
            with open(file_path, "w") as f:
                f.write(f"backup content {i}")
            test_files.append({
                "path": file_path,
                "size": os.path.getsize(file_path),
                "type": ".txt",
                "sha256": compute_file_hash(file_path)
            })
        
        # 매니페스트 파일 생성
        manifest_path = os.path.join(temp_dir, "manifest.json")
        manifest = {
            "timestamp": "2023-01-01T00:00:00Z",
            "version": "1.0",
            "files": test_files
        }
        
        with open(manifest_path, "w") as f:
            json.dump(manifest, f)
        
        return manifest_path

    def test_verify_backup_files_valid(self, test_manifest):
        """유효한 백업 파일 검증 테스트."""
        # 함수 호출
        result = verify_backup_files(test_manifest)
        
        # 검증
        assert result is True

    def test_verify_backup_files_invalid(self, temp_dir, test_manifest):
        """유효하지 않은 백업 파일 검증 테스트."""
        # 매니페스트 파일 로드 및 수정
        with open(test_manifest, "r") as f:
            manifest = json.load(f)
        
        # 첫 번째 파일의 해시 변경
        manifest["files"][0]["sha256"] = "invalid_hash"
        
        # 수정된 매니페스트 저장
        modified_manifest = os.path.join(temp_dir, "modified_manifest.json")
        with open(modified_manifest, "w") as f:
            json.dump(manifest, f)
        
        # 함수 호출
        result = verify_backup_files(modified_manifest)
        
        # 검증
        assert result is False

    @patch('scripts.restore.subprocess.run')
    def test_restore_database(self, mock_run, temp_dir):
        """데이터베이스 복구 테스트."""
        # 모의 프로세스 결과 설정
        mock_process = MagicMock()
        mock_process.returncode = 0
        mock_run.return_value = mock_process
        
        # 테스트 매개변수
        backup_path = os.path.join(temp_dir, "db_backup.dump")
        with open(backup_path, "w") as f:
            f.write("dummy backup data")
        
        db_host = "test_host"
        db_port = 5432
        db_user = "test_user"
        db_password = "test_password"
        db_name = "test_db"
        
        # 함수 호출
        result = restore_database(
            backup_path, db_host, db_port, db_user, db_password, db_name
        )
        
        # 검증
        assert result is True
        assert mock_run.call_count == 3  # dropdb, createdb, pg_restore
        
        # 마지막 호출이 pg_restore인지 확인
        last_call_args = mock_run.call_args_list[-1][0][0]
        assert "pg_restore" in last_call_args
        assert backup_path in last_call_args

    @patch('scripts.restore.shutil.copytree')
    @patch('scripts.restore.tarfile.open')
    def test_restore_config_files(self, mock_tarfile, mock_copytree, temp_dir):
        """설정 파일 복구 테스트."""
        # 모의 객체 설정
        mock_tar = MagicMock()
        mock_tarfile.return_value.__enter__.return_value = mock_tar
        
        # 테스트 매개변수
        backup_path = os.path.join(temp_dir, "config_backup.tar.gz")
        with open(backup_path, "w") as f:
            f.write("dummy tar data")
        
        config_dir = os.path.join(temp_dir, "config")
        os.makedirs(config_dir)
        
        # 함수 호출
        result = restore_config_files(backup_path, config_dir)
        
        # 검증
        assert result is True
        mock_tarfile.assert_called_once_with(backup_path, "r:gz")
        mock_tar.extractall.assert_called_once()
        mock_copytree.assert_called_once()  # 기존 디렉토리 백업 호출

    def test_restore_config_files_dry_run(self, temp_dir):
        """설정 파일 복구 드라이런 테스트."""
        # 테스트 매개변수
        backup_path = os.path.join(temp_dir, "config_backup.tar.gz")
        with open(backup_path, "w") as f:
            f.write("dummy tar data")
        
        config_dir = os.path.join(temp_dir, "config")
        
        # 함수 호출 (dry_run=True)
        result = restore_config_files(backup_path, config_dir, dry_run=True)
        
        # 검증
        assert result is True
        assert not os.path.exists(config_dir)  # 실제로 생성되지 않았음 