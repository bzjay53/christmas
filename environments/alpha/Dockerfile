# Christmas 프로젝트 알파 테스트 환경용 Dockerfile
# 버전: 0.1.0-alpha.1

FROM python:3.10-slim

WORKDIR /app

# 패키지 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    curl \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 필요한 Python 패키지 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# RAG 관련 패키지 설치
RUN pip install --no-cache-dir tiktoken weaviate-client openai beautifulsoup4 markdown

# 애플리케이션 소스 코드 복사
COPY . .

# 환경 변수 설정
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app

# 컨테이너 실행 시 기본 명령
CMD ["python", "-m", "app.api.main"] 