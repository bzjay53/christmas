"""
Christmas 프로젝트 - 백테스트 라우트
전략 백테스트 실행, 결과 조회, 최적화 기능 제공
"""

import logging
from flask import Blueprint, render_template, request, jsonify, current_app, flash, redirect, url_for
from datetime import datetime, timedelta
import json
import random
import uuid

# 로깅 설정
logger = logging.getLogger(__name__)

# Blueprint 설정
bp = Blueprint('backtest', __name__, url_prefix='/backtest')

@bp.route('/')
def index():
    """백테스트 메인 페이지"""
    # 샘플 백테스트 목록
    backtest_list = get_sample_backtest_list()
    
    # 샘플 전략 목록
    strategies = get_sample_strategies()
    
    return render_template(
        'backtest/index.html',
        title='백테스트',
        backtest_list=backtest_list,
        strategies=strategies
    )

@bp.route('/create', methods=['GET', 'POST'])
def create():
    """새 백테스트 생성"""
    if request.method == 'POST':
        # 백테스트 설정 파라미터 가져오기
        strategy_id = request.form.get('strategy_id')
        symbol = request.form.get('symbol')
        start_date = request.form.get('start_date')
        end_date = request.form.get('end_date')
        initial_capital = request.form.get('initial_capital', 10000000)
        
        # 실제로는 백테스트 서비스에 작업 요청
        # 여기서는 샘플 데이터 생성
        backtest_id = f"BT-{str(uuid.uuid4())[:8]}"
        
        # 실제로는 이 시점에서 백테스트 작업 제출
        # backtest_service.submit_backtest(strategy_id, symbol, start_date, end_date, initial_capital)
        
        flash(f'백테스트 {backtest_id}가 제출되었습니다. 결과가 준비되면 알려드립니다.', 'success')
        return redirect(url_for('backtest.view', backtest_id=backtest_id))
    
    # GET 요청 처리
    symbols = ['삼성전자', 'SK하이닉스', 'NAVER', '카카오', 'LG에너지솔루션', '현대차', '기아']
    strategies = get_sample_strategies()
    
    # 기본 날짜 범위 (3개월)
    end_date = datetime.now().strftime('%Y-%m-%d')
    start_date = (datetime.now() - timedelta(days=90)).strftime('%Y-%m-%d')
    
    return render_template(
        'backtest/create.html',
        title='새 백테스트',
        symbols=symbols,
        strategies=strategies,
        start_date=start_date,
        end_date=end_date,
        initial_capital=10000000
    )

@bp.route('/view/<backtest_id>')
def view(backtest_id):
    """백테스트 결과 조회"""
    # 실제로는 백테스트 서비스에서 결과 가져오기
    backtest = get_sample_backtest_result(backtest_id)
    
    if not backtest:
        flash('백테스트 결과를 찾을 수 없습니다.', 'error')
        return redirect(url_for('backtest.index'))
    
    return render_template(
        'backtest/view.html',
        title=f'백테스트 결과: {backtest_id}',
        backtest=backtest
    )

@bp.route('/results/<backtest_id>')
def results(backtest_id):
    """백테스트 결과 JSON"""
    backtest = get_sample_backtest_result(backtest_id)
    
    if not backtest:
        return jsonify({'error': 'Backtest not found'}), 404
    
    return jsonify(backtest)

@bp.route('/optimization')
def optimization():
    """전략 최적화 페이지"""
    # 샘플 전략 목록
    strategies = get_sample_strategies()
    
    # 샘플 최적화 결과
    optimizations = get_sample_optimizations()
    
    return render_template(
        'backtest/optimization.html',
        title='전략 최적화',
        strategies=strategies,
        optimizations=optimizations
    )

@bp.route('/comparison')
def comparison():
    """전략 비교 페이지"""
    # 샘플 백테스트 목록
    backtest_list = get_sample_backtest_list()
    
    return render_template(
        'backtest/comparison.html',
        title='전략 비교',
        backtest_list=backtest_list
    )

# 헬퍼 함수
def get_sample_strategies():
    """샘플 전략 목록 가져오기"""
    return [
        {
            'id': 'strategy_001',
            'name': '초단타 모멘텀 전략',
            'description': '단기 가격 변동성을 활용한 초단타 거래 전략',
            'type': '초단타',
            'status': '활성'
        },
        {
            'id': 'strategy_002',
            'name': '이동평균 돌파 전략',
            'description': '단기 및 장기 이동평균선 돌파를 활용한 추세 추종 전략',
            'type': '스윙',
            'status': '활성'
        },
        {
            'id': 'strategy_003',
            'name': 'RSI 반전 전략',
            'description': 'RSI 지표의 과매수/과매도 구간 반전을 활용한 전략',
            'type': '스윙',
            'status': '활성'
        },
        {
            'id': 'strategy_004',
            'name': '볼린저 밴드 전략',
            'description': '볼린저 밴드 상/하단 터치 시 반전을 예측하는 전략',
            'type': '스윙',
            'status': '테스트 중'
        }
    ]

def get_sample_backtest_list():
    """샘플 백테스트 목록 가져오기"""
    strategies = get_sample_strategies()
    symbols = ['삼성전자', 'SK하이닉스', 'NAVER', '카카오', 'LG에너지솔루션']
    
    backtest_list = []
    
    for i in range(10):
        strategy = random.choice(strategies)
        symbol = random.choice(symbols)
        
        # 랜덤 날짜 범위 (과거 1~6개월)
        end_date = datetime.now() - timedelta(days=random.randint(1, 30))
        start_date = end_date - timedelta(days=random.randint(30, 180))
        
        # 랜덤 수익률 (-10% ~ +20%)
        total_return = random.uniform(-10, 20)
        
        # 연간 수익률 계산
        days = (end_date - start_date).days
        annualized_return = total_return * (365 / days) if days > 0 else 0
        
        backtest = {
            'id': f"BT-{str(uuid.uuid4())[:8]}",
            'strategy_name': strategy['name'],
            'symbol': symbol,
            'start_date': start_date.strftime('%Y-%m-%d'),
            'end_date': end_date.strftime('%Y-%m-%d'),
            'initial_capital': random.randint(5000000, 50000000),
            'total_return': total_return,
            'annualized_return': annualized_return,
            'max_drawdown': random.uniform(5, 25) * -1,
            'sharpe_ratio': random.uniform(0.5, 2.5),
            'created_at': (datetime.now() - timedelta(days=random.randint(0, 30))).strftime('%Y-%m-%d %H:%M:%S'),
            'status': random.choice(['완료', '진행 중', '실패', '취소됨']),
        }
        backtest_list.append(backtest)
    
    # 생성 시간 기준 정렬
    backtest_list.sort(key=lambda x: x['created_at'], reverse=True)
    return backtest_list

def get_sample_backtest_result(backtest_id):
    """샘플 백테스트 결과 가져오기"""
    # 실제로는 DB에서 백테스트 ID로 조회
    # 여기서는 랜덤 데이터 생성
    
    strategies = get_sample_strategies()
    symbols = ['삼성전자', 'SK하이닉스', 'NAVER', '카카오', 'LG에너지솔루션']
    
    # 기본 정보
    strategy = random.choice(strategies)
    symbol = random.choice(symbols)
    end_date = datetime.now() - timedelta(days=random.randint(1, 30))
    start_date = end_date - timedelta(days=90)
    initial_capital = 10000000  # 1천만원
    
    # 성과 지표
    total_return = random.uniform(-10, 30)
    final_capital = initial_capital * (1 + total_return / 100)
    profit = final_capital - initial_capital
    trade_count = random.randint(20, 100)
    win_count = int(trade_count * random.uniform(0.4, 0.8))
    loss_count = trade_count - win_count
    win_rate = (win_count / trade_count) * 100 if trade_count > 0 else 0
    
    # 일별 포트폴리오 가치
    daily_values = []
    current_value = initial_capital
    
    days = (end_date - start_date).days
    for i in range(days):
        date = (start_date + timedelta(days=i)).strftime('%Y-%m-%d')
        daily_change = random.uniform(-1.5, 2) / 100  # -1.5% ~ +2%
        current_value = current_value * (1 + daily_change)
        
        daily_values.append({
            'date': date,
            'value': current_value,
            'return': ((current_value / initial_capital) - 1) * 100
        })
    
    # 거래 내역
    trades = []
    for i in range(trade_count):
        # 랜덤 날짜
        trade_date = start_date + timedelta(days=random.randint(0, days-1))
        
        # 매수 가격과 수량
        buy_price = random.randint(50000, 500000)
        quantity = random.randint(1, 20)
        
        # 매도 가격 (승리/패배 여부에 따라)
        is_win = i < win_count
        sell_price = buy_price * (1 + random.uniform(0.005, 0.05)) if is_win else buy_price * (1 - random.uniform(0.005, 0.05))
        
        # 보유 기간
        hold_days = random.randint(1, 10)
        
        trades.append({
            'id': f"T{i+1}",
            'entry_date': trade_date.strftime('%Y-%m-%d'),
            'exit_date': (trade_date + timedelta(days=hold_days)).strftime('%Y-%m-%d'),
            'symbol': symbol,
            'direction': '매수',
            'entry_price': buy_price,
            'exit_price': sell_price,
            'quantity': quantity,
            'profit': (sell_price - buy_price) * quantity,
            'profit_percent': ((sell_price / buy_price) - 1) * 100,
            'hold_period': hold_days
        })
    
    # 승리/패배 구분하여 정렬
    trades.sort(key=lambda x: x['profit'], reverse=True)
    
    # 총 결과
    result = {
        'id': backtest_id,
        'strategy_name': strategy['name'],
        'strategy_id': strategy['id'],
        'symbol': symbol,
        'start_date': start_date.strftime('%Y-%m-%d'),
        'end_date': end_date.strftime('%Y-%m-%d'),
        'initial_capital': initial_capital,
        'final_capital': final_capital,
        'profit': profit,
        'total_return': total_return,
        'annualized_return': total_return * (365 / days) if days > 0 else 0,
        'max_drawdown': random.uniform(5, 25) * -1,
        'sharpe_ratio': random.uniform(0.5, 2.5),
        'sortino_ratio': random.uniform(0.8, 3.0),
        'trades_count': trade_count,
        'win_count': win_count,
        'loss_count': loss_count,
        'win_rate': win_rate,
        'best_trade': trades[0]['profit'] if trades else 0,
        'worst_trade': trades[-1]['profit'] if trades else 0,
        'avg_profit_per_trade': sum(t['profit'] for t in trades) / trade_count if trade_count > 0 else 0,
        'avg_hold_period': sum(t['hold_period'] for t in trades) / trade_count if trade_count > 0 else 0,
        'created_at': (datetime.now() - timedelta(days=random.randint(0, 30))).strftime('%Y-%m-%d %H:%M:%S'),
        'daily_values': daily_values,
        'trades': trades,
        'status': '완료'
    }
    
    return result

def get_sample_optimizations():
    """샘플 최적화 결과 목록"""
    strategies = get_sample_strategies()
    symbols = ['삼성전자', 'SK하이닉스', 'NAVER', '카카오', 'LG에너지솔루션']
    
    optimizations = []
    
    for i in range(5):
        strategy = random.choice(strategies)
        
        optimization = {
            'id': f"OPT-{str(uuid.uuid4())[:8]}",
            'strategy_name': strategy['name'],
            'symbol': random.choice(symbols),
            'parameters': {
                'param1': f"{random.uniform(0.1, 0.9):.2f}",
                'param2': random.randint(5, 50),
                'param3': random.choice(['true', 'false'])
            },
            'iterations': random.randint(50, 500),
            'best_sharpe': random.uniform(1.0, 3.0),
            'best_return': random.uniform(10, 40),
            'created_at': (datetime.now() - timedelta(days=random.randint(0, 30))).strftime('%Y-%m-%d %H:%M:%S'),
            'status': random.choice(['완료', '진행 중', '실패']),
        }
        optimizations.append(optimization)
    
    # 생성 시간 기준 정렬
    optimizations.sort(key=lambda x: x['created_at'], reverse=True)
    return optimizations 