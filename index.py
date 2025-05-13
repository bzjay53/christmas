from flask import Flask, jsonify, render_template_string, request
import random
from datetime import datetime, timedelta
import json

app = Flask(__name__)

@app.route('/')
def index():
    return jsonify({
        'status': 'ok',
        'message': 'Christmas 초단타 자동 매매 플랫폼',
        'version': '1.0.0',
        'routes': ['/', '/demo', '/dashboard', '/hello', '/api/stats', '/api/performance']
    })

@app.route('/demo')
def demo():
    html = """
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Christmas 초단타 매매 플랫폼</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
        <style>
            body {
                font-family: 'Noto Sans KR', sans-serif;
                margin: 0;
                padding: 40px;
                background-color: #f5f5f5;
                color: #333;
            }
            .container {
                max-width: 800px;
                margin: 0 auto;
                background-color: white;
                padding: 20px;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            h1 {
                color: #4062BB;
                border-bottom: 2px solid #4062BB;
                padding-bottom: 10px;
            }
            .info {
                background-color: #E8F4FD;
                padding: 15px;
                border-radius: 5px;
                margin: 20px 0;
            }
            .button {
                display: inline-block;
                padding: 10px 20px;
                background-color: #4062BB;
                color: white;
                border-radius: 5px;
                text-decoration: none;
                font-weight: bold;
                transition: background-color 0.3s;
                margin-right: 10px;
            }
            .button:hover {
                background-color: #304e96;
                color: white;
                text-decoration: none;
            }
            .features {
                margin-top: 30px;
            }
            .feature-item {
                margin-bottom: 20px;
                padding: 15px;
                border-radius: 5px;
                background-color: #f8f9fa;
                border-left: 4px solid #4062BB;
            }
            .feature-icon {
                font-size: 24px;
                color: #4062BB;
                margin-right: 10px;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>Christmas 초단타 매매 플랫폼</h1>
            <div class="info">
                <p>이 페이지는 Christmas 초단타 매매 플랫폼의 데모 페이지입니다.</p>
                <p>정식 버전 v1.0.0이 성공적으로 배포되었습니다!</p>
            </div>
            
            <div>
                <a href="/dashboard" class="button">대시보드 보기</a>
                <a href="/hello" class="button">API 테스트</a>
            </div>
            
            <div class="features">
                <h3>주요 기능</h3>
                
                <div class="feature-item">
                    <i class="bi bi-graph-up feature-icon"></i>
                    <strong>실시간 모니터링</strong>
                    <p>시장 데이터를 실시간으로 수집하고 분석하여 최적의 매매 타이밍을 포착합니다.</p>
                </div>
                
                <div class="feature-item">
                    <i class="bi bi-lightning feature-icon"></i>
                    <strong>초단타 전략</strong>
                    <p>특허받은 알고리즘으로 초단타 매매 전략을 구현하여 높은 승률을 보장합니다.</p>
                </div>
                
                <div class="feature-item">
                    <i class="bi bi-shield-check feature-icon"></i>
                    <strong>위험 관리</strong>
                    <p>철저한 위험 관리 시스템으로 손실을 최소화하고 자산을 보호합니다.</p>
                </div>
                
                <div class="feature-item">
                    <i class="bi bi-bar-chart feature-icon"></i>
                    <strong>성과 분석</strong>
                    <p>상세한 성과 분석 리포트로 투자 전략을 지속적으로 개선할 수 있습니다.</p>
                </div>
            </div>
        </div>
    </body>
    </html>
    """
    return render_template_string(html)

@app.route('/dashboard')
def dashboard():
    """대시보드 페이지"""
    last_update = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
    
    # 샘플 데이터 생성
    total_profit = format(random.randint(2500000, 3500000), ",")
    profit_change = round(random.uniform(10.5, 15.8), 1)
    total_orders = random.randint(25, 40)
    success_rate = round(random.uniform(92.0, 98.5), 1)
    active_positions = random.randint(3, 8)
    avg_holding_time = f"{random.randint(30, 60)}분"
    total_alerts = random.randint(5, 12)
    critical_alerts = random.randint(0, 3)
    warning_alerts = random.randint(2, 5)
    
    # 성과 차트 데이터
    dates = []
    profits = []
    for i in range(7):
        day = (datetime.now() - timedelta(days=6-i)).strftime('%m/%d')
        dates.append(day)
        profits.append(random.randint(80000, 350000))
    
    # 최근 주문 데이터
    recent_orders = [
        {'symbol': '삼성전자', 'time': '10:15:22', 'side': '매수', 'price': '72,500'},
        {'symbol': 'LG화학', 'time': '10:08:45', 'side': '매도', 'price': '680,000'},
        {'symbol': 'POSCO', 'time': '10:02:31', 'side': '매수', 'price': '375,000'},
        {'symbol': '카카오', 'time': '09:55:17', 'side': '매도', 'price': '57,800'},
        {'symbol': 'SK하이닉스', 'time': '09:48:03', 'side': '매수', 'price': '127,500'},
    ]
    
    # 현재 포지션 데이터
    current_positions = [
        {'symbol': '삼성전자', 'quantity': '200', 'entry_price': '72,500', 'current_price': '73,400', 'profit': '1.24'},
        {'symbol': 'POSCO', 'quantity': '50', 'entry_price': '375,000', 'current_price': '378,500', 'profit': '0.93'},
        {'symbol': 'SK하이닉스', 'quantity': '100', 'entry_price': '127,500', 'current_price': '129,000', 'profit': '1.18'},
        {'symbol': '현대차', 'quantity': '80', 'entry_price': '182,500', 'current_price': '180,000', 'profit': '-1.37'},
        {'symbol': '네이버', 'quantity': '40', 'entry_price': '224,000', 'current_price': '227,500', 'profit': '1.56'},
    ]
    
    html = """
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Christmas - 대시보드</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
        <style>
            body {
                font-family: 'Noto Sans KR', sans-serif;
                background-color: #f8f9fa;
            }
            .navbar-brand {
                font-weight: bold;
                color: #e63946 !important;
            }
            .dashboard-container {
                max-width: 1200px;
                margin: 2rem auto;
                padding: 1rem;
            }
            .stats-card {
                border-radius: 10px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
                margin-bottom: 20px;
                background-color: #fff;
                border-left: 4px solid #4cc9f0;
            }
            .card {
                border-radius: 10px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
                margin-bottom: 20px;
            }
            .table-responsive {
                border-radius: 10px;
                overflow: hidden;
            }
            .table {
                margin-bottom: 0;
            }
            .bg-profit {
                background-color: rgba(40, 167, 69, 0.1);
            }
            .bg-loss {
                background-color: rgba(220, 53, 69, 0.1);
            }
        </style>
    </head>
    <body>
        <nav class="navbar navbar-expand-lg navbar-light bg-white border-bottom">
            <div class="container-fluid">
                <a class="navbar-brand" href="#"><i class="bi bi-snow2"></i> Christmas</a>
                <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarNav">
                    <span class="navbar-toggler-icon"></span>
                </button>
                <div class="collapse navbar-collapse" id="navbarNav">
                    <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                        <li class="nav-item">
                            <a class="nav-link active" href="/dashboard">대시보드</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="/demo">홈</a>
                        </li>
                    </ul>
                    <span class="navbar-text">
                        최근 업데이트: {{ last_update }}
                    </span>
                </div>
            </div>
        </nav>

        <div class="dashboard-container">
            <div class="row mb-4">
                <div class="col-md-3">
                    <div class="card stats-card">
                        <div class="card-body">
                            <h6 class="card-subtitle mb-2 text-muted">총 실현 수익</h6>
                            <h3 class="card-title text-success">{{ total_profit }}원</h3>
                            <div class="mt-2">
                                <span class="badge bg-success">+{{ profit_change }}%</span>
                                <small class="text-muted ms-2">지난 주 대비</small>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stats-card">
                        <div class="card-body">
                            <h6 class="card-subtitle mb-2 text-muted">오늘 주문</h6>
                            <h3 class="card-title">{{ total_orders }}건</h3>
                            <div class="mt-2">
                                <span class="text-success">
                                    <i class="bi bi-check-circle"></i> {{ success_rate }}% 성공률
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stats-card">
                        <div class="card-body">
                            <h6 class="card-subtitle mb-2 text-muted">현재 포지션</h6>
                            <h3 class="card-title">{{ active_positions }}개</h3>
                            <div class="mt-2">
                                <span class="text-muted">
                                    <i class="bi bi-clock"></i> {{ avg_holding_time }} 평균 보유시간
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stats-card">
                        <div class="card-body">
                            <h6 class="card-subtitle mb-2 text-muted">알림</h6>
                            <h3 class="card-title">{{ total_alerts }}개</h3>
                            <div class="mt-2">
                                <span class="badge bg-danger me-1">{{ critical_alerts }} 중요</span>
                                <span class="badge bg-warning text-dark">{{ warning_alerts }} 경고</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header bg-white">
                            일일 수익
                        </div>
                        <div class="card-body">
                            <canvas id="profitChart"></canvas>
                        </div>
                    </div>
                </div>
                
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header bg-white">
                            최근 주문
                        </div>
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>종목</th>
                                        <th>시간</th>
                                        <th>방향</th>
                                        <th>가격</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {% for order in recent_orders %}
                                    <tr>
                                        <td>{{ order.symbol }}</td>
                                        <td>{{ order.time }}</td>
                                        <td>{{ order.side }}</td>
                                        <td>{{ order.price }}</td>
                                    </tr>
                                    {% endfor %}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-4">
                <div class="col-12">
                    <div class="card">
                        <div class="card-header bg-white">
                            현재 포지션
                        </div>
                        <div class="table-responsive">
                            <table class="table table-hover">
                                <thead>
                                    <tr>
                                        <th>종목</th>
                                        <th>수량</th>
                                        <th>진입가</th>
                                        <th>현재가</th>
                                        <th>손익(%)</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {% for position in current_positions %}
                                    <tr class="{{ 'bg-profit' if float(position.profit) > 0 else 'bg-loss' if float(position.profit) < 0 else '' }}">
                                        <td>{{ position.symbol }}</td>
                                        <td>{{ position.quantity }}</td>
                                        <td>{{ position.entry_price }}</td>
                                        <td>{{ position.current_price }}</td>
                                        <td class="{{ 'text-success' if float(position.profit) > 0 else 'text-danger' if float(position.profit) < 0 else '' }}">
                                            {{ position.profit }}%
                                        </td>
                                    </tr>
                                    {% endfor %}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
        <script>
            // 성과 차트
            const ctx = document.getElementById('profitChart').getContext('2d');
            const profitChart = new Chart(ctx, {
                type: 'bar',
                data: {
                    labels: {{ dates|tojson }},
                    datasets: [{
                        label: '일일 수익 (원)',
                        data: {{ profits|tojson }},
                        backgroundColor: 'rgba(75, 192, 192, 0.5)',
                        borderColor: 'rgba(75, 192, 192, 1)',
                        borderWidth: 1
                    }]
                },
                options: {
                    responsive: true,
                    scales: {
                        y: {
                            beginAtZero: true
                        }
                    }
                }
            });
        </script>
    </body>
    </html>
    """
    return render_template_string(html, 
                                 last_update=last_update,
                                 total_profit=total_profit,
                                 profit_change=profit_change,
                                 total_orders=total_orders,
                                 success_rate=success_rate,
                                 active_positions=active_positions,
                                 avg_holding_time=avg_holding_time,
                                 total_alerts=total_alerts,
                                 critical_alerts=critical_alerts,
                                 warning_alerts=warning_alerts,
                                 dates=dates,
                                 profits=profits,
                                 recent_orders=recent_orders,
                                 current_positions=current_positions)

@app.route('/hello')
def hello():
    return jsonify({
        'message': '안녕하세요! Christmas 초단타 매매 플랫폼입니다.',
        'version': '1.0.0',
        'features': [
            '실시간 시장 데이터 모니터링',
            '초단타 매매 전략',
            '자동화된 주문 실행',
            '위험 관리 시스템',
            '성과 분석 및 리포팅'
        ]
    })

@app.route('/api/stats')
def api_stats():
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

@app.route('/api/performance')
def api_performance():
    """성과 데이터 API"""
    # 7일간의 성과 데이터 생성
    dates = []
    profits = []
    
    for i in range(7):
        day = (datetime.now() - timedelta(days=6-i)).strftime('%m/%d')
        dates.append(day)
        profits.append(random.randint(80000, 350000))
    
    return jsonify({
        'dates': dates,
        'profits': profits
    })
