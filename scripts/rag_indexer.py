#!/usr/bin/env python
"""
RAG 문서 색인 스크립트

Christmas 프로젝트 문서를 벡터 데이터베이스에 색인화하는 스크립트
"""

import os
import sys
import argparse
import logging
from typing import List
from pathlib import Path

# 프로젝트 루트 경로를 Python 경로에 추가
project_root = Path(__file__).parent.parent
sys.path.insert(0, str(project_root))

from app.rag.indexer import index_directory, get_indexed_status
from app.rag.retriever import get_document_retriever

def setup_logging():
    """로깅 설정"""
    # 로그 디렉토리 생성
    log_dir = os.path.join(project_root, 'logs')
    os.makedirs(log_dir, exist_ok=True)
    
    logging.basicConfig(
        level=logging.INFO,
        format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        handlers=[
            logging.StreamHandler(),
            logging.FileHandler(os.path.join(log_dir, 'rag_indexer.log'))
        ]
    )

def main():
    """메인 함수"""
    parser = argparse.ArgumentParser(description='Christmas 프로젝트 문서 색인화 도구')
    parser.add_argument('--directory', '-d', type=str, default='docs', 
                        help='색인할 디렉토리 경로 (기본값: docs)')
    parser.add_argument('--extensions', '-e', type=str, default='md', 
                        help='색인할 파일 확장자 (쉼표로 구분, 기본값: md)')
    parser.add_argument('--status', '-s', action='store_true',
                        help='현재 색인 상태 출력')
    parser.add_argument('--dry-run', action='store_true',
                        help='모의 모드로 실행 (실제 색인화 없음)')
    
    args = parser.parse_args()
    
    # 로깅 설정
    setup_logging()
    logger = logging.getLogger(__name__)
    
    try:
        # 상태 확인 모드
        if args.status:
            status = get_indexed_status()
            print("\n=== RAG 색인 상태 ===")
            print(f"상태: {status['status']}")
            print(f"색인된 파일: {status.get('indexed_files', 0)}")
            print(f"총 청크 수: {status.get('total_chunks', 0)}")
            
            if 'last_updated' in status:
                print(f"마지막 업데이트: {status['last_updated']}")
                
            if 'error' in status:
                print(f"오류: {status['error']}")
                
            return 0
            
        # 색인 모드
        extensions = [ext.strip() for ext in args.extensions.split(',')]
        directory = os.path.join(project_root, args.directory)
        
        logger.info(f"색인 시작: 디렉토리={directory}, 확장자={extensions}")
        
        # 벡터 데이터베이스 연결 테스트
        try:
            if not args.dry_run:
                retriever = get_document_retriever()
                logger.info("벡터 데이터베이스 연결 성공")
        except Exception as e:
            logger.warning(f"벡터 데이터베이스 연결 실패: {e}, 모의 모드로 진행합니다.")
            args.dry_run = True
        
        # 색인 실행
        if args.dry_run:
            # Dry Run 모드
            logger.info("Dry Run 모드로 실행 중입니다. 실제 색인화는 수행되지 않습니다.")
            files = [f for f in os.listdir(directory) if f.endswith(tuple('.' + ext for ext in extensions))]
            
            result = {
                "status": "완료 (Dry Run)",
                "indexed_files": len(files),
                "total_chunks": len(files) * 5,  # 가상의 청크 수
                "last_updated": "N/A (Dry Run)"
            }
            
            print("\n=== 색인 시뮬레이션 완료 (Dry Run) ===")
            print(f"상태: {result['status']}")
            print(f"색인 대상 파일: {result['indexed_files']}")
            print(f"예상 청크 수: {result['total_chunks']}")
        else:
            # 실제 색인 실행
            result = index_directory(directory, extensions)
            
            print("\n=== 색인 완료 ===")
            print(f"상태: {result['status']}")
            print(f"색인된 파일: {result.get('indexed_files', 0)}")
            print(f"총 청크 수: {result.get('total_chunks', 0)}")
            
            if 'last_updated' in result:
                print(f"완료 시간: {result['last_updated']}")
        
        return 0
        
    except Exception as e:
        logger.error(f"색인 중 오류 발생: {e}")
        print(f"오류: 색인 중 문제가 발생했습니다. {e}")
        return 1

if __name__ == "__main__":
    sys.exit(main()) 