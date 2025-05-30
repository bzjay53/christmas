"""
Christmas 프로젝트 - 대시보드 라우트
트레이딩 현황, 포트폴리오 상태, 성과 지표 등을 표시하는 대시보드
"""

import logging
from flask import Blueprint, render_template, request, jsonify, current_app
from datetime import datetime, timedelta
import json
import random

# 로깅 설정
logger = logging.getLogger(__name__)

# Blueprint 설정
bp = Blueprint('dashboard', __name__, url_prefix='/dashboard')

@bp.route('/')
def index():
    """대시보드 메인 페이지"""
    # 실제 데이터 대신 샘플 데이터 생성
    data = {
        'last_update': datetime.now().strftime('%Y-%m-%d %H:%M:%S'),
        'total_profit': '2,750,000',
        'profit_change': '12.5',
        'total_orders': '32',
        'success_rate': '94.8',
        'active_positions': '5',
        'avg_holding_time': '45분',
        'total_alerts': '8',
        'critical_alerts': '2',
        'warning_alerts': '3',
        
        # 성과 차트 데이터
        'performance_dates': json.dumps(['7/1', '7/2', '7/3', '7/4', '7/5', '7/6', '7/7']),
        'daily_profits': json.dumps([120000, 85000, 135000, 215000, 178000, 298000, 350000]),
        
        # 최근 주문 데이터
        'recent_orders': [
            {'symbol': '삼성전자', 'time': '10:15:22', 'side': '매수', 'price': '72,500'},
            {'symbol': 'LG화학', 'time': '10:08:45', 'side': '매도', 'price': '680,000'},
            {'symbol': 'POSCO', 'time': '10:02:31', 'side': '매수', 'price': '375,000'},
            {'symbol': '카카오', 'time': '09:55:17', 'side': '매도', 'price': '57,800'},
            {'symbol': 'SK하이닉스', 'time': '09:48:03', 'side': '매수', 'price': '127,500'},
        ],
        
        # 현재 포지션 데이터
        'current_positions': [
            {'symbol': '삼성전자', 'quantity': '200', 'entry_price': '72,500', 'current_price': '73,400', 'profit': '1.24'},
            {'symbol': 'POSCO', 'quantity': '50', 'entry_price': '375,000', 'current_price': '378,500', 'profit': '0.93'},
            {'symbol': 'SK하이닉스', 'quantity': '100', 'entry_price': '127,500', 'current_price': '129,000', 'profit': '1.18'},
            {'symbol': '현대차', 'quantity': '80', 'entry_price': '182,500', 'current_price': '180,000', 'profit': '-1.37'},
            {'symbol': '네이버', 'quantity': '40', 'entry_price': '224,000', 'current_price': '227,500', 'profit': '1.56'},
        ],
        
        # 전략 성과 데이터
        'strategy_names': json.dumps(['추세추종', '모멘텀', '평균회귀', '가격돌파']),
        'strategy_performance': json.dumps([
            {'name': '승률', 'data': [92, 86, 89, 78]},
            {'name': '거래량', 'data': [300, 240, 280, 120]},
            {'name': '손익비', 'data': [2.8, 1.9, 2.3, 1.7]}
        ])
    }
    
    return render_template('dashboard.html', **data)

@bp.route('/pnl-chart-data')
def pnl_chart_data():
    """PnL 차트 데이터 API"""
    days = int(request.args.get('days', 30))
    return jsonify(get_sample_daily_pnl(days))

@bp.route('/portfolio-chart-data')
def portfolio_chart_data():
    """포트폴리오 차트 데이터 API"""
    return jsonify(get_sample_asset_allocation())

@bp.route('/positions')
def positions():
    """포지션 목록 페이지"""
    # 샘플 포지션 데이터
    positions = get_sample_positions()
    
    return render_template(
        'dashboard/positions.html',
        title='포지션 목록',
        positions=positions
    )

@bp.route('/orders')
def orders():
    """주문 목록 페이지"""
    # 샘플 주문 데이터
    orders = get_sample_orders()
    
    return render_template(
        'dashboard/orders.html',
        title='주문 목록',
        orders=orders
    )

@bp.route('/trades')
def trades():
    """거래 내역 페이지"""
    # 샘플 거래 내역
    trades = get_sample_trades()
    
    return render_template(
        'dashboard/trades.html',
        title='거래 내역',
        trades=trades
    )

@bp.route('/api/charts/returns')
def chart_returns():
    """수익률 차트 데이터 API"""
    # 샘플 수익률 데이터 (실제로는 DB에서 가져옴)
    data = {
        'labels': ['1일', '1주', '1개월', '3개월', '6개월', '1년'],
        'datasets': [{
            'label': '수익률',
            'data': [1.2, 4.5, 7.8, 12.3, 18.7, 27.9],
            'backgroundColor': '#4e73df',
            'borderColor': '#4e73df',
            'tension': 0.4
        }]
    }
    return jsonify(data)

@bp.route('/api/charts/volume')
def chart_volume():
    """거래량 차트 데이터 API"""
    # 샘플 거래량 데이터 (실제로는 DB에서 가져옴)
    data = {
        'labels': ['00시', '02시', '04시', '06시', '08시', '10시', '12시', '14시', '16시', '18시', '20시', '22시'],
        'datasets': [{
            'label': '거래량',
            'data': [12, 19, 8, 5, 30, 45, 32, 37, 28, 15, 9, 3],
            'backgroundColor': '#36b9cc'
        }]
    }
    return jsonify(data)

@bp.route('/api/charts/strategy')
def chart_strategy():
    """전략별 수익 차트 데이터 API"""
    # 샘플 전략 데이터 (실제로는 DB에서 가져옴)
    data = {
        'labels': ['RSI 기반', 'MACD 기반', '볼린저밴드', '이동평균선', '기타'],
        'datasets': [{
            'data': [42, 23, 15, 12, 8],
            'backgroundColor': [
                '#4e73df', '#1cc88a', '#36b9cc', '#f6c23e', '#858796'
            ],
            'borderWidth': 1
        }]
    }
    return jsonify(data)

@bp.route('/api/charts/winrate')
def chart_winrate():
    """일별 승률 차트 데이터 API"""
    # 일주일 날짜 레이블 생성
    days = []
    today = datetime.now()
    for i in range(6, -1, -1):
        date = today - timedelta(days=i)
        days.append(date.strftime('%m월 %d일'))
    
    # 샘플 승률 데이터 (실제로는 DB에서 가져옴)
    data = {
        'labels': days,
        'datasets': [{
            'label': '승률',
            'data': [95, 100, 98, 97, 100, 99, 100],
            'backgroundColor': '#1cc88a',
            'borderColor': '#1cc88a',
            'tension': 0.1
        }]
    }
    return jsonify(data)

@bp.route('/api/stats')
def get_stats():
    """대시보드 통계 API"""
    # 실제 데이터 대신 샘플 데이터 생성
    stats = {
        'total_profit': random.randint(2500000, 3000000),
        'total_orders': random.randint(25, 40),
        'success_rate': round(random.uniform(92.0, 98.0), 1),
        'active_positions': random.randint(3, 7),
        'timestamp': datetime.now().isoformat()
    }
    
    return jsonify(stats)

@bp.route('/api/performance')
def get_performance():
    """성과 데이터 API"""
    # 7일간의 성과 데이터 생성
    dates = []
    profits = []
    
    for i in range(7):
        day = (datetime.now() - timedelta(days=6-i)).strftime('%-m/%-d')
        dates.append(day)
        profits.append(random.randint(80000, 350000))
    
    return jsonify({
        'dates': dates,
        'profits': profits
    })

# 헬퍼 함수
def is_market_open():
    """시장 오픈 여부 확인 (한국 주식시장 기준)"""
    now = datetime.now()
    # 주말 체크
    if now.weekday() >= 5:  # 5: 토요일, 6: 일요일
        return False
    
    # 시간 체크 (9:00 ~ 15:30)
    market_open = now.replace(hour=9, minute=0, second=0, microsecond=0)
    market_close = now.replace(hour=15, minute=30, second=0, microsecond=0)
    
    return market_open <= now <= market_close

def get_next_market_event():
    """다음 시장 이벤트 (개장 또는 종료) 시간"""
    now = datetime.now()
    
    # 주말인 경우 다음 월요일 개장
    if now.weekday() >= 5:  # 5: 토요일, 6: 일요일
        days_until_monday = 7 - now.weekday()
        next_monday = now + timedelta(days=days_until_monday)
        market_open = next_monday.replace(hour=9, minute=0, second=0, microsecond=0)
        return {
            'event': '개장',
            'time': market_open.strftime('%Y-%m-%d %H:%M:%S')
        }
    
    # 개장 전
    market_open = now.replace(hour=9, minute=0, second=0, microsecond=0)
    if now < market_open:
        return {
            'event': '개장',
            'time': market_open.strftime('%Y-%m-%d %H:%M:%S')
        }
    
    # 종료 전
    market_close = now.replace(hour=15, minute=30, second=0, microsecond=0)
    if now < market_close:
        return {
            'event': '종료',
            'time': market_close.strftime('%Y-%m-%d %H:%M:%S')
        }
    
    # 이미 종료된 경우, 다음 개장일
    next_day = now + timedelta(days=1)
    # 금요일이면 월요일로
    if next_day.weekday() >= 5:
        days_until_monday = 7 - next_day.weekday()
        next_day = now + timedelta(days=days_until_monday)
    
    next_market_open = next_day.replace(hour=9, minute=0, second=0, microsecond=0)
    return {
        'event': '개장',
        'time': next_market_open.strftime('%Y-%m-%d %H:%M:%S')
    }

def get_sample_recent_trades(count=5):
    """샘플 최근 거래 데이터"""
    symbols = ['삼성전자', 'SK하이닉스', 'NAVER', '카카오', 'LG에너지솔루션', '현대차', '기아']
    trades = []
    
    for i in range(count):
        symbol = random.choice(symbols)
        is_buy = random.choice([True, False])
        price = random.randint(50000, 800000)
        quantity = random.randint(1, 20)
        
        trade = {
            'id': f"T{random.randint(10000, 99999)}",
            'timestamp': (datetime.now() - timedelta(minutes=random.randint(5, 300))).strftime('%Y-%m-%d %H:%M:%S'),
            'symbol': symbol,
            'side': '매수' if is_buy else '매도',
            'price': price,
            'quantity': quantity,
            'amount': price * quantity,
            'fee': int(price * quantity * 0.00015),  # 0.015% 수수료
            'pnl': random.randint(-50000, 50000) if not is_buy else None
        }
        trades.append(trade)
    
    # 시간순 정렬
    trades.sort(key=lambda x: x['timestamp'], reverse=True)
    return trades

def get_sample_daily_pnl(days=30):
    """샘플 일별 손익 데이터"""
    now = datetime.now()
    daily_pnl = []
    
    start_value = 10000000  # 1천만원 시작
    current_value = start_value
    
    for i in range(days, 0, -1):
        date = (now - timedelta(days=i)).strftime('%Y-%m-%d')
        # 무작위 일별 수익률 (-1.5% ~ +1.5%)
        daily_change = random.uniform(-0.015, 0.015)
        daily_amount = int(current_value * daily_change)
        current_value += daily_amount
        
        daily_pnl.append({
            'date': date,
            'value': current_value,
            'pnl': daily_amount,
            'pnl_percent': daily_change * 100
        })
    
    return daily_pnl

def get_sample_asset_allocation():
    """샘플 자산 배분 데이터"""
    return [
        {'asset': '현금', 'value': 5000000, 'ratio': 33.3},
        {'asset': '주식', 'value': 8500000, 'ratio': 56.7},
        {'asset': '선물', 'value': 1500000, 'ratio': 10.0}
    ]

def get_sample_positions():
    """샘플 포지션 데이터"""
    symbols = ['삼성전자', 'SK하이닉스', 'NAVER', '카카오', 'LG에너지솔루션', '현대차', '기아']
    positions = []
    
    for symbol in random.sample(symbols, 4):
        entry_price = random.randint(50000, 800000)
        quantity = random.randint(5, 30)
        current_price = entry_price * (1 + random.uniform(-0.05, 0.05))
        
        positions.append({
            'symbol': symbol,
            'quantity': quantity,
            'entry_price': entry_price,
            'current_price': int(current_price),
            'market_value': int(current_price * quantity),
            'pnl': int((current_price - entry_price) * quantity),
            'pnl_percent': ((current_price / entry_price) - 1) * 100,
            'entry_time': (datetime.now() - timedelta(days=random.randint(1, 10))).strftime('%Y-%m-%d'),
        })
    
    return positions

def get_sample_orders():
    """샘플 주문 데이터"""
    symbols = ['삼성전자', 'SK하이닉스', 'NAVER', '카카오', 'LG에너지솔루션', '현대차', '기아']
    statuses = ['대기중', '체결됨', '부분체결', '취소됨']
    orders = []
    
    for i in range(5):
        symbol = random.choice(symbols)
        is_buy = random.choice([True, False])
        price = random.randint(50000, 800000)
        quantity = random.randint(1, 20)
        
        orders.append({
            'id': f"O{random.randint(10000, 99999)}",
            'symbol': symbol,
            'side': '매수' if is_buy else '매도',
            'type': random.choice(['지정가', '시장가']),
            'price': price,
            'quantity': quantity,
            'filled': random.randint(0, quantity) if random.choice(statuses) in ['체결됨', '부분체결'] else 0,
            'status': random.choice(statuses),
            'created_at': (datetime.now() - timedelta(minutes=random.randint(5, 300))).strftime('%Y-%m-%d %H:%M:%S')
        })
    
    return orders

def get_sample_trades():
    """샘플 거래 내역 데이터"""
    return get_sample_recent_trades(20) 