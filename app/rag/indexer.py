"""
RAG Indexer 모듈

마크다운 문서를 청크로 나누고 Weaviate 벡터 데이터베이스에 색인화하는 모듈
"""

import os
import glob
import re
import logging
import json
from typing import List, Dict, Any, Optional
from datetime import datetime
import tiktoken
import weaviate
import openai
from bs4 import BeautifulSoup
import markdown
from dotenv import load_dotenv

from app.rag.retriever import get_document_retriever

# 환경 변수 로드
load_dotenv()

# OpenAI API 키 설정
openai.api_key = os.getenv("OPENAI_API_KEY")

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 토큰화 인코더
ENCODING = tiktoken.get_encoding("cl100k_base")

# 색인 상태 파일
INDEX_STATUS_FILE = os.path.join(os.path.dirname(__file__), 'index_status.json')

# 모의 모드 설정
MOCK_MODE = not openai.api_key

def count_tokens(text: str) -> int:
    """
    텍스트의 토큰 수 계산
    
    Args:
        text: 계산할 텍스트
        
    Returns:
        토큰 수
    """
    return len(ENCODING.encode(text))

def extract_sections(markdown_text: str) -> List[Dict[str, Any]]:
    """
    마크다운 텍스트에서 섹션을 추출
    
    Args:
        markdown_text: 마크다운 텍스트
        
    Returns:
        섹션 목록 (제목, 내용)
    """
    # HTML로 변환
    html = markdown.markdown(markdown_text)
    soup = BeautifulSoup(html, 'html.parser')
    
    sections = []
    current_section = {"title": "개요", "content": ""}
    
    for element in soup.find_all(['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'pre', 'ul', 'ol']):
        if element.name in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
            # 이전 섹션 저장
            if current_section["content"].strip():
                sections.append(current_section)
            
            # 새 섹션 시작
            current_section = {
                "title": element.get_text(),
                "content": ""
            }
        else:
            # 현재 섹션에 내용 추가
            current_section["content"] += element.get_text() + "\n\n"
    
    # 마지막 섹션 저장
    if current_section["content"].strip():
        sections.append(current_section)
    
    return sections

def chunk_text(text: str, max_tokens: int = 500) -> List[str]:
    """
    텍스트를 일정 크기의 청크로 분할
    
    Args:
        text: 분할할 텍스트
        max_tokens: 청크당 최대 토큰 수
        
    Returns:
        청크 목록
    """
    # 문단으로 분할
    paragraphs = re.split(r'\n\s*\n', text)
    
    chunks = []
    current_chunk = ""
    current_tokens = 0
    
    for para in paragraphs:
        para_stripped = para.strip()
        if not para_stripped:
            continue
            
        para_tokens = count_tokens(para_stripped)
        
        # 현재 문단이 단독으로 max_tokens를 초과하는 경우
        if para_tokens > max_tokens:
            # 문장 단위로 분할
            sentences = re.split(r'(?<=[.!?])\s+', para_stripped)
            
            for sentence in sentences:
                sentence_tokens = count_tokens(sentence)
                
                if current_tokens + sentence_tokens <= max_tokens:
                    current_chunk += sentence + " "
                    current_tokens += sentence_tokens
                else:
                    # 현재 청크 저장하고 새 청크 시작
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                    
                    # 문장이 그 자체로 max_tokens를 초과하는 경우
                    if sentence_tokens > max_tokens:
                        # 문장을 단어 단위로 분할
                        words = sentence.split()
                        current_chunk = ""
                        current_tokens = 0
                        
                        for word in words:
                            word_tokens = count_tokens(word)
                            
                            if current_tokens + word_tokens <= max_tokens:
                                current_chunk += word + " "
                                current_tokens += word_tokens
                            else:
                                chunks.append(current_chunk.strip())
                                current_chunk = word + " "
                                current_tokens = word_tokens
                    else:
                        current_chunk = sentence + " "
                        current_tokens = sentence_tokens
        else:
            # 현재 청크에 문단을 추가할 수 있는 경우
            if current_tokens + para_tokens <= max_tokens:
                current_chunk += para_stripped + "\n\n"
                current_tokens += para_tokens
            else:
                # 현재 청크 저장하고 새 청크 시작
                chunks.append(current_chunk.strip())
                current_chunk = para_stripped + "\n\n"
                current_tokens = para_tokens
    
    # 마지막 청크 저장
    if current_chunk:
        chunks.append(current_chunk.strip())
    
    return chunks

def index_markdown_file(file_path: str, retriever=None) -> int:
    """
    마크다운 파일을 벡터 데이터베이스에 색인화
    
    Args:
        file_path: 마크다운 파일 경로
        retriever: DocumentRetriever 인스턴스
        
    Returns:
        생성된 청크 수
    """
    # 모의 모드에서는 파일이 존재하는지만 확인하고 가상의 청크 수 반환
    if MOCK_MODE:
        if os.path.exists(file_path):
            # 실제 파일의 크기에 비례한 청크 수 생성
            file_size = os.path.getsize(file_path)
            chunk_count = max(1, file_size // 2000)  # 약 2KB당 1개 청크
            logger.info(f"[모의 모드] 파일 '{file_path}' 색인 완료: {chunk_count}개 모의 청크 생성")
            return chunk_count
        else:
            logger.error(f"[모의 모드] 파일 '{file_path}'이 존재하지 않습니다.")
            return 0
    
    if retriever is None:
        retriever = get_document_retriever()
        
    try:
        logger.info(f"파일 색인 중: {file_path}")
        
        # 파일 읽기
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # 섹션 추출
        sections = extract_sections(content)
        
        # 섹션별 청크 생성 및 색인화
        chunk_count = 0
        
        for section in sections:
            section_title = section["title"]
            section_content = section["content"]
            
            # 청크로 분할
            chunks = chunk_text(section_content)
            
            # 각 청크 색인화
            for i, chunk in enumerate(chunks):
                try:
                    # Weaviate에 청크 추가
                    chunk_id = {
                        "content": chunk,
                        "file_path": file_path,
                        "section": section_title,
                        "chunk_id": chunk_count,
                        "metadata": json.dumps({
                            "timestamp": datetime.now().isoformat(),
                            "tokens": count_tokens(chunk)
                        })
                    }
                    
                    # 기존 문서가 있는지 확인 및 업데이트 또는 삽입
                    query = {
                        "operator": "And",
                        "operands": [
                            {
                                "path": ["file_path"],
                                "operator": "Equal",
                                "valueString": file_path
                            },
                            {
                                "path": ["chunk_id"],
                                "operator": "Equal",
                                "valueNumber": chunk_count
                            }
                        ]
                    }
                    
                    result = retriever.client.query.get(
                        "ChristmasDocument", ["_additional {id}"]
                    ).with_where(query).do()
                    
                    if (result["data"]["Get"]["ChristmasDocument"] and 
                        len(result["data"]["Get"]["ChristmasDocument"]) > 0):
                        # 기존 문서 업데이트
                        doc_id = result["data"]["Get"]["ChristmasDocument"][0]["_additional"]["id"]
                        retriever.client.data_object.update(chunk_id, "ChristmasDocument", doc_id)
                    else:
                        # 새 문서 생성
                        retriever.client.data_object.create(chunk_id, "ChristmasDocument")
                    
                    chunk_count += 1
                    
                except Exception as e:
                    logger.error(f"청크 색인화 중 오류 발생: {e}")
                    raise
        
        logger.info(f"파일 '{file_path}' 색인 완료: {chunk_count}개 청크 생성")
        return chunk_count
        
    except Exception as e:
        logger.error(f"파일 '{file_path}' 색인화 중 오류 발생: {e}")
        raise

def index_directory(directory: str, file_extensions: List[str] = None) -> Dict[str, Any]:
    """
    디렉토리의 마크다운 파일들을 색인화
    
    Args:
        directory: 색인할 디렉토리 경로
        file_extensions: 색인할 파일 확장자 목록 (기본값: ["md"])
        
    Returns:
        색인 결과 정보
    """
    if file_extensions is None:
        file_extensions = ["md"]
        
    try:
        logger.info(f"디렉토리 색인 시작: {directory}")
        
        # 모의 모드가 아닌 경우 Retriever 인스턴스 가져옴
        retriever = None if MOCK_MODE else get_document_retriever()
        
        # 파일 목록 가져오기
        file_patterns = [os.path.join(directory, f"**/*.{ext}") for ext in file_extensions]
        files = []
        for pattern in file_patterns:
            files.extend(glob.glob(pattern, recursive=True))
        
        logger.info(f"총 {len(files)}개 파일 발견")
        
        # 각 파일 색인화
        total_chunks = 0
        indexed_files = 0
        
        for file_path in files:
            try:
                chunks = index_markdown_file(file_path, retriever)
                total_chunks += chunks
                indexed_files += 1
                logger.info(f"진행 상태: {indexed_files}/{len(files)} 파일 완료")
            except Exception as e:
                logger.error(f"파일 '{file_path}' 색인화 중 오류 발생: {e}")
        
        # 색인 상태 저장
        status = {
            "status": "완료",
            "indexed_files": indexed_files,
            "total_chunks": total_chunks,
            "last_updated": datetime.now().isoformat()
        }
        
        with open(INDEX_STATUS_FILE, 'w', encoding='utf-8') as f:
            json.dump(status, f, ensure_ascii=False, indent=2)
        
        logger.info(f"디렉토리 색인 완료: {indexed_files}개 파일, {total_chunks}개 청크")
        return status
        
    except Exception as e:
        logger.error(f"디렉토리 색인화 중 오류 발생: {e}")
        
        # 실패 상태 저장
        status = {
            "status": "실패",
            "error": str(e),
            "last_updated": datetime.now().isoformat()
        }
        
        with open(INDEX_STATUS_FILE, 'w', encoding='utf-8') as f:
            json.dump(status, f, ensure_ascii=False, indent=2)
        
        raise

def get_indexed_status() -> Dict[str, Any]:
    """
    색인 상태 조회
    
    Returns:
        색인 상태 정보
    """
    # 모의 모드에서 파일이 없으면 모의 데이터 생성
    if MOCK_MODE and not os.path.exists(INDEX_STATUS_FILE):
        mock_status = {
            "status": "완료 (모의 모드)",
            "indexed_files": 9,
            "total_chunks": 47,
            "last_updated": datetime.now().isoformat()
        }
        
        # 모의 데이터 저장
        try:
            os.makedirs(os.path.dirname(INDEX_STATUS_FILE), exist_ok=True)
            with open(INDEX_STATUS_FILE, 'w', encoding='utf-8') as f:
                json.dump(mock_status, f, ensure_ascii=False, indent=2)
        except Exception as e:
            logger.error(f"모의 상태 파일 저장 중 오류 발생: {e}")
        
        return mock_status
    
    if not os.path.exists(INDEX_STATUS_FILE):
        return {
            "status": "초기화되지 않음",
            "indexed_files": 0,
            "total_chunks": 0
        }
        
    try:
        with open(INDEX_STATUS_FILE, 'r', encoding='utf-8') as f:
            return json.load(f)
    except Exception as e:
        logger.error(f"색인 상태 조회 중 오류 발생: {e}")
        return {
            "status": "오류",
            "error": str(e),
            "indexed_files": 0,
            "total_chunks": 0
        } 