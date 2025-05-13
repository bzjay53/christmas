#!/bin/bash

# 데이터베이스 설정 스크립트

# 환경 변수 로드
source .env

# PostgreSQL 컨테이너가 실행 중인지 확인
if ! docker-compose ps postgres | grep -q "Up"; then
    echo "PostgreSQL 컨테이너를 시작합니다..."
    docker-compose up -d postgres
    sleep 10  # PostgreSQL이 시작될 때까지 대기
fi

# 데이터베이스 생성
echo "데이터베이스를 생성합니다..."
docker-compose exec -T postgres psql -U $POSTGRES_USER -c "CREATE DATABASE $POSTGRES_DB;" || true

# 데이터베이스 마이그레이션
echo "데이터베이스 마이그레이션을 실행합니다..."
docker-compose exec -T api alembic upgrade head

# 초기 데이터 로드
echo "초기 데이터를 로드합니다..."
docker-compose exec -T postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "
-- 기본 역할 생성
INSERT INTO user_roles (role_name) VALUES 
    ('admin'),
    ('user'),
    ('viewer')
ON CONFLICT (role_name) DO NOTHING;

-- 기본 관리자 계정 생성
INSERT INTO users (username, email, password_hash, is_active)
VALUES (
    'admin',
    'admin@example.com',
    '\$2b\$12\$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewKyNiAYMyzJ/I6y',  -- 'admin123'
    true
)
ON CONFLICT (username) DO NOTHING;

-- 관리자에게 admin 역할 부여
INSERT INTO user_roles (user_id, role_name)
SELECT u.id, 'admin'
FROM users u
WHERE u.username = 'admin'
ON CONFLICT (user_id, role_name) DO NOTHING;
"

# 데이터베이스 백업 설정
echo "데이터베이스 백업 설정을 구성합니다..."
mkdir -p backups/postgres

# crontab에 백업 작업 추가
(crontab -l 2>/dev/null; echo "0 0 * * * /opt/christmas/scripts/backup_database.sh") | crontab -

# 데이터베이스 성능 최적화
echo "데이터베이스 성능을 최적화합니다..."
docker-compose exec -T postgres psql -U $POSTGRES_USER -d $POSTGRES_DB -c "
-- 통계 수집 설정
ALTER SYSTEM SET track_activities = on;
ALTER SYSTEM SET track_counts = on;
ALTER SYSTEM SET track_io_timing = on;
ALTER SYSTEM SET track_functions = all;

-- 메모리 설정
ALTER SYSTEM SET shared_buffers = '1GB';
ALTER SYSTEM SET effective_cache_size = '3GB';
ALTER SYSTEM SET maintenance_work_mem = '256MB';
ALTER SYSTEM SET work_mem = '16MB';

-- WAL 설정
ALTER SYSTEM SET wal_level = replica;
ALTER SYSTEM SET max_wal_senders = 3;
ALTER SYSTEM SET max_wal_size = '1GB';
ALTER SYSTEM SET checkpoint_timeout = '15min';

-- 쿼리 최적화 설정
ALTER SYSTEM SET random_page_cost = 1.1;
ALTER SYSTEM SET effective_io_concurrency = 200;
ALTER SYSTEM SET default_statistics_target = 100;

-- 설정 적용
SELECT pg_reload_conf();
"

echo "데이터베이스 설정이 완료되었습니다." 