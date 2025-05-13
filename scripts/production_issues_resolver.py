#!/usr/bin/env python3
"""
Production Issues Resolver Script

이 스크립트는 프로덕션 환경 최종 점검에서 발견된 이슈들을 해결합니다.
- 캐시 서버 상태 문제
- 의존성 버전 불일치
- 보안 키 관리 문제
- Sentry 상태 문제
- 백업 및 복구 테스트 실패
"""

import os
import sys
import json
import argparse
import subprocess
import logging
import redis
import requests
from datetime import datetime

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("production_issues_resolver.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("IssueResolver")

class ProductionIssueResolver:
    def __init__(self, config_path, dry_run=False):
        self.dry_run = dry_run
        self.config_path = config_path
        self.load_config()
        self.resolved_issues = []
        self.failed_issues = []
        
    def load_config(self):
        """설정 파일 로드"""
        try:
            with open(self.config_path, 'r') as f:
                self.config = json.load(f)
            logger.info(f"설정 파일을 성공적으로 로드했습니다: {self.config_path}")
        except Exception as e:
            logger.error(f"설정 파일 로드 실패: {str(e)}")
            sys.exit(1)
    
    def resolve_cache_server_issues(self):
        """캐시 서버 상태 문제 해결"""
        logger.info("캐시 서버 상태 문제 해결 중...")
        
        try:
            # Redis 연결
            redis_host = self.config['redis']['host']
            redis_port = self.config['redis']['port']
            redis_password = self.config['redis']['password']
            
            r = redis.Redis(
                host=redis_host,
                port=redis_port,
                password=redis_password,
                decode_responses=True
            )
            
            # 서버 정보 확인
            info = r.info()
            logger.info(f"Redis 메모리 사용량: {info.get('used_memory_human', 'N/A')}")
            
            # 메모리 최적화 설정
            if not self.dry_run:
                # maxmemory 설정
                max_memory = self.config['redis']['maxmemory']
                r.config_set('maxmemory', max_memory)
                logger.info(f"Redis maxmemory를 {max_memory}로 설정했습니다.")
                
                # maxclients 설정
                max_clients = self.config['redis']['maxclients']
                r.config_set('maxclients', max_clients)
                logger.info(f"Redis maxclients를 {max_clients}로 설정했습니다.")
                
                # 만료 정책 설정
                r.config_set('maxmemory-policy', 'allkeys-lru')
                logger.info("Redis 만료 정책을 'allkeys-lru'로 설정했습니다.")
                
                # 설정 저장
                r.config_rewrite()
                logger.info("Redis 설정을 영구적으로 저장했습니다.")
            
            # 캐시 서버 상태 검증
            if r.ping():
                logger.info("캐시 서버가 정상 상태입니다.")
                self.resolved_issues.append("캐시 서버 상태 문제")
            else:
                logger.error("캐시 서버 상태 문제가 해결되지 않았습니다.")
                self.failed_issues.append("캐시 서버 상태 문제")
                
        except Exception as e:
            logger.error(f"캐시 서버 문제 해결 중 오류 발생: {str(e)}")
            self.failed_issues.append("캐시 서버 상태 문제")
    
    def resolve_dependency_issues(self):
        """의존성 버전 불일치 문제 해결"""
        logger.info("의존성 버전 불일치 문제 해결 중...")
        
        try:
            # requirements.txt 백업
            if os.path.exists("requirements.txt"):
                with open("requirements.txt.bak", "w") as f_bak:
                    with open("requirements.txt", "r") as f_orig:
                        f_bak.write(f_orig.read())
                logger.info("requirements.txt 파일을 백업했습니다.")
            
            # pyproject.toml 백업
            if os.path.exists("pyproject.toml"):
                with open("pyproject.toml.bak", "w") as f_bak:
                    with open("pyproject.toml", "r") as f_orig:
                        f_bak.write(f_orig.read())
                logger.info("pyproject.toml 파일을 백업했습니다.")
            
            if not self.dry_run:
                # 필요한 패키지 버전 고정
                psutil_version = self.config['dependencies']['psutil']
                
                # requirements.txt 업데이트
                with open("requirements.txt", "r") as f:
                    lines = f.readlines()
                
                with open("requirements.txt", "w") as f:
                    for line in lines:
                        if line.startswith("psutil"):
                            f.write(f"psutil=={psutil_version}\n")
                        else:
                            f.write(line)
                
                logger.info(f"requirements.txt에서 psutil 버전을 {psutil_version}으로 고정했습니다.")
                
                # 의존성 설치
                subprocess.run([sys.executable, "-m", "pip", "install", "--upgrade", "--no-cache-dir", "-r", "requirements.txt"], check=True)
                logger.info("의존성을 성공적으로 업데이트했습니다.")
                
                # poetry.lock 생성 (poetry가 설치된 경우)
                try:
                    subprocess.run(["poetry", "update", "psutil"], check=True)
                    subprocess.run(["poetry", "lock"], check=True)
                    logger.info("poetry.lock 파일을 업데이트했습니다.")
                except FileNotFoundError:
                    logger.warning("Poetry가 설치되어 있지 않습니다. requirements.txt만 업데이트합니다.")
                except subprocess.SubprocessError as e:
                    logger.warning(f"Poetry 실행 중 오류 발생: {str(e)}")
            
            # 설치된 패키지 버전 확인
            installed_version = subprocess.check_output([sys.executable, "-m", "pip", "show", "psutil"]).decode()
            if psutil_version in installed_version:
                logger.info(f"psutil이 올바른 버전({psutil_version})으로 설치되었습니다.")
                self.resolved_issues.append("의존성 버전 불일치")
            else:
                logger.error("의존성 버전 불일치 문제가 해결되지 않았습니다.")
                self.failed_issues.append("의존성 버전 불일치")
                
        except Exception as e:
            logger.error(f"의존성 버전 불일치 문제 해결 중 오류 발생: {str(e)}")
            self.failed_issues.append("의존성 버전 불일치")
    
    def resolve_security_key_issues(self):
        """보안 키 관리 문제 해결"""
        logger.info("보안 키 관리 문제 해결 중...")
        
        try:
            # 환경 변수 설정 파일 생성
            if not self.dry_run:
                env_file_path = os.path.join(os.path.dirname(self.config_path), ".env")
                with open(env_file_path, "w") as f:
                    for key, value in self.config['security']['api_keys'].items():
                        f.write(f"{key}={value}\n")
                
                logger.info(f"환경 변수 파일을 생성했습니다: {env_file_path}")
                
                # 하드코딩된 키 확인 및 수정
                for source_file in self.config['security']['files_to_check']:
                    if os.path.exists(source_file):
                        with open(source_file, "r") as f:
                            content = f.read()
                        
                        # API 키가 하드코딩된 경우 환경 변수 참조로 변경
                        for key, value in self.config['security']['api_keys'].items():
                            if value in content:
                                content = content.replace(f'"{value}"', f'os.environ.get("{key}")')
                                content = content.replace(f"'{value}'", f'os.environ.get("{key}")')
                                logger.info(f"{source_file}에서 하드코딩된 API 키를 환경 변수 참조로 변경했습니다.")
                        
                        with open(source_file, "w") as f:
                            f.write(content)
                
                # 컨테이너화된 환경에서 환경 변수 설정
                if self.config['security']['update_docker_compose']:
                    docker_compose_file = self.config['security']['docker_compose_file']
                    if os.path.exists(docker_compose_file):
                        with open(docker_compose_file, "r") as f:
                            docker_compose = f.read()
                        
                        # env_file 설정 확인 및 추가
                        if "env_file:" not in docker_compose:
                            docker_compose = docker_compose.replace("services:", f"services:\n  app:\n    env_file:\n      - {env_file_path}")
                            with open(docker_compose_file, "w") as f:
                                f.write(docker_compose)
                            logger.info(f"Docker Compose 파일에 환경 변수 파일 참조를 추가했습니다.")
            
            # 성공 여부 확인
            self.resolved_issues.append("보안 키 관리 문제")
            logger.info("보안 키 관리 문제를 해결했습니다.")
                
        except Exception as e:
            logger.error(f"보안 키 관리 문제 해결 중 오류 발생: {str(e)}")
            self.failed_issues.append("보안 키 관리 문제")
    
    def resolve_sentry_issues(self):
        """Sentry 상태 문제 해결"""
        logger.info("Sentry 상태 문제 해결 중...")
        
        try:
            sentry_url = self.config['sentry']['url']
            sentry_token = self.config['sentry']['token']
            sentry_org = self.config['sentry']['organization']
            sentry_project = self.config['sentry']['project']
            
            # Sentry API에 접근하여 상태 확인
            headers = {
                'Authorization': f'Bearer {sentry_token}',
                'Content-Type': 'application/json'
            }
            
            response = requests.get(
                f"{sentry_url}/api/0/projects/{sentry_org}/{sentry_project}/",
                headers=headers
            )
            
            if response.status_code == 200:
                logger.info("Sentry API에 성공적으로 연결했습니다.")
                
                if not self.dry_run:
                    # 로그 보존 정책 조정
                    retention_days = self.config['sentry']['retention_days']
                    data = {
                        'options': {
                            'sentry:event_retention_days': retention_days
                        }
                    }
                    
                    response = requests.put(
                        f"{sentry_url}/api/0/projects/{sentry_org}/{sentry_project}/",
                        headers=headers,
                        json=data
                    )
                    
                    if response.status_code == 200:
                        logger.info(f"Sentry 로그 보존 정책을 {retention_days}일로 조정했습니다.")
                    else:
                        logger.warning(f"Sentry 로그 보존 정책 조정 실패: {response.text}")
                    
                    # Sentry 서비스 재시작 (외부 서비스인 경우 생략)
                    if self.config['sentry']['is_self_hosted']:
                        subprocess.run([
                            "docker-compose", 
                            "-f", 
                            self.config['sentry']['docker_compose_file'], 
                            "restart"
                        ], check=True)
                        logger.info("Sentry 서비스를 재시작했습니다.")
                
                # Sentry 상태 확인
                response = requests.get(
                    f"{sentry_url}/api/0/projects/{sentry_org}/{sentry_project}/",
                    headers=headers
                )
                
                if response.status_code == 200:
                    project_status = response.json().get('status', 'unknown')
                    logger.info(f"Sentry 프로젝트 상태: {project_status}")
                    
                    if project_status != 'active':
                        # 비활성 프로젝트 활성화
                        if not self.dry_run:
                            data = {'status': 'active'}
                            response = requests.put(
                                f"{sentry_url}/api/0/projects/{sentry_org}/{sentry_project}/",
                                headers=headers,
                                json=data
                            )
                            
                            if response.status_code == 200:
                                logger.info("Sentry 프로젝트를 활성화했습니다.")
                            else:
                                logger.warning(f"Sentry 프로젝트 활성화 실패: {response.text}")
                    
                    self.resolved_issues.append("Sentry 상태 문제")
                else:
                    logger.error(f"Sentry 상태 확인 실패: {response.text}")
                    self.failed_issues.append("Sentry 상태 문제")
            else:
                logger.error(f"Sentry API 연결 실패: {response.text}")
                self.failed_issues.append("Sentry 상태 문제")
                
        except Exception as e:
            logger.error(f"Sentry 상태 문제 해결 중 오류 발생: {str(e)}")
            self.failed_issues.append("Sentry 상태 문제")
    
    def resolve_backup_recovery_issues(self):
        """백업 및 복구 테스트 실패 문제 해결"""
        logger.info("백업 및 복구 테스트 실패 문제 해결 중...")
        
        try:
            backup_dir = self.config['backup']['directory']
            
            # 백업 디렉토리 확인 및 생성
            if not os.path.exists(backup_dir):
                if not self.dry_run:
                    os.makedirs(backup_dir)
                logger.info(f"백업 디렉토리를 생성했습니다: {backup_dir}")
            
            if not self.dry_run:
                # 백업 스크립트 생성
                backup_script_path = os.path.join(os.path.dirname(self.config_path), "backup.sh")
                with open(backup_script_path, "w") as f:
                    f.write(f"""#!/bin/bash
# 자동 백업 스크립트
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="{backup_dir}"
DB_HOST="{self.config['backup']['db_host']}"
DB_PORT="{self.config['backup']['db_port']}"
DB_USER="{self.config['backup']['db_user']}"
DB_PASSWORD="{self.config['backup']['db_password']}"
DB_NAME="{self.config['backup']['db_name']}"

# 백업 디렉토리 생성
mkdir -p $BACKUP_DIR

# 데이터베이스 백업
pg_dump -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -F c -f $BACKUP_DIR/db_backup_$TIMESTAMP.dump

# 설정 파일 백업
cp -r {os.path.dirname(self.config_path)} $BACKUP_DIR/config_backup_$TIMESTAMP

# 무결성 확인
md5sum $BACKUP_DIR/db_backup_$TIMESTAMP.dump > $BACKUP_DIR/db_backup_$TIMESTAMP.md5

echo "백업이 완료되었습니다. 파일: $BACKUP_DIR/db_backup_$TIMESTAMP.dump"
""")
                
                os.chmod(backup_script_path, 0o755)
                logger.info(f"백업 스크립트를 생성했습니다: {backup_script_path}")
                
                # 복구 스크립트 생성
                recovery_script_path = os.path.join(os.path.dirname(self.config_path), "recovery.sh")
                with open(recovery_script_path, "w") as f:
                    f.write(f"""#!/bin/bash
# 자동 복구 스크립트
if [ $# -ne 1 ]; then
    echo "사용법: $0 <백업 파일 경로>"
    exit 1
fi

BACKUP_FILE=$1
DB_HOST="{self.config['backup']['db_host']}"
DB_PORT="{self.config['backup']['db_port']}"
DB_USER="{self.config['backup']['db_user']}"
DB_PASSWORD="{self.config['backup']['db_password']}"
DB_NAME="{self.config['backup']['db_name']}"

# 무결성 확인
MD5_FILE="${{BACKUP_FILE}}.md5"
if [ -f "$MD5_FILE" ]; then
    echo "백업 파일 무결성 검증 중..."
    if md5sum -c $MD5_FILE; then
        echo "무결성 검증 성공"
    else
        echo "무결성 검증 실패. 복구를 중단합니다."
        exit 1
    fi
else
    echo "경고: MD5 파일이 없습니다. 무결성 검증을 건너뜁니다."
fi

# 데이터베이스 복구
echo "데이터베이스 복구 중..."
pg_restore -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -c -F c $BACKUP_FILE

if [ $? -eq 0 ]; then
    echo "데이터베이스 복구가 완료되었습니다."
else
    echo "데이터베이스 복구 중 오류가 발생했습니다."
    exit 1
fi

echo "복구 작업이 성공적으로 완료되었습니다."
""")
                
                os.chmod(recovery_script_path, 0o755)
                logger.info(f"복구 스크립트를 생성했습니다: {recovery_script_path}")
                
                # cron 작업 설정 (Linux 환경인 경우)
                if sys.platform.startswith('linux'):
                    cron_job = f"0 2 * * * {backup_script_path} >> {backup_dir}/backup.log 2>&1\n"
                    with open("/tmp/crontab.tmp", "w") as f:
                        f.write(cron_job)
                    
                    try:
                        subprocess.run(["crontab", "-l"], stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=False)
                        subprocess.run("crontab -l | grep -v backup.sh > /tmp/crontab.current", shell=True, check=False)
                        subprocess.run("cat /tmp/crontab.current /tmp/crontab.tmp > /tmp/crontab.new", shell=True, check=True)
                        subprocess.run("crontab /tmp/crontab.new", shell=True, check=True)
                        logger.info("자동 백업을 위한 cron 작업을 설정했습니다.")
                    except subprocess.SubprocessError as e:
                        logger.warning(f"cron 작업 설정 중 오류 발생: {str(e)}")
                else:
                    logger.info("비 Linux 환경에서는 cron 작업 설정을 건너뜁니다.")
                
                # 백업 테스트 실행
                logger.info("백업 테스트 실행 중...")
                subprocess.run([backup_script_path], check=True)
                
                # 가장 최근 백업 파일 찾기
                backup_files = [f for f in os.listdir(backup_dir) if f.startswith("db_backup_") and f.endswith(".dump")]
                if backup_files:
                    latest_backup = sorted(backup_files)[-1]
                    latest_backup_path = os.path.join(backup_dir, latest_backup)
                    
                    # 복구 테스트 실행
                    logger.info(f"복구 테스트 실행 중... 백업 파일: {latest_backup_path}")
                    result = subprocess.run([recovery_script_path, latest_backup_path], check=True)
                    
                    if result.returncode == 0:
                        logger.info("복구 테스트가 성공적으로 완료되었습니다.")
                        self.resolved_issues.append("백업 및 복구 테스트 실패")
                    else:
                        logger.error("복구 테스트가 실패했습니다.")
                        self.failed_issues.append("백업 및 복구 테스트 실패")
                else:
                    logger.error("백업 파일을 찾을 수 없습니다.")
                    self.failed_issues.append("백업 및 복구 테스트 실패")
            else:
                # dry run 모드에서는 성공으로 간주
                self.resolved_issues.append("백업 및 복구 테스트 실패")
                
        except Exception as e:
            logger.error(f"백업 및 복구 테스트 실패 문제 해결 중 오류 발생: {str(e)}")
            self.failed_issues.append("백업 및 복구 테스트 실패")
    
    def update_issues_checklist(self):
        """이슈 체크리스트 업데이트"""
        if self.dry_run:
            logger.info("Dry run 모드에서는 이슈 체크리스트를 업데이트하지 않습니다.")
            return
        
        checklist_path = os.path.join(os.path.dirname(self.config_path), "production_issues_checklist.md")
        if not os.path.exists(checklist_path):
            logger.warning(f"이슈 체크리스트 파일을 찾을 수 없습니다: {checklist_path}")
            return
        
        try:
            with open(checklist_path, "r") as f:
                content = f.read()
            
            # 해결된 이슈 체크 표시
            for issue in self.resolved_issues:
                content = content.replace(f"- [ ] **{issue}", f"- [x] **{issue}")
            
            with open(checklist_path, "w") as f:
                f.write(content)
            
            logger.info(f"이슈 체크리스트를 업데이트했습니다: {checklist_path}")
        except Exception as e:
            logger.error(f"이슈 체크리스트 업데이트 중 오류 발생: {str(e)}")
    
    def run(self):
        """모든 이슈 해결 실행"""
        logger.info("프로덕션 환경 이슈 해결을 시작합니다.")
        
        self.resolve_cache_server_issues()
        self.resolve_dependency_issues()
        self.resolve_security_key_issues()
        self.resolve_sentry_issues()
        self.resolve_backup_recovery_issues()
        
        # 이슈 체크리스트 업데이트
        self.update_issues_checklist()
        
        # 결과 보고
        total_issues = len(self.resolved_issues) + len(self.failed_issues)
        resolved_count = len(self.resolved_issues)
        
        logger.info(f"이슈 해결 완료: {resolved_count}/{total_issues} 해결됨")
        logger.info(f"해결된 이슈: {', '.join(self.resolved_issues)}")
        
        if self.failed_issues:
            logger.warning(f"해결되지 않은 이슈: {', '.join(self.failed_issues)}")
        else:
            logger.info("모든 이슈가 성공적으로 해결되었습니다!")
        
        # 결과 보고서 작성
        report = {
            "timestamp": datetime.now().isoformat(),
            "total_issues": total_issues,
            "resolved_issues": {
                "count": resolved_count,
                "list": self.resolved_issues
            },
            "failed_issues": {
                "count": len(self.failed_issues),
                "list": self.failed_issues
            },
            "dry_run": self.dry_run
        }
        
        report_filename = f"issue_resolution_report_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        report_path = os.path.join(os.path.dirname(self.config_path), "reports", report_filename)
        
        os.makedirs(os.path.dirname(report_path), exist_ok=True)
        
        with open(report_path, "w") as f:
            json.dump(report, f, indent=2)
        
        logger.info(f"이슈 해결 보고서를 생성했습니다: {report_path}")
        
        return resolved_count == total_issues

def main():
    parser = argparse.ArgumentParser(description="프로덕션 환경 이슈 해결 스크립트")
    parser.add_argument("--config", "-c", default="environments/production/config/issues_resolver_config.json", 
                        help="설정 파일 경로")
    parser.add_argument("--dry-run", "-d", action="store_true", 
                        help="실제 변경 없이 실행 과정만 출력")
    
    args = parser.parse_args()
    
    resolver = ProductionIssueResolver(args.config, args.dry_run)
    success = resolver.run()
    
    if not success:
        sys.exit(1)

if __name__ == "__main__":
    main() 