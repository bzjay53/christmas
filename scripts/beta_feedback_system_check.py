#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
베타 테스트 피드백 수집 시스템 점검 스크립트
"""

import os
import sys
import json
import requests
import logging
import argparse
from datetime import datetime
from rich.console import Console
from rich.table import Table
from rich.logging import RichHandler

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",
    datefmt="[%X]",
    handlers=[RichHandler(rich_tracebacks=True)]
)
log = logging.getLogger("beta_feedback")

# 콘솔 출력 설정
console = Console()

class FeedbackSystemChecker:
    """베타 테스트 피드백 수집 시스템 점검 클래스"""
    
    def __init__(self, config_path="environments/beta/config/feedback_system.json"):
        """초기화"""
        self.config_path = config_path
        self.load_config()
        self.issues = []
        
    def load_config(self):
        """설정 파일 로드"""
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    self.config = json.load(f)
            else:
                # 설정 파일이 없는 경우 기본값 사용
                self.config = {
                    "survey_urls": {
                        "mid_survey": "https://example.com/christmas/mid-survey",
                        "final_survey": "https://example.com/christmas/final-survey"
                    },
                    "telegram_bot": {
                        "token": "BOT_TOKEN",
                        "chat_id": "CHAT_ID"
                    },
                    "feedback_email": "beta-feedback@christmas-trading.com",
                    "feedback_database": "feedback_data"
                }
                log.warning(f"설정 파일을 찾을 수 없습니다: {self.config_path}, 기본값을 사용합니다.")
        except Exception as e:
            log.error(f"설정 파일 로드 중 오류: {e}")
            sys.exit(1)
    
    def check_survey_urls(self):
        """설문 URL 점검"""
        log.info("설문 URL 점검 중...")
        table = Table(title="설문 URL 점검 결과")
        table.add_column("URL 종류", style="cyan")
        table.add_column("URL", style="yellow")
        table.add_column("상태", style="green")
        
        for survey_type, url in self.config["survey_urls"].items():
            try:
                response = requests.head(url, timeout=5)
                if response.status_code == 200:
                    status = "✅ 접근 가능"
                else:
                    status = f"❌ 오류 (상태 코드: {response.status_code})"
                    self.issues.append(f"설문 URL '{survey_type}' 접근 불가: {url}")
            except requests.RequestException:
                status = "❌ 접근 불가"
                self.issues.append(f"설문 URL '{survey_type}' 접근 불가: {url}")
                
            table.add_row(survey_type, url, status)
        
        console.print(table)
    
    def check_telegram_bot(self):
        """텔레그램 봇 점검"""
        log.info("텔레그램 봇 점검 중...")
        
        try:
            token = self.config["telegram_bot"]["token"]
            chat_id = self.config["telegram_bot"]["chat_id"]
            
            if token == "BOT_TOKEN" or chat_id == "CHAT_ID":
                log.warning("텔레그램 봇 설정이 기본값입니다. 실제 토큰으로 업데이트하세요.")
                self.issues.append("텔레그램 봇 토큰 및 채팅 ID가 기본값입니다.")
                return
            
            # 텔레그램 봇 API 호출
            url = f"https://api.telegram.org/bot{token}/getMe"
            response = requests.get(url, timeout=5)
            
            if response.status_code == 200:
                bot_info = response.json()
                if bot_info["ok"]:
                    console.print(f"[green]텔레그램 봇 '{bot_info['result']['username']}' 확인 완료[/green]")
                    
                    # 테스트 메시지 전송 기능 체크
                    test_msg = f"피드백 시스템 점검 - {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}"
                    send_url = f"https://api.telegram.org/bot{token}/sendMessage"
                    send_params = {
                        "chat_id": chat_id,
                        "text": test_msg
                    }
                    
                    send_response = requests.post(send_url, data=send_params, timeout=5)
                    if send_response.status_code == 200:
                        console.print("[green]텔레그램 메시지 전송 테스트 성공[/green]")
                    else:
                        console.print("[red]텔레그램 메시지 전송 테스트 실패[/red]")
                        self.issues.append("텔레그램 메시지 전송 실패")
                else:
                    console.print("[red]텔레그램 봇 정보 조회 실패[/red]")
                    self.issues.append("텔레그램 봇 정보 조회 실패")
            else:
                console.print("[red]텔레그램 봇 API 호출 실패[/red]")
                self.issues.append("텔레그램 봇 API 호출 실패")
                
        except Exception as e:
            console.print(f"[red]텔레그램 봇 점검 중 오류: {e}[/red]")
            self.issues.append(f"텔레그램 봇 점검 오류: {e}")
    
    def check_feedback_email(self):
        """피드백 이메일 점검"""
        log.info("피드백 이메일 점검 중...")
        
        email = self.config["feedback_email"]
        # 간단한 이메일 형식 검증
        if "@" not in email or "." not in email:
            console.print(f"[red]유효하지 않은 이메일 형식: {email}[/red]")
            self.issues.append(f"유효하지 않은 피드백 이메일 형식: {email}")
        else:
            console.print(f"[green]피드백 이메일 형식 확인: {email}[/green]")
            
        # 여기에 실제 이메일 서버 연결 테스트를 추가할 수 있음
        console.print("[yellow]참고: 실제 이메일 서버 연결 및 메일 전송 테스트는 구현되지 않았습니다.[/yellow]")
    
    def check_feedback_database(self):
        """피드백 데이터베이스 점검"""
        log.info("피드백 데이터베이스 점검 중...")
        
        # 실제 환경에서는 DB 연결 테스트를 수행
        # 이 예제에서는 간단한 검증만 수행
        if isinstance(self.config["feedback_database"], dict):
            db_config = self.config["feedback_database"]
            console.print(f"[cyan]피드백 데이터베이스 정보:[/cyan]")
            console.print(f"  호스트: {db_config.get('host', 'N/A')}")
            console.print(f"  포트: {db_config.get('port', 'N/A')}")
            console.print(f"  DB명: {db_config.get('dbname', 'N/A')}")
            
            # 필수 정보 검증
            if not all(key in db_config for key in ['host', 'port', 'dbname', 'user']):
                console.print("[red]데이터베이스 설정에 필수 정보가 누락되었습니다.[/red]")
                self.issues.append("데이터베이스 설정에 필수 정보 누락")
        else:
            db_name = self.config["feedback_database"]
            console.print(f"[cyan]피드백 데이터베이스 이름: {db_name}[/cyan]")
            
        console.print("[yellow]참고: 실제 데이터베이스 연결 테스트는 구현되지 않았습니다.[/yellow]")
    
    def check_grafana_dashboard(self):
        """Grafana 대시보드 점검"""
        log.info("Grafana 대시보드 점검 중...")
        
        # 상대 경로 대신 절대 경로 사용
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        dashboard_path = os.path.join(base_dir, "environments", "beta", "grafana_dashboards", "beta_test_dashboard.json")
        
        if os.path.exists(dashboard_path):
            try:
                with open(dashboard_path, 'r', encoding='utf-8') as f:
                    dashboard = json.load(f)
                
                # 대시보드 기본 점검
                if "panels" in dashboard and isinstance(dashboard["panels"], list):
                    console.print(f"[green]Grafana 대시보드 확인: {len(dashboard['panels'])} 패널 발견[/green]")
                    
                    # 피드백 관련 패널 확인
                    feedback_panels = [p for p in dashboard["panels"] if "feedback" in str(p).lower()]
                    if feedback_panels:
                        console.print(f"[green]피드백 관련 패널 {len(feedback_panels)}개 발견[/green]")
                    else:
                        console.print("[yellow]피드백 관련 패널이 없습니다. 피드백 모니터링을 위한 패널 추가를 고려하세요.[/yellow]")
                        self.issues.append("Grafana 대시보드에 피드백 관련 패널 없음")
                    
                    # 알림 규칙 연동 확인
                    alert_panels = [p for p in dashboard["panels"] if "alert" in str(p).lower() or "알림" in str(p).lower()]
                    if alert_panels:
                        console.print(f"[green]알림 관련 패널 {len(alert_panels)}개 발견[/green]")
                    else:
                        console.print("[yellow]알림 관련 패널이 없습니다. 알림 모니터링을 위한 패널 추가를 고려하세요.[/yellow]")
                        self.issues.append("Grafana 대시보드에 알림 관련 패널 없음")
                else:
                    console.print("[red]Grafana 대시보드 형식 오류: panels 배열 없음[/red]")
                    self.issues.append("Grafana 대시보드 형식 오류")
            except json.JSONDecodeError:
                console.print("[red]Grafana 대시보드 JSON 파싱 오류[/red]")
                self.issues.append("Grafana 대시보드 JSON 파싱 오류")
        else:
            console.print(f"[red]Grafana 대시보드 파일 없음: {dashboard_path}[/red]")
            self.issues.append(f"Grafana 대시보드 파일 없음: {dashboard_path}")
    
    def check_prometheus_alerts(self):
        """Prometheus 알림 규칙 점검"""
        log.info("Prometheus 알림 규칙 점검 중...")
        
        # 상대 경로 대신 절대 경로 사용
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        alert_rules_path = os.path.join(base_dir, "environments", "beta", "config", "prometheus", "alert_rules.yml")
        
        if os.path.exists(alert_rules_path):
            try:
                # YAML 파일 읽기
                import yaml
                with open(alert_rules_path, 'r', encoding='utf-8') as f:
                    alert_rules = yaml.safe_load(f)
                
                # 알림 규칙 구조 확인
                if "groups" in alert_rules and isinstance(alert_rules["groups"], list):
                    total_rules = 0
                    feedback_rules = 0
                    
                    for group in alert_rules["groups"]:
                        if "rules" in group and isinstance(group["rules"], list):
                            total_rules += len(group["rules"])
                            
                            # 피드백 관련 알림 규칙 확인
                            for rule in group["rules"]:
                                if "alert" in rule and any(keyword in rule["alert"].lower() for keyword in ["feedback", "피드백"]):
                                    feedback_rules += 1
                                elif "annotations" in rule and "description" in rule["annotations"] and \
                                     any(keyword in rule["annotations"]["description"].lower() for keyword in ["feedback", "피드백"]):
                                    feedback_rules += 1
                    
                    console.print(f"[green]Prometheus 알림 규칙 확인: 총 {total_rules}개 규칙 발견[/green]")
                    
                    if feedback_rules > 0:
                        console.print(f"[green]피드백 관련 알림 규칙 {feedback_rules}개 발견[/green]")
                    else:
                        console.print("[yellow]피드백 관련 알림 규칙이 없습니다. 피드백 모니터링을 위한 알림 규칙 추가를 고려하세요.[/yellow]")
                        self.issues.append("Prometheus 알림 규칙에 피드백 관련 규칙 없음")
                else:
                    console.print("[red]Prometheus 알림 규칙 형식 오류: groups 배열 없음[/red]")
                    self.issues.append("Prometheus 알림 규칙 형식 오류")
            except Exception as e:
                console.print(f"[red]Prometheus 알림 규칙 파일 파싱 오류: {e}[/red]")
                self.issues.append(f"Prometheus 알림 규칙 파일 파싱 오류: {e}")
        else:
            console.print(f"[red]Prometheus 알림 규칙 파일 없음: {alert_rules_path}[/red]")
            self.issues.append(f"Prometheus 알림 규칙 파일 없음: {alert_rules_path}")
    
    def run_all_checks(self):
        """모든 점검 실행"""
        console.print("[bold blue]===== 베타 테스트 피드백 수집 시스템 점검 시작 =====[/bold blue]")
        
        self.check_survey_urls()
        self.check_telegram_bot()
        self.check_feedback_email()
        self.check_feedback_database()
        self.check_grafana_dashboard()
        self.check_prometheus_alerts()
        
        # 결과 요약
        console.print("\n[bold blue]===== 점검 결과 요약 =====[/bold blue]")
        
        if not self.issues:
            console.print("[bold green]모든 시스템이 정상 작동 중입니다.[/bold green]")
        else:
            console.print(f"[bold red]발견된 문제: {len(self.issues)}개[/bold red]")
            issues_table = Table(title="발견된 문제")
            issues_table.add_column("No.", style="cyan")
            issues_table.add_column("문제 설명", style="red")
            
            for i, issue in enumerate(self.issues, 1):
                issues_table.add_row(str(i), issue)
            
            console.print(issues_table)
            
            # 해결 방법 제안
            console.print("\n[bold yellow]권장 해결 방안:[/bold yellow]")
            console.print("1. 설정 파일을 확인하고 업데이트하세요.")
            console.print("2. 네트워크 연결을 확인하세요.")
            console.print("3. 텔레그램 봇 토큰과 채팅 ID를 확인하세요.")
            console.print("4. Grafana 대시보드 구성을 확인하세요.")
            console.print("5. Prometheus 알림 규칙을 확인하고 필요한 규칙을 추가하세요.")

def main():
    parser = argparse.ArgumentParser(description="베타 테스트 피드백 수집 시스템 점검")
    parser.add_argument("--config", help="설정 파일 경로")
    args = parser.parse_args()
    
    config_path = args.config if args.config else "environments/beta/config/feedback_system.json"
    checker = FeedbackSystemChecker(config_path)
    checker.run_all_checks()

if __name__ == "__main__":
    main() 