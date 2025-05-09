#!/usr/bin/env python
"""
Christmas 프로젝트 - 백업 스크립트
데이터베이스 및 중요 데이터 백업 자동화
"""

import os
import sys
import argparse
import logging
import datetime
import subprocess
import shutil
import tarfile
import json
from pathlib import Path

# 프로젝트 루트 경로 추가 (상대 경로 import를 위해)
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler(os.path.join(project_root, 'logs', 'backup.log'))
    ]
)
logger = logging.getLogger(__name__)

def ensure_backup_dir(backup_dir):
    """백업 디렉토리가 존재하는지 확인하고 없으면 생성"""
    if not os.path.exists(backup_dir):
        os.makedirs(backup_dir)
        logger.info(f"백업 디렉토리 생성: {backup_dir}")

def backup_database(db_host, db_port, db_user, db_password, db_name, backup_path):
    """
    PostgreSQL 데이터베이스 백업
    
    Returns:
        백업 파일 경로
    """
    try:
        # pg_dump 명령 구성
        env = os.environ.copy()
        env["PGPASSWORD"] = db_password
        
        cmd = [
            "pg_dump", 
            "-h", db_host,
            "-p", str(db_port),
            "-U", db_user,
            "-d", db_name,
            "-F", "c",  # 커스텀 포맷
            "-f", backup_path
        ]
        
        # 백업 실행
        result = subprocess.run(
            cmd, 
            env=env, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE, 
            text=True,
            check=True
        )
        
        logger.info(f"데이터베이스 백업 성공: {backup_path}")
        return backup_path
    
    except subprocess.CalledProcessError as e:
        logger.error(f"데이터베이스 백업 실패: {e.stderr}")
        return None

def backup_config_files(config_dir, backup_path):
    """
    설정 파일 백업
    
    Returns:
        백업 파일 경로
    """
    try:
        with tarfile.open(backup_path, "w:gz") as tar:
            tar.add(config_dir, arcname=os.path.basename(config_dir))
        
        logger.info(f"설정 파일 백업 성공: {backup_path}")
        return backup_path
    
    except Exception as e:
        logger.error(f"설정 파일 백업 실패: {str(e)}")
        return None

def backup_redis(redis_host, redis_port, redis_password, backup_path):
    """
    Redis 데이터 백업
    
    Returns:
        백업 파일 경로
    """
    try:
        # redis-cli 명령으로 RDB 백업 생성 트리거
        cmd = [
            "redis-cli", 
            "-h", redis_host,
            "-p", str(redis_port),
            "-a", redis_password,
            "SAVE"
        ]
        
        # 명령 실행
        result = subprocess.run(
            cmd, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE, 
            text=True,
            check=True
        )
        
        # 백업 파일 복사 (일반적으로 dump.rdb)
        redis_dump_path = "/var/lib/redis/dump.rdb"  # 실제 경로는 환경에 따라 다를 수 있음
        if os.path.exists(redis_dump_path):
            shutil.copy2(redis_dump_path, backup_path)
            logger.info(f"Redis 백업 성공: {backup_path}")
            return backup_path
        else:
            logger.warning(f"Redis 백업 파일을 찾을 수 없음: {redis_dump_path}")
            return None
    
    except subprocess.CalledProcessError as e:
        logger.error(f"Redis 백업 실패: {e.stderr}")
        return None
    except Exception as e:
        logger.error(f"Redis 백업 실패: {str(e)}")
        return None

def create_backup_manifest(backup_files, manifest_path):
    """
    백업 매니페스트 파일 생성
    
    Args:
        backup_files: 백업 파일 목록
        manifest_path: 매니페스트 파일 경로
    """
    manifest = {
        "timestamp": datetime.datetime.now().isoformat(),
        "version": "1.0",
        "files": []
    }
    
    for backup_file in backup_files:
        if backup_file and os.path.exists(backup_file):
            file_info = {
                "path": backup_file,
                "size": os.path.getsize(backup_file),
                "type": os.path.splitext(backup_file)[1],
                "sha256": compute_file_hash(backup_file)
            }
            manifest["files"].append(file_info)
    
    with open(manifest_path, "w") as f:
        json.dump(manifest, f, indent=2)
    
    logger.info(f"백업 매니페스트 생성: {manifest_path}")

def compute_file_hash(file_path):
    """파일의 SHA-256 해시값 계산"""
    import hashlib
    
    sha256_hash = hashlib.sha256()
    
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    
    return sha256_hash.hexdigest()

def clean_old_backups(backup_dir, retention_days):
    """
    오래된 백업 파일 삭제
    
    Args:
        backup_dir: 백업 디렉토리
        retention_days: 보관 기간 (일)
    """
    now = datetime.datetime.now()
    cutoff_date = now - datetime.timedelta(days=retention_days)
    
    for root, dirs, files in os.walk(backup_dir):
        for filename in files:
            file_path = os.path.join(root, filename)
            file_mtime = datetime.datetime.fromtimestamp(os.path.getmtime(file_path))
            
            if file_mtime < cutoff_date:
                try:
                    os.remove(file_path)
                    logger.info(f"오래된 백업 파일 삭제: {file_path}")
                except Exception as e:
                    logger.error(f"백업 파일 삭제 실패: {file_path}, 오류: {str(e)}")

def main():
    """메인 함수"""
    parser = argparse.ArgumentParser(description="Christmas 프로젝트 백업 도구")
    
    parser.add_argument("--db-host", default=os.environ.get("CHRISTMAS_DB_HOST", "localhost"))
    parser.add_argument("--db-port", default=os.environ.get("CHRISTMAS_DB_PORT", "5432"))
    parser.add_argument("--db-user", default=os.environ.get("CHRISTMAS_DB_USER", "christmas"))
    parser.add_argument("--db-password", default=os.environ.get("CHRISTMAS_DB_PASSWORD", "christmas"))
    parser.add_argument("--db-name", default=os.environ.get("CHRISTMAS_DB_NAME", "christmas"))
    
    parser.add_argument("--redis-host", default=os.environ.get("CHRISTMAS_REDIS_HOST", "localhost"))
    parser.add_argument("--redis-port", default=os.environ.get("CHRISTMAS_REDIS_PORT", "6379"))
    parser.add_argument("--redis-password", default=os.environ.get("CHRISTMAS_REDIS_PASSWORD", ""))
    
    parser.add_argument("--backup-dir", default=os.path.join(project_root, "backups"))
    parser.add_argument("--retention-days", type=int, default=30)
    
    args = parser.parse_args()
    
    # 백업 디렉토리 확인
    ensure_backup_dir(args.backup_dir)
    
    # 타임스탬프 생성
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # 백업 파일 경로 설정
    db_backup_path = os.path.join(args.backup_dir, f"db_{args.db_name}_{timestamp}.dump")
    config_backup_path = os.path.join(args.backup_dir, f"config_{timestamp}.tar.gz")
    redis_backup_path = os.path.join(args.backup_dir, f"redis_{timestamp}.rdb")
    manifest_path = os.path.join(args.backup_dir, f"manifest_{timestamp}.json")
    
    # 백업 실행
    logger.info("백업 프로세스 시작")
    
    backup_files = []
    
    # 데이터베이스 백업
    db_result = backup_database(
        args.db_host, args.db_port, args.db_user, args.db_password, 
        args.db_name, db_backup_path
    )
    if db_result:
        backup_files.append(db_result)
    
    # 설정 파일 백업
    config_result = backup_config_files(
        os.path.join(project_root, "config"), 
        config_backup_path
    )
    if config_result:
        backup_files.append(config_result)
    
    # Redis 백업
    redis_result = backup_redis(
        args.redis_host, args.redis_port, args.redis_password,
        redis_backup_path
    )
    if redis_result:
        backup_files.append(redis_result)
    
    # 매니페스트 파일 생성
    create_backup_manifest(backup_files, manifest_path)
    
    # 오래된 백업 정리
    clean_old_backups(args.backup_dir, args.retention_days)
    
    logger.info("백업 프로세스 완료")

if __name__ == "__main__":
    main() 