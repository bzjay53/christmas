"""
Christmas 프로젝트 - 확장성 테스트

시스템의 수평 확장 성능과 효율성을 테스트합니다.
"""
import pytest
import time
import json
import asyncio
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
from pathlib import Path
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor
import requests
from fastapi.testclient import TestClient

from app.api.main import app

# 테스트 클라이언트 생성
client = TestClient(app)

def get_api_key():
    """테스트용 API 키 생성"""
    response = client.post(
        "/auth/api-key",
        json={"user_id": "test_scalability", "permissions": ["read", "write"]}
    )
    return response.json()["api_key"]

async def concurrent_load_test(endpoint, payload, headers, num_requests, max_workers=20):
    """주어진 엔드포인트에 대한 동시 요청 실행"""
    results = []
    
    # 스레드 풀을 사용하여 요청 실행
    with ThreadPoolExecutor(max_workers=max_workers) as executor:
        loop = asyncio.get_event_loop()
        
        # 각 요청을 스레드 풀에서 실행
        async def make_request():
            start_time = time.time()
            try:
                # requests 모듈 사용 (API URL 외부 테스트시)
                if endpoint.startswith("http"):
                    response = await loop.run_in_executor(
                        executor, 
                        lambda: requests.post(endpoint, json=payload, headers=headers)
                    )
                    status_code = response.status_code
                # TestClient 사용 (로컬 테스트시)
                else:
                    response = await loop.run_in_executor(
                        executor, 
                        lambda: client.post(endpoint, json=payload, headers=headers)
                    )
                    status_code = response.status_code
                
                end_time = time.time()
                return {
                    "status_code": status_code,
                    "response_time": (end_time - start_time) * 1000,  # ms로 변환
                    "success": status_code < 300,
                    "timestamp": datetime.now().isoformat()
                }
            except Exception as e:
                end_time = time.time()
                return {
                    "status_code": 500,
                    "response_time": (end_time - start_time) * 1000,
                    "success": False,
                    "error": str(e),
                    "timestamp": datetime.now().isoformat()
                }
        
        # 요청 작업 목록 생성
        tasks = [make_request() for _ in range(num_requests)]
        
        # 모든 요청 실행 및 결과 수집
        results = await asyncio.gather(*tasks)
    
    return results

def analyze_results(results, node_count):
    """확장성 테스트 결과 분석"""
    # 성공 응답 필터링
    successful_responses = [r for r in results if r["success"]]
    
    # 기본 통계 계산
    total_requests = len(results)
    successful_requests = len(successful_responses)
    success_rate = (successful_requests / total_requests) * 100 if total_requests > 0 else 0
    
    # 응답 시간 분석
    if successful_responses:
        response_times = [r["response_time"] for r in successful_responses]
        avg_response_time = np.mean(response_times)
        median_response_time = np.median(response_times)
        p95_response_time = np.percentile(response_times, 95)
        min_response_time = min(response_times)
        max_response_time = max(response_times)
    else:
        avg_response_time = median_response_time = p95_response_time = min_response_time = max_response_time = 0
    
    # 처리량 계산 (초당 요청 수)
    if successful_responses:
        # 첫 요청과 마지막 요청 사이의 시간 차이 계산
        start_time = min([datetime.fromisoformat(r["timestamp"]) for r in successful_responses])
        end_time = max([datetime.fromisoformat(r["timestamp"]) for r in successful_responses])
        duration_seconds = (end_time - start_time).total_seconds()
        throughput = successful_requests / duration_seconds if duration_seconds > 0 else 0
    else:
        throughput = 0
    
    # 확장 효율성 계산 (노드당 처리량)
    node_efficiency = throughput / node_count if node_count > 0 else 0
    
    # 결과 반환
    return {
        "node_count": node_count,
        "total_requests": total_requests,
        "successful_requests": successful_requests,
        "success_rate": success_rate,
        "avg_response_time": avg_response_time,
        "median_response_time": median_response_time,
        "p95_response_time": p95_response_time,
        "min_response_time": min_response_time,
        "max_response_time": max_response_time,
        "throughput": throughput,
        "node_efficiency": node_efficiency
    }

@pytest.mark.asyncio
async def test_api_horizontal_scaling():
    """API 서버의 수평 확장 성능 테스트"""
    api_key = get_api_key()
    headers = {"X-API-Key": api_key}
    
    # 테스트 엔드포인트 및 페이로드
    endpoint = "/api/v1/ingest/market-data"
    payload = {
        "symbol": "BTC/USD",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
        "price": 45000.0,
        "volume": 1.5,
        "bid": 44995.0,
        "ask": 45005.0,
        "source": "scalability_test"
    }
    
    # 다양한 노드 수에 대한 테스트 시뮬레이션
    # 실제로는 Docker Swarm이나 Kubernetes에서 노드 수를 조정하고 부하를 분산
    # 여기서는 시뮬레이션을 위해 노드 수에 따른 리소스 제한을 모방
    node_counts = [1, 2, 4, 8]
    requests_per_test = 100
    
    results_by_node = []
    
    for node_count in node_counts:
        # 현재 노드 수에 맞게 최대 동시 작업자 수 조정
        max_workers = 5 * node_count  # 노드당 5개의 작업자 할당
        
        # 동시 요청 테스트
        print(f"\n{node_count} 노드로 테스트 실행 중... (동시 요청: {requests_per_test})")
        test_results = await concurrent_load_test(
            endpoint, 
            payload, 
            headers, 
            requests_per_test, 
            max_workers=max_workers
        )
        
        # 결과 분석
        analysis = analyze_results(test_results, node_count)
        results_by_node.append(analysis)
        
        print(f"- 성공률: {analysis['success_rate']:.2f}%")
        print(f"- 평균 응답 시간: {analysis['avg_response_time']:.2f} ms")
        print(f"- 처리량: {analysis['throughput']:.2f} 요청/초")
        print(f"- 노드당 효율성: {analysis['node_efficiency']:.2f} 요청/초/노드")
    
    # 결과 시각화 및 저장
    results_dir = Path("test_results/performance")
    results_dir.mkdir(parents=True, exist_ok=True)
    
    # DataFrame 생성
    df = pd.DataFrame(results_by_node)
    
    # 확장성 시각화
    fig, (ax1, ax2, ax3) = plt.subplots(3, 1, figsize=(12, 18))
    
    # 1. 처리량 vs 노드 수
    ax1.plot(df["node_count"], df["throughput"], marker='o', linestyle='-', linewidth=2)
    for i, txt in enumerate(df["throughput"]):
        ax1.annotate(f"{txt:.2f}", (df["node_count"][i], txt), 
                   textcoords="offset points", xytext=(0,10), ha='center')
    ax1.set_xlabel('노드 수')
    ax1.set_ylabel('처리량 (요청/초)')
    ax1.set_title('노드 수에 따른 처리량 변화')
    ax1.grid(True, linestyle='--', alpha=0.7)
    
    # 2. 응답 시간 vs 노드 수
    ax2.plot(df["node_count"], df["avg_response_time"], marker='o', label='평균', linestyle='-', linewidth=2)
    ax2.plot(df["node_count"], df["p95_response_time"], marker='s', label='P95', linestyle='--', linewidth=2)
    ax2.set_xlabel('노드 수')
    ax2.set_ylabel('응답 시간 (ms)')
    ax2.set_title('노드 수에 따른 응답 시간 변화')
    ax2.legend()
    ax2.grid(True, linestyle='--', alpha=0.7)
    
    # 3. 노드당 효율성 vs 노드 수
    ax3.plot(df["node_count"], df["node_efficiency"], marker='o', linestyle='-', linewidth=2)
    for i, txt in enumerate(df["node_efficiency"]):
        ax3.annotate(f"{txt:.2f}", (df["node_count"][i], txt), 
                   textcoords="offset points", xytext=(0,10), ha='center')
    ax3.set_xlabel('노드 수')
    ax3.set_ylabel('노드당 효율성 (요청/초/노드)')
    ax3.set_title('노드 수에 따른 효율성 변화')
    ax3.grid(True, linestyle='--', alpha=0.7)
    
    # 그래프 간격 조정
    plt.tight_layout()
    plt.savefig(results_dir / "horizontal_scaling_performance.png")
    
    # JSON 결과 저장
    with open(results_dir / "scaling_analysis.json", "w") as f:
        json.dump(results_by_node, f, indent=2)
    
    # 확장 효율성 검증
    # 이상적인 경우 노드 수에 비례하여 처리량이 증가해야 함
    # 따라서 노드당 효율성은 일정하게 유지되어야 함
    efficiency_variation = np.std([r["node_efficiency"] for r in results_by_node]) / np.mean([r["node_efficiency"] for r in results_by_node])
    
    # 효율성 변동이 30% 이내에 있는지 확인
    assert efficiency_variation < 0.3, f"수평 확장 효율성 변동이 너무 큽니다: {efficiency_variation:.2%}"
    
    # 노드 수 증가에 따른 처리량 증가 확인
    assert df.iloc[-1]["throughput"] > df.iloc[0]["throughput"], "노드 수 증가에도 처리량이 증가하지 않았습니다."

@pytest.mark.asyncio
async def test_database_scaling():
    """데이터베이스 확장성 테스트 (읽기/쓰기 작업)"""
    api_key = get_api_key()
    headers = {"X-API-Key": api_key}
    
    # 쓰기 집중 작업 테스트 (데이터 수집)
    write_endpoint = "/api/v1/ingest/market-data"
    write_payload = {
        "symbol": "SCALING/USD",
        "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
        "price": 100.0,
        "volume": 10.0,
        "bid": 99.5,
        "ask": 100.5,
        "source": "db_scaling_test"
    }
    
    # 읽기 집중 작업 테스트 (데이터 조회)
    # 주의: 실제로는 먼저 데이터를 쓰고 그 다음 읽기 테스트 수행
    read_endpoint = "/api/v1/market-data"
    
    # 확장 노드 수 시뮬레이션
    node_counts = [1, 2, 4]
    requests_per_test = 50
    
    # 쓰기 작업 확장성 테스트
    write_results = []
    read_results = []
    
    for node_count in node_counts:
        # 쓰기 작업 테스트
        print(f"\n데이터베이스 쓰기 작업 {node_count} 노드 테스트...")
        write_test_results = await concurrent_load_test(
            write_endpoint, 
            write_payload, 
            headers, 
            requests_per_test, 
            max_workers=5 * node_count
        )
        
        write_analysis = analyze_results(write_test_results, node_count)
        write_results.append(write_analysis)
        
        # 읽기 작업 테스트를 위한 데이터 준비 (매개변수 추가)
        read_params = {"symbol": "SCALING/USD", "limit": 10}
        read_endpoint_with_params = f"{read_endpoint}?{'&'.join([f'{k}={v}' for k, v in read_params.items()])}"
        
        # 읽기 작업 테스트
        print(f"\n데이터베이스 읽기 작업 {node_count} 노드 테스트...")
        read_test_results = await concurrent_load_test(
            read_endpoint_with_params,
            None,  # GET 요청이므로 페이로드 없음
            headers,
            requests_per_test,
            max_workers=5 * node_count
        )
        
        read_analysis = analyze_results(read_test_results, node_count)
        read_results.append(read_analysis)
    
    # 결과 시각화 및 저장
    results_dir = Path("test_results/performance")
    results_dir.mkdir(parents=True, exist_ok=True)
    
    # DataFrame 생성
    write_df = pd.DataFrame(write_results)
    read_df = pd.DataFrame(read_results)
    
    # 쓰기/읽기 작업 처리량 비교
    plt.figure(figsize=(12, 6))
    
    plt.plot(write_df["node_count"], write_df["throughput"], marker='o', label='쓰기 작업', linewidth=2)
    plt.plot(read_df["node_count"], read_df["throughput"], marker='s', label='읽기 작업', linewidth=2)
    
    plt.xlabel('데이터베이스 노드 수')
    plt.ylabel('처리량 (요청/초)')
    plt.title('데이터베이스 확장에 따른 읽기/쓰기 처리량')
    plt.legend()
    plt.grid(True, linestyle='--', alpha=0.7)
    
    plt.savefig(results_dir / "database_scaling_performance.png")
    
    # JSON 결과 저장
    db_scaling_results = {
        "write_operations": write_results,
        "read_operations": read_results
    }
    
    with open(results_dir / "database_scaling_analysis.json", "w") as f:
        json.dump(db_scaling_results, f, indent=2)
    
    # 읽기/쓰기 처리량 증가 확인
    assert write_df.iloc[-1]["throughput"] > write_df.iloc[0]["throughput"], "데이터베이스 노드 추가에도 쓰기 처리량이 증가하지 않았습니다."
    assert read_df.iloc[-1]["throughput"] > read_df.iloc[0]["throughput"], "데이터베이스 노드 추가에도 읽기 처리량이 증가하지 않았습니다."

if __name__ == "__main__":
    import asyncio
    
    print("확장성 테스트 실행 중...")
    
    # 비동기 테스트 실행
    loop = asyncio.get_event_loop()
    
    print("\n1. API 수평 확장 테스트")
    loop.run_until_complete(test_api_horizontal_scaling())
    
    print("\n2. 데이터베이스 확장성 테스트")
    loop.run_until_complete(test_database_scaling())
    
    print("\n확장성 테스트 완료! 결과는 test_results/performance 디렉토리에서 확인하세요.") 