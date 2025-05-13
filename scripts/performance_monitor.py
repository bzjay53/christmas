#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
베타 환경 성능 모니터링 및 분석 스크립트
"""

import os
import sys
import json
import time
import requests
import argparse
import logging
from datetime import datetime
from rich.console import Console
from rich.table import Table
from rich.progress import Progress
from rich.logging import RichHandler
import matplotlib.pyplot as plt
import numpy as np

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(message)s",
    datefmt="[%X]",
    handlers=[RichHandler(rich_tracebacks=True)]
)
log = logging.getLogger("performance_monitor")

# 콘솔 출력 설정
console = Console()

class PerformanceMonitor:
    """베타 환경 성능 모니터링 클래스"""
    
    def __init__(self, baseline_path="environments/beta/monitoring_baseline.json", 
                 prometheus_url="http://localhost:9090", 
                 output_dir="environments/beta/performance_reports"):
        """초기화"""
        self.baseline_path = baseline_path
        self.prometheus_url = prometheus_url
        self.output_dir = output_dir
        self.load_baseline()
        self.issues = []
        self.metrics = {}
        
        # 출력 디렉토리 생성
        os.makedirs(self.output_dir, exist_ok=True)
        
    def load_baseline(self):
        """베이스라인 설정 로드"""
        try:
            with open(self.baseline_path, 'r', encoding='utf-8') as f:
                self.baseline = json.load(f)
            log.info(f"베이스라인 로드 완료: {self.baseline['baseline_name']}")
        except Exception as e:
            log.error(f"베이스라인 로드 중 오류: {e}")
            sys.exit(1)
    
    def query_prometheus(self, query, time_range="1h"):
        """Prometheus API 쿼리"""
        try:
            params = {
                'query': query,
                'time': datetime.now().timestamp(),
                'timeout': '30s'
            }
            
            if 'range' in time_range:
                # 범위 쿼리
                response = requests.get(f"{self.prometheus_url}/api/v1/query_range", params=params)
            else:
                # 인스턴트 쿼리
                response = requests.get(f"{self.prometheus_url}/api/v1/query", params=params)
            
            if response.status_code == 200:
                data = response.json()
                if data['status'] == 'success':
                    return data['data']['result']
                else:
                    log.error(f"Prometheus 쿼리 실패: {data['error']}")
            else:
                log.error(f"Prometheus API 호출 실패: {response.status_code}")
                
            return []
        except Exception as e:
            log.error(f"Prometheus 쿼리 중 오류: {e}")
            return []
    
    def collect_api_metrics(self):
        """API 성능 메트릭 수집"""
        log.info("API 성능 메트릭 수집 중...")
        
        # API 응답 시간 (P95)
        response_times = self.query_prometheus(
            "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{job='app_metrics'}[5m])) by (le, handler))"
        )
        
        # 오류율
        error_rates = self.query_prometheus(
            "sum(rate(http_requests_total{job='app_metrics', status=~'5..'}[5m])) / sum(rate(http_requests_total{job='app_metrics'}[5m]))"
        )
        
        # 초당 요청 수
        requests_per_second = self.query_prometheus(
            "sum(rate(http_requests_total{job='app_metrics'}[5m]))"
        )
        
        # 메트릭 저장
        self.metrics['api'] = {
            'response_times': response_times,
            'error_rates': error_rates,
            'requests_per_second': requests_per_second
        }
        
        # 엔드포인트별 응답 시간과 기준선 비교
        if response_times:
            table = Table(title="API 응답 시간 (P95, 밀리초)")
            table.add_column("엔드포인트", style="cyan")
            table.add_column("현재", style="yellow")
            table.add_column("기준선", style="blue")
            table.add_column("상태", style="green")
            
            for endpoint in response_times:
                if 'handler' in endpoint['metric']:
                    handler = endpoint['metric']['handler']
                    current_value = float(endpoint['value'][1]) * 1000  # 초 -> 밀리초 변환
                    
                    # 기준선에서 해당 엔드포인트 찾기
                    baseline_value = None
                    for ep in self.baseline['apis']['endpoints']:
                        if ep['path'].endswith(handler):
                            baseline_value = ep['response_time_ms']['p95']
                            break
                    
                    if baseline_value:
                        if current_value > baseline_value * 1.5:
                            status = f"❌ (+{((current_value / baseline_value) - 1) * 100:.1f}%)"
                            self.issues.append(f"API 응답 시간 (P95) 높음: {handler} - {current_value:.1f}ms (기준: {baseline_value}ms)")
                        elif current_value > baseline_value * 1.2:
                            status = f"⚠️ (+{((current_value / baseline_value) - 1) * 100:.1f}%)"
                        else:
                            status = "✅"
                    else:
                        status = "❓ (기준 없음)"
                    
                    table.add_row(
                        handler,
                        f"{current_value:.1f}",
                        f"{baseline_value}" if baseline_value else "N/A",
                        status
                    )
            
            console.print(table)
            
        # 오류율 비교
        if error_rates and error_rates[0]['value'][1]:
            current_error_rate = float(error_rates[0]['value'][1])
            baseline_error_rate = self.baseline['apis']['error_rates']['total']
            
            if current_error_rate > baseline_error_rate * 2:
                console.print(f"[red]API 오류율 높음: {current_error_rate:.4f} (기준: {baseline_error_rate})[/red]")
                self.issues.append(f"API 오류율 높음: {current_error_rate:.4f} (기준: {baseline_error_rate})")
            else:
                console.print(f"[green]API 오류율 정상: {current_error_rate:.4f} (기준: {baseline_error_rate})[/green]")
    
    def collect_system_metrics(self):
        """시스템 성능 메트릭 수집"""
        log.info("시스템 성능 메트릭 수집 중...")
        
        # CPU 사용률
        cpu_usage = self.query_prometheus(
            "100 - (avg by(instance) (rate(node_cpu_seconds_total{mode='idle',job='node'}[5m])) * 100)"
        )
        
        # 메모리 사용률
        memory_usage = self.query_prometheus(
            "(node_memory_MemTotal_bytes{job='node'} - node_memory_MemAvailable_bytes{job='node'}) / node_memory_MemTotal_bytes{job='node'} * 100"
        )
        
        # 디스크 사용률
        disk_usage = self.query_prometheus(
            "100 - ((node_filesystem_avail_bytes{job='node',mountpoint='/'} * 100) / node_filesystem_size_bytes{job='node',mountpoint='/'})"
        )
        
        # 메트릭 저장
        self.metrics['system'] = {
            'cpu_usage': cpu_usage,
            'memory_usage': memory_usage,
            'disk_usage': disk_usage
        }
        
        # 시스템 메트릭 표시
        table = Table(title="시스템 성능 메트릭")
        table.add_column("메트릭", style="cyan")
        table.add_column("현재", style="yellow")
        table.add_column("기준선", style="blue")
        table.add_column("상태", style="green")
        
        # CPU
        if cpu_usage and cpu_usage[0]['value'][1]:
            current_cpu = float(cpu_usage[0]['value'][1])
            baseline_cpu = 100 - self.baseline['system']['cpu']['idle']
            
            if current_cpu > self.baseline['alerts']['baseline_thresholds']['critical']['cpu_used_percent']:
                status = f"❌ (+{current_cpu - baseline_cpu:.1f}%)"
                self.issues.append(f"CPU 사용률 매우 높음: {current_cpu:.1f}% (기준: {baseline_cpu}%)")
            elif current_cpu > self.baseline['alerts']['baseline_thresholds']['warning']['cpu_used_percent']:
                status = f"⚠️ (+{current_cpu - baseline_cpu:.1f}%)"
                self.issues.append(f"CPU 사용률 높음: {current_cpu:.1f}% (기준: {baseline_cpu}%)")
            else:
                status = "✅"
                
            table.add_row(
                "CPU 사용률",
                f"{current_cpu:.1f}%",
                f"{baseline_cpu}%",
                status
            )
        
        # 메모리
        if memory_usage and memory_usage[0]['value'][1]:
            current_memory = float(memory_usage[0]['value'][1])
            baseline_memory = self.baseline['system']['memory']['used_percent']
            
            if current_memory > self.baseline['alerts']['baseline_thresholds']['critical']['memory_used_percent']:
                status = f"❌ (+{current_memory - baseline_memory:.1f}%)"
                self.issues.append(f"메모리 사용률 매우 높음: {current_memory:.1f}% (기준: {baseline_memory}%)")
            elif current_memory > self.baseline['alerts']['baseline_thresholds']['warning']['memory_used_percent']:
                status = f"⚠️ (+{current_memory - baseline_memory:.1f}%)"
                self.issues.append(f"메모리 사용률 높음: {current_memory:.1f}% (기준: {baseline_memory}%)")
            else:
                status = "✅"
                
            table.add_row(
                "메모리 사용률",
                f"{current_memory:.1f}%",
                f"{baseline_memory}%",
                status
            )
        
        # 디스크
        if disk_usage and disk_usage[0]['value'][1]:
            current_disk = float(disk_usage[0]['value'][1])
            baseline_disk = self.baseline['system']['disk']['used_percent']
            
            if current_disk > self.baseline['alerts']['baseline_thresholds']['critical']['disk_used_percent']:
                status = f"❌ (+{current_disk - baseline_disk:.1f}%)"
                self.issues.append(f"디스크 사용률 매우 높음: {current_disk:.1f}% (기준: {baseline_disk}%)")
            elif current_disk > self.baseline['alerts']['baseline_thresholds']['warning']['disk_used_percent']:
                status = f"⚠️ (+{current_disk - baseline_disk:.1f}%)"
                self.issues.append(f"디스크 사용률 높음: {current_disk:.1f}% (기준: {baseline_disk}%)")
            else:
                status = "✅"
                
            table.add_row(
                "디스크 사용률",
                f"{current_disk:.1f}%",
                f"{baseline_disk}%",
                status
            )
        
        console.print(table)
    
    def collect_user_metrics(self):
        """사용자 활동 메트릭 수집"""
        log.info("사용자 활동 메트릭 수집 중...")
        
        # 동시 사용자 수
        concurrent_users = self.query_prometheus(
            "sum(session_count{job='app_metrics'})"
        )
        
        # 메트릭 저장
        self.metrics['users'] = {
            'concurrent_users': concurrent_users,
        }
        
        # 사용자 활동 표시
        if concurrent_users and concurrent_users[0]['value'][1]:
            current_users = float(concurrent_users[0]['value'][1])
            baseline_users_avg = self.baseline['user_activity']['concurrent_users']['avg']
            baseline_users_peak = self.baseline['user_activity']['concurrent_users']['peak']
            
            console.print(f"현재 동시 접속 사용자: [cyan]{current_users:.0f}[/cyan] (기준 평균: {baseline_users_avg}, 최대: {baseline_users_peak})")
            
            if current_users > baseline_users_peak * 1.5:
                console.print(f"[red]동시 사용자 수가 예상 최대치의 150%를 초과했습니다![/red]")
                self.issues.append(f"동시 사용자 수 매우 높음: {current_users:.0f} (기준 최대: {baseline_users_peak})")
            elif current_users > baseline_users_peak:
                console.print(f"[yellow]동시 사용자 수가 예상 최대치를 초과했습니다.[/yellow]")
                self.issues.append(f"동시 사용자 수 높음: {current_users:.0f} (기준 최대: {baseline_users_peak})")
    
    def generate_performance_report(self):
        """성능 보고서 생성"""
        log.info("성능 보고서 생성 중...")
        
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        report_file = os.path.join(self.output_dir, f"performance_report_{timestamp}.json")
        
        report = {
            "timestamp": datetime.now().isoformat(),
            "baseline_reference": self.baseline["baseline_name"],
            "metrics": self.metrics,
            "issues": self.issues,
            "summary": {
                "total_issues": len(self.issues),
                "critical_issues": len([i for i in self.issues if any(kw in i.lower() for kw in ["매우 높음", "critical"])]),
                "warning_issues": len([i for i in self.issues if any(kw in i.lower() for kw in ["높음", "warning"])])
            }
        }
        
        with open(report_file, 'w', encoding='utf-8') as f:
            json.dump(report, f, ensure_ascii=False, indent=2)
        
        log.info(f"성능 보고서 저장 완료: {report_file}")
        return report_file
    
    def generate_visualizations(self, report_file):
        """성능 시각화 생성"""
        log.info("성능 시각화 생성 중...")
        
        try:
            with open(report_file, 'r', encoding='utf-8') as f:
                report = json.load(f)
            
            # 파일명 설정
            base_filename = os.path.splitext(report_file)[0]
            
            # 시스템 사용률 차트
            if 'system' in report['metrics']:
                plt.figure(figsize=(10, 6))
                
                # 데이터 준비
                metrics = ['CPU 사용률', '메모리 사용률', '디스크 사용률']
                current_values = []
                baseline_values = []
                
                if 'cpu_usage' in report['metrics']['system'] and report['metrics']['system']['cpu_usage']:
                    current_values.append(float(report['metrics']['system']['cpu_usage'][0]['value'][1]))
                    baseline_values.append(100 - self.baseline['system']['cpu']['idle'])
                else:
                    current_values.append(0)
                    baseline_values.append(0)
                
                if 'memory_usage' in report['metrics']['system'] and report['metrics']['system']['memory_usage']:
                    current_values.append(float(report['metrics']['system']['memory_usage'][0]['value'][1]))
                    baseline_values.append(self.baseline['system']['memory']['used_percent'])
                else:
                    current_values.append(0)
                    baseline_values.append(0)
                
                if 'disk_usage' in report['metrics']['system'] and report['metrics']['system']['disk_usage']:
                    current_values.append(float(report['metrics']['system']['disk_usage'][0]['value'][1]))
                    baseline_values.append(self.baseline['system']['disk']['used_percent'])
                else:
                    current_values.append(0)
                    baseline_values.append(0)
                
                # 차트 생성
                x = np.arange(len(metrics))
                width = 0.35
                
                fig, ax = plt.subplots(figsize=(10, 6))
                rects1 = ax.bar(x - width/2, current_values, width, label='현재')
                rects2 = ax.bar(x + width/2, baseline_values, width, label='기준선')
                
                ax.set_title('시스템 사용률 비교')
                ax.set_ylabel('사용률 (%)')
                ax.set_xticks(x)
                ax.set_xticklabels(metrics)
                ax.legend()
                
                # 차트에 값 표시
                def autolabel(rects):
                    for rect in rects:
                        height = rect.get_height()
                        ax.annotate(f'{height:.1f}%',
                                    xy=(rect.get_x() + rect.get_width()/2, height),
                                    xytext=(0, 3),
                                    textcoords="offset points",
                                    ha='center', va='bottom')
                
                autolabel(rects1)
                autolabel(rects2)
                
                plt.tight_layout()
                plt.savefig(f"{base_filename}_system_usage.png")
                plt.close()
            
            log.info(f"성능 시각화 저장 완료: {base_filename}_*.png")
        except Exception as e:
            log.error(f"성능 시각화 생성 중 오류: {e}")
    
    def recommend_improvements(self):
        """성능 개선 권장사항 제공"""
        log.info("성능 개선 권장사항 생성 중...")
        
        recommendations = []
        
        # CPU 사용률 관련 권장사항
        cpu_issues = [i for i in self.issues if "CPU" in i]
        if cpu_issues:
            recommendations.append({
                "category": "CPU 성능",
                "issues": cpu_issues,
                "recommendations": [
                    "컨테이너 리소스 제한 확인 및 조정",
                    "불필요한 백그라운드 프로세스 감소",
                    "CPU 사용률이 높은 엔드포인트 코드 최적화",
                    "필요시 수평적 확장 (pod/컨테이너 수 증가)"
                ]
            })
        
        # 메모리 사용률 관련 권장사항
        memory_issues = [i for i in self.issues if "메모리" in i]
        if memory_issues:
            recommendations.append({
                "category": "메모리 관리",
                "issues": memory_issues,
                "recommendations": [
                    "메모리 누수 확인 (특히 장기 실행 프로세스)",
                    "캐시 크기 및 TTL 조정",
                    "컨테이너 메모리 제한 상향 조정",
                    "대용량 객체 처리 방식 최적화"
                ]
            })
        
        # API 응답 시간 관련 권장사항
        api_issues = [i for i in self.issues if "API 응답 시간" in i]
        if api_issues:
            recommendations.append({
                "category": "API 성능",
                "issues": api_issues,
                "recommendations": [
                    "느린 엔드포인트 프로파일링 및 최적화",
                    "데이터베이스 쿼리 최적화 (인덱스 확인)",
                    "N+1 쿼리 문제 해결",
                    "필요시 캐싱 계층 추가"
                ]
            })
        
        # 디스크 사용률 관련 권장사항
        disk_issues = [i for i in self.issues if "디스크" in i]
        if disk_issues:
            recommendations.append({
                "category": "디스크 관리",
                "issues": disk_issues,
                "recommendations": [
                    "로그 로테이션 정책 확인 및 조정",
                    "오래된 데이터 아카이빙 또는 제거",
                    "디스크 공간 확장 계획 수립",
                    "불필요한 임시 파일 정리"
                ]
            })
        
        # 결과 표시
        if recommendations:
            console.print("\n[bold blue]===== 성능 개선 권장사항 =====[/bold blue]")
            
            for rec in recommendations:
                console.print(f"\n[bold yellow]{rec['category']}[/bold yellow]")
                console.print("관련 이슈:")
                for issue in rec['issues']:
                    console.print(f"  - {issue}")
                
                console.print("권장사항:")
                for r in rec['recommendations']:
                    console.print(f"  - {r}")
        else:
            console.print("\n[bold green]현재 성능 이슈가 없습니다. 지속적인 모니터링을 유지하세요.[/bold green]")
        
        return recommendations
    
    def run_full_analysis(self):
        """전체 성능 분석 실행"""
        console.print("[bold blue]===== 베타 환경 성능 모니터링 및 분석 시작 =====[/bold blue]")
        
        with Progress() as progress:
            task1 = progress.add_task("[cyan]API 성능 메트릭 수집...", total=100)
            task2 = progress.add_task("[green]시스템 성능 메트릭 수집...", total=100)
            task3 = progress.add_task("[yellow]사용자 활동 메트릭 수집...", total=100)
            task4 = progress.add_task("[magenta]성능 보고서 생성...", total=100)
            
            # API 성능 메트릭 수집
            progress.update(task1, advance=50)
            self.collect_api_metrics()
            progress.update(task1, completed=100)
            
            # 시스템 성능 메트릭 수집
            progress.update(task2, advance=50)
            self.collect_system_metrics()
            progress.update(task2, completed=100)
            
            # 사용자 활동 메트릭 수집
            progress.update(task3, advance=50)
            self.collect_user_metrics()
            progress.update(task3, completed=100)
            
            # 성능 보고서 생성
            progress.update(task4, advance=50)
            report_file = self.generate_performance_report()
            self.generate_visualizations(report_file)
            progress.update(task4, completed=100)
        
        # 성능 개선 권장사항
        recommendations = self.recommend_improvements()
        
        # 결과 요약
        console.print("\n[bold blue]===== 분석 결과 요약 =====[/bold blue]")
        
        if not self.issues:
            console.print("[bold green]모든 성능 지표가 정상 범위 내에 있습니다.[/bold green]")
        else:
            console.print(f"[bold red]발견된 성능 이슈: {len(self.issues)}개[/bold red]")
            issues_table = Table(title="발견된 성능 이슈")
            issues_table.add_column("No.", style="cyan")
            issues_table.add_column("이슈 설명", style="red")
            
            for i, issue in enumerate(self.issues, 1):
                issues_table.add_row(str(i), issue)
            
            console.print(issues_table)
        
        console.print(f"\n성능 보고서가 저장되었습니다: [cyan]{report_file}[/cyan]")
        console.print("시각화 파일이 함께 생성되었습니다.")

def main():
    parser = argparse.ArgumentParser(description="베타 환경 성능 모니터링 및 분석")
    parser.add_argument("--baseline", help="베이스라인 파일 경로", default="environments/beta/monitoring_baseline.json")
    parser.add_argument("--prometheus", help="Prometheus URL", default="http://localhost:9090")
    parser.add_argument("--output", help="출력 디렉토리", default="environments/beta/performance_reports")
    args = parser.parse_args()
    
    monitor = PerformanceMonitor(
        baseline_path=args.baseline,
        prometheus_url=args.prometheus,
        output_dir=args.output
    )
    monitor.run_full_analysis()

if __name__ == "__main__":
    main() 