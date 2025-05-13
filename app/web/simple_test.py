"""
Vercel 배포 테스트를 위한 간단한 Flask 애플리케이션
"""
from flask import Flask, jsonify, render_template_string, redirect, url_for
from datetime import datetime, timedelta
import json
import random
import os

app = Flask(__name__, template_folder='../templates')

@app.route('/')
def index():
    """기본 라우트"""
    return jsonify({
        'status': 'ok',
        'message': 'Christmas 초단타 자동 매매 플랫폼',
        'version': '1.0.0',
        'routes': [
            '/',
            '/dashboard',
            '/demo',
            '/hello',
            '/api/stats',
            '/api/performance'
        ]
    })

@app.route('/dashboard')
def dashboard():
    """대시보드 페이지"""
    # 현재 폴더의 templates 디렉토리에서 dashboard.html을 찾을 수 없으므로
    # 직접 다른 폴더의 템플릿 파일을 로드
    try:
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
        
        with open(os.path.join(os.path.dirname(__file__), '../templates/dashboard.html'), 'r', encoding='utf-8') as file:
            template_content = file.read()
            
        return render_template_string(template_content, **data)
    except Exception as e:
        # 오류가 발생하면 간단한 대시보드 페이지 렌더링
        return render_demo_dashboard_html()

@app.route('/demo')
def demo():
    """간단한 HTML 페이지"""
    html = """
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Vercel 배포 테스트</title>
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
            }
            .button:hover {
                background-color: #304e96;
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
            <a href="/dashboard" class="button">대시보드 보기</a>
        </div>
        <script>
            console.log('Christmas 플랫폼 데모 페이지가 로드되었습니다.');
        </script>
    </body>
    </html>
    """
    return render_template_string(html)

@app.route('/hello')
def hello():
    """간단한 인사 메시지"""
    return jsonify({
        'message': '안녕하세요! Christmas 초단타 매매 플랫폼입니다.',
        'version': '1.0.0',
        'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
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

def render_demo_dashboard_html():
    """간단한 대시보드 HTML 생성 (템플릿을 못 찾을 경우 사용)"""
    html = """
    <!DOCTYPE html>
    <html lang="ko">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Christmas - 대시보드</title>
        <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/css/bootstrap.min.css" rel="stylesheet">
        <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.1/font/bootstrap-icons.css">
        <style>
            body {
                background-color: #f8f9fa;
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            }
            .navbar-brand {
                font-weight: bold;
                color: #e63946 !important;
            }
            .dashboard-container {
                max-width: 1200px;
                margin: 2rem auto;
                padding: 2rem;
                background-color: #ffffff;
                border-radius: 10px;
                box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            }
            .stats-card {
                border-radius: 10px;
                box-shadow: 0 2px 5px rgba(0, 0, 0, 0.05);
                margin-bottom: 20px;
                background-color: #fff;
                border-left: 4px solid #4cc9f0;
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
                            <a class="nav-link" href="#">전략</a>
                        </li>
                        <li class="nav-item">
                            <a class="nav-link" href="#">백테스트</a>
                        </li>
                    </ul>
                    <span class="badge bg-success me-3">시스템 정상</span>
                    <span class="navbar-text">v1.0.0</span>
                </div>
            </div>
        </nav>

        <div class="dashboard-container">
            <h2 class="mb-4">대시보드</h2>
            
            <div class="row">
                <div class="col-md-3">
                    <div class="card stats-card">
                        <div class="card-body">
                            <h5 class="card-title">총 실현 수익</h5>
                            <h3 class="text-success">2,750,000원</h3>
                            <span class="badge bg-success">+12.5%</span>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stats-card">
                        <div class="card-body">
                            <h5 class="card-title">오늘 주문</h5>
                            <h3>32건</h3>
                            <span class="text-success">94.8% 성공률</span>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stats-card">
                        <div class="card-body">
                            <h5 class="card-title">현재 포지션</h5>
                            <h3>5개</h3>
                            <span class="text-muted">45분 평균 보유시간</span>
                        </div>
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="card stats-card">
                        <div class="card-body">
                            <h5 class="card-title">오늘 알림</h5>
                            <h3>8건</h3>
                            <span class="badge bg-danger me-1">2개 중요</span>
                            <span class="badge bg-warning text-dark">3개 경고</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="row mt-4">
                <div class="col-md-8">
                    <div class="card">
                        <div class="card-header">
                            성과 추이
                        </div>
                        <div class="card-body">
                            <p class="text-center text-muted">Vercel 배포 환경에서는 차트 렌더링이 비활성화되었습니다.</p>
                        </div>
                    </div>
                </div>
                <div class="col-md-4">
                    <div class="card">
                        <div class="card-header">
                            최근 주문
                        </div>
                        <div class="card-body p-0">
                            <table class="table table-sm mb-0">
                                <tbody>
                                    <tr>
                                        <td>
                                            <div>삼성전자</div>
                                            <small class="text-muted">10:15:22</small>
                                        </td>
                                        <td class="text-end">
                                            <div class="text-success">매수</div>
                                            <small>72,500원</small>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <div>LG화학</div>
                                            <small class="text-muted">10:08:45</small>
                                        </td>
                                        <td class="text-end">
                                            <div class="text-danger">매도</div>
                                            <small>680,000원</small>
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>

            <div class="text-center mt-5">
                <p class="text-muted">이 페이지는 Christmas 초단타 매매 플랫폼의 간소화된 대시보드입니다.</p>
                <p class="text-muted">정식 버전 v1.0.0</p>
                <a href="/" class="btn btn-sm btn-outline-primary">메인으로 돌아가기</a>
            </div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js"></script>
    </body>
    </html>
    """
    return render_template_string(html)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 