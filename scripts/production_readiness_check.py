#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
프로덕션 환경 최종 점검 스크립트
- 인프라 상태 점검
- 애플리케이션 구성 검증
- 보안 설정 점검
- 성능 및 모니터링 시스템 검증
"""

import os
import sys
import json
import time
import logging
import argparse
import requests
from datetime import datetime
from rich.console import Console
from rich.table import Table
from rich.progress import Progress

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("production_readiness.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("production_readiness")

# 콘솔 출력 설정
console = Console()

class ProductionReadinessCheck:
    """프로덕션 환경 점검 클래스"""
    
    def __init__(self, config_path="environments/production/config/readiness_check.json"):
        """초기화"""
        self.config_path = config_path
        self.results = {
            "timestamp": datetime.now().isoformat(),
            "overall_status": "pending",
            "checks": {}
        }
        self.load_config()
    
    def load_config(self):
        """설정 파일 로드"""
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    self.config = json.load(f)
                logger.info(f"설정 파일 로드 완료: {self.config_path}")
            else:
                logger.warning(f"설정 파일이 없습니다. 기본 설정을 사용합니다: {self.config_path}")
                self.config = self.get_default_config()
        except Exception as e:
            logger.error(f"설정 파일 로드 중 오류: {e}")
            logger.info("기본 설정을 사용합니다.")
            self.config = self.get_default_config()
    
    def get_default_config(self):
        """기본 설정 반환"""
        return {
            "environment": "production",
            "endpoints": {
                "api": "https://api.christmas-trading.com",
                "web": "https://www.christmas-trading.com",
                "monitoring": "https://monitoring.christmas-trading.com"
            },
            "checks": {
                "infrastructure": True,
                "application": True,
                "security": True,
                "performance": True,
                "monitoring": True,
                "backup": True
            },
            "thresholds": {
                "api_response_time_ms": 200,
                "error_rate_percentage": 0.1,
                "cpu_usage_percentage": 70,
                "memory_usage_percentage": 80
            }
        }
    
    def check_infrastructure(self):
        """인프라 상태 점검"""
        console.print("\n[bold green]인프라 상태 점검 중...[/bold green]")
        
        infra_components = [
            {"name": "API 서버", "endpoint": f"{self.config['endpoints']['api']}/health"},
            {"name": "웹 서버", "endpoint": f"{self.config['endpoints']['web']}/ping"},
            {"name": "데이터베이스", "endpoint": f"{self.config['endpoints']['api']}/db/health"},
            {"name": "캐시 서버", "endpoint": f"{self.config['endpoints']['api']}/cache/health"},
            {"name": "로드 밸런서", "endpoint": f"{self.config['endpoints']['api']}/lb/health"}
        ]
        
        results = []
        
        for component in infra_components:
            logger.info(f"{component['name']} 상태 확인 중...")
            # 실제 환경에서는 실제 엔드포인트 호출
            # 여기서는 시뮬레이션
            status = self.simulate_health_check(component['name'])
            
            results.append({
                "component": component['name'],
                "endpoint": component['endpoint'],
                "status": status,
                "latency_ms": self.simulate_latency(),
                "timestamp": datetime.now().isoformat()
            })
        
        # 점검 결과 표시
        infra_table = Table(title="인프라 상태 점검 결과")
        infra_table.add_column("구성 요소", style="cyan")
        infra_table.add_column("상태", style="green")
        infra_table.add_column("응답 시간", style="yellow")
        
        all_healthy = True
        for result in results:
            status_style = "green" if result["status"] == "healthy" else "red"
            latency_style = "green" if result["latency_ms"] < 100 else ("yellow" if result["latency_ms"] < 200 else "red")
            
            infra_table.add_row(
                result["component"],
                f"[{status_style}]{result['status']}[/{status_style}]",
                f"[{latency_style}]{result['latency_ms']}ms[/{latency_style}]"
            )
            
            if result["status"] != "healthy":
                all_healthy = False
        
        console.print(infra_table)
        
        self.results["checks"]["infrastructure"] = {
            "status": "pass" if all_healthy else "fail",
            "details": results
        }
        
        return all_healthy
    
    def check_application(self):
        """애플리케이션 구성 검증"""
        console.print("\n[bold green]애플리케이션 구성 검증 중...[/bold green]")
        
        app_components = [
            {"name": "API 버전", "check": "version"},
            {"name": "설정 파일", "check": "config"},
            {"name": "환경 변수", "check": "env"},
            {"name": "의존성", "check": "dependencies"},
            {"name": "라이선스", "check": "licenses"}
        ]
        
        results = []
        
        for component in app_components:
            logger.info(f"{component['name']} 확인 중...")
            status, details = self.simulate_app_check(component['check'])
            
            results.append({
                "component": component['name'],
                "status": status,
                "details": details,
                "timestamp": datetime.now().isoformat()
            })
        
        # 점검 결과 표시
        app_table = Table(title="애플리케이션 구성 검증 결과")
        app_table.add_column("구성 요소", style="cyan")
        app_table.add_column("상태", style="green")
        app_table.add_column("세부 정보", style="yellow")
        
        all_valid = True
        for result in results:
            status_style = "green" if result["status"] == "valid" else "red"
            
            app_table.add_row(
                result["component"],
                f"[{status_style}]{result['status']}[/{status_style}]",
                result["details"]
            )
            
            if result["status"] != "valid":
                all_valid = False
        
        console.print(app_table)
        
        self.results["checks"]["application"] = {
            "status": "pass" if all_valid else "fail",
            "details": results
        }
        
        return all_valid
    
    def check_security(self):
        """보안 설정 점검"""
        console.print("\n[bold green]보안 설정 점검 중...[/bold green]")
        
        security_checks = [
            {"name": "TLS/SSL 설정", "check": "ssl"},
            {"name": "방화벽 규칙", "check": "firewall"},
            {"name": "인증 시스템", "check": "auth"},
            {"name": "권한 부여", "check": "authorization"},
            {"name": "비밀 관리", "check": "secrets"},
            {"name": "취약점 스캔", "check": "vulnerabilities"}
        ]
        
        results = []
        
        for check in security_checks:
            logger.info(f"{check['name']} 점검 중...")
            status, details = self.simulate_security_check(check['check'])
            
            results.append({
                "check": check['name'],
                "status": status,
                "details": details,
                "timestamp": datetime.now().isoformat()
            })
        
        # 점검 결과 표시
        security_table = Table(title="보안 설정 점검 결과")
        security_table.add_column("점검 항목", style="cyan")
        security_table.add_column("상태", style="green")
        security_table.add_column("세부 정보", style="yellow")
        
        all_secure = True
        for result in results:
            status_style = "green" if result["status"] == "secure" else "red"
            
            security_table.add_row(
                result["check"],
                f"[{status_style}]{result['status']}[/{status_style}]",
                result["details"]
            )
            
            if result["status"] != "secure":
                all_secure = False
        
        console.print(security_table)
        
        self.results["checks"]["security"] = {
            "status": "pass" if all_secure else "fail",
            "details": results
        }
        
        return all_secure
    
    def check_performance(self):
        """성능 점검"""
        console.print("\n[bold green]성능 점검 중...[/bold green]")
        
        performance_metrics = [
            {"name": "API 응답 시간", "metric": "api_response_time", "unit": "ms", "threshold": self.config["thresholds"]["api_response_time_ms"]},
            {"name": "오류율", "metric": "error_rate", "unit": "%", "threshold": self.config["thresholds"]["error_rate_percentage"]},
            {"name": "CPU 사용률", "metric": "cpu_usage", "unit": "%", "threshold": self.config["thresholds"]["cpu_usage_percentage"]},
            {"name": "메모리 사용률", "metric": "memory_usage", "unit": "%", "threshold": self.config["thresholds"]["memory_usage_percentage"]}
        ]
        
        results = []
        
        for metric in performance_metrics:
            logger.info(f"{metric['name']} 측정 중...")
            value = self.simulate_performance_metric(metric['metric'])
            
            # 임계값 비교하여 상태 결정
            if metric['metric'] == "api_response_time":
                status = "good" if value <= metric["threshold"] else "warning"
            elif metric['metric'] == "error_rate":
                status = "good" if value <= metric["threshold"] else "critical"
            else:  # CPU, 메모리 사용률
                status = "good" if value <= metric["threshold"] else "warning"
            
            results.append({
                "metric": metric['name'],
                "value": value,
                "unit": metric['unit'],
                "threshold": metric['threshold'],
                "status": status,
                "timestamp": datetime.now().isoformat()
            })
        
        # 점검 결과 표시
        perf_table = Table(title="성능 점검 결과")
        perf_table.add_column("지표", style="cyan")
        perf_table.add_column("값", style="yellow")
        perf_table.add_column("임계값", style="yellow")
        perf_table.add_column("상태", style="green")
        
        all_good = True
        for result in results:
            value_str = f"{result['value']}{result['unit']}"
            threshold_str = f"{result['threshold']}{result['unit']}"
            
            status_style = "green" if result["status"] == "good" else ("yellow" if result["status"] == "warning" else "red")
            
            perf_table.add_row(
                result["metric"],
                value_str,
                threshold_str,
                f"[{status_style}]{result['status']}[/{status_style}]"
            )
            
            if result["status"] != "good":
                all_good = False
        
        console.print(perf_table)
        
        self.results["checks"]["performance"] = {
            "status": "pass" if all_good else "warning",
            "details": results
        }
        
        return all_good
    
    def check_monitoring(self):
        """모니터링 시스템 검증"""
        console.print("\n[bold green]모니터링 시스템 검증 중...[/bold green]")
        
        monitoring_systems = [
            {"name": "Prometheus", "endpoint": f"{self.config['endpoints']['monitoring']}/prometheus"},
            {"name": "Grafana", "endpoint": f"{self.config['endpoints']['monitoring']}/grafana"},
            {"name": "Alertmanager", "endpoint": f"{self.config['endpoints']['monitoring']}/alertmanager"},
            {"name": "Sentry", "endpoint": f"{self.config['endpoints']['monitoring']}/sentry"}
        ]
        
        results = []
        
        for system in monitoring_systems:
            logger.info(f"{system['name']} 상태 확인 중...")
            status = self.simulate_monitoring_check(system['name'])
            
            results.append({
                "system": system['name'],
                "endpoint": system['endpoint'],
                "status": status,
                "timestamp": datetime.now().isoformat()
            })
        
        # 알림 규칙 점검 시뮬레이션
        alert_rules_status, alert_rules_count = self.simulate_alert_rules_check()
        results.append({
            "system": "알림 규칙",
            "status": alert_rules_status,
            "count": alert_rules_count,
            "timestamp": datetime.now().isoformat()
        })
        
        # 점검 결과 표시
        monitoring_table = Table(title="모니터링 시스템 검증 결과")
        monitoring_table.add_column("시스템", style="cyan")
        monitoring_table.add_column("상태", style="green")
        monitoring_table.add_column("세부 정보", style="yellow")
        
        all_operational = True
        for result in results:
            status_style = "green" if result["status"] == "operational" else "red"
            
            # 세부 정보 구성
            if "count" in result:
                details = f"활성 규칙: {result['count']}개"
            else:
                details = f"엔드포인트: {result.get('endpoint', 'N/A')}"
            
            monitoring_table.add_row(
                result["system"],
                f"[{status_style}]{result['status']}[/{status_style}]",
                details
            )
            
            if result["status"] != "operational":
                all_operational = False
        
        console.print(monitoring_table)
        
        self.results["checks"]["monitoring"] = {
            "status": "pass" if all_operational else "fail",
            "details": results
        }
        
        return all_operational
    
    def check_backup(self):
        """백업 시스템 점검"""
        console.print("\n[bold green]백업 및 복구 시스템 점검 중...[/bold green]")
        
        backup_components = [
            {"name": "데이터베이스 백업", "type": "database"},
            {"name": "파일 스토리지 백업", "type": "file_storage"},
            {"name": "설정 백업", "type": "config"},
            {"name": "복구 테스트", "type": "recovery_test"}
        ]
        
        results = []
        
        for component in backup_components:
            logger.info(f"{component['name']} 점검 중...")
            
            status, last_backup, details = self.simulate_backup_check(component['type'])
            
            results.append({
                "component": component['name'],
                "status": status,
                "last_backup": last_backup,
                "details": details,
                "timestamp": datetime.now().isoformat()
            })
        
        # 점검 결과 표시
        backup_table = Table(title="백업 및 복구 시스템 점검 결과")
        backup_table.add_column("구성 요소", style="cyan")
        backup_table.add_column("상태", style="green")
        backup_table.add_column("마지막 백업", style="yellow")
        backup_table.add_column("세부 정보", style="dim")
        
        all_valid = True
        for result in results:
            status_style = "green" if result["status"] == "valid" else "red"
            
            backup_table.add_row(
                result["component"],
                f"[{status_style}]{result['status']}[/{status_style}]",
                result["last_backup"],
                result["details"]
            )
            
            if result["status"] != "valid":
                all_valid = False
        
        console.print(backup_table)
        
        self.results["checks"]["backup"] = {
            "status": "pass" if all_valid else "fail",
            "details": results
        }
        
        return all_valid
    
    def simulate_health_check(self, component_name):
        """상태 확인 시뮬레이션"""
        # 실제 구현에서는 실제 엔드포인트 호출
        # 여기서는 시뮬레이션을 위해 대부분 healthy 반환
        return "healthy" if component_name != "캐시 서버" else "degraded"
    
    def simulate_latency(self):
        """응답 시간 시뮬레이션"""
        import random
        return random.randint(10, 250)
    
    def simulate_app_check(self, check_type):
        """애플리케이션 구성 확인 시뮬레이션"""
        checks = {
            "version": ("valid", "v1.0.5 (최신 버전)"),
            "config": ("valid", "모든 설정 파일 검증됨"),
            "env": ("valid", "필수 환경 변수 설정됨"),
            "dependencies": ("invalid", "psutil 패키지 버전 불일치"),
            "licenses": ("valid", "모든 라이선스 검증됨")
        }
        return checks.get(check_type, ("unknown", "알 수 없는 확인 유형"))
    
    def simulate_security_check(self, check_type):
        """보안 점검 시뮬레이션"""
        checks = {
            "ssl": ("secure", "TLS 1.3, 모든 인증서 유효"),
            "firewall": ("secure", "모든 필수 규칙 적용됨"),
            "auth": ("secure", "OAuth2 + MFA 구성됨"),
            "authorization": ("secure", "역할 기반 접근 제어 검증됨"),
            "secrets": ("insecure", "일부 API 키가 환경 변수로 저장되지 않음"),
            "vulnerabilities": ("secure", "심각한 취약점 없음")
        }
        return checks.get(check_type, ("unknown", "알 수 없는 확인 유형"))
    
    def simulate_performance_metric(self, metric_type):
        """성능 지표 시뮬레이션"""
        metrics = {
            "api_response_time": 180,  # ms
            "error_rate": 0.05,  # %
            "cpu_usage": 65,  # %
            "memory_usage": 72  # %
        }
        return metrics.get(metric_type, 0)
    
    def simulate_monitoring_check(self, system_name):
        """모니터링 시스템 확인 시뮬레이션"""
        systems = {
            "Prometheus": "operational",
            "Grafana": "operational",
            "Alertmanager": "operational",
            "Sentry": "degraded"
        }
        return systems.get(system_name, "unknown")
    
    def simulate_alert_rules_check(self):
        """알림 규칙 확인 시뮬레이션"""
        return "operational", 42  # 상태, 규칙 수
    
    def simulate_backup_check(self, backup_type):
        """백업 점검 시뮬레이션"""
        backups = {
            "database": ("valid", "2025-06-22 23:00", "RTO: 30분, RPO: 24시간"),
            "file_storage": ("valid", "2025-06-22 22:00", "증분 백업, 암호화됨"),
            "config": ("valid", "2025-06-22 20:00", "Git 저장소에 저장됨"),
            "recovery_test": ("invalid", "2025-05-15 10:00", "마지막 복구 테스트 실패")
        }
        return backups.get(backup_type, ("unknown", "알 수 없음", "세부 정보 없음"))
    
    def generate_report(self):
        """결과 보고서 생성"""
        # 전체 상태 결정
        checks_passed = sum(1 for check in self.results["checks"].values() if check["status"] == "pass")
        checks_warnings = sum(1 for check in self.results["checks"].values() if check["status"] == "warning")
        checks_failed = sum(1 for check in self.results["checks"].values() if check["status"] == "fail")
        total_checks = len(self.results["checks"])
        
        if checks_failed > 0:
            self.results["overall_status"] = "fail"
        elif checks_warnings > 0:
            self.results["overall_status"] = "warning"
        else:
            self.results["overall_status"] = "pass"
        
        # 요약 표시
        summary_table = Table(title="프로덕션 환경 점검 요약")
        summary_table.add_column("영역", style="cyan")
        summary_table.add_column("상태", style="green")
        
        for area, check in self.results["checks"].items():
            area_name = {
                "infrastructure": "인프라",
                "application": "애플리케이션",
                "security": "보안",
                "performance": "성능",
                "monitoring": "모니터링",
                "backup": "백업 및 복구"
            }.get(area, area)
            
            status_style = "green" if check["status"] == "pass" else ("yellow" if check["status"] == "warning" else "red")
            status_text = {
                "pass": "통과",
                "warning": "경고",
                "fail": "실패"
            }.get(check["status"], check["status"])
            
            summary_table.add_row(
                area_name,
                f"[{status_style}]{status_text}[/{status_style}]"
            )
        
        console.print("\n[bold blue]===== 프로덕션 환경 점검 요약 =====[/bold blue]")
        console.print(summary_table)
        
        overall_status_style = "green" if self.results["overall_status"] == "pass" else ("yellow" if self.results["overall_status"] == "warning" else "red")
        overall_status_text = {
            "pass": "통과",
            "warning": "경고",
            "fail": "실패"
        }.get(self.results["overall_status"], self.results["overall_status"])
        
        console.print(f"\n전체 상태: [{overall_status_style}]{overall_status_text}[/{overall_status_style}]")
        console.print(f"통과: {checks_passed}/{total_checks}, 경고: {checks_warnings}/{total_checks}, 실패: {checks_failed}/{total_checks}")
        
        # 보고서 파일 저장
        report_dir = "environments/production/reports"
        os.makedirs(report_dir, exist_ok=True)
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = f"{report_dir}/readiness_check_{timestamp}.json"
        
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(self.results, f, ensure_ascii=False, indent=2)
        
        logger.info(f"점검 보고서 저장 완료: {report_file}")
        console.print(f"\n[bold green]점검 보고서가 저장되었습니다: [/bold green][cyan]{report_file}[/cyan]")
        
        return report_file
    
    def run(self):
        """전체 점검 실행"""
        console.print("[bold blue]===== 프로덕션 환경 최종 점검 시작 =====[/bold blue]")
        
        # 설정에 따라 점검 실행
        if self.config["checks"].get("infrastructure", True):
            self.check_infrastructure()
        
        if self.config["checks"].get("application", True):
            self.check_application()
        
        if self.config["checks"].get("security", True):
            self.check_security()
        
        if self.config["checks"].get("performance", True):
            self.check_performance()
        
        if self.config["checks"].get("monitoring", True):
            self.check_monitoring()
        
        if self.config["checks"].get("backup", True):
            self.check_backup()
        
        # 보고서 생성
        report_file = self.generate_report()
        
        console.print("\n[bold blue]===== 프로덕션 환경 최종 점검 완료 =====[/bold blue]")
        
        return self.results["overall_status"], report_file

def main():
    parser = argparse.ArgumentParser(description="프로덕션 환경 최종 점검 도구")
    parser.add_argument("--config", help="설정 파일 경로", default="environments/production/config/readiness_check.json")
    args = parser.parse_args()
    
    checker = ProductionReadinessCheck(config_path=args.config)
    status, report_file = checker.run()
    
    sys.exit(0 if status == "pass" else (1 if status == "warning" else 2))

if __name__ == "__main__":
    main() 