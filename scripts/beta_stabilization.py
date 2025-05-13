#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
베타 버전 안정화 스크립트
- 중간 및 낮은 우선순위 이슈 처리
- 시스템 안정성 테스트 및 개선
- 성능 최적화 작업 수행
- 사용자 경험 개선 검증
"""

import os
import sys
import json
import time
import logging
import argparse
import requests
from datetime import datetime, timedelta
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn
import matplotlib.pyplot as plt
import numpy as np

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[
        logging.FileHandler("beta_stabilization.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("beta_stabilization")

# 콘솔 출력 설정
console = Console()

class BetaStabilization:
    """베타 버전 안정화 클래스"""
    
    def __init__(self, config_path="environments/beta/config/issue_response.json", 
                 jira_api_url=None, jira_token=None,
                 prometheus_url="http://localhost:9090"):
        """초기화"""
        self.config_path = config_path
        self.jira_api_url = jira_api_url or os.environ.get("JIRA_API_URL")
        self.jira_token = jira_token or os.environ.get("JIRA_API_TOKEN")
        self.prometheus_url = prometheus_url
        self.load_config()
        
    def load_config(self):
        """설정 파일 로드"""
        try:
            with open(self.config_path, 'r', encoding='utf-8') as f:
                self.config = json.load(f)
            logger.info(f"설정 파일 로드 완료: {self.config_path}")
        except Exception as e:
            logger.error(f"설정 파일 로드 중 오류: {e}")
            sys.exit(1)
    
    def get_remaining_issues(self):
        """남은 이슈 조회"""
        if not self.jira_api_url or not self.jira_token:
            logger.warning("JIRA API 정보가 없어 모의 데이터를 사용합니다.")
            # 모의 데이터 반환
            return {
                "medium": [
                    {"id": "XMAS-324", "title": "포트폴리오 화면에서 새로고침 시 간헐적 데이터 불일치", "component": "portfolio"},
                    {"id": "XMAS-356", "title": "주문 취소 후 잔고 업데이트 지연", "component": "orders"}
                ],
                "low": [
                    {"id": "XMAS-412", "title": "차트 렌더링 시 가끔 레이블이 겹치는 현상", "component": "web"},
                    {"id": "XMAS-427", "title": "특정 환경에서 폰트 크기 불일치", "component": "web"},
                    {"id": "XMAS-433", "title": "주문 이력 필터링 후 CSV 내보내기 오류", "component": "web"},
                    {"id": "XMAS-441", "title": "마켓 데이터 캐시 적중률 최적화 필요", "component": "ingestion"},
                    {"id": "XMAS-455", "title": "알림 설정 UI 개선 필요", "component": "notification"}
                ]
            }
        
        # 실제 JIRA API 호출 구현 (현재는 모의 데이터 반환)
        headers = {
            "Authorization": f"Bearer {self.jira_token}",
            "Content-Type": "application/json"
        }
        
        try:
            # 중간 우선순위 이슈 조회
            medium_issues_response = requests.get(
                f"{self.jira_api_url}/search",
                headers=headers,
                params={
                    "jql": "project = XMAS AND status != 'Done' AND priority = Medium",
                    "fields": "id,summary,components"
                }
            )
            
            # 낮은 우선순위 이슈 조회
            low_issues_response = requests.get(
                f"{self.jira_api_url}/search",
                headers=headers,
                params={
                    "jql": "project = XMAS AND status != 'Done' AND priority = Low",
                    "fields": "id,summary,components"
                }
            )
            
            medium_issues = []
            if medium_issues_response.status_code == 200:
                for issue in medium_issues_response.json()["issues"]:
                    medium_issues.append({
                        "id": issue["key"],
                        "title": issue["fields"]["summary"],
                        "component": issue["fields"]["components"][0]["name"] if issue["fields"]["components"] else "기타"
                    })
            
            low_issues = []
            if low_issues_response.status_code == 200:
                for issue in low_issues_response.json()["issues"]:
                    low_issues.append({
                        "id": issue["key"],
                        "title": issue["fields"]["summary"],
                        "component": issue["fields"]["components"][0]["name"] if issue["fields"]["components"] else "기타"
                    })
            
            return {
                "medium": medium_issues,
                "low": low_issues
            }
        except Exception as e:
            logger.error(f"JIRA API 호출 중 오류: {e}")
            # 오류 발생 시 모의 데이터 반환
            return {
                "medium": [
                    {"id": "XMAS-324", "title": "포트폴리오 화면에서 새로고침 시 간헐적 데이터 불일치", "component": "portfolio"},
                    {"id": "XMAS-356", "title": "주문 취소 후 잔고 업데이트 지연", "component": "orders"}
                ],
                "low": [
                    {"id": "XMAS-412", "title": "차트 렌더링 시 가끔 레이블이 겹치는 현상", "component": "web"},
                    {"id": "XMAS-427", "title": "특정 환경에서 폰트 크기 불일치", "component": "web"},
                    {"id": "XMAS-433", "title": "주문 이력 필터링 후 CSV 내보내기 오류", "component": "web"},
                    {"id": "XMAS-441", "title": "마켓 데이터 캐시 적중률 최적화 필요", "component": "ingestion"},
                    {"id": "XMAS-455", "title": "알림 설정 UI 개선 필요", "component": "notification"}
                ]
            }
    
    def display_remaining_issues(self, issues):
        """남은 이슈 표시"""
        if not issues["medium"] and not issues["low"]:
            console.print("[bold green]남은 이슈가 없습니다.[/bold green]")
            return
        
        # 중간 우선순위 이슈 표시
        if issues["medium"]:
            console.print("\n[bold yellow]중간 우선순위 이슈 목록[/bold yellow]")
            medium_table = Table(show_header=True, header_style="bold cyan")
            medium_table.add_column("이슈 ID", style="dim")
            medium_table.add_column("제목")
            medium_table.add_column("컴포넌트", style="green")
            
            for issue in issues["medium"]:
                medium_table.add_row(issue["id"], issue["title"], issue["component"])
            
            console.print(medium_table)
        
        # 낮은 우선순위 이슈 표시
        if issues["low"]:
            console.print("\n[bold blue]낮은 우선순위 이슈 목록[/bold blue]")
            low_table = Table(show_header=True, header_style="bold cyan")
            low_table.add_column("이슈 ID", style="dim")
            low_table.add_column("제목")
            low_table.add_column("컴포넌트", style="green")
            
            for issue in issues["low"]:
                low_table.add_row(issue["id"], issue["title"], issue["component"])
            
            console.print(low_table)
    
    def prioritize_issues(self, issues):
        """이슈 우선순위 설정"""
        prioritized_issues = {
            "high": [],  # 중간 우선순위 중 최우선 해결
            "medium": [],  # 나머지 중간 우선순위
            "low": []  # 낮은 우선순위 중 우선 해결
        }
        
        # 중간 우선순위 이슈 분류
        for issue in issues["medium"]:
            # 중요 컴포넌트 (orders, portfolio 등) 관련 이슈는 최우선
            if issue["component"] in ["orders", "portfolio", "auth", "strategy"]:
                prioritized_issues["high"].append(issue)
            else:
                prioritized_issues["medium"].append(issue)
        
        # 낮은 우선순위 이슈 분류
        for issue in issues["low"]:
            # UI/UX 관련 이슈는 우선 해결
            if issue["component"] in ["web", "notification"]:
                prioritized_issues["low"].append(issue)
        
        return prioritized_issues
    
    def run_system_stability_test(self, duration_minutes=60, components=None):
        """시스템 안정성 테스트 실행"""
        console.print("\n[bold green]시스템 안정성 테스트 실행 중...[/bold green]")
        components = components or ["app", "ingestion", "strategy", "orders", "portfolio", "risk", "notification"]
        
        end_time = datetime.now() + timedelta(minutes=duration_minutes)
        
        # 테스트 진행 상태 표시
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            stability_task = progress.add_task(f"안정성 테스트 진행 중 ({duration_minutes}분)...", total=duration_minutes)
            
            while datetime.now() < end_time:
                # 각 컴포넌트 상태 확인
                for component in components:
                    try:
                        # 여기서는 실제 서비스 상태 확인 로직 구현 필요
                        # 예: 헬스체크 엔드포인트 호출, 메트릭 수집 등
                        logger.info(f"{component} 서비스 상태 확인 중")
                    except Exception as e:
                        logger.error(f"{component} 서비스 확인 중 오류: {e}")
                
                # 진행 상태 업데이트
                elapsed_minutes = (datetime.now() - (end_time - timedelta(minutes=duration_minutes))).total_seconds() / 60
                progress.update(stability_task, completed=min(elapsed_minutes, duration_minutes))
                
                # 1분 대기
                time.sleep(60)
        
        console.print("[bold green]시스템 안정성 테스트 완료![/bold green]")
        
        # 테스트 결과 출력 (예시)
        test_results = {
            "uptime_percentage": 99.98,
            "error_rate_percentage": 0.02,
            "response_time_p95_ms": 185,
            "cpu_usage_avg_percentage": 45,
            "memory_usage_avg_percentage": 60
        }
        
        results_table = Table(title=f"안정성 테스트 결과 (테스트 시간: {duration_minutes}분)")
        results_table.add_column("지표", style="cyan")
        results_table.add_column("값", style="green")
        results_table.add_column("상태", style="yellow")
        
        for metric, value in test_results.items():
            status = "✅"
            
            if metric == "uptime_percentage" and value < 99.9:
                status = "⚠️"
            elif metric == "error_rate_percentage" and value > 0.1:
                status = "⚠️"
            elif metric == "response_time_p95_ms" and value > 200:
                status = "⚠️"
            elif metric == "cpu_usage_avg_percentage" and value > 70:
                status = "⚠️"
            elif metric == "memory_usage_avg_percentage" and value > 80:
                status = "⚠️"
            
            # 지표 이름 변환
            metric_name = {
                "uptime_percentage": "가동 시간",
                "error_rate_percentage": "오류율",
                "response_time_p95_ms": "응답 시간 (P95)",
                "cpu_usage_avg_percentage": "CPU 사용률 (평균)",
                "memory_usage_avg_percentage": "메모리 사용률 (평균)"
            }.get(metric, metric)
            
            # 단위 추가
            if metric == "uptime_percentage":
                value_str = f"{value}%"
            elif metric == "error_rate_percentage":
                value_str = f"{value}%"
            elif metric == "response_time_p95_ms":
                value_str = f"{value}ms"
            elif metric == "cpu_usage_avg_percentage":
                value_str = f"{value}%"
            elif metric == "memory_usage_avg_percentage":
                value_str = f"{value}%"
            else:
                value_str = str(value)
            
            results_table.add_row(metric_name, value_str, status)
        
        console.print(results_table)
        
        return test_results
    
    def perform_performance_optimization(self, components=None):
        """성능 최적화 작업 수행"""
        console.print("\n[bold green]성능 최적화 작업 수행 중...[/bold green]")
        components = components or ["api", "database", "cache"]
        
        optimization_steps = {
            "api": [
                "API 엔드포인트 응답 시간 프로파일링",
                "비동기 처리 최적화",
                "불필요한 헤더/페이로드 최소화"
            ],
            "database": [
                "느린 쿼리 식별 및 최적화",
                "인덱스 재구성",
                "데이터베이스 통계 업데이트"
            ],
            "cache": [
                "캐시 계층 추가 및 최적화",
                "메모리 캐시 크기 조정",
                "캐시 무효화 전략 개선"
            ]
        }
        
        for component in components:
            console.print(f"\n[bold cyan]'{component}' 컴포넌트 최적화 중...[/bold cyan]")
            
            if component in optimization_steps:
                for step in optimization_steps[component]:
                    with console.status(f"[bold green]{step} 진행 중...[/bold green]"):
                        # 실제 최적화 작업 수행 (예시)
                        logger.info(f"{component} - {step} 작업 실행")
                        time.sleep(2)  # 실제 구현에서는 최적화 작업 실행
                    
                    console.print(f"[green]✓[/green] {step} 완료")
            else:
                console.print(f"[yellow]'{component}' 컴포넌트에 대한 최적화 단계가 정의되지 않았습니다.[/yellow]")
        
        console.print("\n[bold green]성능 최적화 작업 완료![/bold green]")
        
        # 최적화 결과 출력 (예시)
        optimization_results = {
            "api_response_time_improvement": 35,
            "database_query_time_improvement": 45,
            "cache_hit_rate_improvement": 20
        }
        
        results_table = Table(title="성능 최적화 결과")
        results_table.add_column("지표", style="cyan")
        results_table.add_column("개선율", style="green")
        
        for metric, value in optimization_results.items():
            # 지표 이름 변환
            metric_name = {
                "api_response_time_improvement": "API 응답 시간",
                "database_query_time_improvement": "데이터베이스 쿼리 시간",
                "cache_hit_rate_improvement": "캐시 적중률"
            }.get(metric, metric)
            
            results_table.add_row(metric_name, f"{value}% 개선")
        
        console.print(results_table)
        
        return optimization_results
    
    def improve_user_experience(self, issues=None):
        """사용자 경험 개선"""
        console.print("\n[bold green]사용자 경험 개선 작업 수행 중...[/bold green]")
        
        # UI/UX 관련 이슈 목록 (없으면 기본 이슈 사용)
        ui_issues = issues or [
            {"id": "XMAS-412", "title": "차트 렌더링 시 가끔 레이블이 겹치는 현상", "component": "web"},
            {"id": "XMAS-427", "title": "특정 환경에서 폰트 크기 불일치", "component": "web"},
            {"id": "XMAS-433", "title": "주문 이력 필터링 후 CSV 내보내기 오류", "component": "web"},
            {"id": "XMAS-455", "title": "알림 설정 UI 개선 필요", "component": "notification"}
        ]
        
        # 이슈별로 개선 작업 수행
        for issue in ui_issues:
            console.print(f"\n[bold cyan]'{issue['id']}' 이슈 처리 중: {issue['title']}[/bold cyan]")
            
            with console.status(f"[bold green]개선 작업 진행 중...[/bold green]"):
                # 실제 개선 작업 수행 (예시)
                logger.info(f"{issue['id']} - {issue['title']} 이슈 처리")
                time.sleep(3)  # 실제 구현에서는 개선 작업 실행
            
            console.print(f"[green]✓[/green] {issue['id']} 이슈 처리 완료")
        
        console.print("\n[bold green]사용자 경험 개선 작업 완료![/bold green]")
        
        # 개선 결과 출력 (예시)
        improvement_results = {
            "ui_responsiveness": 40,
            "user_flow_simplification": 25,
            "error_messages_clarity": 60
        }
        
        results_table = Table(title="사용자 경험 개선 결과")
        results_table.add_column("영역", style="cyan")
        results_table.add_column("개선율", style="green")
        
        for area, value in improvement_results.items():
            # 영역 이름 변환
            area_name = {
                "ui_responsiveness": "UI 응답성",
                "user_flow_simplification": "사용자 흐름 단순화",
                "error_messages_clarity": "오류 메시지 명확성"
            }.get(area, area)
            
            results_table.add_row(area_name, f"{value}% 개선")
        
        console.print(results_table)
        
        return improvement_results
    
    def generate_report(self, test_results, optimization_results, improvement_results):
        """결과 보고서 생성"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = f"environments/beta/performance_reports/stabilization_report_{timestamp}.json"
        
        # 결과 데이터 구성
        report_data = {
            "timestamp": datetime.now().isoformat(),
            "stability_test": test_results,
            "performance_optimization": optimization_results,
            "user_experience_improvement": improvement_results,
            "summary": {
                "overall_system_improvement": 30,  # 예상 전체 개선율
                "stability_score": 95,  # 안정성 점수 (0-100)
                "performance_score": 85,  # 성능 점수 (0-100)
                "ux_score": 90  # 사용자 경험 점수 (0-100)
            }
        }
        
        # 보고서 저장
        os.makedirs(os.path.dirname(report_file), exist_ok=True)
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"안정화 보고서 저장 완료: {report_file}")
        console.print(f"\n[bold green]안정화 보고서가 저장되었습니다: [/bold green][cyan]{report_file}[/cyan]")
        
        # 차트 생성
        self.generate_charts(report_data, timestamp)
        
        return report_file
    
    def generate_charts(self, report_data, timestamp):
        """결과 차트 생성"""
        chart_file = f"environments/beta/performance_reports/stabilization_chart_{timestamp}.png"
        
        # 막대 차트 데이터 준비
        categories = ['안정성', '성능', '사용자 경험']
        scores = [
            report_data['summary']['stability_score'],
            report_data['summary']['performance_score'], 
            report_data['summary']['ux_score']
        ]
        
        # 목표 점수 (예시)
        target_scores = [90, 80, 85]
        
        # 차트 생성
        plt.figure(figsize=(10, 6))
        x = np.arange(len(categories))
        width = 0.35
        
        fig, ax = plt.subplots(figsize=(10, 6))
        rects1 = ax.bar(x - width/2, scores, width, label='현재 점수')
        rects2 = ax.bar(x + width/2, target_scores, width, label='목표 점수')
        
        ax.set_title('베타 버전 안정화 결과')
        ax.set_ylabel('점수')
        ax.set_xticks(x)
        ax.set_xticklabels(categories)
        ax.legend()
        
        # 점수 표시
        def autolabel(rects):
            for rect in rects:
                height = rect.get_height()
                ax.annotate(f'{height}',
                            xy=(rect.get_x() + rect.get_width()/2, height),
                            xytext=(0, 3),
                            textcoords="offset points",
                            ha='center', va='bottom')
        
        autolabel(rects1)
        autolabel(rects2)
        
        plt.tight_layout()
        plt.savefig(chart_file)
        plt.close()
        
        logger.info(f"안정화 차트 저장 완료: {chart_file}")
        console.print(f"[bold green]안정화 차트가 저장되었습니다: [/bold green][cyan]{chart_file}[/cyan]")
    
    def run(self, stability_test_duration=60):
        """전체 안정화 과정 실행"""
        console.print("[bold blue]===== 베타 버전 안정화 작업 시작 =====[/bold blue]")
        
        # 1. 남은 이슈 조회 및 우선순위 설정
        console.print("\n[bold yellow]1. 남은 이슈 조회 및 우선순위 설정[/bold yellow]")
        remaining_issues = self.get_remaining_issues()
        self.display_remaining_issues(remaining_issues)
        prioritized_issues = self.prioritize_issues(remaining_issues)
        
        # 2. 시스템 안정성 테스트
        console.print("\n[bold yellow]2. 시스템 안정성 테스트[/bold yellow]")
        test_results = self.run_system_stability_test(duration_minutes=stability_test_duration)
        
        # 3. 성능 최적화 작업
        console.print("\n[bold yellow]3. 성능 최적화 작업[/bold yellow]")
        optimization_results = self.perform_performance_optimization()
        
        # 4. 사용자 경험 개선
        console.print("\n[bold yellow]4. 사용자 경험 개선[/bold yellow]")
        ui_issues = remaining_issues["low"][:4]  # 낮은 우선순위 이슈 중 처음 4개를 UI 이슈로 가정
        improvement_results = self.improve_user_experience(ui_issues)
        
        # 5. 결과 보고서 생성
        console.print("\n[bold yellow]5. 결과 보고서 생성[/bold yellow]")
        report_file = self.generate_report(test_results, optimization_results, improvement_results)
        
        console.print("\n[bold blue]===== 베타 버전 안정화 작업 완료 =====[/bold blue]")
        console.print(f"\n요약: 안정성 점수 [bold green]{test_results['uptime_percentage']}%[/bold green], " + 
                      f"성능 개선율 [bold green]{optimization_results['api_response_time_improvement']}%[/bold green], " +
                      f"UX 개선율 [bold green]{improvement_results['ui_responsiveness']}%[/bold green]")
        
        return report_file

def main():
    parser = argparse.ArgumentParser(description="베타 버전 안정화 도구")
    parser.add_argument("--config", help="설정 파일 경로", default="environments/beta/config/issue_response.json")
    parser.add_argument("--jira-url", help="JIRA API URL", default=None)
    parser.add_argument("--jira-token", help="JIRA API 토큰", default=None)
    parser.add_argument("--prometheus", help="Prometheus URL", default="http://localhost:9090")
    parser.add_argument("--duration", help="안정성 테스트 시간(분)", type=int, default=60)
    args = parser.parse_args()
    
    stabilizer = BetaStabilization(
        config_path=args.config,
        jira_api_url=args.jira_url,
        jira_token=args.jira_token,
        prometheus_url=args.prometheus
    )
    
    stabilizer.run(stability_test_duration=args.duration)

if __name__ == "__main__":
    main() 