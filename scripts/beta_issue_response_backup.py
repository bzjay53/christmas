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
    
    def __init__(self, config_path=None):
        """초기화"""
        if config_path is None:
            base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
            config_path = os.path.join(base_dir, "environments", "beta", "config", "issue_response.json")
        self.config_path = config_path
        self.load_config()
        self.active_issues = {}
        self.notification_errors = 0  # 알림 오류 카운터 추가
        
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
                        },
                        "phone": {
                            "enabled": True,
                            "twilio": {
                                "account_sid": "TWILIO_ACCOUNT_SID",
                                "auth_token": "TWILIO_AUTH_TOKEN",
                                "from_number": "TWILIO_FROM_NUMBER",
                                "to_numbers": ["TWILIO_TO_NUMBER"]
                            }
                        }
                    },
                    "alert_rules": {
                        "error_rate": {
                            "query": "sum(rate(http_requests_total{status=~\"5..\"}[5m])) / sum(rate(http_requests_total[5m])) * 100 > 5",
                            "description": "5분간 HTTP 5xx 에러율이 5%를 초과함",
                            "severity": "P1",
                            "category": "시스템 안정성"
                        },
                        "api_latency": {
                            "query": "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{handler!=\"/health\"}[5m])) by (le, handler)) > 2",
                            "description": "API 응답시간(p95)이 2초를 초과함",
                            "severity": "P2",
                            "category": "성능"
                        }
                    },
                    "response_actions": {
                        "P0": {
                            "notification_channels": ["telegram", "email", "phone"],
                            "escalation_timeout_minutes": 15,
                            "jira": {
                                "create_issue": True,
                                "project_key": "BETA",
                                "issue_type": "Incident",
                                "priority": "Highest"
                            }
                        },
                        "P1": {
                            "notification_channels": ["telegram", "email"],
                            "escalation_timeout_minutes": 30,
                            "jira": {
                                "create_issue": True,
                                "project_key": "BETA",
                                "issue_type": "Bug",
                                "priority": "High"
                            }
                        },
                        "P2": {
                            "notification_channels": ["telegram"],
                            "escalation_timeout_minutes": 120,
                            "jira": {
                                "create_issue": True,
                                "project_key": "BETA",
                                "issue_type": "Task",
                                "priority": "Medium"
                            }
                        },
                        "P3": {
                            "notification_channels": ["telegram"],
                            "escalation_timeout_minutes": 480,
                            "jira": {
                                "create_issue": False,
                                "project_key": "BETA",
                                "issue_type": "Task",
                                "priority": "Low"
                            }
                        }
                    },
                    "jira": {
                        "url": "https://christmas-trading.atlassian.net",
                        "api_token": "JIRA_API_TOKEN",
                        "username": "jira-automation@christmas-trading.com",
                        "project_keys": ["BETA", "PROD"]
                    },
                    "monitoring_interval_seconds": 60,
                    "check_feedback_system": True,
                    "feedback_system_config_path": "../feedback_system.json"
                }
                log.warning(f"설정 파일을 찾을 수 없습니다: {self.config_path}, 기본값을 사용합니다.")
        except Exception as e:
            log.error(f"설정 파일 로드 중 오류: {e}")
            sys.exit(1)
    
    def check_prometheus_alerts(self):
        """Prometheus 알림 규칙 확인"""
        log.info("Prometheus 알림 규칙 확인 중...")
        
        for rule_name, rule in self.config.get("alert_rules", {}).items():
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
                        alert_id = f"{rule_name}_{datetime.datetime.now().strftime('%Y%m%d%H%M%S')}"
                        
                        if alert_id not in self.active_issues:
                            log.warning(f"새로운 알림 감지: {rule_name} ({rule['severity']})")
                            
                            # 새 알림 생성
                            self.active_issues[alert_id] = {
                                "id": alert_id,
                                "name": rule_name,
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
                            if self.config["response_actions"][rule["severity"]]["jira"]["create_issue"]:
                                self.create_jira_issue(self.active_issues[alert_id])
                else:
                    log.error(f"Prometheus API 호출 실패: {response.status_code}")
            
            except Exception as e:
                log.error(f"알림 규칙 '{rule_name}' 확인 중 오류: {e}")
    
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
                        if self.config["response_actions"]["P1"]["jira"]["create_issue"]:
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
                    if self.config["response_actions"]["P0"]["jira"]["create_issue"]:
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
                if self.config["response_actions"]["P0"]["jira"]["create_issue"]:
                    self.create_jira_issue(self.active_issues[alert_id])
    
    def send_alert_notifications(self, alert):
        """알림 전송"""
        severity = alert["severity"]
        log.info(f"{severity} 심각도 알림 전송 중: {alert['name']}")
        
        try:
            channels = self.config["response_actions"][severity]["notification_channels"]
            for channel in channels:
                if channel == "telegram" and self.config["notifications"]["telegram"]["enabled"]:
                    self.send_telegram_alert(f"{severity} 알림: {alert['name']}", 
                                         f"{alert['description']}\n\n발생 시간: {alert['detected_time']}", alert)
                elif channel == "email" and self.config["notifications"]["email"]["enabled"]:
                    self.send_email_alert(f"{severity} 알림: {alert['name']}", 
                                      f"{alert['description']}\n\n발생 시간: {alert['detected_time']}", alert)
                elif channel == "slack" and self.config["notifications"]["slack"]["enabled"]:
                    self.send_slack_alert(f"{severity} 알림: {alert['name']}", 
                                      f"{alert['description']}\n\n발생 시간: {alert['detected_time']}", alert)
                elif channel == "phone" and self.config["notifications"]["phone"]["enabled"]:
                    self.send_phone_alert(alert)
        except Exception as e:
            log.error(f"알림 전송 중 오류: {str(e)}")
            self.notification_errors += 1
    
    def send_email_alert(self, subject, message, alert):
        """이메일 알림 전송"""
        email_config = self.config["notifications"]["email"]
        
        msg = MIMEMultipart()
        msg["From"] = email_config.get("from_address", email_config["username"])
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
    
    def send_phone_alert(self, alert):
        """전화 알림 전송"""
        log.info(f"전화 알림 전송 중: {alert['name']}")
        
        try:
            phone_config = self.config["notifications"]["phone"]
            
            if not phone_config["enabled"]:
                log.warning("전화 알림이 비활성화되어 있습니다.")
                return
                
            # Twilio API를 사용한 전화 알림
            twilio_config = phone_config["twilio"]
            
            # Twilio가 설치되어 있는지 확인
            try:
                from twilio.rest import Client
            except ImportError:
                log.error("Twilio 패키지가 설치되어 있지 않습니다. pip install twilio로 설치하세요.")
                return
                
            # Twilio 클라이언트 초기화
            client = Client(twilio_config["account_sid"], twilio_config["auth_token"])
            
            # 메시지 생성
            twiml = f"""
            <Response>
                <Say language="ko-KR">
                    크리스마스 베타 테스트 {alert['severity']} 알림입니다.
                    {alert['name']}
                    {alert['description']}
                </Say>
                <Pause length="1"/>
                <Say language="ko-KR">
                    즉시 대응이 필요합니다.
                </Say>
            </Response>
            """
            
            # 모든 수신자에게 전화
            for to_number in twilio_config["to_numbers"]:
                call = client.calls.create(
                    twiml=twiml,
                    to=to_number,
                    from_=twilio_config["from_number"]
                )
                log.info(f"전화 알림 전송 완료 (SID: {call.sid}): {to_number}")
                
        except Exception as e:
            log.error(f"전화 알림 전송 중 오류: {str(e)}")
            raise
    
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
        
        # 프로젝트 키 가져오기 (project_key가 없으면 project_keys의 첫 번째 항목 또는 기본값 "BETA" 사용)
        project_key = jira_config.get("project_key")
        if not project_key:
            if "project_keys" in jira_config and len(jira_config["project_keys"]) > 0:
                project_key = jira_config["project_keys"][0]
            else:
                project_key = "BETA"
                log.warning(f"JIRA 프로젝트 키가 설정되지 않아 기본값 '{project_key}'를 사용합니다.")
        
        # 이슈 데이터 구성
        issue_data = {
            "fields": {
                "project": {
                    "key": project_key
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
        if self.config["response_actions"][severity]["jira"]["create_issue"]:
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
    parser.add_argument("--check-all", action="store_true", help="모든 시스템 점검 실행")
    
    args = parser.parse_args()
    
    # config_path 파라미터가 제공되지 않으면 None을 사용하여 기본 경로 사용
    system = IssueResponseSystem(args.config)
    
    if args.check_all:
        console.print("[bold blue]===== Christmas 베타 테스트 모든 시스템 점검 시작 =====[/bold blue]")
        system.check_prometheus_alerts()
        system.check_feedback_system_status()
        console.print("[bold green]===== 시스템 점검 완료 =====[/bold green]")
    elif args.check_feedback:
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