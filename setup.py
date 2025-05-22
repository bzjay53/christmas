#!/usr/bin/env python3
"""
Christmas 프로젝트의 Netlify 배포를 위한 설정 스크립트
"""

import os
import shutil
import json
import sys
from pathlib import Path

def main():
    """
    Netlify 배포를 위한 파일 준비
    """
    print("Christmas 프로젝트 Netlify 배포 설정을 시작합니다...")
    
    # 프로젝트 루트 디렉토리
    root_dir = Path(os.path.dirname(os.path.abspath(__file__)))
    
    # 정적 파일 디렉토리 설정
    static_dir = root_dir / 'app' / 'web' / 'static'
    ensure_directory(static_dir)
    
    # 함수 디렉토리 설정
    functions_dir = root_dir / 'app' / 'web' / 'functions'
    ensure_directory(functions_dir)
    
    # 정적 파일 복사 (templates에서 static으로)
    copy_templates_to_static(root_dir)
    
    # package.json 파일이 없으면 생성
    create_package_json(root_dir)
    
    # redirect 파일 생성
    create_redirects_file(static_dir)
    
    # 성공 메시지 출력
    print("설정이 완료되었습니다. Netlify에 배포할 준비가 되었습니다.")
    return 0

def ensure_directory(directory):
    """지정된 디렉토리가 존재하는지 확인하고 없으면 생성"""
    if not directory.exists():
        print(f"디렉토리 생성: {directory}")
        directory.mkdir(parents=True, exist_ok=True)
    else:
        print(f"디렉토리 확인: {directory} (이미 존재함)")

def copy_templates_to_static(root_dir):
    """템플릿 파일을 정적 디렉토리로 복사"""
    templates_dir = root_dir / 'app' / 'web' / 'templates'
    static_dir = root_dir / 'app' / 'web' / 'static'
    
    if templates_dir.exists():
        print("템플릿 파일을 정적 디렉토리로 복사합니다...")
        
        # 모든 HTML 파일 처리
        for template_file in templates_dir.glob('**/*.html'):
            # 대상 경로 계산 (상대 경로 유지)
            rel_path = template_file.relative_to(templates_dir)
            dest_path = static_dir / rel_path
            
            # 대상 디렉토리 생성
            dest_path.parent.mkdir(parents=True, exist_ok=True)
            
            # 템플릿을 정적 HTML로 변환 (향후 더 복잡한 변환 로직 추가 가능)
            with open(template_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # 파일 복사 (나중에 템플릿 변환 로직 추가 가능)
            with open(dest_path, 'w', encoding='utf-8') as f:
                f.write(content)
            
            print(f"  - {template_file} -> {dest_path}")
    else:
        print("템플릿 디렉토리를 찾을 수 없습니다. 복사를 건너뜁니다.")

def create_package_json(root_dir):
    """루트 디렉토리에 package.json 파일이 없으면 생성"""
    package_json_path = root_dir / 'package.json'
    
    if not package_json_path.exists():
        print("루트 package.json 파일을 생성합니다...")
        
        package_data = {
            "name": "christmas-project",
            "version": "1.0.0",
            "description": "Christmas 초단타 매매 플랫폼",
            "scripts": {
                "build": "python setup.py",
                "dev": "python app/web/main.py"
            },
            "engines": {
                "node": ">=14"
            }
        }
        
        with open(package_json_path, 'w', encoding='utf-8') as f:
            json.dump(package_data, f, indent=2)
            
        print(f"  - {package_json_path} 생성 완료")
    else:
        print("package.json 파일이 이미 존재합니다.")

def create_redirects_file(static_dir):
    """Netlify _redirects 파일 생성"""
    redirects_path = static_dir / '_redirects'
    
    if not redirects_path.exists():
        print("Netlify _redirects 파일을 생성합니다...")
        
        redirects_content = """
# API 요청을 서버리스 함수로 리다이렉트
/api/*  /.netlify/functions/api/:splat  200
/demo/*  /.netlify/functions/demo-trade/:splat  200

# SPA 라우팅을 위한 리다이렉트
/*      /index.html     200
"""
        
        with open(redirects_path, 'w', encoding='utf-8') as f:
            f.write(redirects_content.strip())
            
        print(f"  - {redirects_path} 생성 완료")
    else:
        print("_redirects 파일이 이미 존재합니다.")

if __name__ == "__main__":
    sys.exit(main()) 