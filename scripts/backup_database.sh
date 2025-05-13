#!/bin/bash

# 데이터베이스 백업 스크립트

# 환경 변수 로드
source /opt/christmas/.env

# 백업 디렉토리 설정
BACKUP_DIR="/opt/christmas/backups/postgres"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/backup_$DATE.sql"

# 백업 디렉토리가 없으면 생성
mkdir -p $BACKUP_DIR

# 이전 백업 파일 정리 (30일 이상 된 파일 삭제)
find $BACKUP_DIR -name "backup_*.sql" -mtime +30 -delete

# 전체 백업 실행
echo "데이터베이스 백업을 시작합니다..."
docker-compose exec -T postgres pg_dump -U $POSTGRES_USER -d $POSTGRES_DB -F c -f /tmp/backup.dump

# 백업 파일을 호스트로 복사
docker cp $(docker-compose ps -q postgres):/tmp/backup.dump $BACKUP_FILE

# 백업 파일 압축
gzip $BACKUP_FILE

# 백업 완료 메시지
echo "백업이 완료되었습니다: ${BACKUP_FILE}.gz"

# 백업 상태 확인
if [ -f "${BACKUP_FILE}.gz" ]; then
    echo "백업 파일이 성공적으로 생성되었습니다."
    # 백업 파일 크기 확인
    du -h "${BACKUP_FILE}.gz"
else
    echo "백업 파일 생성에 실패했습니다."
    exit 1
fi

# 백업 로그 기록
echo "$(date): 백업 완료 - ${BACKUP_FILE}.gz" >> $BACKUP_DIR/backup.log

# 디스크 사용량 확인
echo "백업 디렉토리 사용량:"
du -sh $BACKUP_DIR

# 백업 파일 권한 설정
chmod 600 "${BACKUP_FILE}.gz"
chmod 600 $BACKUP_DIR/backup.log 