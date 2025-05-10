"""
Vercel 배포 테스트를 위한 간단한 Flask 애플리케이션
"""
from flask import Flask, jsonify, render_template_string

app = Flask(__name__)

@app.route('/')
def index():
    """기본 라우트"""
    return jsonify({
        'status': 'ok',
        'message': 'Vercel 배포 테스트 애플리케이션',
        'routes': [
            '/',
            '/demo',
            '/hello'
        ]
    })

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
            <h1>Vercel 배포 테스트</h1>
            <div class="info">
                <p>이 페이지는 Vercel에 정상적으로 배포되었는지 확인하기 위한 테스트 페이지입니다.</p>
                <p>크리스마스 프로젝트의 대시보드 UI 및 차트 기능이 추가될 예정입니다.</p>
            </div>
            <a href="/hello" class="button">인사 보기</a>
        </div>
        <script>
            console.log('Vercel 배포 테스트 페이지가 로드되었습니다.');
        </script>
    </body>
    </html>
    """
    return render_template_string(html)

@app.route('/hello')
def hello():
    """간단한 인사 메시지"""
    return jsonify({
        'message': '안녕하세요! Vercel 배포 테스트 애플리케이션입니다.',
        'timestamp': '2025-05-10T16:15:00+09:00'
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True) 