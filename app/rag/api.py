"""
RAG API 엔드포인트

문서 검색 및 질의 처리를 위한 FastAPI 엔드포인트
"""

import logging
from typing import List, Dict, Any, Optional

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from pydantic import BaseModel, Field
from fastapi.middleware.cors import CORSMiddleware

from app.rag.retriever import get_document_retriever
from app.rag.generator import generate_response
from app.rag.indexer import index_directory, get_indexed_status

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# FastAPI 앱 초기화
app = FastAPI(
    title="Christmas RAG API",
    description="Retrieval-Augmented Generation API for Christmas Project",
    version="0.1.0",
)

# CORS 설정
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 요청 모델
class QueryRequest(BaseModel):
    query: str = Field(..., description="사용자 질의")
    max_chunks: int = Field(5, description="검색할 최대 청크 수")
    min_score: float = Field(0.7, description="최소 유사도 점수")

# 응답 모델
class QueryResponse(BaseModel):
    answer: str = Field(..., description="생성된 응답")
    sources: List[Dict[str, Any]] = Field(..., description="참조 소스 목록")
    chunks: List[Dict[str, Any]] = Field(..., description="검색된 청크 목록")

class IndexRequest(BaseModel):
    directory: str = Field("docs", description="색인할 디렉토리 경로")
    file_extensions: List[str] = Field(["md"], description="색인할 파일 확장자")

class StatusResponse(BaseModel):
    status: str
    indexed_files: int
    total_chunks: int
    last_updated: Optional[str] = None

@app.get("/")
async def read_root():
    """루트 엔드포인트: API 정보 반환"""
    return {
        "name": "Christmas RAG API",
        "version": "0.1.0",
        "description": "프로젝트 문서 검색 및 질의 처리 API",
        "endpoints": [
            {"path": "/query", "method": "POST", "description": "문서 기반 질의 처리"},
            {"path": "/index", "method": "POST", "description": "문서 색인 생성"},
            {"path": "/status", "method": "GET", "description": "색인 상태 확인"},
        ]
    }

@app.post("/query", response_model=QueryResponse)
async def query_documents(request: QueryRequest):
    """문서에서 정보를 검색하고 응답 생성"""
    try:
        retriever = get_document_retriever()
        chunks = retriever.search(
            query=request.query,
            limit=request.max_chunks,
            min_score=request.min_score
        )
        
        if not chunks:
            raise HTTPException(status_code=404, detail="관련 문서를 찾을 수 없습니다.")
        
        answer, sources = generate_response(request.query, chunks)
        
        return {
            "answer": answer,
            "sources": sources,
            "chunks": chunks
        }
    except Exception as e:
        logger.error(f"질의 처리 중 오류 발생: {e}")
        raise HTTPException(status_code=500, detail=f"질의 처리 중 오류 발생: {str(e)}")

@app.post("/index")
async def index_documents(request: IndexRequest, background_tasks: BackgroundTasks):
    """문서 디렉토리를 색인화"""
    try:
        # 백그라운드에서 색인 작업 실행
        background_tasks.add_task(
            index_directory,
            directory=request.directory,
            file_extensions=request.file_extensions
        )
        
        return {"status": "색인 작업이 시작되었습니다.", "directory": request.directory}
    except Exception as e:
        logger.error(f"색인 생성 중 오류 발생: {e}")
        raise HTTPException(status_code=500, detail=f"색인 생성 중 오류 발생: {str(e)}")

@app.get("/status", response_model=StatusResponse)
async def get_index_status():
    """색인 상태 확인"""
    try:
        status = get_indexed_status()
        return status
    except Exception as e:
        logger.error(f"상태 확인 중 오류 발생: {e}")
        raise HTTPException(status_code=500, detail=f"상태 확인 중 오류 발생: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000) 