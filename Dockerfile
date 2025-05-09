# Build Stage
FROM python:3.10-slim AS builder

WORKDIR /app

# 빌드 종속성 및 TA-Lib 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    gcc \
    wget \
    make \
    && rm -rf /var/lib/apt/lists/*

# TA-Lib 설치
RUN wget http://prdownloads.sourceforge.net/ta-lib/ta-lib-0.4.0-src.tar.gz && \
    tar -xzf ta-lib-0.4.0-src.tar.gz && \
    cd ta-lib/ && \
    ./configure --prefix=/usr && \
    make && \
    make install && \
    cd .. && \
    rm -rf ta-lib ta-lib-0.4.0-src.tar.gz

# Poetry 설치
RUN pip install --no-cache-dir poetry==1.6.1

# Poetry 설정: 가상 환경 사용 안함
RUN poetry config virtualenvs.create false

# 의존성 먼저 복사하여 캐싱 활용
COPY pyproject.toml poetry.lock* ./
RUN poetry install --no-dev --no-interaction --no-ansi

# Runtime Stage
FROM python:3.10-slim

WORKDIR /app

# 필요한 런타임 패키지 설치 및 TA-Lib 라이브러리 복사
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# TA-Lib 공유 라이브러리 복사
COPY --from=builder /usr/lib/libta_lib* /usr/lib/
RUN ldconfig

# 보안을 위한 비루트 사용자 생성
RUN groupadd -g 1000 appuser && \
    useradd -u 1000 -g appuser -s /bin/bash -m appuser

# Builder 스테이지에서 설치된 패키지 복사
COPY --from=builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# 애플리케이션 코드 복사
COPY --chown=appuser:appuser . .

# 비루트 사용자로 전환
USER appuser

# 애플리케이션 실행
CMD ["uvicorn", "app.api.main:app", "--host", "0.0.0.0", "--port", "8000"]

# 컨테이너 메타데이터
LABEL maintainer="Your Name <your.email@example.com>" \
      version="0.1.0" \
      description="Christmas - 초단타 자동 매매 플랫폼" 