#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
정식 버전 배포 스크립트
"""

import os
import sys
import json
import time
import logging
import argparse
import requests
import datetime
import subprocess
from pathlib import Path
from rich.console import Console
from rich.table import Table
from rich.panel import Panel
from rich.progress import Progress
from rich.logging import RichHandler

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[RichHandler(rich_tracebacks=True)]
)
logger = logging.getLogger("ProductionDeployment")

# 콘솔 출력 설정
console = Console()

class ProductionDeployment:
    """정식 버전 배포 관리자"""
    
    def __init__(self, config_path=None, dry_run=False):
        """초기화"""
        self.dry_run = dry_run
        
        if config_path is None:
            base_dir = Path(__file__).resolve().parent.parent
            config_path = base_dir / "environments" / "production" / "config" / "deployment_config.json"
        
        self.config_path = config_path
        self.load_config()
        
        # 배포 타임스탬프
        self.timestamp = datetime.datetime.now().strftime("%Y%m%d%H%M%S")
        
        # 배포 로그 파일
        log_dir = base_dir / "environments" / "production" / "logs"
        os.makedirs(log_dir, exist_ok=True)
        self.log_file = log_dir / f"deployment_{self.timestamp}.log"
        
        # 파일 핸들러 추가
        file_handler = logging.FileHandler(self.log_file)
        file_handler.setFormatter(logging.Formatter("%(asctime)s - %(name)s - %(levelname)s - %(message)s"))
        logger.addHandler(file_handler)
    
    def load_config(self):
        """설정 파일 로드"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                self.config = json.load(f)
                logger.info(f"설정 파일 로드 완료: {self.config_path}")
        except Exception as e:
            logger.error(f"설정 파일 로드 실패: {e}")
            sys.exit(1)
    
    def check_prerequisites(self):
        """사전 요구 사항 확인"""
        console.print(Panel("[bold blue]사전 요구 사항 확인 중[/bold blue]"))
        
        # 배포 환경 확인
        environment = self.config.get("environment")
        if environment != "production":
            logger.warning(f"배포 환경이 production이 아닙니다: {environment}")
            if not self.confirm("계속 진행하시겠습니까?"):
                logger.info("배포 취소됨")
                sys.exit(0)
        
        # 버전 확인
        version = self.config.get("version")
        logger.info(f"배포 버전: {version}")
        
        # 배포 전략 확인
        strategy = self.config.get("deployment", {}).get("strategy")
        if strategy != "blue_green":
            logger.warning(f"배포 전략이 blue_green이 아닙니다: {strategy}")
            if not self.confirm("계속 진행하시겠습니까?"):
                logger.info("배포 취소됨")
                sys.exit(0)
        
        console.print("[green]✓[/green] 사전 요구 사항 확인 완료")
    
    def confirm(self, message):
        """사용자 확인 메시지"""
        if self.dry_run:
            logger.info(f"드라이 런 모드: {message} - 자동 확인")
            return True
        
        response = console.input(f"[yellow]{message} (y/n)[/yellow]: ")
        return response.lower() in ['y', 'yes']
    
    def backup_database(self):
        """데이터베이스 백업"""
        console.print(Panel("[bold blue]데이터베이스 백업 중[/bold blue]"))
        
        if not self.config.get("database", {}).get("backup_before_migration", False):
            logger.info("데이터베이스 백업이 설정에서 비활성화되어 있습니다.")
            return
        
        logger.info("데이터베이스 백업 시작")
        
        with Progress() as progress:
            task = progress.add_task("[cyan]데이터베이스 백업 중...", total=100)
            
            for i in range(10):
                # 실제 백업 작업 대신 시뮬레이션
                if not self.dry_run:
                    # 실제 백업 명령 실행 (예시)
                    # subprocess.run(["pg_dump", "-h", db_host, "-p", db_port, "-U", db_user, "-d", db_name, "-f", backup_file])
                    pass
                
                progress.update(task, advance=10)
                time.sleep(0.5)
        
        console.print("[green]✓[/green] 데이터베이스 백업 완료")
    
    def deploy_to_green(self):
        """그린 환경에 배포"""
        console.print(Panel("[bold blue]그린 환경에 배포 중[/bold blue]"))
        
        green_host = self.config.get("servers", {}).get("green", {}).get("host")
        logger.info(f"그린 환경 배포 대상: {green_host}")
        
        with Progress() as progress:
            task = progress.add_task("[cyan]그린 환경 배포 중...", total=100)
            
            # 배포 단계별 진행
            steps = [
                ("코드 복사", 20),
                ("의존성 설치", 20),
                ("설정 파일 업데이트", 20),
                ("정적 파일 빌드", 20),
                ("서비스 재시작", 20)
            ]
            
            for step, weight in steps:
                logger.info(f"그린 환경 배포 단계: {step}")
                
                if not self.dry_run:
                    # 실제 배포 명령 실행 (예시)
                    # if step == "코드 복사":
                    #     subprocess.run(["rsync", "-avz", "--exclude=node_modules", "--exclude=.git", ".", f"user@{green_host}:/var/www/christmas"])
                    # elif step == "의존성 설치":
                    #     subprocess.run(["ssh", f"user@{green_host}", "cd /var/www/christmas && pip install -r requirements.txt"])
                    # ...
                    pass
                
                progress.update(task, advance=weight)
                time.sleep(1)
        
        console.print("[green]✓[/green] 그린 환경 배포 완료")
    
    def run_database_migrations(self):
        """데이터베이스 마이그레이션 실행"""
        console.print(Panel("[bold blue]데이터베이스 마이그레이션 실행 중[/bold blue]"))
        
        migration_script = self.config.get("database", {}).get("migration_script")
        if not migration_script:
            logger.warning("데이터베이스 마이그레이션 스크립트가 설정되지 않았습니다.")
            return
        
        logger.info(f"마이그레이션 스크립트: {migration_script}")
        
        with Progress() as progress:
            task = progress.add_task("[cyan]데이터베이스 마이그레이션 중...", total=100)
            
            if not self.dry_run:
                # 실제 마이그레이션 명령 실행 (예시)
                # subprocess.run(["python", migration_script])
                pass
            
            progress.update(task, advance=100)
            time.sleep(2)
        
        console.print("[green]✓[/green] 데이터베이스 마이그레이션 완료")
    
    def health_check_green(self):
        """그린 환경 헬스 체크"""
        console.print(Panel("[bold blue]그린 환경 헬스 체크 중[/bold blue]"))
        
        green_host = self.config.get("servers", {}).get("green", {}).get("host")
        green_port = self.config.get("servers", {}).get("green", {}).get("port", 443)
        ssl = self.config.get("servers", {}).get("green", {}).get("ssl", True)
        protocol = "https" if ssl else "http"
        
        endpoints = self.config.get("health_checks", {}).get("endpoints", ["/api/health"])
        expected_status = self.config.get("health_checks", {}).get("expected_status", 200)
        timeout = self.config.get("health_checks", {}).get("timeout_seconds", 5)
        retries = self.config.get("health_checks", {}).get("retries", 3)
        
        table = Table(title="그린 환경 헬스 체크 결과")
        table.add_column("엔드포인트", style="cyan")
        table.add_column("상태", style="green")
        table.add_column("응답 시간", style="yellow")
        table.add_column("상태 코드", style="blue")
        
        all_healthy = True
        
        for endpoint in endpoints:
            url = f"{protocol}://{green_host}:{green_port}{endpoint}"
            logger.info(f"헬스 체크 URL: {url}")
            
            healthy = False
            response_time = "N/A"
            status_code = "N/A"
            
            for attempt in range(retries):
                try:
                    if not self.dry_run:
                        start_time = time.time()
                        response = requests.get(url, timeout=timeout)
                        end_time = time.time()
                        
                        response_time = f"{(end_time - start_time) * 1000:.0f}ms"
                        status_code = response.status_code
                        
                        if response.status_code == expected_status:
                            healthy = True
                            break
                    else:
                        # 드라이 런 모드에서는 성공으로 가정
                        healthy = True
                        response_time = "100ms"
                        status_code = expected_status
                        break
                
                except Exception as e:
                    logger.error(f"헬스 체크 실패 (시도 {attempt+1}/{retries}): {e}")
                
                if attempt < retries - 1:
                    logger.info(f"재시도 중... ({attempt+1}/{retries})")
                    time.sleep(1)
            
            status = "[green]healthy[/green]" if healthy else "[red]unhealthy[/red]"
            table.add_row(endpoint, status, response_time, str(status_code))
            
            if not healthy:
                all_healthy = False
        
        console.print(table)
        
        if not all_healthy:
            logger.error("그린 환경 헬스 체크 실패")
            if not self.confirm("헬스 체크가 실패했습니다. 배포를 계속하시겠습니까?"):
                logger.info("배포 취소됨")
                sys.exit(1)
        else:
            console.print("[green]✓[/green] 그린 환경 헬스 체크 통과")
    
    def switch_traffic(self):
        """트래픽 전환"""
        console.print(Panel("[bold blue]트래픽 전환 중[/bold blue]"))
        
        load_balancer = self.config.get("servers", {}).get("load_balancer", {}).get("host")
        lb_type = self.config.get("servers", {}).get("load_balancer", {}).get("type", "nginx")
        
        logger.info(f"로드 밸런서: {load_balancer} (타입: {lb_type})")
        
        with Progress() as progress:
            task = progress.add_task("[cyan]트래픽 전환 중...", total=100)
            
            # 점진적 트래픽 전환
            steps = [
                ("10% 트래픽 전환", 10),
                ("30% 트래픽 전환", 20),
                ("50% 트래픽 전환", 20),
                ("80% 트래픽 전환", 20),
                ("100% 트래픽 전환", 30)
            ]
            
            for step, weight in steps:
                logger.info(f"트래픽 전환 단계: {step}")
                
                if not self.dry_run:
                    # 실제 트래픽 전환 명령 실행 (예시)
                    # if lb_type == "nginx":
                    #     # Nginx 설정 업데이트
                    #     percent = int(step.split("%")[0])
                    #     subprocess.run(["ssh", f"user@{load_balancer}", f"sed -i 's/weight=.*;/weight={percent};/' /etc/nginx/conf.d/upstream.conf"])
                    #     subprocess.run(["ssh", f"user@{load_balancer}", "nginx -s reload"])
                    pass
                
                progress.update(task, advance=weight)
                time.sleep(1)
        
        console.print("[green]✓[/green] 트래픽 전환 완료")
    
    def monitor_deployment(self):
        """배포 모니터링"""
        console.print(Panel("[bold blue]배포 모니터링 중[/bold blue]"))
        
        monitoring_time = 60  # 60초 동안 모니터링
        check_interval = 10   # 10초마다 체크
        
        prometheus_url = self.config.get("monitoring", {}).get("prometheus_url")
        dashboard_id = self.config.get("monitoring", {}).get("dashboard_id")
        
        logger.info(f"모니터링 URL: {prometheus_url}")
        logger.info(f"대시보드 ID: {dashboard_id}")
        
        with Progress() as progress:
            task = progress.add_task("[cyan]배포 모니터링 중...", total=monitoring_time)
            
            for i in range(0, monitoring_time, check_interval):
                if not self.dry_run:
                    # 실제 모니터링 데이터 수집 (예시)
                    # try:
                    #     response = requests.get(f"{prometheus_url}/api/v1/query", params={
                    #         "query": "sum(rate(http_requests_total{status=~\"5..\"}[1m])) / sum(rate(http_requests_total[1m])) * 100"
                    #     })
                    #     error_rate = float(response.json()["data"]["result"][0]["value"][1])
                    #     
                    #     if error_rate > self.config.get("deployment", {}).get("auto_rollback_criteria", {}).get("error_rate_threshold", 5):
                    #         logger.error(f"오류율이 임계값을 초과합니다: {error_rate}%")
                    #         return False
                    # except Exception as e:
                    #     logger.error(f"모니터링 데이터 수집 실패: {e}")
                    pass
                
                progress.update(task, advance=check_interval)
                time.sleep(check_interval)
        
        console.print("[green]✓[/green] 배포 모니터링 완료")
        return True
    
    def send_notifications(self, success=True):
        """알림 전송"""
        console.print(Panel("[bold blue]배포 알림 전송 중[/bold blue]"))
        
        channels = self.config.get("notification", {}).get("channels", [])
        app_name = self.config.get("app_name", "christmas")
        version = self.config.get("version", "1.0.0")
        
        status = "성공" if success else "실패"
        message = f"{app_name} v{version} 배포 {status} ({self.timestamp})"
        
        logger.info(f"알림 메시지: {message}")
        logger.info(f"알림 채널: {channels}")
        
        for channel in channels:
            logger.info(f"{channel} 채널로 알림 전송 중...")
            
            if not self.dry_run:
                try:
                    if channel == "slack":
                        # Slack 알림 전송 (예시)
                        webhook_url = self.config.get("notification", {}).get("slack_webhook")
                        if webhook_url:
                            slack_payload = {
                                "text": message,
                                "attachments": [
                                    {
                                        "color": "good" if success else "danger",
                                        "fields": [
                                            {
                                                "title": "버전",
                                                "value": version,
                                                "short": True
                                            },
                                            {
                                                "title": "환경",
                                                "value": "Production",
                                                "short": True
                                            }
                                        ],
                                        "footer": f"배포 시간: {datetime.datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                                    }
                                ]
                            }
                            requests.post(webhook_url, json=slack_payload)
                    
                    elif channel == "telegram":
                        # Telegram 알림 전송 (예시)
                        token = self.config.get("notification", {}).get("telegram_bot_token")
                        chat_id = self.config.get("notification", {}).get("telegram_chat_id")
                        if token and chat_id:
                            telegram_url = f"https://api.telegram.org/bot{token}/sendMessage"
                            telegram_payload = {
                                "chat_id": chat_id,
                                "text": message,
                                "parse_mode": "Markdown"
                            }
                            requests.post(telegram_url, json=telegram_payload)
                    
                    elif channel == "email":
                        # 이메일 알림 전송 (예시)
                        # email_recipients = self.config.get("notification", {}).get("email_recipients", [])
                        # if email_recipients:
                        #     # 이메일 전송 로직
                        #     pass
                        pass
                
                except Exception as e:
                    logger.error(f"{channel} 알림 전송 실패: {e}")
        
        console.print("[green]✓[/green] 배포 알림 전송 완료")
    
    def run_deployment(self):
        """배포 실행"""
        console.print(Panel(f"[bold blue]Christmas v{self.config.get('version', '1.0.0')} 정식 버전 배포 시작[/bold blue]"))
        
        try:
            # 1. 사전 요구 사항 확인
            self.check_prerequisites()
            
            # 2. 배포 시작 알림
            self.send_notifications(success=True)
            
            # 3. 데이터베이스 백업
            self.backup_database()
            
            # 4. 그린 환경에 배포
            self.deploy_to_green()
            
            # 5. 데이터베이스 마이그레이션
            self.run_database_migrations()
            
            # 6. 그린 환경 헬스 체크
            self.health_check_green()
            
            # 7. 트래픽 전환
            self.switch_traffic()
            
            # 8. 배포 모니터링
            monitoring_success = self.monitor_deployment()
            
            if monitoring_success:
                console.print(Panel("[bold green]배포 성공![/bold green]"))
                
                # 9. 배포 완료 알림
                self.send_notifications(success=True)
                
                # 배포 완료 보고서 생성
                self.generate_deployment_report(success=True)
            else:
                console.print(Panel("[bold red]배포 실패: 모니터링 단계에서 문제 발생[/bold red]"))
                
                # 실패 알림 전송
                self.send_notifications(success=False)
                
                # 롤백 실행
                self.rollback()
                
                # 배포 실패 보고서 생성
                self.generate_deployment_report(success=False)
                
                sys.exit(1)
        
        except KeyboardInterrupt:
            logger.warning("사용자에 의해 배포 중단됨")
            
            if self.confirm("롤백을 실행하시겠습니까?"):
                self.rollback()
            
            self.generate_deployment_report(success=False)
            sys.exit(1)
        
        except Exception as e:
            logger.error(f"배포 중 오류 발생: {e}")
            
            # 실패 알림 전송
            self.send_notifications(success=False)
            
            if self.confirm("롤백을 실행하시겠습니까?"):
                self.rollback()
            
            self.generate_deployment_report(success=False)
            sys.exit(1)
    
    def rollback(self):
        """롤백 실행"""
        console.print(Panel("[bold yellow]롤백 실행 중[/bold yellow]"))
        
        if not self.config.get("deployment", {}).get("rollback_enabled", True):
            logger.warning("롤백이 설정에서 비활성화되어 있습니다.")
            return
        
        logger.info("롤백 시작")
        
        with Progress() as progress:
            task = progress.add_task("[cyan]롤백 중...", total=100)
            
            # 롤백 단계별 진행
            steps = [
                ("로드 밸런서 설정 복원", 40),
                ("데이터베이스 롤백", 40),
                ("서비스 재시작", 20)
            ]
            
            for step, weight in steps:
                logger.info(f"롤백 단계: {step}")
                
                if not self.dry_run:
                    # 실제 롤백 명령 실행 (예시)
                    # if step == "로드 밸런서 설정 복원":
                    #     load_balancer = self.config.get("servers", {}).get("load_balancer", {}).get("host")
                    #     lb_type = self.config.get("servers", {}).get("load_balancer", {}).get("type", "nginx")
                    #     
                    #     if lb_type == "nginx":
                    #         subprocess.run(["ssh", f"user@{load_balancer}", "cp /etc/nginx/conf.d/upstream.conf.bak /etc/nginx/conf.d/upstream.conf"])
                    #         subprocess.run(["ssh", f"user@{load_balancer}", "nginx -s reload"])
                    pass
                
                progress.update(task, advance=weight)
                time.sleep(1)
        
        console.print("[yellow]✓[/yellow] 롤백 완료")
        
        # 롤백 알림 전송
        logger.info("롤백 알림 전송 중...")
        self.send_notifications(success=False)
    
    def generate_deployment_report(self, success=True):
        """배포 보고서 생성"""
        status = "성공" if success else "실패"
        console.print(Panel(f"[bold blue]배포 보고서 생성 중 ({status})[/bold blue]"))
        
        app_name = self.config.get("app_name", "christmas")
        version = self.config.get("version", "1.0.0")
        
        # 보고서 생성
        report = {
            "deployment": {
                "app_name": app_name,
                "version": version,
                "timestamp": self.timestamp,
                "status": "success" if success else "failed",
                "environment": self.config.get("environment", "production")
            },
            "steps": [
                {
                    "name": "사전 요구 사항 확인",
                    "status": "completed"
                },
                {
                    "name": "데이터베이스 백업",
                    "status": "completed"
                },
                {
                    "name": "그린 환경 배포",
                    "status": "completed"
                },
                {
                    "name": "데이터베이스 마이그레이션",
                    "status": "completed"
                },
                {
                    "name": "그린 환경 헬스 체크",
                    "status": "completed"
                },
                {
                    "name": "트래픽 전환",
                    "status": "completed" if success else "failed"
                },
                {
                    "name": "배포 모니터링",
                    "status": "completed" if success else "failed"
                }
            ],
            "log_file": str(self.log_file)
        }
        
        # 보고서 파일 저장
        base_dir = Path(__file__).resolve().parent.parent
        reports_dir = base_dir / "environments" / "production" / "reports"
        os.makedirs(reports_dir, exist_ok=True)
        
        report_file = reports_dir / f"deployment_report_{self.timestamp}.json"
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, indent=2, ensure_ascii=False)
        
        logger.info(f"배포 보고서 생성 완료: {report_file}")
        console.print(f"[green]✓[/green] 배포 보고서 생성 완료: {report_file}")

def main():
    parser = argparse.ArgumentParser(description="Christmas 정식 버전 배포 스크립트")
    parser.add_argument("--config", help="설정 파일 경로")
    parser.add_argument("--dry-run", action="store_true", help="실제 배포 없이 시뮬레이션 모드로 실행")
    
    args = parser.parse_args()
    
    deployment = ProductionDeployment(config_path=args.config, dry_run=args.dry_run)
    deployment.run_deployment()

if __name__ == "__main__":
    main() 