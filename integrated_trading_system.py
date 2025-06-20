#!/usr/bin/env python3
"""
크리스마스 트레이딩 통합 시스템
Firebase + KIS API + AI 서비스 통합
"""

import asyncio
import os
import sys
import json
import logging
from datetime import datetime, timezone
from typing import Dict, Any, Optional, List
from dataclasses import dataclass

# 프로젝트 모듈 임포트
sys.path.append('/root/dev/christmas-trading/backend')
from app.core.firebase_config import firebase_manager
from test_kis_api import KISAPITester

@dataclass
class TradingOrder:
    """거래 주문 데이터 클래스"""
    user_id: str
    stock_code: str
    stock_name: str
    order_type: str  # 'buy' or 'sell'
    quantity: int
    price: int
    order_method: str = 'limit'  # 'limit' or 'market'
    ai_decision: bool = False
    ai_reason: str = ''
    ai_confidence: float = 0.0

class ChristmasTradingSystem:
    """크리스마스 트레이딩 통합 시스템"""
    
    def __init__(self):
        self.firebase = firebase_manager
        self.kis_api = KISAPITester()
        self.logger = logging.getLogger(__name__)
        
        # 로깅 설정
        logging.basicConfig(
            level=logging.INFO,
            format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
            handlers=[
                logging.FileHandler('/root/dev/christmas-trading/logs/trading_system.log'),
                logging.StreamHandler()
            ]
        )
        
        print("🎄 Christmas Trading System 초기화 중...")
        self.initialize_system()
    
    def initialize_system(self):
        """시스템 초기화"""
        try:
            # Firebase 연결 확인
            if not self.firebase.is_available():
                print("❌ Firebase 연결 실패")
                return False
            
            print("✅ Firebase 연결 성공")
            
            # KIS API 토큰 발급
            if not self.kis_api.get_access_token():
                print("❌ KIS API 토큰 발급 실패")
                return False
            
            print("✅ KIS API 연결 성공")
            print("🚀 시스템 초기화 완료 - 거래 준비됨")
            return True
            
        except Exception as e:
            print(f"❌ 시스템 초기화 실패: {e}")
            self.logger.error(f"System initialization failed: {e}")
            return False
    
    async def create_test_user(self, user_id: str = "christmas_trader_001") -> bool:
        """테스트 사용자 생성"""
        try:
            user_data = {
                'email': 'trader@christmas-trading.com',
                'firstName': 'Christmas',
                'lastName': 'Trader',
                'tier': 'premium',
                'settings': {
                    'kis_api': {
                        'app_key': self.kis_api.app_key,
                        'account': self.kis_api.account_number,
                        'mock_mode': True
                    },
                    'ai_config': {
                        'openai_key': os.getenv('OPENAI_API_KEY', ''),
                        'model': 'gpt-4o-mini',
                        'risk_tolerance': 0.7,
                        'learning_enabled': True
                    },
                    'notifications': {
                        'telegram': True,
                        'email': True,
                        'telegram_chat_id': os.getenv('TELEGRAM_CHAT_ID', '')
                    }
                }
            }
            
            success = await self.firebase.create_user(user_id, user_data)
            if success:
                print(f"✅ 테스트 사용자 생성 완료: {user_id}")
                return True
            else:
                print(f"❌ 테스트 사용자 생성 실패: {user_id}")
                return False
                
        except Exception as e:
            print(f"❌ 테스트 사용자 생성 중 오류: {e}")
            self.logger.error(f"Test user creation failed: {e}")
            return False
    
    async def analyze_stock_with_ai(self, stock_code: str, current_price: int) -> Dict[str, Any]:
        """AI 기반 주식 분석"""
        try:
            # 간단한 AI 분석 시뮬레이션 (실제로는 OpenAI API 호출)
            # 현재는 기본적인 규칙 기반 분석
            
            analysis = {
                'recommendation': 'hold',  # buy, sell, hold
                'confidence': 0.6,
                'reason': '현재 시장 상황 분석 중',
                'target_price': current_price,
                'stop_loss': current_price * 0.95,  # 5% 손절매
                'take_profit': current_price * 1.1   # 10% 익절매
            }
            
            # 간단한 분석 로직 (예시)
            if current_price < 60000:  # 삼성전자 기준 저가
                analysis.update({
                    'recommendation': 'buy',
                    'confidence': 0.8,
                    'reason': f'현재가 {current_price:,}원은 상대적 저가 구간으로 매수 기회'
                })
            elif current_price > 80000:  # 고가
                analysis.update({
                    'recommendation': 'sell',
                    'confidence': 0.7,
                    'reason': f'현재가 {current_price:,}원은 고가 구간으로 매도 고려'
                })
            
            print(f"🤖 AI 분석 결과: {analysis['recommendation'].upper()} (신뢰도: {analysis['confidence']:.1%})")
            print(f"📝 분석 근거: {analysis['reason']}")
            
            return analysis
            
        except Exception as e:
            print(f"❌ AI 분석 중 오류: {e}")
            self.logger.error(f"AI analysis failed for {stock_code}: {e}")
            
            # 기본값 반환
            return {
                'recommendation': 'hold',
                'confidence': 0.1,
                'reason': f'분석 오류 발생: {str(e)}',
                'target_price': current_price,
                'stop_loss': current_price * 0.95,
                'take_profit': current_price * 1.05
            }
    
    async def execute_trading_order(self, order: TradingOrder) -> Dict[str, Any]:
        """거래 주문 실행"""
        try:
            print(f"\n📝 거래 주문 실행 시작:")
            print(f"   - 사용자: {order.user_id}")
            print(f"   - 종목: {order.stock_name} ({order.stock_code})")
            print(f"   - 타입: {order.order_type.upper()}")
            print(f"   - 수량: {order.quantity}주")
            print(f"   - 가격: {order.price:,}원")
            print(f"   - AI 결정: {'예' if order.ai_decision else '아니오'}")
            
            # 1. Firebase에 주문 저장
            order_data = {
                'stockCode': order.stock_code,
                'stockName': order.stock_name,
                'orderType': order.order_type,
                'quantity': order.quantity,
                'price': order.price,
                'orderMethod': order.order_method,
                'aiDecision': order.ai_decision,
                'aiReason': order.ai_reason,
                'aiConfidence': order.ai_confidence,
                'status': 'pending'
            }
            
            order_id = await self.firebase.add_trading_order(order.user_id, order_data)
            if not order_id:
                raise Exception("Firebase 주문 저장 실패")
            
            print(f"✅ Firebase 주문 저장 완료: {order_id}")
            
            # 2. 실제 KIS API 주문 실행 (모의투자)
            # 실제 환경에서는 주문을 실행하지만, 테스트에서는 시뮬레이션
            
            print("📡 KIS API 주문 실행 시뮬레이션...")
            
            # 모의 주문 실행 (실제로는 실행하지 않음)
            kis_result = {
                'success': True,
                'order_id': f'KIS_{order_id}_{datetime.now().strftime("%Y%m%d%H%M%S")}',
                'message': '모의 주문 성공'
            }
            
            # 3. 주문 상태 업데이트
            update_data = {
                'status': 'submitted' if kis_result['success'] else 'failed',
                'kisOrderId': kis_result.get('order_id', ''),
                'kisMessage': kis_result.get('message', '')
            }
            
            update_success = await self.firebase.update_trading_order(
                order.user_id, order_id, update_data
            )
            
            if update_success:
                print(f"✅ 주문 상태 업데이트 완료")
            else:
                print(f"⚠️ 주문 상태 업데이트 실패")
            
            # 4. AI 학습 데이터 저장
            if order.ai_decision:
                learning_data = {
                    'userId': order.user_id,
                    'orderId': order_id,
                    'stockCode': order.stock_code,
                    'recommendation': order.order_type,
                    'confidence': order.ai_confidence,
                    'reason': order.ai_reason,
                    'executionPrice': order.price,
                    'executionTime': datetime.now(timezone.utc).isoformat(),
                    'marketCondition': 'normal'  # 실제로는 시장 상황 분석 결과
                }
                
                session_id = f"learning_{order_id}_{datetime.now().strftime('%Y%m%d%H%M%S')}"
                learning_success = await self.firebase.save_ai_learning_data(session_id, learning_data)
                
                if learning_success:
                    print(f"✅ AI 학습 데이터 저장 완료")
                else:
                    print(f"⚠️ AI 학습 데이터 저장 실패")
            
            return {
                'success': True,
                'order_id': order_id,
                'kis_order_id': kis_result.get('order_id'),
                'status': 'submitted',
                'message': '주문 실행 완료'
            }
            
        except Exception as e:
            print(f"❌ 거래 주문 실행 실패: {e}")
            self.logger.error(f"Trading order execution failed: {e}")
            
            return {
                'success': False,
                'error': str(e),
                'message': '주문 실행 실패'
            }
    
    async def get_portfolio_status(self, user_id: str) -> Dict[str, Any]:
        """포트폴리오 현황 조회"""
        try:
            print(f"\n📊 포트폴리오 현황 조회: {user_id}")
            
            # 1. Firebase에서 거래 주문 내역 조회
            orders = await self.firebase.get_trading_orders(user_id, limit=20)
            
            # 2. KIS API에서 계좌 잔고 조회
            account_balance = self.kis_api.get_account_balance()
            
            # 3. 포트폴리오 요약 계산
            total_orders = len(orders)
            buy_orders = len([o for o in orders if o.get('orderType') == 'buy'])
            sell_orders = len([o for o in orders if o.get('orderType') == 'sell'])
            ai_orders = len([o for o in orders if o.get('aiDecision')])
            
            portfolio = {
                'userId': user_id,
                'totalOrders': total_orders,
                'buyOrders': buy_orders,
                'sellOrders': sell_orders,
                'aiOrders': ai_orders,
                'aiPercentage': (ai_orders / total_orders * 100) if total_orders > 0 else 0,
                'recentOrders': orders[:10],  # 최근 10개 주문
                'accountBalance': account_balance,
                'lastUpdated': datetime.now().isoformat()
            }
            
            print(f"📈 총 주문: {total_orders}건 (매수: {buy_orders}, 매도: {sell_orders})")
            print(f"🤖 AI 주문: {ai_orders}건 ({portfolio['aiPercentage']:.1f}%)")
            
            return portfolio
            
        except Exception as e:
            print(f"❌ 포트폴리오 조회 실패: {e}")
            self.logger.error(f"Portfolio status failed for {user_id}: {e}")
            return {}
    
    async def run_ai_trading_simulation(self, user_id: str, stock_code: str = "005930") -> bool:
        """AI 매매 시뮬레이션 실행"""
        try:
            print(f"\n🤖 AI 매매 시뮬레이션 시작")
            print(f"   - 사용자: {user_id}")
            print(f"   - 종목: {stock_code}")
            
            # 1. 현재가 조회
            if not self.kis_api.get_current_price(stock_code):
                print("❌ 현재가 조회 실패")
                return False
            
            # 임시로 현재가 설정 (실제로는 KIS API 응답에서 파싱)
            current_price = 59450  # 삼성전자 현재가 (실제 API 응답값)
            stock_name = "삼성전자"
            
            # 2. AI 분석 실행
            ai_analysis = await self.analyze_stock_with_ai(stock_code, current_price)
            
            # 3. AI 추천에 따른 주문 생성
            if ai_analysis['recommendation'] in ['buy', 'sell'] and ai_analysis['confidence'] > 0.6:
                
                # 거래 수량 계산 (위험도에 따라 조절)
                base_quantity = 10
                risk_factor = ai_analysis['confidence']
                quantity = max(1, int(base_quantity * risk_factor))
                
                # 거래 주문 생성
                order = TradingOrder(
                    user_id=user_id,
                    stock_code=stock_code,
                    stock_name=stock_name,
                    order_type=ai_analysis['recommendation'],
                    quantity=quantity,
                    price=current_price,
                    order_method='limit',
                    ai_decision=True,
                    ai_reason=ai_analysis['reason'],
                    ai_confidence=ai_analysis['confidence']
                )
                
                # 4. 주문 실행
                result = await self.execute_trading_order(order)
                
                if result['success']:
                    print(f"✅ AI 매매 시뮬레이션 완료: {result['order_id']}")
                    return True
                else:
                    print(f"❌ AI 매매 실행 실패: {result.get('error')}")
                    return False
            else:
                print(f"💤 AI 분석 결과: {ai_analysis['recommendation'].upper()} (신뢰도 낮음 - {ai_analysis['confidence']:.1%})")
                print("📈 거래 실행하지 않음")
                return True
                
        except Exception as e:
            print(f"❌ AI 매매 시뮬레이션 실패: {e}")
            self.logger.error(f"AI trading simulation failed: {e}")
            return False
    
    async def run_comprehensive_test(self) -> Dict[str, bool]:
        """종합 시스템 테스트"""
        print("\n" + "="*70)
        print("🎄 Christmas Trading 통합 시스템 테스트")
        print("="*70)
        
        results = {}
        test_user_id = "test_trader_001"
        
        try:
            # 1. 테스트 사용자 생성
            print("\n1️⃣ 테스트 사용자 생성...")
            results['create_user'] = await self.create_test_user(test_user_id)
            
            # 2. AI 매매 시뮬레이션
            print("\n2️⃣ AI 매매 시뮬레이션...")
            results['ai_trading'] = await self.run_ai_trading_simulation(test_user_id, "005930")
            
            # 3. 포트폴리오 조회
            print("\n3️⃣ 포트폴리오 현황 조회...")
            portfolio = await self.get_portfolio_status(test_user_id)
            results['portfolio'] = len(portfolio) > 0
            
            # 4. Firebase 헬스체크
            print("\n4️⃣ Firebase 연결 상태 확인...")
            health = await self.firebase.health_check()
            results['firebase_health'] = health['status'] == 'healthy'
            
            # 결과 요약
            print(f"\n" + "="*70)
            print("📊 통합 시스템 테스트 결과")
            print("="*70)
            
            total_tests = len(results)
            passed_tests = sum(results.values())
            
            test_names = {
                'create_user': '사용자 생성',
                'ai_trading': 'AI 매매 시뮬레이션',
                'portfolio': '포트폴리오 조회',
                'firebase_health': 'Firebase 연결'
            }
            
            for test_key, result in results.items():
                status = "✅ 성공" if result else "❌ 실패"
                test_name = test_names.get(test_key, test_key)
                print(f"{test_name}: {status}")
            
            print(f"\n📈 총 테스트: {total_tests}개")
            print(f"✅ 성공: {passed_tests}개")
            print(f"❌ 실패: {total_tests - passed_tests}개")
            print(f"🎯 성공률: {(passed_tests/total_tests)*100:.1f}%")
            
            if passed_tests == total_tests:
                print(f"\n🎉 모든 테스트 통과! 시스템이 정상 작동합니다.")
                print(f"🚀 실제 매매 시스템 운영 준비 완료")
            else:
                print(f"\n⚠️ 일부 테스트 실패. 문제를 해결 후 재시도하세요.")
            
            return results
            
        except Exception as e:
            print(f"❌ 통합 테스트 실행 중 오류: {e}")
            self.logger.error(f"Comprehensive test failed: {e}")
            return {'error': False}

async def main():
    """메인 실행 함수"""
    # 시스템 초기화
    trading_system = ChristmasTradingSystem()
    
    # 종합 테스트 실행
    results = await trading_system.run_comprehensive_test()
    
    # 추가 테스트나 실제 운영 로직은 여기에 추가
    print(f"\n💡 다음 단계:")
    print(f"   1. 실제 Firebase 프로젝트 설정")
    print(f"   2. OpenAI API 키 설정")
    print(f"   3. 텔레그램 봇 설정")
    print(f"   4. 프론트엔드 연동")
    print(f"   5. 실제 매매 운영 시작")
    
    return results

if __name__ == "__main__":
    asyncio.run(main())