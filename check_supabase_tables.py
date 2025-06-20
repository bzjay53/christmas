#!/usr/bin/env python3
"""
Supabase 테이블 상태 확인 및 생성 스크립트
"""

import os
import sys
import requests
import json
from typing import List, Dict, Any

# Supabase 설정
SUPABASE_URL = "https://qehzzsxzjijfzqkysazc.supabase.co"
SUPABASE_SERVICE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFlaHp6c3h6amlqZnpxa3lzYXpjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgwNTgxMTQsImV4cCI6MjA2MzYzNDExNH0.zjrrUaVajb9fV1NRwzA_RMy3-r3Lpww9Uen-cZYXDuE"

def check_table_exists(table_name: str) -> bool:
    """테이블 존재 여부 확인"""
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        # 테이블에서 데이터 조회 시도 (LIMIT 0으로 구조만 확인)
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/{table_name}?limit=0",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            return True
        elif response.status_code == 404:
            return False
        else:
            print(f"❌ 테이블 {table_name} 확인 중 오류: {response.status_code} - {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ 테이블 {table_name} 확인 중 예외 발생: {e}")
        return False

def get_table_info(table_name: str) -> Dict[str, Any]:
    """테이블 정보 조회"""
    headers = {
        "apikey": SUPABASE_SERVICE_KEY,
        "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
        "Content-Type": "application/json"
    }
    
    try:
        response = requests.get(
            f"{SUPABASE_URL}/rest/v1/{table_name}?limit=1",
            headers=headers,
            timeout=10
        )
        
        if response.status_code == 200:
            data = response.json()
            return {
                "exists": True,
                "record_count": len(data),
                "status": "✅ 존재함"
            }
        else:
            return {
                "exists": False,
                "status": "❌ 존재하지 않음"
            }
            
    except Exception as e:
        return {
            "exists": False,
            "status": f"❌ 오류: {str(e)}"
        }

def main():
    """메인 실행 함수"""
    print("🎄 Christmas Trading - Supabase 테이블 상태 확인\n")
    
    # 확인할 테이블 목록
    required_tables = [
        "users",
        "trading_orders", 
        "coupons",
        "coupon_usage",
        "referral_codes",
        "referral_rewards",
        "user_sessions",
        "api_usage_logs",
        "ai_learning_data",
        "ai_strategy_performance",
        "bot_configs"
    ]
    
    print(f"📊 총 {len(required_tables)}개 테이블 상태 확인 중...\n")
    
    existing_tables = []
    missing_tables = []
    
    for table in required_tables:
        print(f"🔍 {table} 테이블 확인 중...", end=" ")
        
        info = get_table_info(table)
        print(info["status"])
        
        if info["exists"]:
            existing_tables.append(table)
        else:
            missing_tables.append(table)
    
    # 결과 요약
    print(f"\n📈 테이블 상태 요약:")
    print(f"✅ 존재하는 테이블: {len(existing_tables)}개")
    print(f"❌ 누락된 테이블: {len(missing_tables)}개")
    
    if existing_tables:
        print(f"\n✅ 존재하는 테이블들:")
        for table in existing_tables:
            print(f"   - {table}")
    
    if missing_tables:
        print(f"\n❌ 누락된 테이블들:")
        for table in missing_tables:
            print(f"   - {table}")
        
        print(f"\n💡 해결 방법:")
        print(f"1. Supabase Dashboard → SQL Editor로 이동")
        print(f"2. /root/dev/christmas-trading/complete_supabase_schema.sql 파일 내용 복사")
        print(f"3. SQL Editor에서 실행")
        print(f"4. 이 스크립트 다시 실행하여 확인")
    else:
        print(f"\n🎉 모든 테이블이 정상적으로 존재합니다!")
        
        # 테이블별 데이터 확인
        print(f"\n📊 테이블별 데이터 현황:")
        for table in existing_tables:
            try:
                headers = {
                    "apikey": SUPABASE_SERVICE_KEY,
                    "Authorization": f"Bearer {SUPABASE_SERVICE_KEY}",
                    "Content-Type": "application/json"
                }
                
                response = requests.get(
                    f"{SUPABASE_URL}/rest/v1/{table}?select=*&limit=0",
                    headers={**headers, "Prefer": "count=exact"},
                    timeout=10
                )
                
                if response.status_code == 200:
                    content_range = response.headers.get("Content-Range", "")
                    if content_range:
                        count = content_range.split("/")[-1]
                        print(f"   - {table}: {count}개 레코드")
                    else:
                        print(f"   - {table}: 레코드 수 확인 불가")
                else:
                    print(f"   - {table}: 확인 실패")
                    
            except Exception as e:
                print(f"   - {table}: 오류 ({str(e)})")

if __name__ == "__main__":
    main()