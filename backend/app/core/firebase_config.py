#!/usr/bin/env python3
"""
Firebase 설정 및 관리자 클래스
Christmas Trading 프로젝트용 Firebase Admin SDK 통합
"""

import os
import sys
import json
import logging
from typing import Dict, Any, Optional, List
from datetime import datetime, timezone

try:
    import firebase_admin
    from firebase_admin import credentials, firestore, auth, storage
    from google.cloud.firestore_v1 import FieldFilter
    FIREBASE_AVAILABLE = True
except ImportError:
    FIREBASE_AVAILABLE = False
    print("Warning: Firebase Admin SDK not available. Install firebase-admin package.", file=sys.stderr)

class FirebaseManager:
    """Firebase 서비스 통합 관리 클래스"""
    
    def __init__(self):
        self.db = None
        self.auth = None
        self.storage = None
        self.app = None
        
        if not FIREBASE_AVAILABLE:
            print("❌ Firebase Admin SDK가 설치되지 않았습니다.")
            return
        
        # 로깅 설정
        self.logger = logging.getLogger(__name__)
        
        # Firebase 초기화
        self._initialize_firebase()
    
    def _initialize_firebase(self):
        """Firebase Admin SDK 초기화"""
        try:
            # 이미 초기화된 앱이 있는지 확인
            if firebase_admin._apps:
                self.app = firebase_admin.get_app()
            else:
                # 서비스 계정 인증 정보 설정
                cred = self._get_credentials()
                
                # Firebase 앱 초기화
                self.app = firebase_admin.initialize_app(cred, {
                    'projectId': os.getenv('FIREBASE_PROJECT_ID', 'christmas-trading'),
                    'storageBucket': os.getenv('FIREBASE_STORAGE_BUCKET', 'christmas-trading.appspot.com')
                })
            
            # Firebase 서비스 클라이언트 초기화
            self.db = firestore.client()
            self.auth = auth
            self.storage = storage.bucket()
            
            print("✅ Firebase Admin SDK 초기화 완료")
            
        except Exception as e:
            print(f"❌ Firebase 초기화 실패: {e}")
            self.logger.error(f"Firebase initialization failed: {e}")
    
    def _get_credentials(self):
        """Firebase 인증 정보 획득"""
        # 방법 1: 서비스 계정 키 파일 사용
        service_account_path = os.getenv('FIREBASE_SERVICE_ACCOUNT_FILE')
        if service_account_path and os.path.exists(service_account_path):
            print(f"✅ 서비스 계정 파일 사용: {service_account_path}")
            return credentials.Certificate(service_account_path)
        
        # 방법 2: 환경변수에서 서비스 계정 정보 구성
        try:
            service_account_info = {
                "type": "service_account",
                "project_id": os.getenv('FIREBASE_PROJECT_ID'),
                "private_key_id": os.getenv('FIREBASE_PRIVATE_KEY_ID'),
                "private_key": os.getenv('FIREBASE_PRIVATE_KEY', '').replace('\\n', '\n'),
                "client_email": os.getenv('FIREBASE_CLIENT_EMAIL'),
                "client_id": os.getenv('FIREBASE_CLIENT_ID'),
                "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                "token_uri": "https://oauth2.googleapis.com/token",
                "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
                "client_x509_cert_url": f"https://www.googleapis.com/robot/v1/metadata/x509/{os.getenv('FIREBASE_CLIENT_EMAIL', '').replace('@', '%40')}"
            }
            
            # 필수 필드 검증
            required_fields = ['project_id', 'private_key', 'client_email']
            missing_fields = [field for field in required_fields if not service_account_info.get(field)]
            
            if missing_fields:
                raise ValueError(f"Missing required Firebase config: {missing_fields}")
            
            print("✅ 환경변수에서 서비스 계정 정보 구성")
            return credentials.Certificate(service_account_info)
            
        except Exception as e:
            print(f"❌ Firebase 인증 정보 설정 실패: {e}")
            # 방법 3: 기본 애플리케이션 크리덴셜 사용 (Google Cloud 환경)
            return credentials.ApplicationDefault()
    
    def is_available(self) -> bool:
        """Firebase 사용 가능 여부 확인"""
        return FIREBASE_AVAILABLE and self.db is not None
    
    # ==================== 사용자 관리 ====================
    
    async def get_user(self, user_id: str) -> Optional[Dict[str, Any]]:
        """사용자 정보 조회"""
        if not self.is_available():
            return None
            
        try:
            doc_ref = self.db.collection('users').document(user_id)
            doc = doc_ref.get()
            
            if doc.exists:
                data = doc.to_dict()
                data['id'] = doc.id
                return data
            return None
            
        except Exception as e:
            self.logger.error(f"사용자 조회 오류 ({user_id}): {e}")
            return None
    
    async def create_user(self, user_id: str, user_data: Dict[str, Any]) -> bool:
        """사용자 생성"""
        if not self.is_available():
            return False
            
        try:
            doc_ref = self.db.collection('users').document(user_id)
            
            # 기본 사용자 데이터 구조
            default_data = {
                'email': '',
                'firstName': '',
                'lastName': '',
                'tier': 'basic',
                'settings': {
                    'kis_api': {
                        'app_key': '',
                        'account': '',
                        'mock_mode': True
                    },
                    'ai_config': {
                        'openai_key': '',
                        'model': 'gpt-4o-mini',
                        'risk_tolerance': 0.5,
                        'learning_enabled': False
                    },
                    'notifications': {
                        'telegram': False,
                        'email': True,
                        'telegram_chat_id': ''
                    }
                },
                'createdAt': firestore.SERVER_TIMESTAMP,
                'updatedAt': firestore.SERVER_TIMESTAMP
            }
            
            # 사용자 제공 데이터와 병합
            final_data = {**default_data, **user_data}
            
            doc_ref.set(final_data)
            
            self.logger.info(f"사용자 생성 완료: {user_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"사용자 생성 오류 ({user_id}): {e}")
            return False
    
    async def update_user(self, user_id: str, update_data: Dict[str, Any]) -> bool:
        """사용자 정보 업데이트"""
        if not self.is_available():
            return False
            
        try:
            doc_ref = self.db.collection('users').document(user_id)
            
            # 업데이트 타임스탬프 추가
            update_data['updatedAt'] = firestore.SERVER_TIMESTAMP
            
            doc_ref.update(update_data)
            
            self.logger.info(f"사용자 정보 업데이트 완료: {user_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"사용자 업데이트 오류 ({user_id}): {e}")
            return False
    
    # ==================== 거래 주문 관리 ====================
    
    async def add_trading_order(self, user_id: str, order_data: Dict[str, Any]) -> Optional[str]:
        """거래 주문 추가"""
        if not self.is_available():
            return None
            
        try:
            orders_ref = self.db.collection('users').document(user_id).collection('trading_orders')
            
            # 기본 주문 데이터 구조
            default_order = {
                'stockCode': '',
                'stockName': '',
                'orderType': 'buy',  # buy, sell
                'quantity': 0,
                'price': 0,
                'orderMethod': 'limit',  # limit, market
                'status': 'pending',  # pending, submitted, filled, cancelled, failed
                'kisOrderId': '',
                'aiDecision': False,
                'aiReason': '',
                'createdAt': firestore.SERVER_TIMESTAMP,
                'updatedAt': firestore.SERVER_TIMESTAMP
            }
            
            # 주문 데이터와 병합
            final_order = {**default_order, **order_data}
            
            # 주문 추가
            doc_ref = orders_ref.add(final_order)
            order_id = doc_ref[1].id
            
            self.logger.info(f"거래 주문 추가 완료: {user_id}/{order_id}")
            return order_id
            
        except Exception as e:
            self.logger.error(f"거래 주문 추가 오류 ({user_id}): {e}")
            return None
    
    async def get_trading_orders(self, user_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """사용자 거래 주문 조회"""
        if not self.is_available():
            return []
            
        try:
            orders_ref = self.db.collection('users').document(user_id).collection('trading_orders')
            
            # 최신 주문부터 조회
            query = orders_ref.order_by('createdAt', direction=firestore.Query.DESCENDING).limit(limit)
            docs = query.stream()
            
            orders = []
            for doc in docs:
                order_data = doc.to_dict()
                order_data['id'] = doc.id
                orders.append(order_data)
            
            return orders
            
        except Exception as e:
            self.logger.error(f"거래 주문 조회 오류 ({user_id}): {e}")
            return []
    
    async def update_trading_order(self, user_id: str, order_id: str, update_data: Dict[str, Any]) -> bool:
        """거래 주문 상태 업데이트"""
        if not self.is_available():
            return False
            
        try:
            order_ref = self.db.collection('users').document(user_id).collection('trading_orders').document(order_id)
            
            # 업데이트 타임스탬프 추가
            update_data['updatedAt'] = firestore.SERVER_TIMESTAMP
            
            order_ref.update(update_data)
            
            self.logger.info(f"거래 주문 업데이트 완료: {user_id}/{order_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"거래 주문 업데이트 오류 ({user_id}/{order_id}): {e}")
            return False
    
    # ==================== AI 학습 데이터 관리 ====================
    
    async def save_ai_learning_data(self, session_id: str, learning_data: Dict[str, Any]) -> bool:
        """AI 학습 데이터 저장"""
        if not self.is_available():
            return False
            
        try:
            doc_ref = self.db.collection('ai_learning').document(session_id)
            
            # 기본 학습 데이터 구조
            default_data = {
                'userId': '',
                'strategyType': 'basic',
                'marketCondition': '',
                'decisionData': {},
                'executionResult': {},
                'performance': {
                    'profitLoss': 0,
                    'accuracy': 0,
                    'executionTime': 0
                },
                'learningPhase': 'training',  # training, validation, production
                'createdAt': firestore.SERVER_TIMESTAMP
            }
            
            # 학습 데이터와 병합
            final_data = {**default_data, **learning_data}
            
            doc_ref.set(final_data)
            
            self.logger.info(f"AI 학습 데이터 저장 완료: {session_id}")
            return True
            
        except Exception as e:
            self.logger.error(f"AI 학습 데이터 저장 오류 ({session_id}): {e}")
            return False
    
    async def get_ai_performance_stats(self, user_id: str = None) -> Dict[str, Any]:
        """AI 성과 통계 조회"""
        if not self.is_available():
            return {}
            
        try:
            query = self.db.collection('ai_learning')
            
            # 특정 사용자 필터링 (인덱스 없이 단순 조회)
            if user_id:
                query = query.where('userId', '==', user_id)
            
            # 최신 100개 문서로 제한 (날짜 필터 제거하여 인덱스 요구사항 회피)
            query = query.limit(100)
            
            docs = query.stream()
            
            total_trades = 0
            profitable_trades = 0
            total_profit = 0
            
            for doc in docs:
                data = doc.to_dict()
                performance = data.get('performance', {})
                
                total_trades += 1
                profit_loss = performance.get('profitLoss', 0)
                total_profit += profit_loss
                
                if profit_loss > 0:
                    profitable_trades += 1
            
            win_rate = (profitable_trades / total_trades * 100) if total_trades > 0 else 0
            
            return {
                'totalTrades': total_trades,
                'profitableTrades': profitable_trades,
                'winRate': round(win_rate, 2),
                'totalProfit': total_profit,
                'averageProfit': round(total_profit / total_trades, 2) if total_trades > 0 else 0
            }
            
        except Exception as e:
            self.logger.error(f"AI 성과 통계 조회 오류: {e}")
            return {}
    
    # ==================== 시스템 로그 관리 ====================
    
    async def save_system_log(self, log_data: Dict[str, Any]) -> bool:
        """시스템 로그 저장"""
        if not self.is_available():
            return False
            
        try:
            logs_ref = self.db.collection('system_logs')
            
            # 기본 로그 구조
            default_log = {
                'timestamp': firestore.SERVER_TIMESTAMP,
                'level': 'info',  # debug, info, warning, error, critical
                'service': 'backend',
                'message': '',
                'metadata': {}
            }
            
            # 로그 데이터와 병합
            final_log = {**default_log, **log_data}
            
            logs_ref.add(final_log)
            return True
            
        except Exception as e:
            self.logger.error(f"시스템 로그 저장 오류: {e}")
            return False
    
    # ==================== 배치 작업 ====================
    
    async def batch_operation(self, operations: List[Dict[str, Any]]) -> bool:
        """배치 작업 실행"""
        if not self.is_available():
            return False
            
        try:
            batch = self.db.batch()
            
            for operation in operations:
                op_type = operation.get('type')  # set, update, delete
                collection = operation.get('collection')
                document_id = operation.get('document_id')
                data = operation.get('data', {})
                
                doc_ref = self.db.collection(collection).document(document_id)
                
                if op_type == 'set':
                    batch.set(doc_ref, data)
                elif op_type == 'update':
                    batch.update(doc_ref, data)
                elif op_type == 'delete':
                    batch.delete(doc_ref)
            
            # 배치 실행
            batch.commit()
            
            self.logger.info(f"배치 작업 완료: {len(operations)}개 작업")
            return True
            
        except Exception as e:
            self.logger.error(f"배치 작업 오류: {e}")
            return False
    
    # ==================== 헬스체크 ====================
    
    async def health_check(self) -> Dict[str, Any]:
        """Firebase 연결 상태 확인"""
        if not self.is_available():
            return {
                'status': 'error',
                'message': 'Firebase not available',
                'timestamp': datetime.now().isoformat()
            }
        
        try:
            # 간단한 읽기 작업으로 연결 테스트
            test_ref = self.db.collection('_health_check').document('test')
            test_ref.set({'timestamp': firestore.SERVER_TIMESTAMP})
            
            # 읽기 테스트
            doc = test_ref.get()
            
            if doc.exists:
                return {
                    'status': 'healthy',
                    'message': 'Firebase connection successful',
                    'timestamp': datetime.now().isoformat(),
                    'project_id': os.getenv('FIREBASE_PROJECT_ID', 'unknown')
                }
            else:
                return {
                    'status': 'warning',
                    'message': 'Firebase write successful but read failed',
                    'timestamp': datetime.now().isoformat()
                }
                
        except Exception as e:
            return {
                'status': 'error',
                'message': f'Firebase health check failed: {str(e)}',
                'timestamp': datetime.now().isoformat()
            }

# 전역 Firebase 매니저 인스턴스
firebase_manager = FirebaseManager()

# 편의 함수들
async def get_user(user_id: str) -> Optional[Dict[str, Any]]:
    """사용자 조회 편의 함수"""
    return await firebase_manager.get_user(user_id)

async def create_user(user_id: str, user_data: Dict[str, Any]) -> bool:
    """사용자 생성 편의 함수"""
    return await firebase_manager.create_user(user_id, user_data)

async def add_trading_order(user_id: str, order_data: Dict[str, Any]) -> Optional[str]:
    """거래 주문 추가 편의 함수"""
    return await firebase_manager.add_trading_order(user_id, order_data)

# 개발/테스트용 데이터 생성 함수
async def create_test_data():
    """테스트용 샘플 데이터 생성"""
    if not firebase_manager.is_available():
        print("❌ Firebase를 사용할 수 없습니다.")
        return
    
    # 테스트 사용자 생성
    test_user_id = "test_user_123"
    test_user_data = {
        'email': 'test@christmas-trading.com',
        'firstName': 'Test',
        'lastName': 'User',
        'tier': 'premium'
    }
    
    success = await create_user(test_user_id, test_user_data)
    if success:
        print("✅ 테스트 사용자 생성 완료")
        
        # 테스트 주문 생성
        test_order_data = {
            'stockCode': '005930',
            'stockName': '삼성전자',
            'orderType': 'buy',
            'quantity': 10,
            'price': 75000,
            'aiDecision': True,
            'aiReason': 'Strong buy signal detected'
        }
        
        order_id = await add_trading_order(test_user_id, test_order_data)
        if order_id:
            print(f"✅ 테스트 주문 생성 완료: {order_id}")
        else:
            print("❌ 테스트 주문 생성 실패")
    else:
        print("❌ 테스트 사용자 생성 실패")

if __name__ == "__main__":
    import asyncio
    
    # Firebase 연결 테스트
    async def main():
        print("🔥 Firebase 연결 테스트 시작...")
        
        # 헬스체크
        health = await firebase_manager.health_check()
        print(f"📊 헬스체크 결과: {health}")
        
        # 테스트 데이터 생성 (선택사항)
        # await create_test_data()
    
    asyncio.run(main())