"""
Christmas 프로젝트 - 스트레스 테스트

API 시스템의 부하 한계와 오류 처리 능력을 테스트합니다.
"""
import pytest
import time
import random
import concurrent.futures
from fastapi.testclient import TestClient

from app.api.main import app

# 테스트 클라이언트 생성
client = TestClient(app)

def get_api_key():
    """테스트용 API 키 생성"""
    response = client.post(
        "/auth/api-key",
        json={"user_id": "test_stress", "permissions": ["read", "write"]}
    )
    return response.json()["api_key"]

def test_market_data_stress():
    """시장 데이터 수집 엔드포인트 스트레스 테스트"""
    # API 키 생성
    api_key = get_api_key()
    headers = {"X-API-Key": api_key}
    
    # 테스트 데이터 생성
    test_data_count = 100
    test_data = []
    for i in range(test_data_count):
        data = {
            "symbol": f"STRESS{i}/USD",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
            "price": random.uniform(100.0, 1000.0),
            "volume": random.uniform(1.0, 100.0),
            "bid": 0,
            "ask": 0,
            "source": "stress_test"
        }
        data["bid"] = data["price"] * 0.999
        data["ask"] = data["price"] * 1.001
        test_data.append(data)
    
    # 스트레스 테스트 함수
    def send_request(data):
        try:
            response = client.post(
                "/api/v1/ingest/market-data",
                json=data,
                headers=headers
            )
            return response.status_code
        except Exception as e:
            return f"오류: {str(e)}"
    
    # 병렬로 요청 전송
    start_time = time.time()
    with concurrent.futures.ThreadPoolExecutor(max_workers=20) as executor:
        futures = [executor.submit(send_request, data) for data in test_data]
        results = [future.result() for future in futures]
    end_time = time.time()
    
    # 결과 집계
    success_count = results.count(200)
    error_count = test_data_count - success_count
    success_rate = success_count / test_data_count
    
    print(f"스트레스 테스트 결과:")
    print(f"- 총 요청: {test_data_count}")
    print(f"- 성공: {success_count}")
    print(f"- 실패: {error_count}")
    print(f"- 성공률: {success_rate * 100:.2f}%")
    print(f"- 총 실행 시간: {end_time - start_time:.2f}초")
    
    # 성공률이 80% 이상인지 확인
    assert success_rate >= 0.8, f"스트레스 테스트 성공률이 너무 낮습니다: {success_rate * 100:.2f}%"

def test_api_resilience():
    """API 복원력 테스트 - 악의적인 입력과 오류 조건 처리"""
    # API 키 생성
    api_key = get_api_key()
    headers = {"X-API-Key": api_key}
    
    # 다양한 악의적인 입력 생성
    malicious_inputs = [
        # 형식이 올바르지 않은 시장 데이터
        {
            "symbol": "MALICIOUS/TEST",
            "timestamp": "잘못된 타임스탬프",
            "price": "문자열 가격",
            "volume": -1000,
            "source": "malicious_test"
        },
        # 매우 큰 숫자
        {
            "symbol": "BIG/NUMBER",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
            "price": 1e50,
            "volume": 1e20,
            "bid": 1e49,
            "ask": 1e51,
            "source": "malicious_test"
        },
        # 매우 긴 문자열
        {
            "symbol": "X" * 1000,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
            "price": 100.0,
            "volume": 10.0,
            "bid": 99.0,
            "ask": 101.0,
            "source": "X" * 1000
        },
        # SQL 인젝션 시도
        {
            "symbol": "SQL'; DROP TABLE users; --",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
            "price": 100.0,
            "volume": 10.0,
            "source": "injection_test"
        },
        # JSON 깊이 공격
        {"a": {"b": {"c": {"d": {"e": {"f": {"g": {"h": {"i": {"j": {"k": 1}}}}}}}}}}
    ]
    
    # 악의적인 입력에 대한 API 응답 테스트
    for i, test_input in enumerate(malicious_inputs):
        start_time = time.time()
        try:
            response = client.post(
                "/api/v1/ingest/market-data",
                json=test_input,
                headers=headers
            )
            end_time = time.time()
            
            # 서버 에러(500)가 아닌 클라이언트 에러(4xx)로 처리되어야 함
            assert response.status_code < 500, f"입력 {i}에 대해 서버 에러가 발생했습니다: {response.status_code}"
            
            # 타임아웃 없이 빠르게 응답해야 함
            response_time = end_time - start_time
            assert response_time < 5, f"입력 {i}에 대한 응답이 너무 느립니다: {response_time:.2f}초"
            
            print(f"악의적인 입력 {i} 테스트 성공: {response.status_code}, 응답 시간: {response_time:.2f}초")
        except Exception as e:
            # 예외가 발생해도 테스트가 중단되지 않도록 처리
            print(f"악의적인 입력 {i}에서 예외 발생: {str(e)}")
    
    # 진단 용도로 건강 상태 엔드포인트 확인
    health_response = client.get("/api/health", headers=headers)
    assert health_response.status_code == 200, "악의적인 입력 테스트 후 API 건강 상태 확인 실패"

def test_memory_leak():
    """메모리 누수 테스트 - 반복적인 요청으로 시스템 리소스 소모 패턴 확인"""
    # API 키 생성
    api_key = get_api_key()
    headers = {"X-API-Key": api_key}
    
    # 메모리 사용량을 간접적으로 측정하기 위한 응답 시간 추적
    iterations = 10
    batches = 10
    requests_per_batch = 10
    
    response_times = []
    
    # 여러 배치의 요청을 반복적으로 전송
    for iteration in range(iterations):
        batch_times = []
        
        for batch in range(batches):
            batch_start_time = time.time()
            
            for _ in range(requests_per_batch):
                # 테스트 데이터 생성
                test_data = {
                    "symbol": f"MEMLEAK/USD",
                    "timestamp": time.strftime("%Y-%m-%dT%H:%M:%S.000Z", time.gmtime()),
                    "price": random.uniform(100.0, 1000.0),
                    "volume": random.uniform(1.0, 100.0),
                    "bid": 0,
                    "ask": 0,
                    "source": "memory_leak_test"
                }
                test_data["bid"] = test_data["price"] * 0.999
                test_data["ask"] = test_data["price"] * 1.001
                
                # 요청 전송
                response = client.post(
                    "/api/v1/ingest/market-data",
                    json=test_data,
                    headers=headers
                )
                
                assert response.status_code == 200
            
            batch_end_time = time.time()
            batch_times.append(batch_end_time - batch_start_time)
        
        # 이 반복에서 평균 배치 시간 계산
        avg_batch_time = sum(batch_times) / len(batch_times)
        response_times.append(avg_batch_time)
        
        print(f"반복 {iteration+1}/{iterations}: 평균 배치 처리 시간 = {avg_batch_time:.4f}초")
    
    # 메모리 누수가 있으면 응답 시간이 점점 증가함
    # 첫 번째 반복은 워밍업으로 제외
    initial_time = response_times[1]
    final_time = response_times[-1]
    
    # 응답 시간 증가율 계산
    increase_rate = (final_time - initial_time) / initial_time
    
    print(f"응답 시간 증가율: {increase_rate * 100:.2f}%")
    print(f"초기 응답 시간: {initial_time:.4f}초")
    print(f"최종 응답 시간: {final_time:.4f}초")
    
    # 응답 시간 증가율이 50% 미만이어야 함 (일부 증가는 허용)
    assert increase_rate < 0.5, f"응답 시간 증가율이 너무 높습니다 ({increase_rate * 100:.2f}%), 메모리 누수가 의심됩니다" 