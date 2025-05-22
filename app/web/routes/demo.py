"""
크리스마스 프로젝트 - 배포 데모 라우트
Vercel 배포 및 테스트를 위한 데모 페이지
"""

from flask import Blueprint, render_template, jsonify, request
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


@bp.route('/trade')
def trade():
    """모의투자 페이지"""
    # 초기 계좌 데이터 설정
    account_data = {
        'balance': '10,000,000',  # 초기 잔고 1000만원
        'stock_value': '0',       # 초기 주식 가치
        'total_value': '10,000,000',  # 초기 총 자산가치
        'pnl': '0',                # 초기 손익
        'pnl_percent': '0.0'       # 초기 손익률
    }
    
    # 종목 리스트
    stock_list = [
        {'symbol': '삼성전자', 'code': '005930', 'current_price': '72,500', 'change_percent': '+1.2'},
        {'symbol': 'SK하이닉스', 'code': '000660', 'current_price': '127,500', 'change_percent': '+0.8'},
        {'symbol': 'LG화학', 'code': '051910', 'current_price': '680,000', 'change_percent': '+2.3'},
        {'symbol': 'POSCO', 'code': '005490', 'current_price': '375,000', 'change_percent': '-0.5'},
        {'symbol': '카카오', 'code': '035720', 'current_price': '57,800', 'change_percent': '+1.4'},
        {'symbol': 'NAVER', 'code': '035420', 'current_price': '227,500', 'change_percent': '+1.1'},
        {'symbol': '현대차', 'code': '005380', 'current_price': '182,500', 'change_percent': '-0.7'},
        {'symbol': '기아', 'code': '000270', 'current_price': '97,800', 'change_percent': '-0.3'},
        {'symbol': '셀트리온', 'code': '068270', 'current_price': '143,500', 'change_percent': '+3.1'},
        {'symbol': '삼성바이오로직스', 'code': '207940', 'current_price': '872,000', 'change_percent': '+0.9'},
    ]
    
    return render_template(
        'demo/trade.html',
        title='모의투자',
        account=account_data,
        stock_list=stock_list
    )


@bp.route('/api/mock/order', methods=['POST'])
def mock_order():
    """모의 주문 API"""
    data = request.json
    
    # 주문 데이터 확인
    symbol = data.get('symbol')
    order_type = data.get('type')  # 'buy' 또는 'sell'
    price = data.get('price')
    quantity = data.get('quantity')
    
    # 실제로는 여기서 모의 주문 처리 로직이 들어갑니다
    
    # 주문 성공 응답
    response = {
        'success': True,
        'order_id': f"ORD-{random.randint(10000, 99999)}",
        'symbol': symbol,
        'type': order_type,
        'price': price,
        'quantity': quantity,
        'timestamp': datetime.now().isoformat(),
        'status': '체결'
    }
    
    return jsonify(response)


@bp.route('/api/mock/positions')
def mock_positions():
    """모의 포지션 조회 API"""
    # 샘플 포지션 데이터 생성
    positions = []
    
    # 50% 확률로 포지션 생성
    if random.random() > 0.5:
        position_count = random.randint(1, 3)
        symbols = ['삼성전자', 'SK하이닉스', 'LG화학', 'POSCO', '카카오', 'NAVER', '현대차']
        
        for _ in range(position_count):
            symbol = random.choice(symbols)
            entry_price = random.randint(50000, 800000)
            current_price = entry_price * random.uniform(0.9, 1.1)
            quantity = random.randint(10, 100)
            profit_pct = ((current_price - entry_price) / entry_price) * 100
            
            positions.append({
                'symbol': symbol,
                'quantity': quantity,
                'entry_price': f"{entry_price:,}",
                'current_price': f"{int(current_price):,}",
                'profit': f"{profit_pct:.2f}"
            })
    
    return jsonify(positions)


@bp.route('/api/mock/price/<symbol>')
def mock_price(symbol):
    """모의 가격 실시간 업데이트 API"""
    # 심볼별 기본 가격 설정
    base_prices = {
        '005930': 72500,  # 삼성전자
        '000660': 127500,  # SK하이닉스
        '051910': 680000,  # LG화학
        '005490': 375000,  # POSCO
        '035720': 57800,  # 카카오
        '035420': 227500,  # NAVER
        '005380': 182500,  # 현대차
        '000270': 97800,  # 기아
        '068270': 143500,  # 셀트리온
        '207940': 872000,  # 삼성바이오로직스
    }
    
    # 심볼 매핑
    symbol_map = {
        '삼성전자': '005930',
        'SK하이닉스': '000660',
        'LG화학': '051910',
        'POSCO': '005490',
        '카카오': '035720',
        'NAVER': '035420',
        '현대차': '005380',
        '기아': '000270',
        '셀트리온': '068270',
        '삼성바이오로직스': '207940',
    }
    
    # 코드가 없으면 심볼 매핑 시도
    code = symbol
    if code not in base_prices and symbol in symbol_map:
        code = symbol_map[symbol]
    
    # 기본 가격 가져오기 (없으면 100,000원 기본값)
    base_price = base_prices.get(code, 100000)
    
    # 랜덤 가격 변동 (-0.5% ~ +0.5%)
    change_percent = random.uniform(-0.5, 0.5)
    new_price = int(base_price * (1 + (change_percent / 100)))
    
    # 틱 크기 반영
    if new_price > 100000:
        # 10원 단위 반올림
        new_price = round(new_price / 10) * 10
    else:
        # 5원 단위 반올림
        new_price = round(new_price / 5) * 5
    
    return jsonify({
        'symbol': symbol,
        'price': f"{new_price:,}",
        'raw_price': new_price,
        'change_percent': f"{change_percent:.2f}",
        'timestamp': datetime.now().isoformat()
    })


@bp.route('/api/mock/account')
def mock_account():
    """모의 계좌 정보 API"""
    # 초기 잔고 설정
    initial_balance = 10000000
    
    # 랜덤 손익 생성 (-5% ~ +15%)
    pnl_percent = random.uniform(-5, 15)
    pnl = initial_balance * (pnl_percent / 100)
    
    # 랜덤 주식 가치 결정 (총 자산의 30~70%)
    total_value = initial_balance + pnl
    stock_ratio = random.uniform(0.3, 0.7)
    stock_value = total_value * stock_ratio
    balance = total_value - stock_value
    
    account_data = {
        'balance': f"{int(balance):,}",
        'stock_value': f"{int(stock_value):,}",
        'total_value': f"{int(total_value):,}",
        'pnl': f"{int(pnl):,}",
        'pnl_percent': f"{pnl_percent:.2f}"
    }
    
    return jsonify(account_data) 