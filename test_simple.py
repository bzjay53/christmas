"""
Supabase 연동 간단 테스트 스크립트
"""
import sys
import os
import logging
import uuid
from datetime import datetime

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)

# 현재 디렉토리를 Python 경로에 추가
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

def test_supabase_client():
    try:
        from app.db.supabase_client import SupabaseClient
        
        # Supabase 클라이언트 생성
        supabase_client = SupabaseClient.get_instance()
        
        print(f"Supabase 테스트 모드: {supabase_client.is_test_mode}")
        
        # 간단한 테스트 데이터 생성
        test_data = {
            "user_id": str(uuid.uuid4()),
            "symbol": "BTC/USDT",
            "side": "BUY",
            "quantity": 0.01,
            "price": 60000.0,
            "status": "FILLED",
            "created_at": datetime.now().isoformat()
        }
        
        print(f"테스트 데이터: {test_data}")
        
        return True
    except ImportError as e:
        print(f"모듈 임포트 오류: {e}")
        return False
    except Exception as e:
        print(f"테스트 중 오류 발생: {e}")
        return False

if __name__ == "__main__":
    if test_supabase_client():
        print("Supabase 클라이언트 테스트 성공!")
    else:
        print("Supabase 클라이언트 테스트 실패...") 