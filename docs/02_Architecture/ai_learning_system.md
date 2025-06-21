# AI 자기학습 매매 시스템 설계

## 🧠 핵심 개념: 실패에서 배우는 AI

기존 지표 기반 매매의 한계를 극복하기 위해, **실패 경험을 학습하여 점진적으로 개선하는 AI 시스템**을 구축합니다.

## 🔄 AI 학습 사이클

```
매매 실행 → 결과 분석 → 패턴 학습 → 모델 업데이트 → 전략 개선
    ↑                                                       ↓
    ←────────────── 피드백 루프 ──────────────────────────────→
```

### 1단계: 매매 실행 및 데이터 수집
```python
# 매매 실행 시 수집할 데이터
trade_data = {
    "timestamp": "2025-06-10 14:30:00",
    "stock_code": "005930",  # 삼성전자
    "action": "buy",
    "price": 75000,
    "quantity": 10,
    "market_conditions": {
        "rsi": 45.2,
        "macd": 0.8,
        "bollinger_position": "middle",
        "volume_ratio": 1.3,
        "market_sentiment": "neutral",
        "news_sentiment": 0.2,
        "time_of_day": "14:30",
        "day_of_week": "monday"
    },
    "ai_confidence": 0.75,
    "expected_profit": 0.025  # 2.5% 기대 수익률
}
```

### 2단계: 결과 분석 (30분 후)
```python
# 매매 결과 분석
trade_result = {
    "trade_id": "T001",
    "actual_profit": -0.015,  # -1.5% 실제 손실
    "exit_reason": "stop_loss",
    "max_profit": 0.008,     # 최대 수익 지점
    "max_loss": -0.018,      # 최대 손실 지점
    "volatility": 0.025,
    "success": False
}
```

## 🎯 AI 학습 모델 구조

### 다층 학습 시스템
```python
class ChristmasAI:
    def __init__(self):
        self.pattern_analyzer = PatternAnalyzer()
        self.failure_learner = FailureLearner() 
        self.success_reinforcer = SuccessReinforcer()
        self.market_predictor = MarketPredictor()
        self.risk_manager = RiskManager()
```

### 1. 실패 패턴 학습기 (FailureLearner)
```python
class FailureLearner:
    def learn_from_failure(self, trade_data, trade_result):
        """
        실패한 매매에서 패턴 추출
        """
        failure_patterns = {
            "avoid_conditions": {
                "rsi_range": (40, 50),  # RSI 40-50 구간에서 실패율 높음
                "time_avoid": ["14:30-15:00"],  # 오후 2:30-3시 위험
                "volume_below": 1.2,  # 거래량 1.2배 미만 시 위험
                "news_sentiment_below": 0.1  # 뉴스 감정 0.1 미만 시 위험
            },
            "failure_indicators": {
                "rapid_volume_spike": True,  # 급격한 거래량 증가 시 위험
                "multiple_resistance": True,  # 여러 저항선 동시 접촉
                "weekend_effect": True       # 주말 전 효과
            }
        }
        return failure_patterns
```

### 2. 성공 패턴 강화기 (SuccessReinforcer)
```python
class SuccessReinforcer:
    def reinforce_success(self, successful_trades):
        """
        성공한 매매 패턴 강화
        """
        success_patterns = {
            "golden_conditions": {
                "rsi_range": (25, 35),      # RSI 25-35에서 성공률 높음
                "macd_positive": True,       # MACD 양수일 때 유리
                "morning_trades": True,      # 오전 매매 성공률 높음
                "volume_surge": 1.5          # 거래량 1.5배 이상 시 유리
            },
            "success_multipliers": {
                "news_positive": 1.3,        # 긍정 뉴스 시 30% 가중치
                "market_uptrend": 1.2,       # 상승장에서 20% 가중치
                "low_volatility": 1.1        # 낮은 변동성에서 10% 가중치
            }
        }
        return success_patterns
```

## 📊 학습 데이터 구조

### Supabase 데이터베이스 스키마
```sql
-- AI 학습 데이터 테이블
CREATE TABLE ai_learning_data (
    id SERIAL PRIMARY KEY,
    trade_id VARCHAR(50) UNIQUE,
    user_id UUID REFERENCES users(id),
    timestamp TIMESTAMP WITH TIME ZONE,
    
    -- 매매 정보
    stock_code VARCHAR(10),
    action VARCHAR(10), -- 'buy' or 'sell'
    price DECIMAL(10,2),
    quantity INTEGER,
    
    -- 시장 상황 (JSON으로 저장)
    market_conditions JSONB,
    
    -- 결과 데이터
    actual_profit DECIMAL(8,4),
    success BOOLEAN,
    exit_reason VARCHAR(50),
    
    -- AI 분석 결과
    ai_confidence DECIMAL(3,2),
    learned_patterns JSONB,
    
    created_at TIMESTAMP DEFAULT NOW()
);

-- 패턴 학습 결과 테이블
CREATE TABLE ai_patterns (
    id SERIAL PRIMARY KEY,
    pattern_type VARCHAR(50), -- 'success', 'failure', 'neutral'
    conditions JSONB,
    success_rate DECIMAL(5,2),
    sample_count INTEGER,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- 사용자별 AI 모델 테이블
CREATE TABLE user_ai_models (
    id SERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    model_version VARCHAR(20),
    model_data JSONB,
    performance_metrics JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);
```

## 🔬 AI 학습 알고리즘

### 주간 학습 프로세스
```python
class WeeklyLearningProcess:
    def run_weekly_analysis(self):
        """
        매주 일요일 실행되는 AI 학습 프로세스
        """
        # 1. 지난 주 매매 데이터 수집
        weekly_trades = self.get_weekly_trades()
        
        # 2. 성공/실패 패턴 분석
        success_patterns = self.analyze_success_patterns(weekly_trades)
        failure_patterns = self.analyze_failure_patterns(weekly_trades)
        
        # 3. 기존 모델과 비교 분석
        model_improvements = self.compare_with_existing_model()
        
        # 4. 새로운 전략 생성
        new_strategy = self.generate_new_strategy(
            success_patterns, 
            failure_patterns, 
            model_improvements
        )
        
        # 5. 백테스팅으로 검증
        backtest_results = self.backtest_new_strategy(new_strategy)
        
        # 6. 성능 개선 시에만 모델 업데이트
        if backtest_results.success_rate > self.current_model.success_rate:
            self.update_model(new_strategy)
            self.notify_improvement(backtest_results)
```

### 실시간 의사결정 알고리즘
```python
class RealTimeDecisionMaker:
    def should_trade(self, stock_data, market_conditions):
        """
        실시간 매매 여부 결정
        """
        # 1. 실패 패턴 체크
        failure_risk = self.check_failure_patterns(
            stock_data, market_conditions
        )
        if failure_risk > 0.7:  # 70% 이상 실패 위험 시 거래 중단
            return False, "High failure risk detected"
        
        # 2. 성공 패턴 매칭
        success_score = self.calculate_success_score(
            stock_data, market_conditions
        )
        
        # 3. AI 신뢰도 계산
        ai_confidence = self.calculate_confidence(
            success_score, failure_risk
        )
        
        # 4. 최종 의사결정
        if success_score > 0.6 and ai_confidence > 0.7:
            return True, f"High success probability: {success_score:.2f}"
        else:
            return False, f"Insufficient confidence: {ai_confidence:.2f}"
```

## 🎖️ 개인화 학습 시스템

### 사용자별 매매 성향 학습
```python
class PersonalizedLearning:
    def analyze_user_patterns(self, user_id):
        """
        사용자별 매매 패턴 분석 및 개인화
        """
        user_trades = self.get_user_trades(user_id)
        
        personal_patterns = {
            "risk_tolerance": self.calculate_risk_tolerance(user_trades),
            "preferred_time": self.find_preferred_trading_time(user_trades),
            "successful_stocks": self.find_successful_stocks(user_trades),
            "loss_triggers": self.identify_loss_triggers(user_trades),
            "profit_taking_behavior": self.analyze_profit_taking(user_trades)
        }
        
        return personal_patterns
    
    def create_personal_strategy(self, user_id, personal_patterns):
        """
        개인화된 매매 전략 생성
        """
        base_strategy = self.get_base_ai_strategy()
        
        # 개인 성향 반영
        personal_strategy = {
            **base_strategy,
            "risk_multiplier": personal_patterns["risk_tolerance"],
            "preferred_times": personal_patterns["preferred_time"],
            "stock_whitelist": personal_patterns["successful_stocks"],
            "custom_stop_loss": self.calculate_personal_stop_loss(user_id)
        }
        
        return personal_strategy
```

## 📈 성능 측정 및 개선

### AI 성과 지표
```python
class AIPerformanceMetrics:
    def calculate_weekly_performance(self):
        return {
            "success_rate": 0.78,        # 78% 성공률
            "avg_profit": 0.032,         # 평균 3.2% 수익
            "risk_adjusted_return": 0.85, # 위험 조정 수익률
            "sharpe_ratio": 1.45,        # 샤프 비율
            "max_drawdown": 0.08,        # 최대 손실폭 8%
            "trades_per_week": 25,       # 주간 매매 횟수
            "ai_confidence_avg": 0.72    # 평균 AI 신뢰도
        }
    
    def improvement_tracking(self):
        """
        주간 개선 추적
        """
        improvements = {
            "success_rate_change": +0.03,  # 3% 개선
            "new_patterns_discovered": 5,   # 5개 새 패턴 발견
            "failed_patterns_eliminated": 3, # 3개 실패 패턴 제거
            "model_accuracy": +0.02         # 2% 정확도 향상
        }
        return improvements
```

## 🔮 미래 확장 계획

### 고급 AI 기능
1. **감정 분석 통합**: 뉴스, SNS 감정 분석으로 시장 분위기 예측
2. **다중 종목 상관관계**: 종목 간 연관성 학습으로 포트폴리오 최적화
3. **시장 사이클 인식**: 불장/곰장 사이클 인식하여 전략 자동 전환
4. **리얼타임 학습**: 매매 결과를 즉시 반영하는 실시간 학습 시스템

이 AI 시스템은 전통적 지표의 한계를 극복하고, 실패 경험을 통해 지속적으로 발전하는 자기진화형 매매 시스템입니다.