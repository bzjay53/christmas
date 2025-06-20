# Christmas 자주 묻는 질문 (FAQ)

이 문서는 Christmas 플랫폼에 대해 자주 묻는 질문과 답변을 제공합니다.

## 목차

1. [일반 질문](#일반-질문)
2. [시스템 요구사항](#시스템-요구사항)
3. [설치 및 설정](#설치-및-설정)
4. [기능 관련](#기능-관련)
5. [문제 해결](#문제-해결)
6. [보안 관련](#보안-관련)
7. [성능 및 최적화](#성능-및-최적화)
8. [업데이트 및 유지보수](#업데이트-및-유지보수)

## 일반 질문

### Q: Christmas 플랫폼은 무엇인가요?

A: Christmas는 Docker 컨테이너 기반의 초단타(스켈핑) 자동 매매 플랫폼입니다. 모든 매수·매도에서 실패 없이 이익을 실현(100% Win-Rate)하는 것을 목표로 합니다. 실시간 데이터 수집, 신호 생성, 전략 실행, 위험 관리, 모니터링, 알림 등의 기능을 포함하고 있습니다.

### Q: 어떤 금융 상품을 거래할 수 있나요?

A: Christmas 플랫폼은 주로 주식, ETF, 선물, 옵션 등의 금융 상품을 거래할 수 있도록 설계되었습니다. 국내 주식시장을 중심으로 지원하며, 증권사 API를 통해 연동됩니다.

### Q: Christmas는 오픈소스인가요?

A: 현재 Christmas는 비공개 프로젝트이지만, 일부 모듈은 오픈소스로 제공될 수 있습니다. 자세한 라이선스 정보는 프로젝트 문서를 참조하세요.

## 시스템 요구사항

### Q: 최소 하드웨어 요구사항은 무엇인가요?

A: 최소 하드웨어 요구사항은 다음과 같습니다:
- CPU: 4코어 이상
- RAM: 8GB 이상
- 디스크: 100GB SSD
- 네트워크: 안정적인 인터넷 연결 (최소 10Mbps)

실시간 거래와 대용량 데이터 처리를 위해서는 더 높은 사양을 권장합니다:
- CPU: 8코어 이상
- RAM: 16GB 이상
- 디스크: 500GB SSD 이상

### Q: 어떤 운영체제를 지원하나요?

A: Christmas는 Docker 기반으로 구축되어 다음 운영체제를 지원합니다:
- Linux (Ubuntu 20.04 LTS 이상 권장)
- Windows 10 Pro 이상 (Docker Desktop과 WSL2 사용)
- macOS (Intel 및 Apple Silicon)

### Q: 클라우드 환경에서 실행할 수 있나요?

A: 네, AWS, GCP, Azure 등의 클라우드 환경에서 실행할 수 있습니다. 컨테이너 오케스트레이션 도구(Kubernetes, ECS 등)와도 호환됩니다.

## 설치 및 설정

### Q: Docker 없이 설치할 수 있나요?

A: 가능하지만 권장하지 않습니다. Docker 없이 설치하려면 Python 3.10 이상, PostgreSQL 14 이상, Redis 7.0 이상 등을 직접 설치해야 합니다. 자세한 방법은 설치 가이드의 "수동 설치" 섹션을 참조하세요.

### Q: 설치 중 "docker-compose: command not found" 오류가 발생합니다. 어떻게 해결하나요?

A: Docker Compose가 설치되지 않았거나 PATH에 추가되지 않은 경우 발생합니다. 다음 명령으로 Docker Compose를 설치하세요:

Windows PowerShell:
```powershell
# Docker Desktop을 설치하면 Docker Compose가 함께 설치됩니다.
```

Linux:
```bash
sudo curl -L "https://github.com/docker/compose/releases/download/v2.24.3/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose
```

### Q: 증권사 API 연결은 어떻게 설정하나요?

A: 증권사 API 연결을 위해 다음 단계를 따르세요:

1. 증권사에서 API 키(앱 키, 비밀 키)를 발급받습니다.
2. `.env` 파일에 API 키 정보를 추가합니다:
   ```
   KIS_APP_KEY=your_app_key
   KIS_APP_SECRET=your_app_secret
   KIS_ACCOUNT_NUMBER=your_account_number
   ```
3. 애플리케이션을 재시작합니다:
   ```powershell
   docker-compose restart
   ```

## 기능 관련

### Q: 어떤 트레이딩 전략을 지원하나요?

A: Christmas는 다음과 같은 트레이딩 전략을 기본적으로 제공합니다:
- 초단타(스켈핑) 전략
- 볼린저 밴드 기반 전략
- 이동평균선 교차 전략
- 상대강도지수(RSI) 전략
- 추세 추종 전략

또한 사용자 정의 전략을 Python 코드로 작성하여 추가할 수 있습니다.

### Q: 백테스팅은 어떻게 수행하나요?

A: 백테스팅은 다음 단계로 수행할 수 있습니다:

1. 웹 인터페이스에서 "백테스트" 메뉴로 이동합니다.
2. 테스트할 전략을 선택하거나 새로 생성합니다.
3. 백테스트 기간, 종목, 초기 자본 등의 파라미터를 설정합니다.
4. "백테스트 실행" 버튼을 클릭합니다.
5. 결과 페이지에서 성과 지표, 차트, 거래 내역을 확인합니다.

### Q: 알림 설정은 어떻게 하나요?

A: 알림 설정은 다음과 같이 할 수 있습니다:

1. 웹 인터페이스에서 "설정" > "알림 설정" 메뉴로 이동합니다.
2. 텔레그램 봇 연동을 위해 봇 토큰과 채팅 ID를 입력합니다.
3. 알림 유형별로 활성화 여부를 설정합니다:
   - 거래 실행 알림
   - 이익/손실 알림
   - 시스템 상태 알림
   - 시장 이벤트 알림
4. "저장" 버튼을 클릭합니다.

### Q: 여러 계정으로 거래할 수 있나요?

A: 네, 여러 계정으로 거래할 수 있습니다. 다음과 같이 설정하세요:

1. 웹 인터페이스에서 "설정" > "계정 관리" 메뉴로 이동합니다.
2. "계정 추가" 버튼을 클릭합니다.
3. 계정 이름, API 키, 비밀 키, 계좌 번호를 입력합니다.
4. 전략 설정 시 사용할 계정을 선택합니다.

## 문제 해결

### Q: 실시간 데이터가 수신되지 않습니다. 어떻게 해결하나요?

A: 다음 단계로 문제를 확인하고 해결할 수 있습니다:

1. 증권사 API 연결 상태 확인:
   ```powershell
   docker-compose logs ingestion | findstr "connection"
   ```
2. API 키의 유효성 및 권한 확인
3. 네트워크 방화벽 설정 확인
4. 웹소켓 서비스 재시작:
   ```powershell
   docker-compose restart ingestion
   ```

자세한 문제 해결은 [문제 해결 가이드](troubleshooting_guide.md)를 참조하세요.

### Q: Docker 컨테이너가 갑자기 중지되었습니다. 어떻게 해야 하나요?

A: 컨테이너 로그를 확인하고 원인을 파악한 후 재시작하세요:

```powershell
# 로그 확인
docker-compose logs

# 컨테이너 재시작
docker-compose up -d
```

메모리 부족이 원인인 경우 `docker-compose.yml` 파일의 메모리 제한을 조정하세요.

### Q: 데이터베이스 오류가 발생합니다. 어떻게 복구할 수 있나요?

A: 다음 단계에 따라 데이터베이스 문제를 해결하세요:

1. 데이터베이스 로그 확인:
   ```powershell
   docker-compose logs timescaledb
   ```
2. 데이터베이스 서비스 재시작:
   ```powershell
   docker-compose restart timescaledb
   ```
3. 문제가 지속되면 데이터베이스 백업에서 복원:
   ```powershell
   docker-compose exec timescaledb psql -U christmas -d christmas -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE pid <> pg_backend_pid();"
   docker-compose exec -T timescaledb pg_restore -U christmas -d christmas < /path/to/backup.dump
   ```

## 보안 관련

### Q: API 키는 어떻게 안전하게 관리되나요?

A: API 키는 다음과 같은 방법으로 안전하게 관리됩니다:

1. 환경 변수로 저장되며 애플리케이션 코드나 로그에 직접 노출되지 않습니다.
2. 데이터베이스에 저장될 때는 AES-256 암호화를 사용합니다.
3. 메모리에 로드될 때만 복호화되며, 사용 후 즉시 메모리에서 삭제됩니다.
4. HTTPS/TLS를 통해서만 API와 통신합니다.

### Q: 시스템 접근 제어는 어떻게 구성되나요?

A: Christmas 플랫폼은 다중 계층 접근 제어를 제공합니다:

1. 웹 인터페이스: 사용자명/비밀번호 및 2FA(Two-Factor Authentication) 지원
2. API 엔드포인트: API 키 및 JWT 토큰 기반 인증
3. 데이터베이스: 역할 기반 접근 제어
4. 컨테이너: 최소 권한 원칙 적용
5. 네트워크: 방화벽 및 보안 그룹으로 제한

## 성능 및 최적화

### Q: 시스템 성능을 최적화하려면 어떻게 해야 하나요?

A: 다음과 같은 방법으로 성능을 최적화할 수 있습니다:

1. 하드웨어 리소스 증가 (특히 RAM과 CPU)
2. 데이터베이스 인덱싱 최적화:
   ```powershell
   docker-compose exec timescaledb psql -U christmas -d christmas -c "VACUUM ANALYZE;"
   ```
3. TimescaleDB 청크 간격 조정 (기본 7일에서 용도에 맞게 변경)
4. 불필요한 로깅 제한:
   ```
   CHRISTMAS_LOG_LEVEL=warning
   ```
5. 필요한 데이터만 수집하도록 설정

자세한 내용은 [성능 최적화 가이드](../15.%20Performance%20Optimization%20Guide.md)를 참조하세요.

### Q: 얼마나 많은 종목을 동시에 모니터링할 수 있나요?

A: 하드웨어 성능과 네트워크 상태에 따라 다르지만, 일반적인 권장 사항은 다음과 같습니다:

- 권장 시스템 사양(8코어, 16GB RAM)에서는 최대 100개 종목을 1분 간격으로 모니터링할 수 있습니다.
- 초단타 거래(초 단위 모니터링)는 리소스 소비가 많으므로 이 경우 20-30개 종목으로 제한하는 것이 좋습니다.
- 성능 문제가 발생하면 모니터링 간격을 늘리거나 종목 수를 줄이세요.

## 업데이트 및 유지보수

### Q: 시스템을 어떻게 업데이트하나요?

A: 다음 단계로 Christmas 플랫폼을 업데이트할 수 있습니다:

1. 최신 코드를 가져옵니다:
   ```powershell
   git pull origin main
   ```

2. Docker 이미지를 재빌드합니다:
   ```powershell
   docker-compose build
   ```

3. 마이그레이션(필요한 경우):
   ```powershell
   docker-compose run --rm api python -m app.db.migrations
   ```

4. 서비스를 재시작합니다:
   ```powershell
   docker-compose down
   docker-compose up -d
   ```

주요 버전 업데이트의 경우 반드시 데이터베이스 백업을 먼저 수행하세요.

### Q: 정기적인 유지보수는 어떻게 해야 하나요?

A: 다음과 같은 정기적인 유지보수 작업을 권장합니다:

1. 데이터베이스 백업 (매일):
   ```powershell
   docker-compose exec timescaledb pg_dump -U christmas -d christmas > backup_$(date +%Y%m%d).sql
   ```

2. 로그 관리 (매주):
   ```powershell
   # 로그 파일 압축 및 보관
   docker-compose logs > logs_$(date +%Y%m%d).txt
   ```

3. 디스크 정리 (매월):
   ```powershell
   docker system prune -a --volumes
   ```

4. 보안 업데이트 적용 (분기별):
   ```powershell
   docker-compose pull
   docker-compose build --no-cache
   docker-compose up -d
   ```

### Q: 데이터 백업은 어떻게 수행하나요?

A: 다음 명령으로 데이터베이스를 백업할 수 있습니다:

```powershell
# 전체 데이터베이스 백업
docker-compose exec timescaledb pg_dump -U christmas -d christmas -F c -f /tmp/backup.dump
docker cp $(docker-compose ps -q timescaledb):/tmp/backup.dump ./backups/

# 특정 테이블만 백업
docker-compose exec timescaledb pg_dump -U christmas -d christmas -t market_data -F c -f /tmp/market_data_backup.dump
docker cp $(docker-compose ps -q timescaledb):/tmp/market_data_backup.dump ./backups/
```

백업은 최소 매일 수행하고, 중요 변경 전에는 항상 백업을 수행하세요. 