#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
베타 테스트 이슈 대응 스크립트
"""

import os
import sys
import json
import time
import logging
import argparse
import requests
import smtplib
import datetime
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
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
log = logging.getLogger("beta_issue_response")

# 콘솔 출력 설정
console = Console()

class IssueResponseSystem:
    """베타 테스트 이슈 대응 시스템"""
    
    def __init__(self, config_path="environments/beta/config/issue_response.json"):
        """초기화"""
        self.config_path = config_path
        self.load_config()
        self.active_issues = {}
        
    def load_config(self):
        """설정 파일 로드"""
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path, 'r', encoding='utf-8') as f:
                    self.config = json.load(f)
            else:
                # 설정 파일이 없는 경우 기본값 사용
                self.config = {
                    "prometheus": {
                        "url": "http://localhost:9090",
                        "query_interval": 60
                    },
                    "grafana": {
                        "url": "http://localhost:3000",
                        "api_key": "GRAFANA_API_KEY"
                    },
                    "notifications": {
                        "email": {
                            "enabled": True,
                            "smtp_server": "smtp.example.com",
                            "smtp_port": 587,
                            "username": "alerts@christmas-trading.com",
                            "password": "PASSWORD",
                            "from_address": "alerts@christmas-trading.com",
                            "recipients": [
                                "dev-team@christmas-trading.com",
                                "ops-team@christmas-trading.com"
                            ]
                        },
                        "telegram": {
                            "enabled": True,
                            "token": "TELEGRAM_BOT_TOKEN",
                            "chat_id": "CHAT_ID"
                        },
                        "slack": {
                            "enabled": True,
                            "webhook_url": "SLACK_WEBHOOK_URL",
                            "channel": "#beta-alerts"
                        }
                    },
                    "alert_rules": [
                        {
                            "name": "높은 오류율",
                            "query": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) > 0.05",
                            "severity": "P1",
                            "description": "5분 동안 5xx 오류율이 5%를 초과합니다.",
                            "category": "성능",
                            "check_interval": 60
                        },
                        {
                            "name": "API 응답 시간 지연",
                            "query": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{handler!=\"\"}[5m])) by (le, handler)) > 2",
                            "severity": "P2",
                            "description": "API 응답 시간이 2초를 초과합니다.",
                            "category": "성능",
                            "check_interval": 120
                        },
                        {
                            "name": "높은 CPU 사용량",
                            "query": "avg(rate(process_cpu_seconds_total[5m]) * 100) > 80",
                            "severity": "P2",
                            "description": "CPU 사용량이 80%를 초과합니다.",
                            "category": "리소스",
                            "check_interval": 300
                        },
                        {
                            "name": "높은 메모리 사용량",
                            "query": "avg(container_memory_usage_bytes) / avg(container_spec_memory_limit_bytes) * 100 > 85",
                            "severity": "P2",
                            "description": "메모리 사용량이 85%를 초과합니다.",
                            "category": "리소스",
                            "check_interval": 300
                        },
                        {
                            "name": "API 키 갱신 실패",
                            "query": "api_key_renewal_failures_total > 0",
                            "severity": "P1",
                            "description": "API 키 갱신에 실패했습니다.",
                            "category": "API",
                            "check_interval": 60
                        },
                        {
                            "name": "피드백 시스템 중단",
                            "query": "up{job=\"feedback_system\"} == 0",
                            "severity": "P0",
                            "description": "피드백 수집 시스템이 중단되었습니다.",
                            "category": "피드백",
                            "check_interval": 60
                        },
                        {
                            "name": "피드백 API 오류",
                            "query": "sum(rate(feedback_api_errors_total{job=\"feedback_system\"}[5m])) > 0",
                            "severity": "P1",
                            "description": "피드백 API에서 오류가 발생하고 있습니다.",
                            "category": "피드백",
                            "check_interval": 120
                        },
                        {
                            "name": "피드백 설문 URL 접근 불가",
                            "query": "probe_success{job=\"blackbox\", instance=~\".*survey.*\"} == 0",
                            "severity": "P1",
                            "description": "피드백 설문 URL에 접근할 수 없습니다.",
                            "category": "피드백",
                            "check_interval": 300
                        },
                        {
                            "name": "고우선순위 피드백 수신",
                            "query": "sum(feedback_priority_count{priority=\"high\"}) > sum(feedback_priority_count{priority=\"high\"} offset 1h)",
                            "severity": "P2",
                            "description": "새로운 고우선순위 피드백이 수신되었습니다.",
                            "category": "피드백",
                            "check_interval": 300
                        }
                    ],
                    "response_actions": {
                        "P0": {
                            "notify_channels": ["email", "telegram", "slack"],
                            "escalation_time": 15,
                            "auto_create_jira": True
                        },
                        "P1": {
                            "notify_channels": ["email", "telegram", "slack"],
                            "escalation_time": 60,
                            "auto_create_jira": True
                        },
                        "P2": {
                            "notify_channels": ["telegram", "slack"],
                            "escalation_time": 240,
                            "auto_create_jira": True
                        },
                        "P3": {
                            "notify_channels": ["slack"],
                            "escalation_time": 0,
                            "auto_create_jira": False
                        }
                    },
                    "jira": {
                        "url": "https://christmas-project.atlassian.net",
                        "username": "jira-bot",
                        "api_token": "JIRA_API_TOKEN",
                        "project_key": "BETA"
                    }
                }
                log.warning(f"설정 파일을 찾을 수 없습니다: {self.config_path}, 기본값을 사용합니다.")
        except Exception as e:
            log.error(f"설정 파일 로드 중 오류: {e}")
            sys.exit(1)
    
    def check_prometheus_alerts(self):
        """Prometheus 알림 규칙 확인"""
        log.info("Prometheus 알림 규칙 확인 중...")
        
        for rule in self.config["alert_rules"]:
            try:
                # Prometheus API 호출
                response = requests.get(
                    f"{self.config['prometheus']['url']}/api/v1/query",
                    params={"query": rule["query"]},
                    timeout=10
                )
                
                if response.status_code == 200:
                    result = response.json()
                    if result["status"] == "success" and len(result["data"]["result"]) > 0:
                        # 알림 조건 충족
                        alert_id = f"{rule['name']}_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
                        
                        if alert_id not in self.active_issues:
                            log.warning(f"새로운 알림 감지: {rule['name']} ({rule['severity']})")
                            
                            # 새 알림 생성
                            self.active_issues[alert_id] = {
                                "id": alert_id,
                                "name": rule["name"],
                                "description": rule["description"],
                                "severity": rule["severity"],
                                "category": rule["category"],
                                "detected_time": datetime.datetime.now().isoformat(),
                                "status": "detected",
                                "value": str(result["data"]["result"])
                            }
                            
                            # 알림 전송
                            self.send_alert_notifications(self.active_issues[alert_id])
                            
                            # JIRA 이슈 생성
                            if self.config["response_actions"][rule["severity"]]["auto_create_jira"]:
                                self.create_jira_issue(self.active_issues[alert_id])
                else:
                    log.error(f"Prometheus API 호출 실패: {response.status_code}")
            
            except Exception as e:
                log.error(f"알림 규칙 '{rule['name']}' 확인 중 오류: {e}")
    
    def check_feedback_system_status(self):
        """피드백 시스템 상태 확인"""
        log.info("피드백 시스템 상태 확인 중...")
        
        try:
            # 피드백 시스템 상태 API 호출
            response = requests.get(
                "http://feedback_system:4000/health",
                timeout=5
            )
            
            if response.status_code == 200:
                status_data = response.json()
                
                # 피드백 시스템 상태 보고
                table = Table(title="피드백 시스템 상태")
                table.add_column("구성 요소", style="cyan")
                table.add_column("상태", style="green")
                table.add_column("세부 정보", style="yellow")
                
                components = status_data.get("components", {})
                for component, status in components.items():
                    status_icon = "✅" if status.get("status") == "healthy" else "❌"
                    table.add_row(
                        component,
                        f"{status_icon} {status.get('status', 'unknown')}",
                        status.get("message", "")
                    )
                
                console.print(table)
                
                # 경고 상태 확인
                warnings = [c for c, s in components.items() if s.get("status") != "healthy"]
                if warnings:
                    alert_id = f"피드백시스템경고_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
                    
                    if alert_id not in self.active_issues:
                        log.warning(f"피드백 시스템 경고: {', '.join(warnings)}")
                        
                        # 새 알림 생성
                        self.active_issues[alert_id] = {
                            "id": alert_id,
                            "name": "피드백 시스템 경고",
                            "description": f"피드백 시스템 구성 요소에 문제가 있습니다: {', '.join(warnings)}",
                            "severity": "P1",
                            "category": "피드백",
                            "detected_time": datetime.datetime.now().isoformat(),
                            "status": "detected",
                            "value": str(warnings)
                        }
                        
                        # 알림 전송
                        self.send_alert_notifications(self.active_issues[alert_id])
                        
                        # JIRA 이슈 생성
                        if self.config["response_actions"]["P1"]["auto_create_jira"]:
                            self.create_jira_issue(self.active_issues[alert_id])
            else:
                log.error(f"피드백 시스템 상태 API 호출 실패: {response.status_code}")
                
                # 피드백 시스템 접근 불가 알림
                alert_id = f"피드백시스템접근불가_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
                
                if alert_id not in self.active_issues:
                    # 새 알림 생성
                    self.active_issues[alert_id] = {
                        "id": alert_id,
                        "name": "피드백 시스템 접근 불가",
                        "description": "피드백 시스템 상태 API에 접근할 수 없습니다.",
                        "severity": "P0",
                        "category": "피드백",
                        "detected_time": datetime.datetime.now().isoformat(),
                        "status": "detected",
                        "value": f"HTTP {response.status_code}"
                    }
                    
                    # 알림 전송
                    self.send_alert_notifications(self.active_issues[alert_id])
                    
                    # JIRA 이슈 생성
                    if self.config["response_actions"]["P0"]["auto_create_jira"]:
                        self.create_jira_issue(self.active_issues[alert_id])
                        
        except requests.RequestException as e:
            log.error(f"피드백 시스템 상태 확인 중 오류: {e}")
            
            # 피드백 시스템 접근 불가 알림
            alert_id = f"피드백시스템접근불가_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
            
            if alert_id not in self.active_issues:
                # 새 알림 생성
                self.active_issues[alert_id] = {
                    "id": alert_id,
                    "name": "피드백 시스템 접근 불가",
                    "description": "피드백 시스템 상태 API에 접근할 수 없습니다.",
                    "severity": "P0",
                    "category": "피드백",
                    "detected_time": datetime.datetime.now().isoformat(),
                    "status": "detected",
                    "value": str(e)
                }
                
                # 알림 전송
                self.send_alert_notifications(self.active_issues[alert_id])
                
                # JIRA 이슈 생성
                if self.config["response_actions"]["P0"]["auto_create_jira"]:
                    self.create_jira_issue(self.active_issues[alert_id])
    
    def send_alert_notifications(self, alert):
        """알림 전송"""
        severity = alert["severity"]
        channels = self.config["response_actions"][severity]["notify_channels"]
        
        log.info(f"알림 전송 중: {alert['name']} ({severity}) - 채널: {channels}")
        
        # 알림 메시지 구성
        subject = f"[{severity}] Christmas 베타 테스트 알림: {alert['name']}"
        message = f"""
알림 ID: {alert['id']}
심각도: {alert['severity']}
카테고리: {alert['category']}
설명: {alert['description']}
감지 시간: {alert['detected_time']}
현재 값: {alert['value']}

대시보드: {self.config['grafana']['url']}/dashboards
"""
        
        # 이메일 알림
        if "email" in channels and self.config["notifications"]["email"]["enabled"]:
            try:
                self.send_email_alert(subject, message, alert)
            except Exception as e:
                log.error(f"이메일 알림 전송 실패: {e}")
        
        # 텔레그램 알림
        if "telegram" in channels and self.config["notifications"]["telegram"]["enabled"]:
            try:
                self.send_telegram_alert(subject, message, alert)
            except Exception as e:
                log.error(f"텔레그램 알림 전송 실패: {e}")
        
        # Slack 알림
        if "slack" in channels and self.config["notifications"]["slack"]["enabled"]:
            try:
                self.send_slack_alert(subject, message, alert)
            except Exception as e:
                log.error(f"Slack 알림 전송 실패: {e}")
    
    def send_email_alert(self, subject, message, alert):
        """이메일 알림 전송"""
        email_config = self.config["notifications"]["email"]
        
        msg = MIMEMultipart()
        msg["From"] = email_config["from_address"]
        msg["To"] = ", ".join(email_config["recipients"])
        msg["Subject"] = subject
        
        msg.attach(MIMEText(message, "plain"))
        
        try:
            server = smtplib.SMTP(email_config["smtp_server"], email_config["smtp_port"])
            server.starttls()
            server.login(email_config["username"], email_config["password"])
            server.send_message(msg)
            server.quit()
            log.info(f"이메일 알림 전송 완료: {subject}")
        except Exception as e:
            log.error(f"이메일 전송 중 오류: {e}")
            raise
    
    def send_telegram_alert(self, subject, message, alert):
        """텔레그램 알림 전송"""
        telegram_config = self.config["notifications"]["telegram"]
        
        full_message = f"*{subject}*\n\n{message}"
        
        url = f"https://api.telegram.org/bot{telegram_config['token']}/sendMessage"
        data = {
            "chat_id": telegram_config["chat_id"],
            "text": full_message,
            "parse_mode": "Markdown"
        }
        
        response = requests.post(url, data=data, timeout=10)
        if response.status_code == 200:
            log.info(f"텔레그램 알림 전송 완료: {subject}")
        else:
            log.error(f"텔레그램 알림 전송 실패: {response.status_code} {response.text}")
            raise Exception(f"텔레그램 알림 전송 실패: {response.status_code}")
    
    def send_slack_alert(self, subject, message, alert):
        """Slack 알림 전송"""
        slack_config = self.config["notifications"]["slack"]
        
        # 심각도에 따른 색상 설정
        color_map = {
            "P0": "#FF0000",  # 빨강
            "P1": "#FFA500",  # 주황
            "P2": "#FFFF00",  # 노랑
            "P3": "#00FF00"   # 초록
        }
        
        payload = {
            "channel": slack_config["channel"],
            "username": "Christmas Beta Alert",
            "icon_emoji": ":christmas_tree:",
            "attachments": [
                {
                    "fallback": subject,
                    "color": color_map.get(alert["severity"], "#36a64f"),
                    "title": subject,
                    "text": message,
                    "fields": [
                        {
                            "title": "심각도",
                            "value": alert["severity"],
                            "short": True
                        },
                        {
                            "title": "카테고리",
                            "value": alert["category"],
                            "short": True
                        }
                    ],
                    "footer": "Christmas Beta Test Monitoring",
                    "footer_icon": "https://platform.slack-edge.com/img/default_application_icon.png",
                    "ts": int(time.time())
                }
            ]
        }
        
        response = requests.post(slack_config["webhook_url"], json=payload, timeout=10)
        if response.status_code == 200:
            log.info(f"Slack 알림 전송 완료: {subject}")
        else:
            log.error(f"Slack 알림 전송 실패: {response.status_code} {response.text}")
            raise Exception(f"Slack 알림 전송 실패: {response.status_code}")
    
    def create_jira_issue(self, alert):
        """JIRA 이슈 생성"""
        jira_config = self.config["jira"]
        
        # 심각도에 따른 이슈 타입 매핑
        issue_type_map = {
            "P0": "버그",
            "P1": "버그",
            "P2": "작업",
            "P3": "하위 작업"
        }
        
        # 이슈 데이터 구성
        issue_data = {
            "fields": {
                "project": {
                    "key": jira_config["project_key"]
                },
                "summary": f"[{alert['severity']}] {alert['name']}",
                "description": f"{alert['description']}\n\n감지 시간: {alert['detected_time']}\n현재 값: {alert['value']}",
                "issuetype": {
                    "name": issue_type_map.get(alert["severity"], "버그")
                },
                "labels": ["beta-test", "automated", alert["category"].lower()],
                "priority": {
                    "name": "Highest" if alert["severity"] == "P0" else 
                           "High" if alert["severity"] == "P1" else 
                           "Medium" if alert["severity"] == "P2" else 
                           "Low"
                }
            }
        }
        
        # JIRA API 호출
        url = f"{jira_config['url']}/rest/api/2/issue"
        auth = (jira_config["username"], jira_config["api_token"])
        headers = {"Content-Type": "application/json"}
        
        try:
            response = requests.post(url, json=issue_data, auth=auth, headers=headers, timeout=10)
            
            if response.status_code == 201:
                issue_key = response.json()["key"]
                log.info(f"JIRA 이슈 생성 완료: {issue_key}")
                
                # 생성된 이슈 키 저장
                self.active_issues[alert["id"]]["jira_key"] = issue_key
            else:
                log.error(f"JIRA 이슈 생성 실패: {response.status_code} {response.text}")
        except Exception as e:
            log.error(f"JIRA 이슈 생성 중 오류: {e}")
    
    def run_monitoring(self):
        """모니터링 실행"""
        console.print("[bold blue]===== Christmas 베타 테스트 이슈 대응 시스템 시작 =====[/bold blue]")
        
        try:
            while True:
                self.check_prometheus_alerts()
                self.check_feedback_system_status()
                
                # 다음 체크까지 대기
                time.sleep(self.config["prometheus"]["query_interval"])
        except KeyboardInterrupt:
            console.print("[yellow]모니터링 중단됨[/yellow]")
        except Exception as e:
            log.error(f"모니터링 중 오류 발생: {e}")
            sys.exit(1)
    
    def manual_alert(self, name, description, severity, category):
        """수동 알림 생성"""
        alert_id = f"manual_{name}_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
        
        alert = {
            "id": alert_id,
            "name": name,
            "description": description,
            "severity": severity,
            "category": category,
            "detected_time": datetime.datetime.now().isoformat(),
            "status": "detected",
            "value": "수동 생성"
        }
        
        self.active_issues[alert_id] = alert
        
        # 알림 전송
        self.send_alert_notifications(alert)
        
        # JIRA 이슈 생성
        if self.config["response_actions"][severity]["auto_create_jira"]:
            self.create_jira_issue(alert)
        
        return alert_id

def main():
    parser = argparse.ArgumentParser(description="Christmas 베타 테스트 이슈 대응 시스템")
    parser.add_argument("--config", help="설정 파일 경로")
    parser.add_argument("--monitor", action="store_true", help="지속적인 모니터링 실행")
    parser.add_argument("--manual-alert", action="store_true", help="수동 알림 생성")
    parser.add_argument("--name", help="알림 이름 (수동 알림 시)")
    parser.add_argument("--description", help="알림 설명 (수동 알림 시)")
    parser.add_argument("--severity", choices=["P0", "P1", "P2", "P3"], default="P2", help="알림 심각도 (수동 알림 시)")
    parser.add_argument("--category", default="기타", help="알림 카테고리 (수동 알림 시)")
    parser.add_argument("--check-feedback", action="store_true", help="피드백 시스템 상태 확인")
    
    args = parser.parse_args()
    
    config_path = args.config if args.config else "environments/beta/config/issue_response.json"
    system = IssueResponseSystem(config_path)
    
    if args.check_feedback:
        system.check_feedback_system_status()
    elif args.manual_alert:
        if not args.name or not args.description:
            parser.error("수동 알림 생성 시 --name과 --description이 필요합니다.")
        
        alert_id = system.manual_alert(args.name, args.description, args.severity, args.category)
        console.print(f"[green]수동 알림이 생성되었습니다. ID: {alert_id}[/green]")
    elif args.monitor:
        system.run_monitoring()
    else:
        parser.print_help()

if __name__ == "__main__":
    main() 