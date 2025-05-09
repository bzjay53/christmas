#!/usr/bin/env python
"""
Christmas 프로젝트 - 복구 스크립트
백업으로부터 데이터 복구 자동화
"""

import os
import sys
import argparse
import logging
import json
import hashlib
import subprocess
import shutil
import tarfile
import datetime
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
        logging.FileHandler(os.path.join(project_root, 'logs', 'restore.log'))
    ]
)
logger = logging.getLogger(__name__)

def compute_file_hash(file_path):
    """파일의 SHA-256 해시값 계산"""
    sha256_hash = hashlib.sha256()
    
    with open(file_path, "rb") as f:
        for byte_block in iter(lambda: f.read(4096), b""):
            sha256_hash.update(byte_block)
    
    return sha256_hash.hexdigest()

def verify_backup_files(manifest_path):
    """
    백업 파일의 무결성 검증
    
    Args:
        manifest_path: 매니페스트 파일 경로
        
    Returns:
        검증 결과 (성공: True, 실패: False)
    """
    try:
        with open(manifest_path, "r") as f:
            manifest = json.load(f)
        
        for file_info in manifest.get("files", []):
            file_path = file_info.get("path")
            expected_hash = file_info.get("sha256")
            
            if not file_path or not expected_hash:
                logger.warning(f"매니페스트에 파일 정보 누락: {file_info}")
                continue
            
            if not os.path.exists(file_path):
                logger.error(f"백업 파일을 찾을 수 없음: {file_path}")
                return False
            
            actual_hash = compute_file_hash(file_path)
            if actual_hash != expected_hash:
                logger.error(f"백업 파일 무결성 검증 실패: {file_path}")
                logger.error(f"기대 해시: {expected_hash}, 실제 해시: {actual_hash}")
                return False
            
            logger.info(f"백업 파일 검증 성공: {file_path}")
        
        return True
    
    except Exception as e:
        logger.error(f"백업 검증 중 오류 발생: {str(e)}")
        return False

def restore_database(backup_path, db_host, db_port, db_user, db_password, db_name):
    """
    PostgreSQL 데이터베이스 복구
    
    Returns:
        성공 여부
    """
    try:
        # 먼저 기존 데이터베이스 삭제
        env = os.environ.copy()
        env["PGPASSWORD"] = db_password
        
        drop_cmd = [
            "dropdb", 
            "-h", db_host,
            "-p", str(db_port),
            "-U", db_user,
            "--if-exists",
            db_name
        ]
        
        # 데이터베이스 삭제 실행
        subprocess.run(
            drop_cmd, 
            env=env, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE, 
            text=True,
            check=True
        )
        
        # 빈 데이터베이스 생성
        create_cmd = [
            "createdb", 
            "-h", db_host,
            "-p", str(db_port),
            "-U", db_user,
            db_name
        ]
        
        # 데이터베이스 생성 실행
        subprocess.run(
            create_cmd, 
            env=env, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE, 
            text=True,
            check=True
        )
        
        # pg_restore 명령 구성
        restore_cmd = [
            "pg_restore", 
            "-h", db_host,
            "-p", str(db_port),
            "-U", db_user,
            "-d", db_name,
            "-v",
            backup_path
        ]
        
        # 복구 실행
        result = subprocess.run(
            restore_cmd, 
            env=env, 
            stdout=subprocess.PIPE, 
            stderr=subprocess.PIPE, 
            text=True,
            check=True
        )
        
        logger.info(f"데이터베이스 복구 성공: {db_name}")
        return True
    
    except subprocess.CalledProcessError as e:
        logger.error(f"데이터베이스 복구 실패: {e.stderr}")
        return False

def restore_config_files(backup_path, config_dir, dry_run=False):
    """
    설정 파일 복구
    
    Args:
        backup_path: 백업 파일 경로
        config_dir: 복구할 설정 디렉토리
        dry_run: 실제 복구 여부
        
    Returns:
        성공 여부
    """
    try:
        if dry_run:
            logger.info(f"Dry Run 모드: 설정 파일 추출 시뮬레이션 {backup_path} -> {config_dir}")
            return True
        
        # 먼저 기존 디렉토리 백업
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        backup_dir = f"{config_dir}_backup_{timestamp}"
        if os.path.exists(config_dir):
            shutil.copytree(config_dir, backup_dir)
            logger.info(f"기존 설정 디렉토리 백업: {backup_dir}")
        
        # 압축 해제
        with tarfile.open(backup_path, "r:gz") as tar:
            tar.extractall(path=os.path.dirname(config_dir))
        
        logger.info(f"설정 파일 복구 성공: {config_dir}")
        return True
    
    except Exception as e:
        logger.error(f"설정 파일 복구 실패: {str(e)}")
        return False

def restore_redis(backup_path, redis_host, redis_port, redis_password, dry_run=False):
    """
    Redis 데이터 복구
    
    Returns:
        성공 여부
    """
    try:
        if dry_run:
            logger.info(f"Dry Run 모드: Redis 데이터 복구 시뮬레이션")
            return True
        
        # Redis 서버 중지
        stop_cmd = [
            "redis-cli", 
            "-h", redis_host,
            "-p", str(redis_port),
            "-a", redis_password,
            "SHUTDOWN"
        ]
        
        try:
            subprocess.run(
                stop_cmd, 
                stdout=subprocess.PIPE, 
                stderr=subprocess.PIPE, 
                text=True,
                check=True,
                timeout=5
            )
        except (subprocess.TimeoutExpired, subprocess.CalledProcessError):
            # Redis를 중지할 수 없는 경우 무시
            pass
        
        # Redis dump 파일 복사
        redis_dump_path = "/var/lib/redis/dump.rdb"  # 실제 경로는 환경에 따라 다를 수 있음
        if os.path.exists(os.path.dirname(redis_dump_path)):
            shutil.copy2(backup_path, redis_dump_path)
            logger.info(f"Redis 백업 파일 복사: {backup_path} -> {redis_dump_path}")
        else:
            logger.warning(f"Redis 데이터 디렉토리를 찾을 수 없음: {os.path.dirname(redis_dump_path)}")
            return False
        
        # Redis 서버 시작 (서비스로 관리된다면 서비스 재시작 필요)
        logger.info("Redis 복구를 완료하려면 Redis 서비스를 재시작하세요.")
        return True
    
    except Exception as e:
        logger.error(f"Redis 복구 실패: {str(e)}")
        return False

def main():
    """메인 함수"""
    parser = argparse.ArgumentParser(description="Christmas 프로젝트 복구 도구")
    
    parser.add_argument("manifest_path", help="복구할 백업의 매니페스트 파일 경로")
    
    parser.add_argument("--db-host", default=os.environ.get("CHRISTMAS_DB_HOST", "localhost"))
    parser.add_argument("--db-port", default=os.environ.get("CHRISTMAS_DB_PORT", "5432"))
    parser.add_argument("--db-user", default=os.environ.get("CHRISTMAS_DB_USER", "christmas"))
    parser.add_argument("--db-password", default=os.environ.get("CHRISTMAS_DB_PASSWORD", "christmas"))
    parser.add_argument("--db-name", default=os.environ.get("CHRISTMAS_DB_NAME", "christmas"))
    
    parser.add_argument("--redis-host", default=os.environ.get("CHRISTMAS_REDIS_HOST", "localhost"))
    parser.add_argument("--redis-port", default=os.environ.get("CHRISTMAS_REDIS_PORT", "6379"))
    parser.add_argument("--redis-password", default=os.environ.get("CHRISTMAS_REDIS_PASSWORD", ""))
    
    parser.add_argument("--config-dir", default=os.path.join(project_root, "config"))
    parser.add_argument("--dry-run", action="store_true", help="실제 복구 없이 검증만 수행")
    
    parser.add_argument("--skip-db", action="store_true", help="데이터베이스 복구 건너뛰기")
    parser.add_argument("--skip-config", action="store_true", help="설정 파일 복구 건너뛰기")
    parser.add_argument("--skip-redis", action="store_true", help="Redis 복구 건너뛰기")
    
    args = parser.parse_args()
    
    # 매니페스트 파일 확인
    if not os.path.exists(args.manifest_path):
        logger.error(f"매니페스트 파일을 찾을 수 없음: {args.manifest_path}")
        return 1
    
    # 백업 파일 검증
    logger.info("백업 파일 검증 시작")
    if not verify_backup_files(args.manifest_path):
        logger.error("백업 파일 검증 실패. 복구를 중단합니다.")
        return 1
    
    # 백업 매니페스트 로드
    with open(args.manifest_path, "r") as f:
        manifest = json.load(f)
    
    backup_files = manifest.get("files", [])
    
    # 백업 파일 분류
    db_backup = None
    config_backup = None
    redis_backup = None
    
    for file_info in backup_files:
        file_path = file_info.get("path")
        file_type = file_info.get("type")
        
        if not file_path:
            continue
        
        if file_path.endswith(".dump"):
            db_backup = file_path
        elif file_path.endswith(".tar.gz") and "config" in file_path:
            config_backup = file_path
        elif file_path.endswith(".rdb"):
            redis_backup = file_path
    
    # 복구 시작
    logger.info(f"{'Dry Run 모드: ' if args.dry_run else ''}복구 프로세스 시작")
    
    # 데이터베이스 복구
    if not args.skip_db and db_backup:
        if args.dry_run:
            logger.info(f"Dry Run 모드: 데이터베이스 복구 시뮬레이션: {db_backup}")
        else:
            logger.info(f"데이터베이스 복구 시작: {db_backup}")
            restore_database(
                db_backup, args.db_host, args.db_port, args.db_user,
                args.db_password, args.db_name
            )
    elif args.skip_db:
        logger.info("데이터베이스 복구 건너뛰기")
    elif not db_backup:
        logger.warning("데이터베이스 백업 파일을 찾을 수 없음")
    
    # 설정 파일 복구
    if not args.skip_config and config_backup:
        logger.info(f"설정 파일 복구 시작: {config_backup}")
        restore_config_files(config_backup, args.config_dir, args.dry_run)
    elif args.skip_config:
        logger.info("설정 파일 복구 건너뛰기")
    elif not config_backup:
        logger.warning("설정 파일 백업을 찾을 수 없음")
    
    # Redis 복구
    if not args.skip_redis and redis_backup:
        logger.info(f"Redis 복구 시작: {redis_backup}")
        restore_redis(
            redis_backup, args.redis_host, args.redis_port,
            args.redis_password, args.dry_run
        )
    elif args.skip_redis:
        logger.info("Redis 복구 건너뛰기")
    elif not redis_backup:
        logger.warning("Redis 백업 파일을 찾을 수 없음")
    
    logger.info(f"{'Dry Run 모드: ' if args.dry_run else ''}복구 프로세스 완료")
    
    if args.dry_run:
        logger.info("모든 검증이 성공적으로 완료되었습니다. 실제 복구를 실행하려면 --dry-run 옵션을 제거하세요.")
    
    return 0

if __name__ == "__main__":
    sys.exit(main()) 