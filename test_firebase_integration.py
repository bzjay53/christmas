#!/usr/bin/env python3
"""
Firebase 통합 테스트
Christmas Trading 프로젝트용 Firebase 연결 및 기능 테스트
"""

import os
import sys
import asyncio
import json
from datetime import datetime

# 환경변수 설정
os.environ['FIREBASE_PROJECT_ID'] = 'houseparty-protocol-70821'
os.environ['FIREBASE_SERVICE_ACCOUNT_FILE'] = '/root/dev/christmas-trading/houseparty-protocol-70821-c71f293cfcd6.json'

# 백엔드 모듈 경로 추가
sys.path.append('/root/dev/christmas-trading')

try:
    from backend.app.core.firebase_config import firebase_manager
    print("✅ Firebase 설정 모듈 로드 성공")
except ImportError as e:
    print(f"❌ Firebase 설정 모듈 로드 실패: {e}")
    sys.exit(1)

async def test_firebase_integration():
    """Firebase 통합 테스트 실행"""
    print("🔥 Firebase 통합 테스트 시작\n")
    
    success_count = 0
    total_tests = 6
    
    # 1. Firebase 연결 테스트
    print("1️⃣ Firebase 연결 테스트")
    try:
        health = await firebase_manager.health_check()
        if health['status'] == 'healthy':
            print("✅ Firebase 연결 성공")
            print(f"   프로젝트 ID: {health.get('project_id', 'unknown')}")
            success_count += 1
        else:
            print(f"❌ Firebase 연결 실패: {health['message']}")
    except Exception as e:
        print(f"❌ Firebase 연결 테스트 오류: {e}")
    
    print()
    
    # 2. 사용자 생성 테스트
    print("2️⃣ 사용자 생성 테스트")
    try:
        test_user_id = f"test_user_{int(datetime.now().timestamp())}"
        user_data = {
            'email': 'test@christmas-trading.com',
            'firstName': 'Christmas',
            'lastName': 'Trader',
            'tier': 'premium'
        }
        
        result = await firebase_manager.create_user(test_user_id, user_data)
        if result:
            print(f"✅ 사용자 생성 성공: {test_user_id}")
            success_count += 1
            
            # 생성된 사용자 조회 테스트
            user = await firebase_manager.get_user(test_user_id)
            if user:
                print(f"✅ 사용자 조회 성공: {user['email']}")
            else:
                print("⚠️  사용자 조회 실패")
        else:
            print("❌ 사용자 생성 실패")
    except Exception as e:
        print(f"❌ 사용자 생성 테스트 오류: {e}")
    
    print()
    
    # 3. 거래 주문 생성 테스트
    print("3️⃣ 거래 주문 생성 테스트")
    try:
        order_data = {
            'stockCode': '005930',
            'stockName': '삼성전자',
            'orderType': 'buy',
            'quantity': 10,
            'price': 75000,
            'aiDecision': True,
            'aiReason': 'AI 매수 신호 감지 - 강한 상승 모멘텀'
        }
        
        order_id = await firebase_manager.add_trading_order(test_user_id, order_data)
        if order_id:
            print(f"✅ 거래 주문 생성 성공: {order_id}")
            success_count += 1
            
            # 생성된 주문 조회 테스트
            orders = await firebase_manager.get_trading_orders(test_user_id, limit=1)
            if orders and len(orders) > 0:
                print(f"✅ 거래 주문 조회 성공: {orders[0]['stockName']} {orders[0]['quantity']}주")
            else:
                print("⚠️  거래 주문 조회 실패")
        else:
            print("❌ 거래 주문 생성 실패")
    except Exception as e:
        print(f"❌ 거래 주문 생성 테스트 오류: {e}")
    
    print()
    
    # 4. AI 학습 데이터 저장 테스트
    print("4️⃣ AI 학습 데이터 저장 테스트")
    try:
        session_id = f"ai_session_{int(datetime.now().timestamp())}"
        learning_data = {
            'userId': test_user_id,
            'strategyType': 'momentum',
            'marketCondition': 'bullish',
            'decisionData': {
                'indicators': ['RSI', 'MACD', 'MA'],
                'confidence': 0.85,
                'signals': ['buy_signal_strong']
            },
            'executionResult': {
                'executed': True,
                'execution_time': 1.23,
                'price_filled': 75100
            },
            'performance': {
                'profitLoss': 2.5,
                'accuracy': 0.87,
                'executionTime': 1.23
            }
        }
        
        result = await firebase_manager.save_ai_learning_data(session_id, learning_data)
        if result:
            print(f"✅ AI 학습 데이터 저장 성공: {session_id}")
            success_count += 1
        else:
            print("❌ AI 학습 데이터 저장 실패")
    except Exception as e:
        print(f"❌ AI 학습 데이터 저장 테스트 오류: {e}")
    
    print()
    
    # 5. AI 성과 통계 조회 테스트
    print("5️⃣ AI 성과 통계 조회 테스트")
    try:
        stats = await firebase_manager.get_ai_performance_stats(test_user_id)
        if stats:
            print(f"✅ AI 성과 통계 조회 성공")
            print(f"   총 거래 수: {stats.get('totalTrades', 0)}")
            print(f"   수익 거래 수: {stats.get('profitableTrades', 0)}")
            print(f"   승률: {stats.get('winRate', 0)}%")
            print(f"   총 수익: {stats.get('totalProfit', 0)}")
            success_count += 1
        else:
            print("❌ AI 성과 통계 조회 실패")
    except Exception as e:
        print(f"❌ AI 성과 통계 조회 테스트 오류: {e}")
    
    print()
    
    # 6. 시스템 로그 저장 테스트
    print("6️⃣ 시스템 로그 저장 테스트")
    try:
        log_data = {
            'level': 'info',
            'service': 'christmas-trading',
            'message': 'Firebase 통합 테스트 실행',
            'metadata': {
                'test_user': test_user_id,
                'test_timestamp': datetime.now().isoformat(),
                'version': '1.0.0'
            }
        }
        
        result = await firebase_manager.save_system_log(log_data)
        if result:
            print("✅ 시스템 로그 저장 성공")
            success_count += 1
        else:
            print("❌ 시스템 로그 저장 실패")
    except Exception as e:
        print(f"❌ 시스템 로그 저장 테스트 오류: {e}")
    
    print()
    
    # 테스트 결과 요약
    print("=" * 50)
    print("🎯 Firebase 통합 테스트 결과")
    print("=" * 50)
    print(f"총 테스트: {total_tests}")
    print(f"성공: {success_count}")
    print(f"실패: {total_tests - success_count}")
    print(f"성공률: {round(success_count / total_tests * 100, 1)}%")
    
    if success_count == total_tests:
        print("\n🎉 모든 테스트 성공! Firebase 통합 완료")
        return True
    else:
        print(f"\n⚠️  {total_tests - success_count}개 테스트 실패")
        return False

if __name__ == "__main__":
    # Firebase 가용성 확인
    if not firebase_manager.is_available():
        print("❌ Firebase를 사용할 수 없습니다. Firebase Admin SDK 설치를 확인하세요.")
        sys.exit(1)
    
    # 테스트 실행
    result = asyncio.run(test_firebase_integration())
    
    if result:
        print("\n✨ Firebase 통합 테스트 완료!")
        print("🚀 Christmas Trading 시스템이 Firebase와 성공적으로 연동되었습니다.")
    else:
        print("\n❌ Firebase 통합 테스트에서 문제가 발견되었습니다.")
        print("🔧 문제를 해결한 후 다시 시도하세요.")
        sys.exit(1)