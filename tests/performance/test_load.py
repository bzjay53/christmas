"""
Christmas 프로젝트 - 부하 테스트

API 엔드포인트의 동시 사용자 처리 및 응답 시간을 테스트합니다.
"""
import pytest
import time
import asyncio
import statistics
from concurrent.futures import ThreadPoolExecutor
from fastapi.testclient import TestClient

from app.api.main import app

# 테스트 클라이언트 생성
client = TestClient(app)

def get_api_key():
    """테스트용 API 키 생성"""
    response = client.post(
        "/auth/api-key",
        json={"user_id": "test_performance", "permissions": ["read", "write"]}
    )
    return response.json()["api_key"]

def test_api_response_time():
    """API 엔드포인트 응답 시간 테스트"""
    # API 키 생성
    api_key = get_api_key()
    headers = {"X-API-Key": api_key}
    
    # 헬스 체크 엔드포인트 응답 시간 측정
    response_times = []
    for _ in range(10):
        start_time = time.time()
        response = client.get("/api/health", headers=headers)
        end_time = time.time()
        
        assert response.status_code == 200
        response_times.append((end_time - start_time) * 1000)  # ms로 변환
    
    # 응답 시간 통계 계산
    avg_response_time = statistics.mean(response_times)
    max_response_time = max(response_times)
    min_response_time = min(response_times)
    
    print(f"API 응답 시간 (ms): 평균={avg_response_time:.2f}, 최대={max_response_time:.2f}, 최소={min_response_time:.2f}")
    
    # 응답 시간이 200ms 이하인지 확인
    assert avg_response_time < 200, f"평균 응답 시간이 너무 깁니다: {avg_response_time:.2f}ms"

def make_request(api_key):
    """API 요청을 보내는 함수"""
    headers = {"X-API-Key": api_key}
    response = client.get("/api/health", headers=headers)
    return response.status_code

def test_concurrent_requests():
    """동시 요청 처리 테스트"""
    # API 키 생성
    api_key = get_api_key()
    
    # 동시 요청 수
    concurrent_requests = 50
    
    # ThreadPoolExecutor를 사용하여 동시 요청 실행
    with ThreadPoolExecutor(max_workers=concurrent_requests) as executor:
        futures = [executor.submit(make_request, api_key) for _ in range(concurrent_requests)]
        results = [future.result() for future in futures]
    
    # 모든 요청이 성공했는지 확인
    success_rate = results.count(200) / len(results)
    print(f"동시 요청 성공률: {success_rate * 100:.2f}%")
    
    # 성공률이 95% 이상인지 확인
    assert success_rate >= 0.95, f"동시 요청 성공률이 너무 낮습니다: {success_rate * 100:.2f}%"

@pytest.mark.asyncio
async def test_data_pipeline_throughput():
    """데이터 파이프라인 처리량 테스트"""
    # API 키 생성
    api_key = get_api_key()
    headers = {"X-API-Key": api_key}
    
    # 데이터 생성
    test_data_count = 10
    test_data = [
        {
            "symbol": f"TEST{i}/USD",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
            "price": 100.0 + i,
            "volume": 10.0,
            "bid": 99.5 + i,
            "ask": 100.5 + i,
            "source": "performance_test"
        }
        for i in range(test_data_count)
    ]
    
    # 데이터 전송 시간 측정
    start_time = time.time()
    
    # 비동기로 데이터 전송
    async def send_data(data):
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(
            None,
            lambda: client.post(
                "/api/v1/ingest/market-data", 
                json=data, 
                headers=headers
            )
        )
    
    # 병렬로 요청 실행
    tasks = [send_data(data) for data in test_data]
    responses = await asyncio.gather(*tasks)
    
    end_time = time.time()
    
    # 모든 응답이 성공인지 확인
    for response in responses:
        assert response.status_code == 200
    
    # 처리 시간 계산
    total_time = end_time - start_time
    throughput = test_data_count / total_time
    
    print(f"데이터 파이프라인 처리량: {throughput:.2f} 요청/초")
    print(f"총 처리 시간: {total_time:.2f}초 ({test_data_count} 요청)")
    
    # 초당 최소 5개 요청을 처리할 수 있는지 확인
    assert throughput >= 5, f"데이터 처리량이 너무 낮습니다: {throughput:.2f} 요청/초" 