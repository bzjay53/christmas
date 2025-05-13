#!/usr/bin/env python
# -*- coding: utf-8 -*-

"""
Christmas 프로젝트 성능 최적화 유틸리티 스크립트

이 스크립트는 다양한 성능 모니터링, 프로파일링 및 최적화 유틸리티를 제공합니다.
성능 최적화 가이드(Performance Optimization Guide)에 맞춰 구현되었습니다.
"""

import os
import sys
import time
import json
import cProfile
import pstats
import io
import timeit
import asyncio
import threading
import multiprocessing
from concurrent.futures import ThreadPoolExecutor
from functools import wraps
import logging
from rich.console import Console
from rich.table import Table
from rich.progress import Progress, SpinnerColumn, TextColumn

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s"
)
logger = logging.getLogger("performance_utils")

# 콘솔 출력 설정
console = Console()

# ============================================================================
# 1. 프로파일링 유틸리티
# ============================================================================

def profile_function(func):
    """함수 프로파일링 데코레이터

    이 데코레이터는 함수 실행 시간을 측정하고 cProfile 결과를 출력합니다.

    Args:
        func: 프로파일링할 함수

    Returns:
        프로파일링 결과를 출력하는 래퍼 함수
    """
    @wraps(func)
    def wrapper(*args, **kwargs):
        # cProfile 설정
        pr = cProfile.Profile()
        pr.enable()
        
        # 함수 실행 및 시간 측정
        start_time = time.time()
        result = func(*args, **kwargs)
        end_time = time.time()
        
        # cProfile 중지
        pr.disable()
        
        # 실행 시간 출력
        console.print(f"[bold cyan]함수 {func.__name__} 실행 시간:[/bold cyan] {end_time - start_time:.4f}초")
        
        # cProfile 결과 문자열로 가져오기
        s = io.StringIO()
        ps = pstats.Stats(pr, stream=s).sort_stats('cumulative')
        ps.print_stats(20)  # 상위 20개 결과만 출력
        
        # 결과 출력
        console.print("[bold green]cProfile 결과:[/bold green]")
        console.print(s.getvalue())
        
        return result
    
    return wrapper

def benchmark_code(stmt, setup="pass", number=1000):
    """코드 조각의 성능을 벤치마크합니다.

    Args:
        stmt (str): 벤치마크할 코드 문자열
        setup (str): 초기화 코드 문자열
        number (int): 반복 실행 횟수

    Returns:
        float: 평균 실행 시간 (초)
    """
    console.print(f"[bold yellow]코드 벤치마크 중...[/bold yellow] (반복: {number}회)")
    
    # timeit으로 측정
    result = timeit.timeit(stmt=stmt, setup=setup, number=number)
    avg_time = result / number
    
    console.print(f"[bold cyan]평균 실행 시간:[/bold cyan] {avg_time:.6f}초 (총 {result:.4f}초)")
    return avg_time

# ============================================================================
# 2. 비동기 및 병렬 처리 유틸리티
# ============================================================================

async def run_in_threadpool(func, *args, **kwargs):
    """블로킹 함수를 스레드 풀에서 실행하는 비동기 래퍼

    Args:
        func: 실행할 동기 함수
        *args, **kwargs: 함수에 전달할 인자

    Returns:
        함수 실행 결과
    """
    with ThreadPoolExecutor() as executor:
        return await asyncio.get_event_loop().run_in_executor(
            executor, lambda: func(*args, **kwargs)
        )

def run_in_process(func, *args, **kwargs):
    """함수를 별도 프로세스에서 실행

    Args:
        func: 실행할 함수
        *args, **kwargs: 함수에 전달할 인자

    Returns:
        프로세스 객체
    """
    process = multiprocessing.Process(target=func, args=args, kwargs=kwargs)
    process.start()
    return process

def parallel_map(func, items, processes=None):
    """함수를 여러 항목에 병렬로 적용

    Args:
        func: 적용할 함수
        items: 입력 항목 리스트
        processes: 사용할 프로세스 수 (None일 경우 CPU 코어 수)

    Returns:
        list: 결과 리스트
    """
    if processes is None:
        processes = multiprocessing.cpu_count()
    
    with multiprocessing.Pool(processes=processes) as pool:
        with Progress(
            SpinnerColumn(),
            TextColumn("[progress.description]{task.description}"),
            console=console
        ) as progress:
            task = progress.add_task(f"[cyan]병렬 처리 중... ({processes} 프로세스)", total=1)
            results = pool.map(func, items)
            progress.update(task, completed=1)
    
    return results

# ============================================================================
# 3. 메모리 및 리소스 최적화 유틸리티
# ============================================================================

def get_object_size(obj):
    """객체의 메모리 사용량 추정

    Args:
        obj: 크기를 측정할 객체

    Returns:
        int: 바이트 단위 크기
    """
    import sys
    import types
    import gc
    
    # 기본 객체 크기
    size = sys.getsizeof(obj)
    
    # 딕셔너리나 리스트와 같은 컨테이너 객체인 경우 내부 객체도 계산
    if isinstance(obj, (list, tuple, set, dict)):
        if isinstance(obj, dict):
            size += sum(get_object_size(k) + get_object_size(v) for k, v in obj.items())
        else:
            size += sum(get_object_size(item) for item in obj)
    
    return size

def memory_usage_report():
    """현재 프로세스의 메모리 사용량 보고

    Returns:
        dict: 메모리 사용량 정보
    """
    import psutil
    
    process = psutil.Process(os.getpid())
    memory_info = process.memory_info()
    
    # 결과 딕셔너리 생성
    report = {
        "rss": memory_info.rss / (1024 * 1024),  # RSS (Resident Set Size) - MB
        "vms": memory_info.vms / (1024 * 1024),  # VMS (Virtual Memory Size) - MB
        "percent": process.memory_percent(),
        "cpu_percent": process.cpu_percent(interval=0.1)
    }
    
    # 결과 출력
    table = Table(title="메모리 & CPU 사용량")
    table.add_column("지표", style="cyan")
    table.add_column("값", style="green")
    
    table.add_row("RSS (MB)", f"{report['rss']:.2f}")
    table.add_row("VMS (MB)", f"{report['vms']:.2f}")
    table.add_row("메모리 사용률 (%)", f"{report['percent']:.2f}")
    table.add_row("CPU 사용률 (%)", f"{report['cpu_percent']:.2f}")
    
    console.print(table)
    return report

# ============================================================================
# 4. 데이터베이스 및 캐싱 유틸리티
# ============================================================================

def analyze_query(query, db_conn, explain_format="json"):
    """데이터베이스 쿼리 실행 계획 분석

    Args:
        query (str): 분석할 SQL 쿼리
        db_conn: 데이터베이스 연결 객체
        explain_format (str): 설명 형식 (text, json, xml, yaml)

    Returns:
        dict: 쿼리 분석 결과
    """
    explain_query = f"EXPLAIN (FORMAT {explain_format}) {query}"
    
    # 쿼리 실행
    cursor = db_conn.cursor()
    cursor.execute(explain_query)
    result = cursor.fetchall()
    
    if explain_format == "json":
        # JSON 결과 처리
        plan = json.loads(result[0][0])
        
        # 결과 출력
        console.print("[bold green]쿼리 실행 계획:[/bold green]")
        console.print(f"[bold]예상 실행 시간:[/bold] {plan['Plan']['Total Cost']:.2f}")
        console.print(f"[bold]예상 행 수:[/bold] {plan['Plan']['Plan Rows']}")
        
        return plan
    else:
        # 텍스트 형식 처리
        console.print("[bold green]쿼리 실행 계획:[/bold green]")
        for row in result:
            console.print(row[0])
        
        return result

def simulate_cache_efficiency(hit_ratio, miss_penalty, operations):
    """캐시 성능 시뮬레이션

    Args:
        hit_ratio (float): 캐시 적중률 (0.0 ~ 1.0)
        miss_penalty (float): 캐시 미스 페널티 (초)
        operations (int): 총 연산 수

    Returns:
        dict: 시뮬레이션 결과
    """
    hits = int(operations * hit_ratio)
    misses = operations - hits
    
    hit_time = hits * 0.001  # 캐시 적중 시 평균 1ms 소요 가정
    miss_time = misses * miss_penalty
    total_time = hit_time + miss_time
    avg_time = total_time / operations
    
    # 결과 딕셔너리
    result = {
        "hit_ratio": hit_ratio,
        "hits": hits,
        "misses": misses,
        "total_time": total_time,
        "avg_time": avg_time
    }
    
    # 결과 출력
    table = Table(title="캐시 성능 시뮬레이션")
    table.add_column("지표", style="cyan")
    table.add_column("값", style="green")
    
    table.add_row("적중률", f"{hit_ratio:.2%}")
    table.add_row("적중 수", f"{hits:,}")
    table.add_row("미스 수", f"{misses:,}")
    table.add_row("총 소요 시간", f"{total_time:.2f}초")
    table.add_row("평균 응답 시간", f"{avg_time * 1000:.2f}ms")
    
    console.print(table)
    return result

# ============================================================================
# 5. 명령행 인터페이스
# ============================================================================

def print_usage():
    """사용법 출력"""
    console.print("[bold cyan]Christmas 성능 최적화 유틸리티[/bold cyan]")
    console.print("\n[bold yellow]사용법:[/bold yellow]")
    console.print("  python performance_utilities.py [옵션] <인자>")
    
    console.print("\n[bold yellow]옵션:[/bold yellow]")
    console.print("  --benchmark <코드>      : 코드 조각 벤치마크")
    console.print("  --memory-report         : 메모리 사용량 보고")
    console.print("  --cache-sim <적중률> <미스페널티> <연산수> : 캐시 성능 시뮬레이션")
    console.print("  --help                  : 이 도움말 표시")

def main():
    """메인 함수"""
    if len(sys.argv) < 2 or sys.argv[1] == "--help":
        print_usage()
        return
    
    if sys.argv[1] == "--benchmark":
        if len(sys.argv) < 3:
            console.print("[bold red]오류:[/bold red] 벤치마크할 코드를 입력하세요.")
            return
        
        stmt = sys.argv[2]
        number = int(sys.argv[3]) if len(sys.argv) > 3 else 1000
        benchmark_code(stmt, number=number)
    
    elif sys.argv[1] == "--memory-report":
        memory_usage_report()
    
    elif sys.argv[1] == "--cache-sim":
        if len(sys.argv) < 5:
            console.print("[bold red]오류:[/bold red] 적중률, 미스 페널티, 연산 수를 입력하세요.")
            return
        
        hit_ratio = float(sys.argv[2])
        miss_penalty = float(sys.argv[3])
        operations = int(sys.argv[4])
        simulate_cache_efficiency(hit_ratio, miss_penalty, operations)
    
    else:
        console.print(f"[bold red]오류:[/bold red] 알 수 없는 옵션: {sys.argv[1]}")
        print_usage()

if __name__ == "__main__":
    main() 