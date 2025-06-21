## 프로젝트 개요  
“Christmas”는 Docker 컨테이너 기반의 초단타(스켈핑) 자동 매매 플랫폼으로, **모든 매수·매도에서 실패 없이 이익을 실현(100% Win-Rate)**하는 것을 목표로 합니다. 데이터 수집·분석·주문 실행 모듈을 마이크로서비스화하고, Vercel 서버리스 웹 UI 및 Python Telegram Bot을 연동하여 실시간 차트·매매 현황·코드 업로드 기능을 제공합니다.

## 1. 목표 및 정의  
- **100% Win-Rate**: 모든 트레이드에서 손실 없이 이익을 보장하는 자동화 전략 구축 :contentReference[oaicite:1]{index=1}.  
- **스켈핑 전략**: RSI(14), MACD(12,26,9), 볼린저 밴드(20σ±2) 기반의 1분 이하 초단타 매매로 다수의 작은 이익을 확보 :contentReference[oaicite:2]{index=2}.  
- **컨테이너화**: Docker 멀티스테이지 빌드로 빌드·런타임 분리, 이미지 크기 최소화 :contentReference[oaicite:3]{index=3}.  
- **서버리스 호스팅**: Vercel Python Functions(Flask/FastAPI)로 백엔드 및 React SPA 배포 :contentReference[oaicite:4]{index=4}.  
- **실시간 알림**: `python-telegram-bot` 라이브러리로 매매 이벤트·오류 알림 :contentReference[oaicite:5]{index=5}.  
- **CI/CD**: GitHub Actions → Docker Hub → Vercel 배포 파이프라인 자동화 :contentReference[oaicite:6]{index=6}.

## 2. 시스템 아키텍처  
```mermaid
flowchart LR
  subgraph "데이터 레이어"
    A["증권사 API 클라이언트"] --> B["Redis (Sorted Set)"]
    B --> C["TimescaleDB (Hypertable)"]
  end
  subgraph "분석/실행 레이어"
    C -->|틱·OHLC| D["분석 엔진 (RSI/MACD/Bollinger)"]
    D -->|매매 신호| E["전략 실행기"]
    E -->|주문 요청| A
  end
  subgraph "알림 레이어"
    E --> F["Telegram Bot"]
  end
  subgraph "프레젠테이션 레이어"
    D --> G["Vercel Functions (FastAPI)"]
    G --> H["React SPA (실시간 차트)"]
  end
  subgraph "CI/CD"
    I["GitHub Actions"] --> J["Docker Hub"]
    J --> K["Vercel 배포"]
  end
````

## 3. 컨테이너 설정 (Docker)

1. **베이스 이미지**: `python:3.10-slim` 사용, 보안 패치 포함 및 멀티스테이지 빌드 권장 ([Docker Documentation](https://docs.docker.com/build/building/multi-stage/?utm_source=chatgpt.com "Multi-stage builds - Docker Docs")).
    
2. **Dockerfile**:
    
    ```dockerfile
    # Build Stage
    FROM python:3.10-slim AS builder
    WORKDIR /app
    COPY requirements.txt .
    RUN pip install --user -r requirements.txt
    
    # Runtime Stage
    FROM python:3.10-slim
    WORKDIR /app
    COPY --from=builder /root/.local /root/.local
    ENV PATH=/root/.local/bin:$PATH
    COPY . .
    CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
    ```
    
    - 멀티스테이지로 빌드 도구를 분리하여 최종 이미지 크기 최소화 ([Docker Documentation](https://docs.docker.com/get-started/docker-concepts/building-images/multi-stage-builds/?utm_source=chatgpt.com "Multi-stage builds | Docker Docs")).
        
3. **Docker Compose**: Redis, TimescaleDB, 전략 실행기, FastAPI, Telegram Bot을 각기 컨테이너로 정의 ([Docker Documentation](https://docs.docker.com/get-started/docker-concepts/running-containers/multi-container-applications/?utm_source=chatgpt.com "Multi-container applications - Docker Docs")).
    

## 4. 데이터 저장소

- **TimescaleDB**:
    
    - 하이퍼테이블 `ticks(time TIMESTAMPTZ, symbol TEXT, price NUMERIC, volume BIGINT)` 생성 ([Timescale documentation](https://docs.timescale.com/use-timescale/latest/hypertables/create/?utm_source=chatgpt.com "Create hypertables - Timescale documentation")).
        
    - `SELECT create_hypertable('ticks', 'time')`로 시계열 데이터 분할 저장 ([Timescale documentation](https://docs.timescale.com/api/latest/hypertable/create_hypertable/?utm_source=chatgpt.com "create_hypertable() Create a hypertable - Timescale documentation")).
        
- **Redis (Sorted Set)**:
    
    - 틱 데이터 점수를 타임스탬프로, 멤버를 가격·볼륨 JSON으로 저장 ([Redis](https://redis.io/docs/latest/develop/data-types/sorted-sets/?utm_source=chatgpt.com "Redis sorted sets | Docs")).
        

## 5. 백엔드 (FastAPI)

- **프로젝트 구조**:
    
    ```
    app/
      auth/
      ingestion/
      analysis/
      execution/
      notification/
      api/  # FastAPI 라우터
    ```
    
- **배포**: Vercel Functions로 `api/` 디렉토리 내 FastAPI 핸들러 배포 ([FastAPI](https://fastapi.tiangolo.com/deployment/docker/?utm_source=chatgpt.com "FastAPI in Containers - Docker")).
    
- **생산 환경**: Uvicorn 워커 사용 없이 단일 프로세스 권장 (Kubernetes 환경 대비) ([FastAPI](https://fastapi.tiangolo.com/deployment/server-workers/?utm_source=chatgpt.com "Server Workers - Uvicorn with Workers - FastAPI")).
    

## 6. 프론트엔드 (React SPA)

- **핵심 화면**:
    
    - 랜딩 페이지: 프로젝트 소개 및 로그인
        
    - 메인 대시보드: 실시간 차트(Recharts), 포지션 현황
        
    - 코드 업로드: 전략 스크립트·설정 파일 제출
        
- **호스팅**: Vercel로 정적 파일 배포 및 API 프록시 설정 ([Docker Documentation](https://docs.docker.com/get-started/docker-concepts/building-images/multi-stage-builds/?utm_source=chatgpt.com "Multi-stage builds | Docker Docs")).
    

## 7. 알림 (Telegram Bot)

- **라이브러리**: `python-telegram-bot` v22 이상 권장 ([GitHub](https://github.com/python-telegram-bot/python-telegram-bot?utm_source=chatgpt.com "python-telegram-bot/python-telegram-bot: We have made ... - GitHub")).
    
- **기본 예제**:
    
    ```python
    from telegram.ext import ApplicationBuilder, CommandHandler
    
    async def start(update, context):
        await update.message.reply_text("Bot started!")
    
    app = ApplicationBuilder().token("YOUR_TOKEN").build()
    app.add_handler(CommandHandler("start", start))
    app.run_polling()
    ```
    
- **통합**: 전략 실행기에서 이벤트 발생 시 `bot.send_message(chat_id, text)` 호출 ([docs.python-telegram-bot.org](https://docs.python-telegram-bot.org/en/stable/examples.html?utm_source=chatgpt.com "Examples - python-telegram-bot v22.0")).
    

## 8. CI/CD 파이프라인

1. **Lint & Test**: Python 린트(`flake8`), 유닛/통합 테스트(`pytest`) 실행 ([Docker Documentation](https://docs.docker.com/build/building/best-practices/?utm_source=chatgpt.com "Building best practices - Docker Docs")).
    
2. **Build & Push**: Docker 이미지 빌드 → Docker Hub 푸시 ([Docker Documentation](https://docs.docker.com/build/building/best-practices/?utm_source=chatgpt.com "Building best practices - Docker Docs")).
    
3. **Deploy**: GitHub Actions `vercel` 액션으로 Vercel 자동 배포 ([Docker Documentation](https://docs.docker.com/get-started/docker-concepts/building-images/multi-stage-builds/?utm_source=chatgpt.com "Multi-stage builds | Docker Docs")).
    

## 9. 로드맵 & 마일스톤

|단계|기간|산출물|
|---|---|---|
|Phase 1|2주|Docker Compose 환경, Redis·TimescaleDB 연결 ([Docker Documentation](https://docs.docker.com/get-started/docker-concepts/running-containers/multi-container-applications/?utm_source=chatgpt.com "Multi-container applications - Docker Docs"))|
|Phase 2|1개월|기술 분석 엔진(RSI/MACD/Bollinger) + 백테스트|
|Phase 3|1개월|전략 실행기 + Telegram Bot 통합 ([docs.python-telegram-bot.org](https://docs.python-telegram-bot.org/en/stable/examples.html?utm_source=chatgpt.com "Examples - python-telegram-bot v22.0"))|
|Phase 4|2주|React SPA + FastAPI 서버리스 배포 ([Docker Documentation](https://docs.docker.com/get-started/docker-concepts/building-images/multi-stage-builds/?utm_source=chatgpt.com "Multi-stage builds \| Docker Docs"))|
|Phase 5|지속|모니터링(Prometheus, Sentry), CI/CD 최적화|

## 10. 성공 지표

- **승률**: 100% (실패 없는 이익 실현)
    
- **레이턴시**: 신호→주문 <100ms
    
- **가용성**: 99.9% 이상
    
- **배포 리드타임**: 커밋→프로덕션 <10분 ([Docker Documentation](https://docs.docker.com/build/building/best-practices/?utm_source=chatgpt.com "Building best practices - Docker Docs")).
    
