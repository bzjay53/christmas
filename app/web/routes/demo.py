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