#!/usr/bin/env python
"""
Christmas 프로젝트 - 웹 서버 실행 스크립트
"""

import os
import sys
import logging
from pathlib import Path

# 로깅 설정
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
)
logger = logging.getLogger(__name__)

# 프로젝트 루트 경로 추가 (상대 경로 import를 위해)
project_root = Path(__file__).parent.parent.parent
sys.path.insert(0, str(project_root))

# 애플리케이션 생성
from app.web.main import create_app
app = create_app()

# 실행 환경 설정
port = int(os.environ.get('FLASK_PORT', 5000))
host = os.environ.get('FLASK_HOST', '0.0.0.0')
debug = os.environ.get('FLASK_DEBUG', 'True').lower() in ('true', '1', 't')

if __name__ == '__main__':
    # Flask 앱 실행
    logger.info(f"웹 서버 시작 - http://{host}:{port}")
    logger.info(f"디버그 모드: {'활성화' if debug else '비활성화'}")
    
    try:
        app.run(host=host, port=port, debug=debug)
    except KeyboardInterrupt:
        logger.info("사용자에 의해 웹 서버가 중지되었습니다.")
    except Exception as e:
        logger.error(f"웹 서버 실행 중 오류 발생: {str(e)}")
        sys.exit(1) 