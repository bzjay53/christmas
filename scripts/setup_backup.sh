#!/bin/bash

# 백업 시스템 구축 스크립트

# 환경 변수 로드
source .env

# 백업 디렉토리 생성
echo "백업 디렉토리를 생성합니다..."
mkdir -p backups/{postgres,redis,config,logs}

# 데이터베이스 백업 스크립트
echo "데이터베이스 백업 스크립트를 설정합니다..."
cat << 'EOF' > scripts/backup_postgres.sh
#!/bin/bash

# 환경 변수 로드
source /opt/christmas/.env

# 백업 디렉토리 설정
BACKUP_DIR="/opt/christmas/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# 백업 실행
echo "PostgreSQL 백업을 시작합니다..."
docker-compose exec -T postgres pg_dump -U $POSTGRES_USER -d $POSTGRES_DB -F c -f /tmp/backup.dump

# 백업 파일을 호스트로 복사
docker cp $(docker-compose ps -q postgres):/tmp/backup.dump $BACKUP_FILE

# 백업 파일 압축
gzip $BACKUP_FILE

# 이전 백업 파일 정리 (30일 이상 된 파일 삭제)
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

# 백업 로그 기록
echo "$(date): PostgreSQL 백업 완료 - ${BACKUP_FILE}.gz" >> $BACKUP_DIR/backup.log
EOF

# Redis 백업 스크립트
echo "Redis 백업 스크립트를 설정합니다..."
cat << 'EOF' > scripts/backup_redis.sh
#!/bin/bash

# 환경 변수 로드
source /opt/christmas/.env

# 백업 디렉토리 설정
BACKUP_DIR="/opt/christmas/backups/redis"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.rdb"

# 백업 실행
echo "Redis 백업을 시작합니다..."
docker-compose exec -T redis redis-cli SAVE

# 백업 파일을 호스트로 복사
docker cp $(docker-compose ps -q redis):/data/dump.rdb $BACKUP_FILE

# 백업 파일 압축
gzip $BACKUP_FILE

# 이전 백업 파일 정리 (30일 이상 된 파일 삭제)
find $BACKUP_DIR -name "backup_*.rdb.gz" -mtime +30 -delete

# 백업 로그 기록
echo "$(date): Redis 백업 완료 - ${BACKUP_FILE}.gz" >> $BACKUP_DIR/backup.log
EOF

# 설정 파일 백업 스크립트
echo "설정 파일 백업 스크립트를 설정합니다..."
cat << 'EOF' > scripts/backup_config.sh
#!/bin/bash

# 백업 디렉토리 설정
BACKUP_DIR="/opt/christmas/backups/config"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/config_$DATE.tar.gz"

# 백업할 설정 파일 목록
CONFIG_FILES=(
    ".env"
    "docker-compose.yml"
    "docker-compose.prod.yml"
    "prometheus/prometheus.yml"
    "grafana/provisioning/datasources/datasources.yml"
    "grafana/provisioning/dashboards/dashboards.yml"
    "alertmanager/alertmanager.yml"
    "prometheus/rules/alerts.yml"
)

# 백업 실행
echo "설정 파일 백업을 시작합니다..."
tar -czf $BACKUP_FILE "${CONFIG_FILES[@]}"

# 이전 백업 파일 정리 (30일 이상 된 파일 삭제)
find $BACKUP_DIR -name "config_*.tar.gz" -mtime +30 -delete

# 백업 로그 기록
echo "$(date): 설정 파일 백업 완료 - $BACKUP_FILE" >> $BACKUP_DIR/backup.log
EOF

# 로그 파일 백업 스크립트
echo "로그 파일 백업 스크립트를 설정합니다..."
cat << 'EOF' > scripts/backup_logs.sh
#!/bin/bash

# 백업 디렉토리 설정
BACKUP_DIR="/opt/christmas/backups/logs"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/logs_$DATE.tar.gz"

# 백업 실행
echo "로그 파일 백업을 시작합니다..."
tar -czf $BACKUP_FILE /opt/christmas/logs/*

# 이전 백업 파일 정리 (30일 이상 된 파일 삭제)
find $BACKUP_DIR -name "logs_*.tar.gz" -mtime +30 -delete

# 백업 로그 기록
echo "$(date): 로그 파일 백업 완료 - $BACKUP_FILE" >> $BACKUP_DIR/backup.log
EOF

# 전체 백업 스크립트
echo "전체 백업 스크립트를 설정합니다..."
cat << 'EOF' > scripts/backup_all.sh
#!/bin/bash

# 전체 백업 스크립트

# 스크립트 실행 권한 설정
chmod +x /opt/christmas/scripts/backup_*.sh

# 각 백업 스크립트 실행
/opt/christmas/scripts/backup_postgres.sh
/opt/christmas/scripts/backup_redis.sh
/opt/christmas/scripts/backup_config.sh
/opt/christmas/scripts/backup_logs.sh

# 백업 상태 확인
echo "백업 상태 확인:"
du -sh /opt/christmas/backups/*

# 백업 로그 확인
echo "백업 로그 확인:"
tail -n 5 /opt/christmas/backups/*/backup.log
EOF

# 스크립트 실행 권한 설정
chmod +x scripts/backup_*.sh

# crontab에 백업 작업 추가
echo "crontab에 백업 작업을 추가합니다..."
(crontab -l 2>/dev/null; echo "0 0 * * * /opt/christmas/scripts/backup_all.sh") | crontab -

# 백업 모니터링 설정
echo "백업 모니터링을 설정합니다..."
cat << EOF >> prometheus/rules/alerts.yml
  - alert: BackupFailed
    expr: time() - file_mtime{file="/opt/christmas/backups/postgres/backup.log"} > 86400
    for: 1h
    labels:
      severity: critical
    annotations:
      summary: Backup failed
      description: "No successful backup in the last 24 hours"

  - alert: BackupDiskSpaceLow
    expr: node_filesystem_free_bytes{mountpoint="/opt/christmas/backups"} / node_filesystem_size_bytes{mountpoint="/opt/christmas/backups"} * 100 < 10
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: Low backup disk space
      description: "Backup disk space is below 10%"
EOF

echo "백업 시스템 설정이 완료되었습니다." 