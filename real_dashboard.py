"""
Christmas 프로젝트 - 실시간 웹 대시보드
"""
from flask import Flask, render_template_string, jsonify, request
import asyncio
import threading
import json
import time
from datetime import datetime
import os
import sys

# 프로젝트 루트 추가
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from app.simulation.portfolio_simulator import get_simulator, start_simulation, stop_simulation
from app.notification.telegram_bot_service import initialize_telegram_service, stop_telegram_service

app = Flask(__name__)

# 전역 상태
dashboard_data = {
    "simulator_running": False,
    "portfolio": {},
    "trades": [],
    "last_update": None
}

@app.route('/')
def dashboard():
    """실시간 대시보드 메인 페이지"""
    return render_template_string(DASHBOARD_HTML)

@app.route('/api/status')
def api_status():
    """시스템 상태 API"""
    simulator = get_simulator()
    return jsonify({
        "simulator_running": simulator is not None and simulator.is_running,
        "timestamp": datetime.now().isoformat(),
        "telegram_configured": bool(os.getenv('TELEGRAM_BOT_TOKEN') and os.getenv('TELEGRAM_CHAT_ID'))
    })

@app.route('/api/portfolio')
def api_portfolio():
    """포트폴리오 데이터 API"""
    simulator = get_simulator()
    if simulator:
        summary = simulator.get_portfolio_summary()
        return jsonify(summary)
    else:
        return jsonify({"error": "시뮬레이터가 실행되지 않음"})

@app.route('/api/start', methods=['POST'])
def api_start():
    """시뮬레이터 시작 API"""
    try:
        data = request.get_json() or {}
        initial_cash = data.get('initial_cash', 10_000_000)
        
        # 백그라운드에서 시뮬레이터 시작
        def start_in_background():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(start_simulation(initial_cash))
            loop.run_until_complete(initialize_telegram_service())
        
        thread = threading.Thread(target=start_in_background)
        thread.daemon = True
        thread.start()
        
        return jsonify({"success": True, "message": "시뮬레이터 시작됨"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/stop', methods=['POST'])
def api_stop():
    """시뮬레이터 중지 API"""
    try:
        def stop_in_background():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            loop.run_until_complete(stop_simulation())
            loop.run_until_complete(stop_telegram_service())
        
        thread = threading.Thread(target=stop_in_background)
        thread.daemon = True
        thread.start()
        
        return jsonify({"success": True, "message": "시뮬레이터 중지됨"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

@app.route('/api/trade', methods=['POST'])
def api_trade():
    """거래 실행 API"""
    try:
        simulator = get_simulator()
        if not simulator:
            return jsonify({"success": False, "error": "시뮬레이터가 실행되지 않음"})
        
        data = request.get_json()
        action = data.get('action')  # 'buy' or 'sell'
        symbol = data.get('symbol')
        quantity = int(data.get('quantity', 0))
        
        def trade_in_background():
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            if action == 'buy':
                success = loop.run_until_complete(simulator.buy_order(symbol, quantity, "web"))
            else:
                success = loop.run_until_complete(simulator.sell_order(symbol, quantity, "web"))
            return success
        
        thread = threading.Thread(target=trade_in_background)
        thread.daemon = True
        thread.start()
        
        return jsonify({"success": True, "message": f"{action} 주문 실행됨"})
    except Exception as e:
        return jsonify({"success": False, "error": str(e)})

# HTML 템플릿
DASHBOARD_HTML = '''
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Christmas 실시간 대시보드</title>
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { 
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: #333;
            min-height: 100vh;
        }
        .header {
            background: rgba(255,255,255,0.95);
            padding: 1rem 2rem;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
            margin-bottom: 2rem;
        }
        .header h1 {
            color: #e63946;
            font-size: 2rem;
            margin-bottom: 0.5rem;
        }
        .status {
            display: flex;
            gap: 1rem;
            align-items: center;
        }
        .status-badge {
            padding: 0.3rem 0.8rem;
            border-radius: 20px;
            font-size: 0.9rem;
            font-weight: bold;
        }
        .status-online { background: #28a745; color: white; }
        .status-offline { background: #dc3545; color: white; }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 0 1rem;
        }
        .grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 1.5rem;
            margin-bottom: 2rem;
        }
        .card {
            background: rgba(255,255,255,0.95);
            border-radius: 15px;
            padding: 1.5rem;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
        }
        .card h3 {
            color: #667eea;
            margin-bottom: 1rem;
            font-size: 1.2rem;
        }
        .metric {
            display: flex;
            justify-content: space-between;
            margin-bottom: 0.8rem;
            padding: 0.5rem 0;
            border-bottom: 1px solid #eee;
        }
        .metric:last-child { border-bottom: none; }
        .metric-label { color: #666; }
        .metric-value { 
            font-weight: bold;
            color: #333;
        }
        .positive { color: #28a745; }
        .negative { color: #dc3545; }
        .controls {
            display: flex;
            gap: 1rem;
            margin-bottom: 1rem;
            flex-wrap: wrap;
        }
        .btn {
            padding: 0.8rem 1.5rem;
            border: none;
            border-radius: 8px;
            cursor: pointer;
            font-weight: bold;
            transition: all 0.3s;
        }
        .btn-primary { background: #667eea; color: white; }
        .btn-danger { background: #dc3545; color: white; }
        .btn-success { background: #28a745; color: white; }
        .btn:hover { transform: translateY(-2px); box-shadow: 0 4px 10px rgba(0,0,0,0.2); }
        .trade-form {
            display: flex;
            gap: 0.5rem;
            margin-top: 1rem;
            flex-wrap: wrap;
        }
        .form-group {
            display: flex;
            flex-direction: column;
            gap: 0.3rem;
        }
        .form-group input, .form-group select {
            padding: 0.5rem;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .auto-refresh {
            color: #666;
            font-size: 0.9rem;
            margin-top: 1rem;
        }
        .positions-table {
            width: 100%;
            border-collapse: collapse;
        }
        .positions-table th, .positions-table td {
            padding: 0.8rem;
            text-align: left;
            border-bottom: 1px solid #eee;
        }
        .positions-table th {
            background: #f8f9fa;
            font-weight: bold;
        }
        .chart-container {
            height: 300px;
            margin-top: 1rem;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎄 Christmas 실시간 트레이딩 대시보드</h1>
        <div class="status">
            <span id="status-badge" class="status-badge status-offline">오프라인</span>
            <span id="last-update">마지막 업데이트: -</span>
        </div>
    </div>

    <div class="container">
        <div class="card">
            <h3>🎮 시스템 제어</h3>
            <div class="controls">
                <button class="btn btn-primary" onclick="startSimulator()">시뮬레이터 시작</button>
                <button class="btn btn-danger" onclick="stopSimulator()">시뮬레이터 중지</button>
                <input type="number" id="initialCash" placeholder="초기자금" value="10000000" style="padding: 0.8rem; border: 1px solid #ddd; border-radius: 8px;">
            </div>
            
            <div class="trade-form">
                <div class="form-group">
                    <label>종목</label>
                    <select id="tradeSymbol">
                        <option value="삼성전자">삼성전자</option>
                        <option value="SK하이닉스">SK하이닉스</option>
                        <option value="POSCO">POSCO</option>
                        <option value="카카오">카카오</option>
                        <option value="네이버">네이버</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>수량</label>
                    <input type="number" id="tradeQuantity" placeholder="수량" value="10">
                </div>
                <div class="form-group">
                    <label>액션</label>
                    <button class="btn btn-success" onclick="executeTrade('buy')">매수</button>
                    <button class="btn btn-danger" onclick="executeTrade('sell')">매도</button>
                </div>
            </div>
        </div>

        <div class="grid">
            <div class="card">
                <h3>📊 포트폴리오 요약</h3>
                <div id="portfolio-summary">
                    <div class="metric">
                        <span class="metric-label">총 자산</span>
                        <span class="metric-value" id="total-value">0원</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">현금</span>
                        <span class="metric-value" id="cash">0원</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">총 손익</span>
                        <span class="metric-value" id="total-pnl">0원</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">수익률</span>
                        <span class="metric-value" id="return-rate">0.00%</span>
                    </div>
                    <div class="metric">
                        <span class="metric-label">거래 횟수</span>
                        <span class="metric-value" id="trades-count">0회</span>
                    </div>
                </div>
            </div>

            <div class="card">
                <h3>📈 보유 포지션</h3>
                <div id="positions-container">
                    <p>포지션이 없습니다.</p>
                </div>
            </div>
        </div>

        <div class="auto-refresh">
            🔄 자동 새로고침: 3초마다 데이터가 업데이트됩니다.
        </div>
    </div>

    <script>
        let refreshInterval;

        function formatCurrency(value) {
            return new Intl.NumberFormat('ko-KR').format(Math.round(value)) + '원';
        }

        function formatPercent(value) {
            return value.toFixed(2) + '%';
        }

        async function updateStatus() {
            try {
                const response = await fetch('/api/status');
                const status = await response.json();
                
                const badge = document.getElementById('status-badge');
                badge.textContent = status.simulator_running ? '온라인' : '오프라인';
                badge.className = 'status-badge ' + (status.simulator_running ? 'status-online' : 'status-offline');
                
                document.getElementById('last-update').textContent = 
                    '마지막 업데이트: ' + new Date().toLocaleString();
                
                if (status.simulator_running) {
                    await updatePortfolio();
                }
            } catch (error) {
                console.error('상태 업데이트 오류:', error);
            }
        }

        async function updatePortfolio() {
            try {
                const response = await fetch('/api/portfolio');
                const portfolio = await response.json();
                
                if (portfolio.error) return;
                
                // 포트폴리오 요약 업데이트
                document.getElementById('total-value').textContent = formatCurrency(portfolio.total_value || 0);
                document.getElementById('cash').textContent = formatCurrency(portfolio.cash || 0);
                
                const totalPnl = portfolio.total_pnl || 0;
                const pnlElement = document.getElementById('total-pnl');
                pnlElement.textContent = formatCurrency(totalPnl);
                pnlElement.className = 'metric-value ' + (totalPnl >= 0 ? 'positive' : 'negative');
                
                const returnRate = portfolio.return_rate || 0;
                const rateElement = document.getElementById('return-rate');
                rateElement.textContent = formatPercent(returnRate);
                rateElement.className = 'metric-value ' + (returnRate >= 0 ? 'positive' : 'negative');
                
                document.getElementById('trades-count').textContent = (portfolio.trades_count || 0) + '회';
                
                // 포지션 업데이트
                const positionsContainer = document.getElementById('positions-container');
                if (portfolio.positions && Object.keys(portfolio.positions).length > 0) {
                    let html = '<table class="positions-table"><tr><th>종목</th><th>수량</th><th>평균가</th><th>현재가</th><th>손익</th></tr>';
                    for (const [symbol, pos] of Object.entries(portfolio.positions)) {
                        const pnlClass = pos.unrealized_pnl >= 0 ? 'positive' : 'negative';
                        html += `<tr>
                            <td>${symbol}</td>
                            <td>${pos.quantity}주</td>
                            <td>${formatCurrency(pos.avg_price)}</td>
                            <td>${formatCurrency(pos.current_price)}</td>
                            <td class="${pnlClass}">${formatCurrency(pos.unrealized_pnl)}</td>
                        </tr>`;
                    }
                    html += '</table>';
                    positionsContainer.innerHTML = html;
                } else {
                    positionsContainer.innerHTML = '<p>포지션이 없습니다.</p>';
                }
                
            } catch (error) {
                console.error('포트폴리오 업데이트 오류:', error);
            }
        }

        async function startSimulator() {
            const initialCash = document.getElementById('initialCash').value;
            try {
                const response = await fetch('/api/start', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ initial_cash: parseInt(initialCash) })
                });
                const result = await response.json();
                alert(result.message);
                
                if (result.success) {
                    // 2초 후 상태 업데이트
                    setTimeout(updateStatus, 2000);
                }
            } catch (error) {
                alert('시뮬레이터 시작 오류: ' + error.message);
            }
        }

        async function stopSimulator() {
            try {
                const response = await fetch('/api/stop', { method: 'POST' });
                const result = await response.json();
                alert(result.message);
                updateStatus();
            } catch (error) {
                alert('시뮬레이터 중지 오류: ' + error.message);
            }
        }

        async function executeTrade(action) {
            const symbol = document.getElementById('tradeSymbol').value;
            const quantity = document.getElementById('tradeQuantity').value;
            
            try {
                const response = await fetch('/api/trade', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ action, symbol, quantity })
                });
                const result = await response.json();
                alert(result.message);
                
                if (result.success) {
                    // 즉시 포트폴리오 업데이트
                    setTimeout(updatePortfolio, 1000);
                }
            } catch (error) {
                alert('거래 실행 오류: ' + error.message);
            }
        }

        // 초기화 및 자동 새로고침
        document.addEventListener('DOMContentLoaded', function() {
            updateStatus();
            refreshInterval = setInterval(updateStatus, 3000); // 3초마다 업데이트
        });
    </script>
</body>
</html>
'''

if __name__ == '__main__':
    print("🎄 Christmas 실시간 대시보드 시작!")
    print("📱 브라우저에서 http://localhost:5555 접속하세요")
    print("🔄 실시간으로 데이터가 업데이트됩니다")
    app.run(host='0.0.0.0', port=5555, debug=True) 