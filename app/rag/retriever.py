"""
RAG Retriever 모듈

벡터 데이터베이스(Weaviate)에서 관련 문서 청크를 검색하는 모듈
"""

import os
import logging
import json
import random
from typing import List, Dict, Any, Optional
import weaviate
from weaviate.auth import AuthApiKey
import openai
from dotenv import load_dotenv

# 환경 변수 로드
load_dotenv()

# OpenAI API 키 설정
openai.api_key = os.getenv("OPENAI_API_KEY")

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Weaviate 스키마 정의
WEAVIATE_SCHEMA = {
    "classes": [
        {
            "class": "ChristmasDocument",
            "description": "Christmas 프로젝트 문서 청크",
            "vectorizer": "text2vec-openai",
            "moduleConfig": {
                "text2vec-openai": {
                    "model": "text-embedding-ada-002",
                    "modelVersion": "002",
                    "type": "text"
                }
            },
            "properties": [
                {
                    "name": "content",
                    "dataType": ["text"],
                    "description": "문서 청크 내용"
                },
                {
                    "name": "file_path",
                    "dataType": ["string"],
                    "description": "원본 파일 경로"
                },
                {
                    "name": "section",
                    "dataType": ["string"],
                    "description": "문서 섹션"
                },
                {
                    "name": "chunk_id",
                    "dataType": ["int"],
                    "description": "청크 ID"
                },
                {
                    "name": "metadata",
                    "dataType": ["text"],
                    "description": "추가 메타데이터"
                }
            ]
        }
    ]
}

class MockRetriever:
    """모의 검색기 클래스 - API 키가 없을 때 사용"""
    
    def __init__(self):
        """초기화"""
        logger.info("모의 검색기 초기화")
        self.documents = []
        
        # 모의 문서 데이터 생성
        self._create_mock_documents()
    
    def _create_mock_documents(self):
        """모의 문서 데이터 생성"""
        # docs 디렉토리의 마크다운 파일 목록 (실제 존재하는 파일들)
        example_files = [
            "docs/01. Christmas_plan.md",
            "docs/02. christmas_requirement.md",
            "docs/03. christmas_userflow.md",
            "docs/09. christmas_project-structure.md",
            "docs/10. christmas_dependency-management.md",
            "docs/11. christmas_code-quality.md",
            "docs/12. christmas_test-strategy.md",
            "docs/19. christmas_RAG.md",
            "docs/20. christmas_Refactoring Governance.md"
        ]
        
        # 가상의 섹션 이름
        sections = [
            "개요", "목표", "아키텍처", "구현 방법", "모듈 구조", 
            "테스트 전략", "배포 전략", "보안 지침", "성능 최적화"
        ]
        
        # 가상의 콘텐츠 내용
        content_templates = [
            "Christmas 프로젝트는 Docker 기반의 {purpose} 시스템입니다.",
            "{module_name} 모듈은 {function}을 담당합니다.",
            "{strategy_name} 전략을 사용하여 {goal}을 달성합니다.",
            "이 구조는 {benefit}의 장점이 있습니다.",
            "{technology} 기술을 활용하여 {feature}을 구현했습니다."
        ]
        
        # 가상의 콘텐츠 변수
        substitutions = {
            "purpose": ["자동 매매", "데이터 수집", "신호 생성", "위험 관리"],
            "module_name": ["Auth", "Ingestion", "Signal", "Order", "Risk", "Notification"],
            "function": ["인증", "데이터 수집", "신호 생성", "주문 실행", "위험 관리", "알림 전송"],
            "strategy_name": ["스켈핑", "모멘텀", "평균 회귀", "기술적 분석"],
            "goal": ["수익 최대화", "위험 최소화", "자동화", "실시간 대응"],
            "benefit": ["유지보수성", "확장성", "성능", "보안성"],
            "technology": ["FastAPI", "Redis", "TimescaleDB", "WebSocket", "Docker"],
            "feature": ["실시간 데이터 처리", "자동 매매", "신호 생성", "위험 관리"]
        }
        
        # 모의 문서 생성
        for i in range(20):
            file_path = random.choice(example_files)
            section = random.choice(sections)
            
            # 콘텐츠 생성
            template = random.choice(content_templates)
            content = template
            
            # 변수 치환
            for key, values in substitutions.items():
                if f"{{{key}}}" in content:
                    content = content.replace(f"{{{key}}}", random.choice(values))
                    
            # 추가 콘텐츠 생성 (더 긴 콘텐츠)
            additional_content = ""
            for _ in range(3):
                try:
                    additional_template = random.choice(content_templates)
                    formatted_content = additional_template
                    for k, v in substitutions.items():
                        if f"{{{k}}}" in additional_template:
                            formatted_content = formatted_content.replace(f"{{{k}}}", random.choice(v))
                    additional_content += formatted_content + "\n\n"
                except Exception as e:
                    logger.warning(f"추가 콘텐츠 생성 중 오류: {e}")
                    continue
            
            content = f"{content}\n\n{additional_content}"
            
            # 문서 추가
            self.documents.append({
                "content": content,
                "file_path": file_path,
                "section": section,
                "chunk_id": i,
                "metadata": json.dumps({
                    "timestamp": "2025-05-11T00:00:00Z",
                    "tokens": len(content.split())
                }),
                "score": random.uniform(0.7, 0.99),
                "id": f"mock-id-{i}"
            })
            
        logger.info(f"{len(self.documents)}개의 모의 문서 생성 완료")
    
    def search(self, query: str, limit: int = 5, min_score: float = 0.7) -> List[Dict[str, Any]]:
        """
        모의 검색 수행
        
        Args:
            query: 검색 쿼리
            limit: 반환할 최대 결과 수
            min_score: 최소 유사도 점수
            
        Returns:
            관련 문서 청크 목록
        """
        logger.info(f"모의 검색 수행: 쿼리='{query}', 최대 결과={limit}")
        
        # 쿼리 분석 (간단하게 키워드 추출)
        keywords = [word.lower() for word in query.split() if len(word) > 3]
        
        # 모의 점수 계산 및 필터링
        results = []
        for doc in self.documents:
            # 키워드 포함 여부에 따라 스코어 조정
            base_score = doc["score"]
            keyword_matches = sum(1 for keyword in keywords if keyword in doc["content"].lower())
            adjusted_score = min(0.99, base_score + (keyword_matches * 0.05))
            
            if adjusted_score >= min_score:
                doc_copy = doc.copy()
                doc_copy["score"] = adjusted_score
                results.append(doc_copy)
        
        # 스코어 기준 정렬 및 제한
        results.sort(key=lambda x: x["score"], reverse=True)
        results = results[:limit]
        
        logger.info(f"모의 검색 결과: {len(results)}개 문서 반환")
        return results

class DocumentRetriever:
    """문서 검색기 클래스"""
    
    def __init__(self, weaviate_url: str = None, openai_api_key: str = None):
        """
        초기화
        
        Args:
            weaviate_url: Weaviate 서버 URL (기본값: 환경변수에서 가져옴)
            openai_api_key: OpenAI API 키 (기본값: 환경변수에서 가져옴)
        """
        self.weaviate_url = weaviate_url or os.getenv("WEAVIATE_URL", "http://localhost:8080")
        self.openai_api_key = openai_api_key or os.getenv("OPENAI_API_KEY")
        
        # API 키가 없으면 모의 검색기 사용
        if not self.openai_api_key:
            logger.warning("OpenAI API 키가 설정되지 않았습니다. 모의 검색기를 사용합니다.")
            self.mock_retriever = MockRetriever()
            return
            
        try:
            # Weaviate 클라이언트 초기화
            self.client = weaviate.Client(
                url=self.weaviate_url,
                auth_client_secret=AuthApiKey(api_key=self.openai_api_key) if self.openai_api_key else None,
                additional_headers={
                    "X-OpenAI-Api-Key": self.openai_api_key
                }
            )
            
            # 스키마 확인 및 생성
            self._ensure_schema()
            logger.info("DocumentRetriever 초기화 완료")
            
        except Exception as e:
            logger.error(f"Weaviate 클라이언트 초기화 실패: {e}")
            logger.warning("모의 검색기로 대체합니다.")
            self.mock_retriever = MockRetriever()
    
    def _ensure_schema(self):
        """스키마가 없으면 생성"""
        try:
            schema = self.client.schema.get()
            existing_classes = [cls["class"] for cls in schema["classes"]] if "classes" in schema else []
            
            if "ChristmasDocument" not in existing_classes:
                logger.info("Weaviate 스키마 생성 중...")
                self.client.schema.create(WEAVIATE_SCHEMA)
                logger.info("Weaviate 스키마 생성 완료")
        except Exception as e:
            logger.error(f"스키마 확인/생성 중 오류 발생: {e}")
            raise
    
    def search(self, query: str, limit: int = 5, min_score: float = 0.7) -> List[Dict[str, Any]]:
        """
        쿼리와 관련된 문서 청크 검색
        
        Args:
            query: 검색 쿼리
            limit: 반환할 최대 결과 수
            min_score: 최소 유사도 점수
            
        Returns:
            관련 문서 청크 목록
        """
        # API 키가 없거나 Weaviate 연결 실패 시 모의 검색 사용
        if not hasattr(self, 'client'):
            return self.mock_retriever.search(query, limit, min_score)
            
        try:
            logger.info(f"검색 쿼리: {query}, 최대 결과: {limit}")
            
            # nearText 쿼리 수행
            result = (
                self.client.query
                .get("ChristmasDocument", ["content", "file_path", "section", "chunk_id", "metadata"])
                .with_near_text({"concepts": [query]})
                .with_additional(["score", "id"])
                .with_limit(limit)
                .do()
            )
            
            # 결과 처리
            if "data" in result and "Get" in result["data"] and "ChristmasDocument" in result["data"]["Get"]:
                chunks = result["data"]["Get"]["ChristmasDocument"]
                
                # 최소 점수 필터링
                filtered_chunks = [
                    {
                        "content": chunk["content"],
                        "file_path": chunk["file_path"],
                        "section": chunk["section"],
                        "chunk_id": chunk["chunk_id"],
                        "metadata": chunk.get("metadata", ""),
                        "score": chunk["_additional"]["score"],
                        "id": chunk["_additional"]["id"]
                    }
                    for chunk in chunks
                    if chunk["_additional"]["score"] >= min_score
                ]
                
                logger.info(f"검색 결과: {len(filtered_chunks)}개 청크 발견")
                return filtered_chunks
            
            logger.warning("검색 결과가 없습니다.")
            return []
            
        except Exception as e:
            logger.error(f"검색 중 오류 발생: {e}. 모의 검색으로 대체합니다.")
            return self.mock_retriever.search(query, limit, min_score)

def get_document_retriever() -> DocumentRetriever:
    """DocumentRetriever 인스턴스 반환 (싱글톤 패턴)"""
    if not hasattr(get_document_retriever, "instance"):
        get_document_retriever.instance = DocumentRetriever()
    return get_document_retriever.instance 