# Christmas 장애 복구 가이드

## 1. 개요

이 문서는 Christmas 자동 매매 플랫폼의 장애 상황 발생 시 시스템 복구 방법을 설명합니다. 데이터 손실, 서비스 중단, 하드웨어 오류 등의 상황에서 시스템을 신속하게 복구하기 위한 절차와 도구를 다룹니다.

## 2. 장애 유형 및 대응 전략

### 2.1 장애 유형

1. **데이터베이스 장애**
   - 데이터 손상
   - 연결 실패
   - 성능 저하

2. **애플리케이션 서버 장애**
   - 메모리 부족
   - 프로세스 충돌
   - 코드 오류로 인한 서비스 중단

3. **네트워크 장애**
   - 네트워크 연결 끊김
   - 방화벽 문제
   - DNS 오류

4. **하드웨어 장애**
   - 디스크 오류
   - 서버 하드웨어 오류
   - 클라우드 인프라 문제

5. **설정 오류**
   - 구성 파일 손상
   - 잘못된 환경 변수
   - 권한 문제

### 2.2 대응 전략 개요

1. **신속한 문제 감지**
   - 모니터링 시스템을 통한 조기 경고
   - 로그 분석

2. **영향 평가**
   - 장애 범위 파악
   - 영향 받는 서비스 식별

3. **격리 및 차단**
   - 손상된 컴포넌트 격리
   - 추가 손상 방지

4. **복구 계획 실행**
   - 백업에서 복원
   - 대체 서비스 활성화
   - 설정 복구

5. **정상화 확인**
   - 시스템 무결성 검증
   - 성능 테스트

## 3. 백업 및 복구 도구

Christmas 플랫폼은 두 가지 핵심 스크립트를 제공합니다:

1. **backup.py**: 데이터베이스, 설정 파일, Redis 데이터의 백업 생성
2. **restore.py**: 백업 파일을 사용해 시스템 복구

## 4. 정기 백업 관리

### 4.1 백업 생성 방법

```powershell
# 기본 백업 실행
python scripts/backup.py

# 사용자 지정 옵션으로 백업
python scripts/backup.py --db-host localhost --db-port 5432 --backup-dir E:\backups
```

### 4.2 백업 예약

Windows 작업 스케줄러를 사용한 정기 백업 설정:

1. 작업 스케줄러 실행
2. "기본 작업 만들기..." 선택
3. 이름과 설명 입력 (예: "Christmas 일일 백업")
4. 실행 일정 설정 (예: 매일 새벽 3시)
5. 프로그램 실행 작업 선택
6. 프로그램/스크립트: `python`
7. 인수 추가: `E:\study\Business\Develope\christmas\scripts\backup.py --backup-dir E:\backups`
8. 작업 옵션 구성 및 완료

### 4.3 백업 보관 정책

기본적으로 30일간 백업 보관하며, 다음과 같이 보관 기간 설정이 가능합니다:

```powershell
# 60일간 백업 보관
python scripts/backup.py --retention-days 60
```

## 5. 시스템 복구 절차

### 5.1 데이터베이스 장애 복구

#### 5.1.1 증상 확인
- 애플리케이션 로그에서 데이터베이스 연결 오류
- 쿼리 실행 실패
- 데이터베이스 서비스 중단

#### 5.1.2 복구 절차

1. **상태 확인**:
   ```powershell
   docker-compose ps timescaledb
   docker-compose logs timescaledb
   ```

2. **컨테이너 재시작 시도**:
   ```powershell
   docker-compose restart timescaledb
   ```

3. **재시작으로 해결되지 않는 경우 백업에서 복원**:
   ```powershell
   # 사용 가능한 백업 목록 확인
   dir E:\study\Business\Develope\christmas\backups\manifest_*.json

   # 가장 최근 백업에서 복원
   python scripts/restore.py E:\study\Business\Develope\christmas\backups\manifest_20240101_120000.json
   
   # 특정 데이터베이스 호스트로 복원
   python scripts/restore.py E:\study\Business\Develope\christmas\backups\manifest_20240101_120000.json --db-host localhost --db-port 5432
   ```

4. **복원 후 검증**:
   ```powershell
   docker-compose exec timescaledb psql -U christmas -d christmas -c "SELECT COUNT(*) FROM market_data"
   ```

### 5.2 설정 파일 복구

#### 5.2.1 증상 확인
- 애플리케이션이 잘못된 설정으로 시작됨
- 로그에 구성 파일 오류 표시
- 특정 기능이 예상대로 작동하지 않음

#### 5.2.2 복구 절차

1. **현재 설정 백업**:
   ```powershell
   # 현재 설정을 별도로 백업
   copy E:\study\Business\Develope\christmas\config E:\study\Business\Develope\christmas\config_backup_manual
   ```

2. **백업에서 설정 파일 복원**:
   ```powershell
   # 검증만 수행 (실제 복원하지 않음)
   python scripts/restore.py E:\study\Business\Develope\christmas\backups\manifest_20240101_120000.json --dry-run --skip-db --skip-redis
   
   # 설정 파일만 복원
   python scripts/restore.py E:\study\Business\Develope\christmas\backups\manifest_20240101_120000.json --skip-db --skip-redis
   ```

3. **서비스 재시작**:
   ```powershell
   docker-compose down
   docker-compose up -d
   ```

### 5.3 Redis 데이터 복구

#### 5.3.1 증상 확인
- 세션 정보 손실
- 캐시 데이터 누락
- Redis 서버 연결 오류

#### 5.3.2 복구 절차

1. **Redis 상태 확인**:
   ```powershell
   docker-compose ps redis
   docker-compose logs redis
   ```

2. **백업에서 Redis 데이터 복원**:
   ```powershell
   # Redis 데이터만 복원
   python scripts/restore.py E:\study\Business\Develope\christmas\backups\manifest_20240101_120000.json --skip-db --skip-config
   ```

3. **Redis 서버 재시작**:
   ```powershell
   docker-compose restart redis
   ```

### 5.4 전체 시스템 복구

#### 5.4.1 증상 확인
- 여러 서비스 장애
- 시스템 전체 비정상 작동
- 심각한 데이터 손상

#### 5.4.2 복구 절차

1. **모든 컨테이너 중지**:
   ```powershell
   docker-compose down
   ```

2. **전체 시스템 복원**:
   ```powershell
   # 전체 복구 시작 (데이터베이스, 설정, Redis)
   python scripts/restore.py E:\study\Business\Develope\christmas\backups\manifest_20240101_120000.json
   ```

3. **서비스 재시작**:
   ```powershell
   docker-compose up -d
   ```

4. **복구 확인**:
   ```powershell
   # 서비스 상태 확인
   docker-compose ps
   
   # 로그 확인
   docker-compose logs
   ```

## 6. 특수 상황 복구

### 6.1 Docker 호스트 장애 복구

호스트 시스템 자체에 문제가 발생한 경우:

1. **새 호스트 시스템 준비**:
   - Docker 및 Docker Compose 설치
   - Git 설치

2. **코드베이스 복제**:
   ```powershell
   git clone https://github.com/your-username/christmas.git
   cd christmas
   ```

3. **백업 파일 복사**:
   - 안전한 외부 저장소에서 백업 파일 가져오기
   - 백업 디렉토리에 복사

4. **시스템 복원**:
   ```powershell
   python scripts/restore.py path/to/manifest_file.json
   ```

5. **서비스 시작**:
   ```powershell
   docker-compose up -d
   ```

### 6.2 증분 복구

특정 서비스나 데이터만 복구해야 하는 경우:

```powershell
# 데이터베이스만 복구
python scripts/restore.py path/to/manifest_file.json --skip-config --skip-redis

# 설정 파일만 복구
python scripts/restore.py path/to/manifest_file.json --skip-db --skip-redis

# Redis만 복구
python scripts/restore.py path/to/manifest_file.json --skip-db --skip-config
```

### 6.3 백업 파일 손상 시 대응

백업 파일 자체가 손상된 경우:

1. **백업 검증 실행**:
   ```powershell
   python scripts/restore.py path/to/manifest_file.json --dry-run
   ```

2. **대체 백업 사용**:
   - 이전 백업 파일로 복원 시도
   - 여러 백업 파일의 일부분만 선택적으로 사용

3. **불완전 복구**:
   - 일부라도 복구 가능한 데이터 복원
   - 수동 데이터 재구성

## 7. 고가용성 설정

### 7.1 레플리카 데이터베이스

TimescaleDB 레플리카 설정으로 고가용성 구성:

```yaml
# docker-compose.ha.yml 예시
services:
  timescaledb-master:
    image: timescale/timescaledb:latest-pg14
    volumes:
      - timescaledb-master:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: secure_password
    
  timescaledb-replica:
    image: timescale/timescaledb:latest-pg14
    volumes:
      - timescaledb-replica:/var/lib/postgresql/data
    environment:
      POSTGRES_PASSWORD: secure_password
      POSTGRES_MASTER_HOST: timescaledb-master
      POSTGRES_REPLICA_MODE: "hot_standby"
```

### 7.2 자동 장애 조치

Keepalived와 같은 도구를 사용한 자동 장애 조치 설정:

```
# keepalived.conf 예시
vrrp_script check_db {
    script "/usr/local/bin/check_postgres.sh"
    interval 2
    weight 2
}

vrrp_instance VI_1 {
    state MASTER
    interface eth0
    virtual_router_id 51
    priority 100
    advert_int 1
    authentication {
        auth_type PASS
        auth_pass secret
    }
    virtual_ipaddress {
        192.168.1.100
    }
    track_script {
        check_db
    }
}
```

## 8. 장애 복구 테스트

### 8.1 테스트 시나리오

정기적인 복구 훈련을 위한 시나리오:

1. **계획된 데이터베이스 중단**:
   ```powershell
   docker-compose stop timescaledb
   ```
   복구 및 서비스 가용성 테스트

2. **강제 애플리케이션 충돌**:
   ```powershell
   docker-compose kill api
   ```
   자동 복구 및 재시작 확인

3. **디스크 공간 부족 시뮬레이션**:
   - 임시 대형 파일로 디스크 공간 소진
   - 경고 시스템 및 자동 정리 기능 테스트

### 8.2 테스트 체크리스트

- [ ] 알림 시스템이 적시에 경고를 보내는가?
- [ ] 백업에서 복원이 성공적으로 수행되는가?
- [ ] 복원 후 데이터 무결성이 유지되는가?
- [ ] 복구 시간이 기대치 내에 있는가?
- [ ] 모든 서비스가 정상적으로 다시 시작되는가?

## 9. 복구 작업 기록

### 9.1 복구 로그 템플릿

모든 복구 작업은 문서화되어야 합니다:

```
복구 작업 기록

날짜: YYYY-MM-DD
시간: HH:MM
담당자: [이름]

1. 발생한 장애:
   - 유형: [데이터베이스/애플리케이션/네트워크 등]
   - 증상:
   - 영향 범위:

2. 실행한 복구 절차:
   - 사용한 백업:
   - 실행한 명령어:
   - 소요 시간:

3. 결과:
   - 복구 상태:
   - 검증 단계:
   - 남은 문제:

4. 후속 조치:
   - 재발 방지 대책:
   - 모니터링 강화:
   - 변경된 구성:
```

### 9.2 장애 데이터베이스

장애 사례와 해결책을 데이터베이스화하여 향후 유사 문제 발생 시 빠른 대응에 활용합니다.

## 10. 참고 자료
- [Docker 공식 문서](https://docs.docker.com/)
- [PostgreSQL 백업 및 복구](https://www.postgresql.org/docs/current/backup.html)
- [TimescaleDB 재해 복구](https://docs.timescale.com/timescaledb/latest/how-to-guides/backup-and-restore/pg-dump-and-restore/)
- [Redis 지속성 및 백업](https://redis.io/topics/persistence) 