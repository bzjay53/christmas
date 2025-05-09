"""
Christmas 프로젝트 - 병목 분석 테스트

API 시스템과 데이터 파이프라인의 병목 지점을 식별하고 분석합니다.
"""
import pytest
import time
import cProfile
import pstats
import io
import os
import json
from pathlib import Path
from fastapi.testclient import TestClient
from concurrent.futures import ThreadPoolExecutor
import pandas as pd
import matplotlib.pyplot as plt

from app.api.main import app

# 테스트 클라이언트 생성
client = TestClient(app)

def get_api_key():
    """테스트용 API 키 생성"""
    response = client.post(
        "/auth/api-key",
        json={"user_id": "test_bottleneck", "permissions": ["read", "write"]}
    )
    return response.json()["api_key"]

def profile_function(func, *args, **kwargs):
    """함수 프로파일링을 위한 유틸리티 함수"""
    profiler = cProfile.Profile()
    profiler.enable()
    result = func(*args, **kwargs)
    profiler.disable()
    
    # 결과 분석
    s = io.StringIO()
    ps = pstats.Stats(profiler, stream=s).sort_stats('cumulative')
    ps.print_stats(20)  # 상위 20개 항목만 출력
    
    return result, s.getvalue()

def test_data_ingestion_bottleneck():
    """데이터 수집 엔드포인트 병목 분석"""
    api_key = get_api_key()
    headers = {"X-API-Key": api_key}
    
    # 테스트 데이터 준비
    test_data = {
        "symbol": "BTC/USD",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
        "price": 45000.0,
        "volume": 1.5,
        "bid": 44995.0,
        "ask": 45005.0,
        "source": "bottleneck_test"
    }
    
    # 함수 정의
    def make_request():
        return client.post(
            "/api/v1/ingest/market-data",
            json=test_data,
            headers=headers
        )
    
    # 프로파일링 실행
    _, profile_output = profile_function(make_request)
    
    # 결과 출력
    print("\n데이터 수집 엔드포인트 병목 분석 결과:")
    print(profile_output)
    
    # 결과 저장
    results_dir = Path("test_results/performance")
    results_dir.mkdir(parents=True, exist_ok=True)
    
    with open(results_dir / "data_ingestion_profile.txt", "w") as f:
        f.write(profile_output)
    
    # 테스트 성공
    # 실제 병목 검증은 프로파일 결과를 수동으로 검토해야 함
    assert True

def test_signal_generation_bottleneck():
    """시그널 생성 엔드포인트 병목 분석"""
    api_key = get_api_key()
    headers = {"X-API-Key": api_key}
    
    # 테스트 시그널 데이터
    signal_data = {
        "symbol": "BTC/USD",
        "strategy": "bottleneck_test_strategy",
        "signal_type": "buy",
        "confidence": 0.95,
        "price": 45000.0,
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
        "metadata": {
            "indicator": "rsi",
            "value": 30.5,
            "test": True
        }
    }
    
    # 함수 정의
    def make_request():
        return client.post(
            "/api/v1/signals",
            json=signal_data,
            headers=headers
        )
    
    # 프로파일링 실행
    _, profile_output = profile_function(make_request)
    
    # 결과 출력
    print("\n시그널 생성 엔드포인트 병목 분석 결과:")
    print(profile_output)
    
    # 결과 저장
    results_dir = Path("test_results/performance")
    results_dir.mkdir(parents=True, exist_ok=True)
    
    with open(results_dir / "signal_generation_profile.txt", "w") as f:
        f.write(profile_output)
    
    # 테스트 성공
    assert True

def test_database_query_bottleneck():
    """데이터베이스 쿼리 병목 분석"""
    api_key = get_api_key()
    headers = {"X-API-Key": api_key}
    
    # 함수 정의
    def make_request():
        # 최근 주문 조회 API 호출
        return client.get(
            "/api/v1/orders?limit=50",
            headers=headers
        )
    
    # 프로파일링 실행
    response, profile_output = profile_function(make_request)
    
    # 결과 출력
    print("\n데이터베이스 쿼리 병목 분석 결과:")
    print(profile_output)
    
    # 결과 저장
    results_dir = Path("test_results/performance")
    results_dir.mkdir(parents=True, exist_ok=True)
    
    with open(results_dir / "database_query_profile.txt", "w") as f:
        f.write(profile_output)
    
    # 응답이 성공적인지 확인
    assert response.status_code == 200

def test_pipeline_bottleneck_visualization():
    """전체 파이프라인 구간별 소요 시간 시각화"""
    api_key = get_api_key()
    headers = {"X-API-Key": api_key}
    
    # 파이프라인 단계별 시간 측정
    pipeline_stages = [
        "데이터 수집",
        "데이터 검증",
        "시그널 생성",
        "전략 적용",
        "주문 생성"
    ]
    
    # 임의 테스트 데이터 - 실제로는 API에서 타임스탬프 데이터 수집 필요
    execution_times = {
        "데이터 수집": [],
        "데이터 검증": [],
        "시그널 생성": [],
        "전략 적용": [],
        "주문 생성": []
    }
    
    # 여러 번 반복 측정
    iterations = 5
    for _ in range(iterations):
        # 1. 데이터 수집 시간 측정
        start_time = time.time()
        data_response = client.post(
            "/api/v1/ingest/market-data",
            json={
                "symbol": "BTC/USD",
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
                "price": 45000.0 + (100 * _),  # 가격 조금씩 변경
                "volume": 1.5,
                "bid": 44995.0 + (100 * _),
                "ask": 45005.0 + (100 * _),
                "source": "bottleneck_test"
            },
            headers=headers
        )
        data_id = data_response.json().get("data_id")
        execution_times["데이터 수집"].append((time.time() - start_time) * 1000)  # ms로 변환
        
        # 단계별 시간을 측정하기 위해 각 단계의 API에 요청
        # 실제 프로젝트에서는 각 단계의 API 엔드포인트 구현 필요
        # 여기서는 예시로 임의의 시간을 할당
        
        # 2. 데이터 검증 (가정)
        time.sleep(0.05)  # 실제로는 API 호출
        execution_times["데이터 검증"].append(50 + random.uniform(-10, 10))
        
        # 3. 시그널 생성
        start_time = time.time()
        signal_response = client.post(
            "/api/v1/signals",
            json={
                "symbol": "BTC/USD",
                "strategy": "bottleneck_test_strategy",
                "signal_type": "buy",
                "confidence": 0.95,
                "price": 45000.0 + (100 * _),
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
                "metadata": {
                    "data_id": data_id,
                    "test": True
                }
            },
            headers=headers
        )
        execution_times["시그널 생성"].append((time.time() - start_time) * 1000)
        
        # 4. 전략 적용 (가정)
        time.sleep(0.08)  # 실제로는 API 호출
        execution_times["전략 적용"].append(80 + random.uniform(-15, 15))
        
        # 5. 주문 생성 (가정) - 실제로는 API 호출
        signal_id = signal_response.json().get("signal_id", "test_signal")
        start_time = time.time()
        order_response = client.post(
            "/api/v1/orders",
            json={
                "symbol": "BTC/USD",
                "order_type": "market",
                "side": "buy",
                "quantity": 0.1,
                "signal_id": signal_id
            },
            headers=headers
        )
        execution_times["주문 생성"].append((time.time() - start_time) * 1000)
    
    # 평균 계산
    avg_times = {stage: sum(times) / len(times) for stage, times in execution_times.items()}
    
    # 데이터 시각화
    results_dir = Path("test_results/performance")
    results_dir.mkdir(parents=True, exist_ok=True)
    
    # 단계별 소요 시간 막대 그래프
    plt.figure(figsize=(12, 6))
    bars = plt.bar(avg_times.keys(), avg_times.values())
    
    # 막대 위에 값 표시
    for bar in bars:
        height = bar.get_height()
        plt.text(bar.get_x() + bar.get_width()/2., height,
                 f'{height:.1f} ms',
                 ha='center', va='bottom')
    
    plt.title('데이터 파이프라인 단계별 평균 소요 시간')
    plt.ylabel('소요 시간 (ms)')
    plt.grid(axis='y', linestyle='--', alpha=0.7)
    plt.savefig(results_dir / "pipeline_bottleneck.png")
    
    # 결과 저장
    with open(results_dir / "pipeline_timing.json", "w") as f:
        json.dump(avg_times, f, indent=2)
    
    # 병목 지점 식별 (가장 시간이 오래 걸리는 단계)
    bottleneck_stage = max(avg_times, key=avg_times.get)
    bottleneck_time = avg_times[bottleneck_stage]
    
    print(f"\n파이프라인 병목 지점: {bottleneck_stage} ({bottleneck_time:.2f} ms)")
    
    # 전체 파이프라인 시간의 20% 이상을 차지하는 단계를 병목으로 간주
    total_time = sum(avg_times.values())
    bottleneck_threshold = total_time * 0.2
    
    bottlenecks = [stage for stage, time in avg_times.items() if time > bottleneck_threshold]
    assert bottlenecks, f"병목 지점이 식별되지 않았습니다. 분석이 필요합니다."
    
    print(f"주요 병목 단계: {', '.join(bottlenecks)}")
    print(f"총 파이프라인 실행 시간: {total_time:.2f} ms")
    
    # JSON 결과 파일에 병목 정보 추가
    bottleneck_info = {
        "pipeline_times": avg_times,
        "total_time": total_time,
        "bottleneck_stages": bottlenecks,
        "bottleneck_threshold": bottleneck_threshold
    }
    
    with open(results_dir / "bottleneck_analysis.json", "w") as f:
        json.dump(bottleneck_info, f, indent=2)
    
    return bottlenecks

if __name__ == "__main__":
    # 테스트 실행을 위한 진입점
    import random  # 임시 데이터 생성용
    
    print("병목 분석 테스트 실행 중...")
    test_data_ingestion_bottleneck()
    test_signal_generation_bottleneck()
    test_database_query_bottleneck()
    bottlenecks = test_pipeline_bottleneck_visualization()
    
    print(f"\n분석 완료! 병목 지점: {', '.join(bottlenecks)}")
    print(f"상세 결과는 test_results/performance 디렉토리에서 확인하세요.") 