from flask import Flask, jsonify, render_template_string

app = Flask(__name__)

@app.route('/')
def index():
    return jsonify({
        'status': 'ok',
        'message': 'Christmas 초단타 자동 매매 플랫폼',
        'version': '1.0.0',
        'routes': ['/', '/demo', '/hello']
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
            <a href="/hello" class="button">API 테스트</a>
        </div>
    </body>
    </html>
    """
    return render_template_string(html)

@app.route('/hello')
def hello():
    return jsonify({
        'message': '안녕하세요! Christmas 초단타 매매 플랫폼입니다.',
        'version': '1.0.0'
    })
