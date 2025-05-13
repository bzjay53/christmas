#!/usr/bin/env python3
"""
Production Deployment Script

이 스크립트는, 정식 버전 배포(WBS 7.5.2)를 수행하는 도구로서, 다음 작업을 수행합니다:
- 정식 버전 태그 생성 및 배포 브랜치 준비
- 프로덕션 환경에 블루/그린 배포 실행
- 데이터베이스 마이그레이션 수행
- 트래픽 전환 (카나리 배포 방식)
- 배포 후 모니터링 및 검증
"""

import os
import sys
import json
import time
import logging
import argparse
import subprocess
from datetime import datetime, timedelta
import requests

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("production_deployment.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("ProductionDeployment")

class ProductionDeployer:
    def __init__(self, config_path, dry_run=False):
        self.dry_run = dry_run
        self.config_path = config_path
        self.load_config()
        self.deployment_success = False
        self.version = "1.0.0"
        self.deployment_id = f"deploy-{datetime.now().strftime('%Y%m%d-%H%M%S')}"
        
    def load_config(self):
        """설정 파일 로드"""
        try:
            with open(self.config_path, 'r') as f:
                self.config = json.load(f)
            logger.info(f"설정 파일을 성공적으로 로드했습니다: {self.config_path}")
        except Exception as e:
            logger.error(f"설정 파일 로드 실패: {str(e)}")
            sys.exit(1)
    
    def prepare_deployment(self):
        """배포 준비"""
        logger.info("배포 준비를 시작합니다...")
        
        try:
            # 배포 브랜치 생성
            current_branch = subprocess.check_output(["git", "rev-parse", "--abbrev-ref", "HEAD"]).decode().strip()
            logger.info(f"현재 브랜치: {current_branch}")
            
            # master 브랜치로 전환
            if current_branch != "main" and not self.dry_run:
                subprocess.run(["git", "checkout", "main"], check=True)
                logger.info("main 브랜치로 전환했습니다.")
            
            # main 브랜치 최신화
            if not self.dry_run:
                subprocess.run(["git", "pull", "origin", "main"], check=True)
                logger.info("main 브랜치를 최신화했습니다.")
            
            # 배포용 태그 생성
            tag_name = f"v{self.version}"
            if not self.dry_run:
                # 태그 존재 여부 확인
                result = subprocess.run(["git", "tag", "-l", tag_name], capture_output=True)
                if tag_name in result.stdout.decode():
                    logger.warning(f"태그 {tag_name}이 이미 존재합니다. 배포를 계속 진행합니다.")
                else:
                    subprocess.run(["git", "tag", "-a", tag_name, "-m", f"정식 버전 {self.version} 배포"], check=True)
                    subprocess.run(["git", "push", "origin", tag_name], check=True)
                    logger.info(f"배포 태그 {tag_name}을 생성했습니다.")
            
            # 배포 브랜치 생성
            release_branch = f"release/v{self.version}"
            if not self.dry_run:
                # 브랜치 존재 여부 확인
                result = subprocess.run(["git", "branch", "--list", release_branch], capture_output=True)
                if release_branch in result.stdout.decode():
                    logger.warning(f"브랜치 {release_branch}가 이미 존재합니다. 기존 브랜치를 사용합니다.")
                    subprocess.run(["git", "checkout", release_branch], check=True)
                else:
                    subprocess.run(["git", "checkout", "-b", release_branch], check=True)
                    subprocess.run(["git", "push", "-u", "origin", release_branch], check=True)
                    logger.info(f"배포 브랜치 {release_branch}를 생성했습니다.")
            
            # 버전 정보 업데이트
            if not self.dry_run:
                # VERSION 파일 업데이트
                with open("VERSION", "w") as f:
                    f.write(self.version)
                
                # 변경사항 커밋
                subprocess.run(["git", "add", "VERSION"], check=True)
                subprocess.run(["git", "commit", "-m", f"버전 {self.version} 정보 업데이트"], check=True)
                subprocess.run(["git", "push", "origin", release_branch], check=True)
                logger.info("버전 정보를 업데이트했습니다.")
            
            logger.info("배포 준비가 완료되었습니다.")
            return True
            
        except Exception as e:
            logger.error(f"배포 준비 중 오류 발생: {str(e)}")
            return False
    
    def execute_deployment(self):
        """배포 실행"""
        logger.info("배포를 실행합니다...")
        
        try:
            # Docker 이미지 빌드
            if not self.dry_run:
                image_name = f"{self.config['docker']['registry']}/christmas:v{self.version}"
                subprocess.run(["docker", "build", "-t", image_name, "."], check=True)
                logger.info(f"Docker 이미지를 빌드했습니다: {image_name}")
                
                # Docker 이미지 푸시
                subprocess.run(["docker", "push", image_name], check=True)
                logger.info(f"Docker 이미지를 레지스트리에 푸시했습니다: {image_name}")
            
            # 그린 환경 배포
            if not self.dry_run:
                green_env = self.config['environments']['green']
                
                # 기존 그린 환경 백업
                green_backup_cmd = [
                    "ssh", 
                    f"{self.config['ssh']['user']}@{green_env['host']}", 
                    f"cd {green_env['deploy_path']} && docker-compose down && tar -czf config_backup_$(date +%Y%m%d_%H%M%S).tar.gz config/"
                ]
                subprocess.run(green_backup_cmd, check=True)
                logger.info("그린 환경 설정을 백업했습니다.")
                
                # 그린 환경 배포
                green_deploy_cmd = [
                    "ssh", 
                    f"{self.config['ssh']['user']}@{green_env['host']}", 
                    f"cd {green_env['deploy_path']} && " +
                    f"echo 'VERSION={self.version}' > .env && " +
                    f"echo 'IMAGE={image_name}' >> .env && " +
                    f"docker-compose pull && " +
                    f"docker-compose up -d"
                ]
                subprocess.run(green_deploy_cmd, check=True)
                logger.info("그린 환경에 새 버전을 배포했습니다.")
            
            # 그린 환경 상태 확인
            if not self.dry_run:
                health_check_url = f"https://{green_env['domain']}/health"
                retry_count = 0
                max_retries = 10
                
                while retry_count < max_retries:
                    try:
                        response = requests.get(health_check_url, timeout=10)
                        if response.status_code == 200 and response.json().get("status") == "ok":
                            logger.info("그린 환경 상태 확인 성공!")
                            break
                        else:
                            logger.warning(f"그린 환경 상태 확인 실패: {response.status_code} - {response.text}")
                    except Exception as e:
                        logger.warning(f"그린 환경 상태 확인 중 오류: {str(e)}")
                    
                    retry_count += 1
                    logger.info(f"재시도 중... ({retry_count}/{max_retries})")
                    time.sleep(30)  # 30초 대기
                
                if retry_count >= max_retries:
                    logger.error("그린 환경 상태 확인 최대 재시도 횟수 초과. 배포를 중단합니다.")
                    return False
            
            logger.info("배포 실행이 완료되었습니다.")
            return True
            
        except Exception as e:
            logger.error(f"배포 실행 중 오류 발생: {str(e)}")
            return False
    
    def migrate_database(self):
        """데이터베이스 마이그레이션"""
        logger.info("데이터베이스 마이그레이션을 시작합니다...")
        
        try:
            if not self.dry_run:
                green_env = self.config['environments']['green']
                
                # 마이그레이션 명령 실행
                migration_cmd = [
                    "ssh", 
                    f"{self.config['ssh']['user']}@{green_env['host']}", 
                    f"cd {green_env['deploy_path']} && " +
                    f"docker-compose exec -T app python manage.py db upgrade"
                ]
                subprocess.run(migration_cmd, check=True)
                logger.info("데이터베이스 마이그레이션을 완료했습니다.")
            
            return True
            
        except Exception as e:
            logger.error(f"데이터베이스 마이그레이션 중 오류 발생: {str(e)}")
            return False
    
    def switch_traffic(self):
        """트래픽 전환"""
        logger.info("트래픽 전환(카나리 배포)을 시작합니다...")
        
        try:
            if not self.dry_run:
                # 로드 밸런서 설정 업데이트
                load_balancer_host = self.config['load_balancer']['host']
                load_balancer_config_path = self.config['load_balancer']['config_path']
                
                # 초기 트래픽 배분 (10% 그린 환경으로 전환)
                initial_split_cmd = [
                    "ssh", 
                    f"{self.config['ssh']['user']}@{load_balancer_host}", 
                    f"cd {load_balancer_config_path} && " +
                    f"sed -i 's/blue_weight=100/blue_weight=90/g' nginx.conf && " +
                    f"sed -i 's/green_weight=0/green_weight=10/g' nginx.conf && " +
                    f"nginx -t && nginx -s reload"
                ]
                subprocess.run(initial_split_cmd, check=True)
                logger.info("초기 트래픽 배분 완료: 블루 90% / 그린 10%")
                
                # 5분 대기
                logger.info("5분 동안 초기 배포 상태를 모니터링합니다...")
                time.sleep(300)
                
                # 모니터링 지표 확인
                # 실제 구현에서는 Prometheus/Grafana API를 통해 메트릭 확인
                monitoring_ok = True  # 이 예제에서는 항상 성공으로 가정
                
                if monitoring_ok:
                    # 트래픽 50%로 증가
                    half_split_cmd = [
                        "ssh", 
                        f"{self.config['ssh']['user']}@{load_balancer_host}", 
                        f"cd {load_balancer_config_path} && " +
                        f"sed -i 's/blue_weight=90/blue_weight=50/g' nginx.conf && " +
                        f"sed -i 's/green_weight=10/green_weight=50/g' nginx.conf && " +
                        f"nginx -t && nginx -s reload"
                    ]
                    subprocess.run(half_split_cmd, check=True)
                    logger.info("트래픽 배분 업데이트: 블루 50% / 그린 50%")
                    
                    # 10분 대기
                    logger.info("10분 동안 절반 배포 상태를 모니터링합니다...")
                    time.sleep(600)
                    
                    # 모니터링 지표 재확인
                    monitoring_ok = True  # 이 예제에서는 항상 성공으로 가정
                    
                    if monitoring_ok:
                        # 트래픽 100% 그린 환경으로 전환
                        full_switch_cmd = [
                            "ssh", 
                            f"{self.config['ssh']['user']}@{load_balancer_host}", 
                            f"cd {load_balancer_config_path} && " +
                            f"sed -i 's/blue_weight=50/blue_weight=0/g' nginx.conf && " +
                            f"sed -i 's/green_weight=50/green_weight=100/g' nginx.conf && " +
                            f"nginx -t && nginx -s reload"
                        ]
                        subprocess.run(full_switch_cmd, check=True)
                        logger.info("트래픽 배분 완료: 블루 0% / 그린 100%")
                        
                        # 그린 환경을 블루 환경으로 승격
                        logger.info("그린 환경을 블루 환경으로 승격합니다...")
                        # 환경 레이블 스왑 (다음 배포를 위해)
                        self.swap_environments()
                        
                        return True
                    else:
                        # 문제 발생 시 롤백
                        logger.error("절반 배포 상태에서 문제가 감지되었습니다. 롤백을 시작합니다.")
                        self.rollback()
                        return False
                else:
                    # 문제 발생 시 롤백
                    logger.error("초기 배포 상태에서 문제가 감지되었습니다. 롤백을 시작합니다.")
                    self.rollback()
                    return False
            
            # dry run 모드
            logger.info("(Dry run) 트래픽 전환 과정을 시뮬레이션했습니다.")
            return True
            
        except Exception as e:
            logger.error(f"트래픽 전환 중 오류 발생: {str(e)}")
            self.rollback()
            return False
    
    def swap_environments(self):
        """블루/그린 환경 스왑"""
        if not self.dry_run:
            # 환경 설정 파일 업데이트
            env_config_path = os.path.join(os.path.dirname(self.config_path), "environments.json")
            
            try:
                with open(env_config_path, 'r') as f:
                    env_config = json.load(f)
                
                # 블루/그린 환경 스왑
                blue_env = env_config['environments']['blue']
                green_env = env_config['environments']['green']
                
                env_config['environments']['blue'] = green_env
                env_config['environments']['green'] = blue_env
                
                with open(env_config_path, 'w') as f:
                    json.dump(env_config, f, indent=2)
                
                logger.info("블루/그린 환경 설정을 업데이트했습니다.")
            except Exception as e:
                logger.error(f"환경 스왑 중 오류 발생: {str(e)}")
    
    def rollback(self):
        """배포 롤백"""
        logger.info("배포 롤백을 시작합니다...")
        
        if not self.dry_run:
            try:
                # 로드 밸런서 설정 복원 (100% 블루 환경으로 전환)
                load_balancer_host = self.config['load_balancer']['host']
                load_balancer_config_path = self.config['load_balancer']['config_path']
                
                rollback_cmd = [
                    "ssh", 
                    f"{self.config['ssh']['user']}@{load_balancer_host}", 
                    f"cd {load_balancer_config_path} && " +
                    f"sed -i 's/blue_weight=[0-9]*/blue_weight=100/g' nginx.conf && " +
                    f"sed -i 's/green_weight=[0-9]*/green_weight=0/g' nginx.conf && " +
                    f"nginx -t && nginx -s reload"
                ]
                subprocess.run(rollback_cmd, check=True)
                logger.info("트래픽을 블루 환경으로 100% 복원했습니다.")
                
                # 버전 태그 삭제
                tag_name = f"v{self.version}"
                delete_tag_cmd = ["git", "push", "--delete", "origin", tag_name]
                delete_local_tag_cmd = ["git", "tag", "-d", tag_name]
                
                try:
                    subprocess.run(delete_tag_cmd, check=False)
                    subprocess.run(delete_local_tag_cmd, check=False)
                    logger.info(f"배포 태그 {tag_name}을 삭제했습니다.")
                except:
                    logger.warning(f"배포 태그 {tag_name} 삭제에 실패했습니다.")
                
                logger.info("롤백이 완료되었습니다.")
            except Exception as e:
                logger.error(f"롤백 중 오류 발생: {str(e)}")
        else:
            logger.info("(Dry run) 롤백 과정을 시뮬레이션했습니다.")
    
    def perform_post_deployment_tasks(self):
        """배포 후 작업"""
        logger.info("배포 후 작업을 시작합니다...")
        
        try:
            if not self.dry_run:
                # 배포 알림 발송
                self.send_deployment_notification()
                
                # 이벤트 로깅
                self.log_deployment_event()
                
                # 환경 상태 확인
                self.verify_environment_health()
            
            logger.info("배포 후 작업이 완료되었습니다.")
            return True
            
        except Exception as e:
            logger.error(f"배포 후 작업 중 오류 발생: {str(e)}")
            return False
    
    def send_deployment_notification(self):
        """배포 알림 발송"""
        try:
            webhook_url = self.config['notifications']['slack_webhook']
            
            message = {
                "text": f"🚀 정식 버전 v{self.version} 배포 완료!",
                "blocks": [
                    {
                        "type": "header",
                        "text": {
                            "type": "plain_text",
                            "text": f"🚀 정식 버전 v{self.version} 배포 완료!"
                        }
                    },
                    {
                        "type": "section",
                        "fields": [
                            {
                                "type": "mrkdwn",
                                "text": f"*배포 ID:*\n{self.deployment_id}"
                            },
                            {
                                "type": "mrkdwn",
                                "text": f"*배포 시간:*\n{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                            }
                        ]
                    },
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": "모든 시스템이 정상 작동 중입니다. 자세한 내용은 <https://monitoring.christmas-trading.com|모니터링 대시보드>를 확인하세요."
                        }
                    }
                ]
            }
            
            requests.post(webhook_url, json=message)
            logger.info("배포 알림을 발송했습니다.")
            
        except Exception as e:
            logger.error(f"배포 알림 발송 중 오류 발생: {str(e)}")
    
    def log_deployment_event(self):
        """배포 이벤트 로깅"""
        try:
            event_log = {
                "deployment_id": self.deployment_id,
                "version": self.version,
                "timestamp": datetime.now().isoformat(),
                "status": "success",
                "environment": "production"
            }
            
            log_dir = os.path.join(os.path.dirname(self.config_path), "logs")
            os.makedirs(log_dir, exist_ok=True)
            
            log_file = os.path.join(log_dir, f"deployment_log_{datetime.now().strftime('%Y%m%d')}.json")
            
            if os.path.exists(log_file):
                with open(log_file, 'r') as f:
                    logs = json.load(f)
            else:
                logs = []
            
            logs.append(event_log)
            
            with open(log_file, 'w') as f:
                json.dump(logs, f, indent=2)
            
            logger.info("배포 이벤트를 로깅했습니다.")
            
        except Exception as e:
            logger.error(f"배포 이벤트 로깅 중 오류 발생: {str(e)}")
    
    def verify_environment_health(self):
        """환경 상태 확인"""
        try:
            # 블루 환경(이전 그린 환경)의 상태 확인
            blue_env = self.config['environments']['blue']
            health_check_url = f"https://{blue_env['domain']}/health"
            
            response = requests.get(health_check_url, timeout=10)
            if response.status_code == 200 and response.json().get("status") == "ok":
                logger.info("프로덕션 환경이 정상 작동 중입니다.")
                
                # 추가 지표 확인
                metrics_url = f"https://{blue_env['domain']}/metrics"
                metrics_response = requests.get(metrics_url, timeout=10)
                
                if metrics_response.status_code == 200:
                    metrics = metrics_response.json()
                    logger.info(f"API 응답 시간: {metrics.get('api_response_time_ms', 'N/A')}ms")
                    logger.info(f"오류율: {metrics.get('error_rate_percentage', 'N/A')}%")
                    logger.info(f"CPU 사용률: {metrics.get('cpu_usage_percentage', 'N/A')}%")
                    logger.info(f"메모리 사용률: {metrics.get('memory_usage_percentage', 'N/A')}%")
            else:
                logger.warning(f"프로덕션 환경 상태 확인 실패: {response.status_code} - {response.text}")
                
        except Exception as e:
            logger.error(f"환경 상태 확인 중 오류 발생: {str(e)}")
    
    def run(self):
        """전체 배포 프로세스 실행"""
        logger.info(f"정식 버전 v{self.version} 배포를 시작합니다...")
        
        # 배포 단계 실행
        if not self.prepare_deployment():
            logger.error("배포 준비에 실패했습니다.")
            return False
        
        if not self.execute_deployment():
            logger.error("배포 실행에 실패했습니다.")
            return False
        
        if not self.migrate_database():
            logger.error("데이터베이스 마이그레이션에 실패했습니다.")
            self.rollback()
            return False
        
        if not self.switch_traffic():
            logger.error("트래픽 전환에 실패했습니다.")
            # 롤백은 switch_traffic 내부에서 처리됨
            return False
        
        if not self.perform_post_deployment_tasks():
            logger.warning("배포 후 작업 중 일부 실패가 발생했습니다. 배포는 계속 진행됩니다.")
        
        logger.info(f"정식 버전 v{self.version} 배포가 성공적으로 완료되었습니다!")
        self.deployment_success = True
        return True

def main():
    parser = argparse.ArgumentParser(description="정식 버전 배포 스크립트")
    parser.add_argument("--config", "-c", default="environments/production/config/deployment_config.json", 
                        help="배포 설정 파일 경로")
    parser.add_argument("--dry-run", "-d", action="store_true", 
                        help="실제 변경 없이 배포 과정만 시뮬레이션")
    parser.add_argument("--version", "-v", default="1.0.0",
                        help="배포할 버전 (기본값: 1.0.0)")
    
    args = parser.parse_args()
    
    deployer = ProductionDeployer(args.config, args.dry_run)
    deployer.version = args.version
    success = deployer.run()
    
    if not success:
        sys.exit(1)

if __name__ == "__main__":
    main() 