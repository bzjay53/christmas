# Christmas 프로젝트 베타 테스트 환경용 Dockerfile
# 버전: 0.2.0-beta.1

FROM python:3.10-slim AS builder

WORKDIR /app

# 빌드 도구 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    curl \
    build-essential \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 필요한 Python 패키지 설치
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 성능 최적화 및 모니터링 도구 설치
RUN pip install --no-cache-dir \
    py-spy \
    ddtrace \
    opentelemetry-api \
    opentelemetry-sdk \
    opentelemetry-exporter-jaeger \
    memory-profiler \
    sentry-sdk

# 최종 이미지
FROM python:3.10-slim

WORKDIR /app

# 런타임 필수 패키지 설치
RUN apt-get update && apt-get install -y --no-install-recommends \
    curl \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# 빌더 이미지에서 설치된 패키지 복사
COPY --from=builder /usr/local/lib/python3.10/site-packages /usr/local/lib/python3.10/site-packages
COPY --from=builder /usr/local/bin /usr/local/bin

# 애플리케이션 소스 코드 복사
COPY . .

# 베타 환경 설정
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PYTHONPATH=/app \
    CHRISTMAS_ENV=beta \
    CHRISTMAS_VERSION=0.2.0-beta.1 \
    OPENTELEMETRY_ENABLED=true \
    SENTRY_ENABLED=true

# 헬스체크 스크립트 추가
COPY environments/beta/healthcheck.sh /app/healthcheck.sh
RUN chmod +x /app/healthcheck.sh

HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 CMD [ "/app/healthcheck.sh" ]

# 컨테이너 실행 시 기본 명령
CMD ["python", "-m", "app.api.main"] 