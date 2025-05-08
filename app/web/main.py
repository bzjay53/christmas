"""
Christmas 프로젝트 - 웹 인터페이스 메인 모듈
Flask 기반의 웹 애플리케이션 설정 및 실행
"""

import os
import logging
from pathlib import Path
from flask import Flask, render_template, redirect, url_for, flash, request, jsonify
from flask_assets import Environment, Bundle

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

def create_app(test_config=None):
    """
    Flask 애플리케이션 생성 및 설정
    
    Args:
        test_config: 테스트용 설정 (None이면 기본 설정 사용)
        
    Returns:
        구성된 Flask 애플리케이션
    """
    # 애플리케이션 인스턴스 생성
    app = Flask(
        __name__, 
        instance_relative_config=True,
        template_folder='templates',
        static_folder='static'
    )
    
    # 기본 설정
    app.config.from_mapping(
        SECRET_KEY=os.environ.get('FLASK_SECRET_KEY', 'dev'),
        TEMPLATES_AUTO_RELOAD=True,
        SEND_FILE_MAX_AGE_DEFAULT=0,
    )
    
    # 테스트 설정 적용 또는 config.py에서 설정 로드
    if test_config is None:
        app.config.from_pyfile('config.py', silent=True)
    else:
        app.config.from_mapping(test_config)
    
    # 인스턴스 폴더 생성
    try:
        os.makedirs(app.instance_path, exist_ok=True)
    except OSError:
        pass
    
    # Assets 설정 (CSS, JS 번들링)
    assets = Environment(app)
    assets.debug = app.debug
    
    # CSS 번들
    css = Bundle(
        'css/bootstrap.min.css',
        'css/dashboard.css',
        filters='cssmin',
        output='gen/packed.css'
    )
    assets.register('css_all', css)
    
    # JavaScript 번들
    js = Bundle(
        'js/jquery.min.js',
        'js/bootstrap.bundle.min.js',
        'js/dashboard.js',
        filters='jsmin',
        output='gen/packed.js'
    )
    assets.register('js_all', js)
    
    # Blueprint 등록
    from app.web.routes import dashboard, backtest, settings
    app.register_blueprint(dashboard.bp)
    app.register_blueprint(backtest.bp)
    app.register_blueprint(settings.bp)
    
    # 루트 경로 설정
    @app.route('/')
    def index():
        return redirect(url_for('dashboard.index'))
    
    # 에러 핸들러
    @app.errorhandler(404)
    def page_not_found(e):
        return render_template('error/404.html'), 404
    
    @app.errorhandler(500)
    def server_error(e):
        return render_template('error/500.html'), 500
    
    # API 상태 확인 엔드포인트
    @app.route('/api/health')
    def api_health():
        return jsonify({
            'status': 'ok',
            'version': '0.1.0'
        })
    
    logger.info("웹 애플리케이션이 초기화되었습니다.")
    return app


if __name__ == '__main__':
    app = create_app()
    app.run(host='0.0.0.0', port=5000, debug=True) 