"""
RAG Generator 모듈

검색된 문서 청크를 컨텍스트로 사용하여 LLM을 통해 질의에 대한 응답을 생성하는 모듈
"""

import os
import logging
import re
import json
from typing import List, Dict, Any, Tuple
import openai
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# OpenAI API 키 설정
openai.api_key = os.getenv("OPENAI_API_KEY")

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# 시스템 프롬프트
SYSTEM_PROMPT = """당신은 Christmas 프로젝트에 대한 전문가입니다. 
다음 문서에 포함된 정보를 바탕으로 질문에 정확하게 답변하세요.
각 참조 문서는 Document X: {...} 형식으로 제공됩니다.
참조 문서에 없는 내용은 답변하지 마세요.
답변에 참조한 문서를 (Document X:섹션) 형식의 인용으로 표시하세요.
"""

def generate_response(query: str, chunks: List[Dict[str, Any]]) -> Tuple[str, List[Dict[str, Any]]]:
    """
    검색된 청크를 기반으로 응답 생성
    
    Args:
        query: 사용자 질의
        chunks: 검색된 문서 청크 목록
        
    Returns:
        생성된 응답, 참조 소스 목록
    """
    try:
        logger.info(f"질의에 대한 응답 생성 중: {query}")
        
        # API 키가 없는 경우 모의 응답 반환
        if not openai.api_key:
            logger.warning("OpenAI API 키가 설정되지 않았습니다. 모의 응답을 반환합니다.")
            mock_answer = f"[모의 응답 모드] 질의: '{query}'에 대한 응답입니다.\n\n"
            
            for i, chunk in enumerate(chunks):
                if i < 2:  # 처음 두 청크만 사용
                    content_preview = chunk["content"][:100] + "..." if len(chunk["content"]) > 100 else chunk["content"]
                    mock_answer += f"문서 {i+1}의 정보에 따르면: {content_preview}\n\n"
            
            mock_answer += f"(Document 1:{chunks[0]['section'] if chunks else '섹션 없음'})"
            
            sources = extract_sources(mock_answer, chunks)
            logger.info("모의 응답 생성 완료")
            return mock_answer, sources
        
        # 컨텍스트 구성
        context = ""
        for i, chunk in enumerate(chunks):
            context += f"Document {i+1}: {chunk['content']}\n\n"
        
        # 사용자 프롬프트 구성
        user_prompt = f"{context}\n\n질문: {query}"
        
        # OpenAI API 호출
        response = openai.chat.completions.create(
            model="gpt-4o",
            messages=[
                {"role": "system", "content": SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt}
            ],
            temperature=0.1,
            max_tokens=1500
        )
        
        answer = response.choices[0].message.content
        
        # 참조 추출
        sources = extract_sources(answer, chunks)
        
        logger.info(f"응답 생성 완료: {len(answer)} 자")
        return answer, sources
        
    except Exception as e:
        logger.error(f"응답 생성 중 오류 발생: {e}")
        
        # 오류 발생 시 모의 응답 반환
        mock_answer = f"[오류 발생] 질의: '{query}'에 대한 응답을 생성하는 중 오류가 발생했습니다.\n\n"
        mock_answer += f"오류 메시지: {str(e)}\n\n"
        
        if chunks:
            mock_answer += f"관련된 정보가 있습니다. (Document 1:{chunks[0]['section']})"
            
        sources = extract_sources(mock_answer, chunks)
        return mock_answer, sources

def extract_sources(answer: str, chunks: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    """
    응답에서 참조 소스 추출
    
    Args:
        answer: 생성된 응답
        chunks: 검색된 문서 청크 목록
        
    Returns:
        참조 소스 목록
    """
    try:
        # 정규식으로 참조 패턴 찾기
        # (Document X:섹션) 또는 (Document X) 형식
        references = re.findall(r'\(Document\s+(\d+)(?::([^)]+))?\)', answer)
        
        cited_sources = []
        seen_indices = set()
        
        for ref in references:
            doc_idx = int(ref[0]) - 1
            section = ref[1].strip() if len(ref) > 1 and ref[1].strip() else None
            
            if doc_idx < 0 or doc_idx >= len(chunks):
                continue
                
            if doc_idx not in seen_indices:
                source = {
                    "file_path": chunks[doc_idx]["file_path"],
                    "section": chunks[doc_idx]["section"],
                    "content": chunks[doc_idx]["content"][:150] + "..." if len(chunks[doc_idx]["content"]) > 150 else chunks[doc_idx]["content"]
                }
                
                if section:
                    source["cited_section"] = section
                    
                cited_sources.append(source)
                seen_indices.add(doc_idx)
        
        # 명시적 참조가 없으면 사용된 모든 청크를 참조로 추가
        if not cited_sources:
            for i, chunk in enumerate(chunks):
                if i < 3:  # 최대 3개 청크만 표시
                    source = {
                        "file_path": chunk["file_path"],
                        "section": chunk["section"],
                        "content": chunk["content"][:150] + "..." if len(chunk["content"]) > 150 else chunk["content"]
                    }
                    cited_sources.append(source)
        
        return cited_sources
        
    except Exception as e:
        logger.error(f"참조 추출 중 오류 발생: {e}")
        return [] 