import requests
import json

def test_api_endpoints():
    """로컬에서 실행 중인 Flask 애플리케이션의 API 엔드포인트를 테스트합니다."""
    base_url = "http://localhost:5000"
    
    # 기본 엔드포인트 테스트
    response = requests.get(f"{base_url}/")
    print("/ 엔드포인트 응답:")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    print("\n")
    
    # hello 엔드포인트 테스트
    response = requests.get(f"{base_url}/hello")
    print("/hello 엔드포인트 응답:")
    print(json.dumps(response.json(), indent=2, ensure_ascii=False))
    print("\n")
    
    # 추가 API 테스트
    endpoints = ['/api/stats', '/api/performance', '/dashboard/api/stats', '/dashboard/api/performance']
    for endpoint in endpoints:
        try:
            response = requests.get(f"{base_url}{endpoint}")
            if response.status_code == 200:
                print(f"{endpoint} 엔드포인트 응답:")
                print(json.dumps(response.json(), indent=2, ensure_ascii=False))
                print("\n")
            else:
                print(f"{endpoint} 엔드포인트 상태 코드: {response.status_code}")
        except Exception as e:
            print(f"{endpoint} 엔드포인트 오류: {str(e)}")

if __name__ == "__main__":
    test_api_endpoints() 