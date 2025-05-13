#!/bin/bash

# Christmas 프로젝트 문서 서버 실행 스크립트

# 현재 디렉토리 확인
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" &> /dev/null && pwd )"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"

# 문서 디렉토리로 이동
cd "$PROJECT_ROOT/docs" || { echo "문서 디렉토리를 찾을 수 없습니다."; exit 1; }

# MkDocs 설치 확인
if ! command -v mkdocs &> /dev/null; then
    echo "MkDocs가 설치되어 있지 않습니다. pip로 설치합니다..."
    pip install mkdocs mkdocs-material mkdocs-mermaid2-plugin
fi

# 모드 확인
MODE=${1:-serve}

case "$MODE" in
    serve)
        echo "MkDocs 서버를 시작합니다..."
        mkdocs serve -a 0.0.0.0:8000
        ;;
    build)
        echo "MkDocs 정적 사이트를 빌드합니다..."
        mkdocs build
        ;;
    deploy)
        echo "MkDocs 사이트를 GitHub Pages에 배포합니다..."
        mkdocs gh-deploy --force
        ;;
    *)
        echo "알 수 없는 모드: $MODE"
        echo "사용법: $0 [serve|build|deploy]"
        exit 1
        ;;
esac

echo "완료 - $(date)" 