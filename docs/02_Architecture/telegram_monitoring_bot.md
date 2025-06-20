# 텔레그램 실시간 모니터링 봇 설계

## 📱 봇 개요 및 핵심 기능

실시간 매매 상황을 모니터링하고 즉시 알림을 제공하는 지능형 텔레그램 봇 시스템입니다.

### 주요 기능
1. **실시간 매매 알림**: 거래 실행 즉시 알림
2. **AI 학습 진행 상황**: 주간 성과 및 개선 사항
3. **위험 상황 경고**: 급격한 시장 변동 및 손실 알림
4. **대화형 명령어**: 사용자 요청에 따른 정보 제공
5. **일일/주간 리포트**: 자동 성과 분석 보고서

## 🤖 봇 아키텍처

### 시스템 구성
```
Telegram Bot API ←→ Christmas Bot Server ←→ Trading System
                          ↓
                    Redis Message Queue
                          ↓
                  Real-time Event Processing
```

### 메시지 처리 플로우
```python
# 메시지 처리 파이프라인
사용자 명령 → 명령 파싱 → 권한 확인 → 데이터 조회 → 응답 생성 → 전송
실시간 이벤트 → 이벤트 필터링 → 포맷팅 → 사용자별 맞춤 → 즉시 전송
```

## 📬 실시간 알림 시스템

### 매매 실행 알림
```python
class TradingNotifier:
    def notify_trade_execution(self, trade_data):
        """
        매매 실행 즉시 알림
        """
        emoji = "📈" if trade_data["action"] == "buy" else "📉"
        profit_emoji = "💰" if trade_data.get("expected_profit", 0) > 0 else "🔻"
        
        message = f"""
{emoji} **매매 실행 알림**

🏢 **종목**: {trade_data['stock_name']} ({trade_data['stock_code']})
{'🛒 **매수**' if trade_data['action'] == 'buy' else '💸 **매도**'}
💰 **가격**: {trade_data['price']:,}원
📊 **수량**: {trade_data['quantity']:,}주
💵 **총액**: {trade_data['total_amount']:,}원

🤖 **AI 신뢰도**: {trade_data['ai_confidence']:.1%}
🎯 **예상 수익률**: {trade_data['expected_profit']:.2%}
⏰ **실행 시간**: {trade_data['execution_time']}

{profit_emoji} 총 포트폴리오 수익률: {trade_data['portfolio_return']:.2%}
        """
        
        return self.send_message(trade_data['user_id'], message)

    def notify_trade_result(self, result_data):
        """
        매매 결과 알림 (30분 후)
        """
        result_emoji = "✅" if result_data["success"] else "❌"
        profit_emoji = "🎉" if result_data["actual_profit"] > 0 else "😔"
        
        message = f"""
{result_emoji} **매매 결과 알림**

🏢 **종목**: {result_data['stock_name']}
⏱️ **경과시간**: 30분
📊 **실제 수익률**: {result_data['actual_profit']:.2%} {profit_emoji}
💰 **수익금액**: {result_data['profit_amount']:,}원

📈 **최고점**: +{result_data['max_profit']:.2%}
📉 **최저점**: {result_data['max_loss']:.2%}

🧠 **AI 예측 정확도**: {result_data['ai_accuracy']:.1%}
        """
        
        return self.send_message(result_data['user_id'], message)
```

### AI 학습 진행 알림
```python
class AILearningNotifier:
    def notify_weekly_improvement(self, improvement_data):
        """
        주간 AI 학습 성과 알림
        """
        message = f"""
🧠 **AI 학습 주간 리포트**

📊 **성과 개선**
• 성공률: {improvement_data['old_success_rate']:.1%} → {improvement_data['new_success_rate']:.1%} (+{improvement_data['success_improvement']:.1%})
• 평균 수익률: {improvement_data['old_avg_profit']:.2%} → {improvement_data['new_avg_profit']:.2%} (+{improvement_data['profit_improvement']:.2%})

🔍 **새로 발견한 패턴**
{self.format_new_patterns(improvement_data['new_patterns'])}

🚫 **제거된 실패 패턴**
{self.format_removed_patterns(improvement_data['removed_patterns'])}

🎯 **다음 주 목표**
• 목표 성공률: {improvement_data['target_success_rate']:.1%}
• 학습 계획: {improvement_data['learning_plan']}
        """
        
        return self.broadcast_to_all_users(message)

    def format_new_patterns(self, patterns):
        """
        새로운 패턴을 읽기 쉽게 포맷팅
        """
        formatted = []
        for pattern in patterns[:3]:  # 최대 3개만 표시
            formatted.append(f"• {pattern['description']} (신뢰도: {pattern['confidence']:.1%})")
        return "\n".join(formatted)
```

### 위험 상황 경고
```python
class RiskAlertNotifier:
    def notify_high_risk_situation(self, risk_data):
        """
        고위험 상황 즉시 경고
        """
        risk_level = risk_data['risk_level']
        
        if risk_level >= 0.8:
            emoji = "🚨"
            level = "**매우 위험**"
        elif risk_level >= 0.6:
            emoji = "⚠️"
            level = "**위험**"
        else:
            emoji = "📢"
            level = "**주의**"
        
        message = f"""
{emoji} **위험 상황 알림** {emoji}

🔴 **위험도**: {level} ({risk_level:.1%})
📊 **상황**: {risk_data['situation']}
📉 **예상 손실**: {risk_data['potential_loss']:.2%}

🛡️ **자동 조치**
{self.format_auto_actions(risk_data['auto_actions'])}

💡 **권장 조치**
{risk_data['recommendations']}

⏰ **발생 시간**: {risk_data['timestamp']}
        """
        
        # 고위험 상황은 모든 사용자에게 즉시 전송
        return self.emergency_broadcast(message)

    def notify_stop_loss_triggered(self, stop_loss_data):
        """
        손절매 실행 알림
        """
        message = f"""
🛑 **손절매 실행 알림**

🏢 **종목**: {stop_loss_data['stock_name']}
📉 **손실률**: {stop_loss_data['loss_rate']:.2%}
💸 **손실금액**: {stop_loss_data['loss_amount']:,}원

⚡ **실행 이유**: {stop_loss_data['trigger_reason']}
🕒 **실행 시간**: {stop_loss_data['execution_time']}

📈 **포트폴리오 영향**: {stop_loss_data['portfolio_impact']:.2%}
        """
        
        return self.send_urgent_message(stop_loss_data['user_id'], message)
```

## 🗣️ 대화형 명령어 시스템

### 기본 명령어
```python
class BotCommands:
    def __init__(self):
        self.commands = {
            '/start': self.cmd_start,
            '/status': self.cmd_status,
            '/portfolio': self.cmd_portfolio,
            '/trades': self.cmd_recent_trades,
            '/ai': self.cmd_ai_status,
            '/stop': self.cmd_emergency_stop,
            '/report': self.cmd_daily_report,
            '/settings': self.cmd_settings,
            '/help': self.cmd_help
        }

    def cmd_status(self, user_id):
        """
        현재 시스템 상태 조회
        """
        status_data = self.get_system_status(user_id)
        
        message = f"""
📊 **시스템 현황**

🤖 **AI 상태**: {'🟢 정상' if status_data['ai_active'] else '🔴 중단'}
💰 **매매 상태**: {'🟢 활성' if status_data['trading_active'] else '🔴 비활성'}
📈 **포트폴리오**: {status_data['portfolio_value']:,}원 ({status_data['daily_return']:+.2%})

⏰ **오늘 매매**
• 총 {status_data['today_trades']}회 실행
• 성공: {status_data['successful_trades']}회
• 실패: {status_data['failed_trades']}회

🎯 **AI 성과**
• 성공률: {status_data['ai_success_rate']:.1%}
• 신뢰도: {status_data['ai_confidence']:.1%}

⚡ **대기 중인 주문**: {status_data['pending_orders']}건
        """
        
        return message

    def cmd_portfolio(self, user_id):
        """
        포트폴리오 현황 조회
        """
        portfolio = self.get_user_portfolio(user_id)
        
        message = f"""
💼 **포트폴리오 현황**

💰 **총 자산**: {portfolio['total_value']:,}원
📊 **현금**: {portfolio['cash']:,}원 ({portfolio['cash_ratio']:.1%})
📈 **주식**: {portfolio['stock_value']:,}원 ({portfolio['stock_ratio']:.1%})

🏆 **수익률**
• 오늘: {portfolio['daily_return']:+.2%}
• 이번 주: {portfolio['weekly_return']:+.2%}
• 이번 달: {portfolio['monthly_return']:+.2%}

📋 **보유 종목** (상위 5개)
{self.format_holdings(portfolio['top_holdings'])}
        """
        
        return message

    def cmd_ai_status(self, user_id):
        """
        AI 학습 현황 조회
        """
        ai_data = self.get_ai_status(user_id)
        
        message = f"""
🧠 **AI 학습 현황**

📊 **현재 성과**
• 성공률: {ai_data['success_rate']:.1%}
• 평균 수익률: {ai_data['avg_profit']:.2%}
• 학습된 패턴: {ai_data['learned_patterns']}개

📈 **최근 개선사항**
{self.format_recent_improvements(ai_data['recent_improvements'])}

🎯 **학습 진행도**
• 이번 주 매매: {ai_data['week_trades']}/{ai_data['target_trades']}
• 데이터 품질: {ai_data['data_quality']:.1%}
• 다음 업데이트: {ai_data['next_update']}

🔮 **예측 정확도**
• 단기 (30분): {ai_data['short_accuracy']:.1%}
• 중기 (2시간): {ai_data['medium_accuracy']:.1%}
        """
        
        return message
```

### 고급 명령어
```python
class AdvancedCommands:
    def cmd_detailed_analysis(self, user_id, stock_code=None):
        """
        상세 분석 명령어: /analyze [종목코드]
        """
        if stock_code:
            analysis = self.get_stock_analysis(stock_code)
            
            message = f"""
🔍 **{analysis['stock_name']} 상세 분석**

📊 **현재 상태**
• 현재가: {analysis['current_price']:,}원
• 등락률: {analysis['change_rate']:+.2%}
• 거래량: {analysis['volume']:,}주

🤖 **AI 분석**
• 매수 신호: {analysis['buy_signal']}/10
• 매도 신호: {analysis['sell_signal']}/10
• 신뢰도: {analysis['confidence']:.1%}

📈 **기술적 지표**
• RSI: {analysis['rsi']:.1f}
• MACD: {analysis['macd']:.3f}
• 볼린저 위치: {analysis['bollinger_position']}

💭 **AI 의견**
{analysis['ai_opinion']}

⚠️ **주의사항**
{analysis['warnings']}
            """
        else:
            message = "분석할 종목코드를 입력해주세요.\n예: /analyze 005930"
        
        return message

    def cmd_emergency_stop(self, user_id):
        """
        긴급 매매 중단 명령어
        """
        result = self.execute_emergency_stop(user_id)
        
        if result['success']:
            message = f"""
🛑 **긴급 매매 중단 완료**

⏰ **중단 시간**: {result['stop_time']}
📊 **중단된 주문**: {result['stopped_orders']}건
💰 **보호된 자산**: {result['protected_amount']:,}원

🔄 **재시작 방법**
매매를 재시작하려면 /resume 명령어를 사용하세요.

📞 **추가 지원**
문제가 지속되면 관리자에게 문의하세요.
            """
        else:
            message = f"❌ 긴급 중단 실패: {result['error']}"
        
        return message
```

## 📊 자동 리포트 시스템

### 일일 리포트
```python
class AutoReportSystem:
    def generate_daily_report(self, user_id):
        """
        매일 오후 6시 자동 발송
        """
        daily_data = self.get_daily_summary(user_id)
        
        message = f"""
📅 **일일 매매 리포트** ({daily_data['date']})

💰 **수익 현황**
• 일일 수익률: {daily_data['daily_return']:+.2%}
• 수익금액: {daily_data['profit_amount']:+,}원
• 총 자산: {daily_data['total_assets']:,}원

📊 **매매 실적**
• 총 매매: {daily_data['total_trades']}회
• 성공: {daily_data['successful_trades']}회 ({daily_data['success_rate']:.1%})
• 실패: {daily_data['failed_trades']}회

🏆 **베스트 매매**
{self.format_best_trade(daily_data['best_trade'])}

😔 **아쉬운 매매**
{self.format_worst_trade(daily_data['worst_trade'])}

🤖 **AI 성과**
• 예측 정확도: {daily_data['ai_accuracy']:.1%}
• 새로운 학습: {daily_data['new_learnings']}건

📈 **내일 전망**
{daily_data['tomorrow_outlook']}
        """
        
        return message

    def generate_weekly_report(self, user_id):
        """
        매주 일요일 자동 발송
        """
        weekly_data = self.get_weekly_summary(user_id)
        
        message = f"""
📊 **주간 매매 리포트** ({weekly_data['week_range']})

🎯 **주간 성과**
• 주간 수익률: {weekly_data['weekly_return']:+.2%}
• 누적 수익률: {weekly_data['cumulative_return']:+.2%}
• 평균 일일 수익률: {weekly_data['avg_daily_return']:+.2%}

📈 **매매 통계**
• 총 매매: {weekly_data['total_trades']}회
• 평균 성공률: {weekly_data['avg_success_rate']:.1%}
• 최고 수익률: {weekly_data['best_day_return']:+.2%}
• 최저 수익률: {weekly_data['worst_day_return']:+.2%}

🧠 **AI 발전**
• 성공률 개선: {weekly_data['success_improvement']:+.1%}
• 새로운 패턴: {weekly_data['new_patterns']}개
• 제거된 나쁜 패턴: {weekly_data['removed_patterns']}개

🎪 **주요 종목**
{self.format_top_stocks(weekly_data['top_performing_stocks'])}

📅 **다음 주 계획**
{weekly_data['next_week_plan']}
        """
        
        return message
```

## ⚙️ 봇 설정 및 관리

### 사용자 설정
```python
class BotSettings:
    def get_notification_settings(self, user_id):
        """
        알림 설정 조회/변경
        """
        settings = self.get_user_settings(user_id)
        
        keyboard = [
            ["🔔 매매 알림", "📊 일일 리포트"],
            ["🤖 AI 업데이트", "⚠️ 위험 경고"],
            ["💰 수익 알림", "📱 모든 알림"],
            ["❌ 설정 종료"]
        ]
        
        message = f"""
⚙️ **알림 설정**

현재 설정:
🔔 매매 알림: {'✅' if settings['trade_alerts'] else '❌'}
📊 일일 리포트: {'✅' if settings['daily_reports'] else '❌'}
🤖 AI 업데이트: {'✅' if settings['ai_updates'] else '❌'}
⚠️ 위험 경고: {'✅' if settings['risk_alerts'] else '❌'}
💰 수익 알림: {'✅' if settings['profit_alerts'] else '❌'}

변경할 항목을 선택해주세요:
        """
        
        return message, keyboard

    def cmd_set_risk_level(self, user_id, risk_level):
        """
        위험도 설정: /risk [1-10]
        """
        if 1 <= risk_level <= 10:
            self.update_user_risk_level(user_id, risk_level)
            
            risk_description = {
                1: "매우 보수적 (안전 우선)",
                3: "보수적 (안정성 중시)", 
                5: "균형잡힌 (중간 위험)",
                7: "공격적 (수익 중시)",
                10: "매우 공격적 (최대 수익)"
            }
            
            desc = risk_description.get(risk_level, "사용자 맞춤")
            
            message = f"""
⚙️ **위험도 설정 완료**

🎯 **설정된 위험도**: {risk_level}/10
📝 **설명**: {desc}

🤖 **AI 조정사항**
• 매매 빈도: {'높음' if risk_level > 7 else '보통' if risk_level > 3 else '낮음'}
• 손절매 기준: -{2 + (10-risk_level)*0.5:.1f}%
• 익절매 기준: +{3 + risk_level*0.5:.1f}%

⏰ **적용 시점**: 다음 매매부터 즉시 적용
            """
        else:
            message = "❌ 위험도는 1-10 사이의 숫자를 입력해주세요."
        
        return message
```

## 🔧 기술적 구현

### FastAPI + python-telegram-bot 통합
```python
from telegram.ext import Application, CommandHandler, MessageHandler
import asyncio

class ChristmasTradingBot:
    def __init__(self, token, trading_system):
        self.app = Application.builder().token(token).build()
        self.trading_system = trading_system
        self.setup_handlers()
    
    def setup_handlers(self):
        """
        명령어 핸들러 설정
        """
        self.app.add_handler(CommandHandler("start", self.cmd_start))
        self.app.add_handler(CommandHandler("status", self.cmd_status))
        self.app.add_handler(CommandHandler("portfolio", self.cmd_portfolio))
        # ... 기타 핸들러
    
    async def start_bot(self):
        """
        봇 시작 및 웹훅 설정
        """
        await self.app.initialize()
        await self.app.start()
        
        # 실시간 이벤트 리스너 시작
        asyncio.create_task(self.listen_to_trading_events())
    
    async def listen_to_trading_events(self):
        """
        매매 시스템의 실시간 이벤트 수신
        """
        while True:
            try:
                events = await self.trading_system.get_pending_notifications()
                
                for event in events:
                    await self.process_event(event)
                
                await asyncio.sleep(1)  # 1초마다 체크
                
            except Exception as e:
                logger.error(f"Event processing error: {e}")
                await asyncio.sleep(5)
```

이 텔레그램 봇 시스템으로 사용자는 실시간으로 모든 매매 상황을 모니터링하고 필요시 즉시 대응할 수 있습니다.