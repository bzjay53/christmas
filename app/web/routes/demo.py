"""
크리스마스 프로젝트 - 배포 데모 라우트
Vercel 배포 및 테스트를 위한 데모 페이지
"""

from flask import Blueprint, render_template, jsonify
import logging
import random
from datetime import datetime, timedelta

# 로깅 설정
logger = logging.getLogger(__name__)

# Blueprint 설정
bp = Blueprint('demo', __name__, url_prefix='/demo')


@bp.route('/')
def index():
    """배포 데모 메인 페이지"""
    logger.info("데모 페이지 접속")
    return render_template('demo/vercel.html')


@bp.route('/api/stats')
def get_stats():
    """통계 데이터 API"""
    logger.info("통계 데이터 API 요청")
    
    # 샘플 데이터 생성
    stats = {
        'total_assets': f"{random.randint(950, 1050)}만원",
        'daily_profit': f"{random.randint(8, 15)}만 {random.randint(1000, 9999)}원",
        'trades_count': random.randint(35, 50),
        'win_rate': "100%",
        'system_status': {
            'api_server': 'normal',
            'database': 'normal',
            'redis_cache': 'normal',
            'websocket': 'normal',
            'backup_system': 'normal'
        },
        'timestamp': datetime.now().isoformat()
    }
    
    return jsonify(stats)


@bp.route('/api/market')
def get_market_data():
    """시장 데이터 API"""
    logger.info("시장 데이터 API 요청")
    
    # 오늘 날짜
    today = datetime.now()
    
    # 7일간의 샘플 데이터 생성
    dates = [(today - timedelta(days=i)).strftime('%Y-%m-%d') for i in range(7, 0, -1)]
    values = [random.randint(97, 103) for _ in range(7)]
    
    market_data = {
        'dates': dates,
        'values': values,
        'strategies': {
            'RSI 전략': random.randint(25, 35),
            'MACD 전략': random.randint(20, 30),
            'Bollinger Bands': random.randint(15, 25),
            '이동평균선': random.randint(10, 20),
            '패턴 인식': random.randint(5, 15)
        },
        'timestamp': datetime.now().isoformat()
    }
    
    return jsonify(market_data)


@bp.route('/api/health')
def health_check():
    """서버 상태 체크 API"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.now().isoformat(),
        'environment': 'vercel'
    })


@bp.route('/api/data')
def sample_data():
    """샘플 데이터 API"""
    # 6개월 수익률 데이터 샘플
    months = ['1월', '2월', '3월', '4월', '5월', '6월']
    
    data = {
        'labels': months,
        'datasets': [{
            'label': '수익률 (%)',
            'data': [round(random.uniform(-5, 30), 1) for _ in range(6)],
            'borderColor': 'rgb(75, 192, 192)',
            'backgroundColor': 'rgba(75, 192, 192, 0.2)',
            'tension': 0.4
        }]
    }
    
    return jsonify(data)


@bp.route('/api/trades')
def recent_trades():
    """최근 거래 내역 API"""
    stocks = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX']
    
    now = datetime.now()
    
    trades = []
    for i in range(5):
        trade_time = now - timedelta(minutes=random.randint(5, 300))
        profit = round(random.uniform(-3.0, 5.0), 1)
        
        trades.append({
            'symbol': random.choice(stocks),
            'timestamp': trade_time.strftime('%Y-%m-%d %H:%M'),
            'profit': profit,
            'status': 'gain' if profit > 0 else 'loss'
        })
    
    return jsonify(trades) 