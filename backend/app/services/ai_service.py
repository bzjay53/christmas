"""
AI Service - Self-learning trading AI
"""

import asyncio
import json
from typing import Dict, List, Optional, Any
from datetime import datetime, timedelta
from loguru import logger
import openai

from app.core.config import settings

class AIService:
    """
    AI-powered trading decision service with self-learning capabilities
    """
    
    def __init__(self):
        self.openai_client = openai.AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
        self.learning_active = True
        self.model_version = "1.0.0"
        
    async def initialize(self):
        """
        Initialize AI service
        """
        try:
            # Test OpenAI connection
            response = await self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "Hello, this is a test."}],
                max_tokens=10
            )
            
            logger.info("✅ AI Service 초기화 완료")
            return True
            
        except Exception as e:
            logger.error(f"❌ AI Service 초기화 실패: {e}")
            return False
    
    async def analyze_market_conditions(self, stock_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze market conditions for trading decision
        """
        try:
            stock_code = stock_data["stock_code"]
            current_price = stock_data["current_price"]
            
            # Prepare market analysis prompt
            prompt = f"""
            다음 주식 데이터를 분석하여 매매 결정을 도와주세요:
            
            종목코드: {stock_code}
            현재가: {current_price:,}원
            등락률: {stock_data.get('change_rate', 0):.2f}%
            거래량: {stock_data.get('volume', 0):,}주
            시간: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}
            
            다음 기준으로 분석해주세요:
            1. 매수 신호 강도 (1-10점)
            2. 매도 신호 강도 (1-10점)
            3. 위험도 평가 (1-10점)
            4. 신뢰도 (0.0-1.0)
            5. 간단한 분석 이유
            
            JSON 형식으로 응답해주세요.
            """
            
            response = await self.openai_client.chat.completions.create(
                model=settings.OPENAI_MODEL,
                messages=[
                    {"role": "system", "content": "You are an expert stock analyst. Respond in Korean and provide JSON format analysis."},
                    {"role": "user", "content": prompt}
                ],
                max_tokens=500,
                temperature=0.3
            )
            
            # Parse AI response
            ai_response = response.choices[0].message.content
            
            try:
                analysis = json.loads(ai_response)
            except json.JSONDecodeError:
                # Fallback to default analysis
                analysis = {
                    "buy_signal": 5,
                    "sell_signal": 5,
                    "risk_level": 5,
                    "confidence": 0.5,
                    "analysis_reason": "AI 응답 파싱 실패"
                }
            
            # Add metadata
            analysis.update({
                "stock_code": stock_code,
                "model_version": self.model_version,
                "timestamp": datetime.now().isoformat(),
                "market_data": stock_data
            })
            
            logger.info(f"✅ AI 시장 분석 완료: {stock_code}")
            
            return analysis
            
        except Exception as e:
            logger.error(f"❌ AI 시장 분석 실패: {e}")
            # Return neutral analysis on error
            return {
                "buy_signal": 5,
                "sell_signal": 5,
                "risk_level": 8,  # High risk on error
                "confidence": 0.1,
                "analysis_reason": f"분석 오류: {str(e)}",
                "stock_code": stock_data.get("stock_code", "unknown"),
                "model_version": self.model_version,
                "timestamp": datetime.now().isoformat()
            }
    
    async def should_trade(self, analysis: Dict[str, Any]) -> Dict[str, bool]:
        """
        Make trading decision based on analysis
        """
        try:
            buy_signal = analysis.get("buy_signal", 5)
            sell_signal = analysis.get("sell_signal", 5)
            confidence = analysis.get("confidence", 0.5)
            risk_level = analysis.get("risk_level", 5)
            
            # Trading decision logic
            should_buy = (
                buy_signal >= 7 and 
                confidence >= settings.AI_CONFIDENCE_THRESHOLD and
                risk_level <= 6
            )
            
            should_sell = (
                sell_signal >= 7 and
                confidence >= settings.AI_CONFIDENCE_THRESHOLD and
                risk_level <= 6
            )
            
            # Prevent simultaneous buy/sell signals
            if should_buy and should_sell:
                if buy_signal > sell_signal:
                    should_sell = False
                else:
                    should_buy = False
            
            decision = {
                "should_buy": should_buy,
                "should_sell": should_sell,
                "confidence": confidence,
                "reason": self._get_decision_reason(buy_signal, sell_signal, confidence, risk_level)
            }
            
            logger.info(f"✅ AI 매매 결정: {analysis['stock_code']} - {decision}")
            
            return decision
            
        except Exception as e:
            logger.error(f"❌ AI 매매 결정 실패: {e}")
            return {
                "should_buy": False,
                "should_sell": False,
                "confidence": 0.0,
                "reason": f"결정 오류: {str(e)}"
            }
    
    def _get_decision_reason(self, buy_signal: int, sell_signal: int, confidence: float, risk_level: int) -> str:
        """
        Generate human-readable reason for trading decision
        """
        if buy_signal >= 7 and confidence >= settings.AI_CONFIDENCE_THRESHOLD:
            return f"강한 매수 신호 (신호강도: {buy_signal}, 신뢰도: {confidence:.2f})"
        elif sell_signal >= 7 and confidence >= settings.AI_CONFIDENCE_THRESHOLD:
            return f"강한 매도 신호 (신호강도: {sell_signal}, 신뢰도: {confidence:.2f})"
        elif confidence < settings.AI_CONFIDENCE_THRESHOLD:
            return f"신뢰도 부족 (현재: {confidence:.2f}, 필요: {settings.AI_CONFIDENCE_THRESHOLD})"
        elif risk_level > 6:
            return f"위험도 높음 (위험도: {risk_level}/10)"
        else:
            return "중립적 시장 상황"
    
    async def learn_from_trade_result(self, trade_data: Dict[str, Any], result_data: Dict[str, Any]):
        """
        Learn from trading results to improve future decisions
        """
        try:
            # Create learning data point
            learning_point = {
                "trade_id": trade_data.get("order_id"),
                "stock_code": trade_data.get("stock_code"),
                "action": trade_data.get("action"),
                "ai_confidence": trade_data.get("ai_confidence"),
                "market_conditions": trade_data.get("market_data", {}),
                "expected_result": trade_data.get("expected_profit", 0),
                "actual_result": result_data.get("actual_profit", 0),
                "success": result_data.get("success", False),
                "timestamp": datetime.now().isoformat()
            }
            
            # Store learning data (in production, this would go to database)
            # For now, we'll log it for analysis
            logger.info(f"📚 AI 학습 데이터: {learning_point}")
            
            # Analyze if this was a good or bad decision
            prediction_accuracy = self._calculate_prediction_accuracy(learning_point)
            
            logger.info(f"🎯 예측 정확도: {prediction_accuracy:.2f}")
            
            return learning_point
            
        except Exception as e:
            logger.error(f"❌ AI 학습 실패: {e}")
            return None
    
    def _calculate_prediction_accuracy(self, learning_point: Dict[str, Any]) -> float:
        """
        Calculate how accurate the AI prediction was
        """
        try:
            expected = learning_point.get("expected_result", 0)
            actual = learning_point.get("actual_result", 0)
            
            if expected == 0:
                return 0.5  # Neutral if no expectation
            
            # Calculate accuracy based on direction and magnitude
            if (expected > 0 and actual > 0) or (expected < 0 and actual < 0):
                # Correct direction
                magnitude_accuracy = 1 - min(abs(expected - actual) / abs(expected), 1)
                return 0.5 + (magnitude_accuracy * 0.5)  # 0.5 to 1.0
            else:
                # Wrong direction
                return max(0, 0.5 - abs(actual) / 0.1)  # 0 to 0.5
                
        except Exception as e:
            logger.error(f"❌ 예측 정확도 계산 실패: {e}")
            return 0.5
    
    async def generate_market_insight(self, stock_codes: List[str]) -> Dict[str, Any]:
        """
        Generate market insights for multiple stocks
        """
        try:
            insights = {
                "timestamp": datetime.now().isoformat(),
                "market_sentiment": "neutral",
                "top_opportunities": [],
                "risk_warnings": [],
                "ai_recommendations": []
            }
            
            # This would be expanded with real market analysis
            # For MVP, return basic structure
            insights["ai_recommendations"].append(
                "현재 시장 상황에서는 신중한 접근이 필요합니다."
            )
            
            logger.info("✅ 시장 인사이트 생성 완료")
            
            return insights
            
        except Exception as e:
            logger.error(f"❌ 시장 인사이트 생성 실패: {e}")
            return {"error": str(e)}
    
    async def run_learning_cycle(self):
        """
        Background task for continuous learning
        """
        logger.info("🧠 AI 학습 사이클 시작")
        
        while self.learning_active:
            try:
                # Weekly learning cycle
                await asyncio.sleep(3600)  # Check every hour
                
                current_time = datetime.now()
                if current_time.weekday() == 6 and current_time.hour == 1:  # Sunday 1 AM
                    await self._run_weekly_analysis()
                
            except Exception as e:
                logger.error(f"❌ AI 학습 사이클 오류: {e}")
                await asyncio.sleep(300)  # Wait 5 minutes on error
    
    async def _run_weekly_analysis(self):
        """
        Run weekly analysis and model updates
        """
        try:
            logger.info("📊 주간 AI 분석 시작")
            
            # This would analyze past week's performance
            # Update model parameters
            # Generate performance report
            
            analysis_report = {
                "week_start": (datetime.now() - timedelta(days=7)).isoformat(),
                "week_end": datetime.now().isoformat(),
                "total_trades": 0,  # Would be calculated from database
                "success_rate": 0.75,  # Would be calculated
                "improvements": ["패턴 인식 개선", "위험 평가 정확도 향상"],
                "next_week_focus": "변동성 대응 전략 개선"
            }
            
            logger.info(f"✅ 주간 AI 분석 완료: {analysis_report}")
            
        except Exception as e:
            logger.error(f"❌ 주간 AI 분석 실패: {e}")
    
    async def health_check(self) -> bool:
        """
        Health check for AI service
        """
        try:
            # Test OpenAI API
            response = await self.openai_client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": "Health check"}],
                max_tokens=5
            )
            
            return True
            
        except Exception as e:
            logger.error(f"❌ AI Service 헬스체크 실패: {e}")
            return False
    
    async def cleanup(self):
        """
        Cleanup AI service
        """
        try:
            self.learning_active = False
            logger.info("✅ AI Service 정리 완료")
            
        except Exception as e:
            logger.error(f"❌ AI Service 정리 실패: {e}")