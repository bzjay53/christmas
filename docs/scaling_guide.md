# Christmas 프로젝트 스케일링 가이드

## 1. 개요

이 문서는 Christmas 자동 매매 플랫폼의 확장성(스케일링) 전략과 구현 방법을 설명합니다. 시스템의 부하 증가에 따라 성능과 안정성을 유지하면서 확장하는 방법을 다룹니다.

## 2. 스케일링 전략

Christmas 시스템은 다음과 같은 확장 전략을 사용합니다:

### 2.1 수평적 확장 (Horizontal Scaling)
동일한 서비스의 인스턴스를 여러 개 실행하여 부하를 분산합니다. 주로 상태를 저장하지 않는(Stateless) 서비스에 적합합니다.

### 2.2 수직적 확장 (Vertical Scaling)
서비스가 실행되는 컨테이너 또는 호스트 머신의 리소스(CPU, 메모리 등)를 증가시킵니다.

### 2.3 데이터베이스 확장
데이터베이스 성능과 용량을 확장하기 위한 전략입니다. 샤딩, 레플리카 설정, 파티셔닝 등의 기법을 사용합니다.

### 2.4 마이크로서비스 아키텍처
서비스를 독립적으로 배포 가능한 작은 단위로 분할하여 개별적으로 스케일링할 수 있도록 합니다.

## 3. 컴포넌트별 스케일링 전략

### 3.1 API 서버 스케일링

#### 3.1.1 수평적 확장
Docker Compose를 사용한 API 서버 확장:
```bash
docker-compose -f docker-compose.prod.yml up -d --scale api=3
```

#### 3.1.2 로드 밸런싱
Nginx를 사용한 API 서버 로드 밸런싱 설정:
```nginx
upstream api_servers {
    server api_1:8000;
    server api_2:8000;
    server api_3:8000;
    least_conn;
}

server {
    listen 80;
    
    location /api {
        proxy_pass http://api_servers;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### 3.1.3 자동 스케일링
Docker Swarm 또는 Kubernetes를 사용한 자동 스케일링 설정:

**Docker Swarm 예시:**
```yaml
version: '3.8'

services:
  api:
    image: christmas-api:latest
    deploy:
      replicas: 3
      resources:
        limits:
          cpus: '0.5'
          memory: 512M
      restart_policy:
        condition: on-failure
      update_config:
        parallelism: 1
        delay: 10s
      rollback_config:
        parallelism: 1
        delay: 10s
```

**Kubernetes 예시:**
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: api
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### 3.2 데이터베이스 스케일링

#### 3.2.1 TimescaleDB 확장
TimescaleDB는 시계열 데이터에 최적화된 PostgreSQL 확장이며, 다음과 같은 확장 기능을 제공합니다:

1. **하이퍼테이블 청크 관리:**
   ```sql
   -- 최적 청크 크기 설정
   SELECT set_chunk_time_interval('market_data', INTERVAL '1 day');
   
   -- 압축 정책 설정
   ALTER TABLE market_data SET (timescaledb.compress, timescaledb.compress_orderby = 'timestamp DESC');
   SELECT add_compression_policy('market_data', INTERVAL '7 days');
   ```

2. **데이터 보관 정책:**
   ```sql
   -- 오래된 데이터 자동 삭제 정책
   SELECT add_drop_chunks_policy('market_data', INTERVAL '90 days');
   ```

3. **하이퍼테이블 파티셔닝:**
   ```sql
   -- 여러 차원에 따른 파티셔닝
   CREATE TABLE market_data (
     time TIMESTAMPTZ NOT NULL,
     symbol TEXT NOT NULL,
     price DOUBLE PRECISION,
     volume DOUBLE PRECISION
   );
   
   SELECT create_hypertable('market_data', 'time', 
                           partitioning_column => 'symbol',
                           number_partitions => 4);
   ```

#### 3.2.2 읽기 복제본 설정
고가용성 및 읽기 확장을 위한 PostgreSQL 복제본 설정:

```yaml
services:
  timescaledb-master:
    image: timescale/timescaledb:latest-pg14
    environment:
      POSTGRES_PASSWORD: secure_password
    volumes:
      - timescaledb-master:/var/lib/postgresql/data
    ports:
      - "5432:5432"
      
  timescaledb-replica:
    image: timescale/timescaledb:latest-pg14
    environment:
      POSTGRES_PASSWORD: secure_password
      POSTGRES_MASTER_HOST: timescaledb-master
      POSTGRES_MASTER_PORT: 5432
      POSTGRES_REPLICATION_USER: replication_user
      POSTGRES_REPLICATION_PASSWORD: replication_password
    volumes:
      - timescaledb-replica:/var/lib/postgresql/data
    ports:
      - "5433:5432"
    depends_on:
      - timescaledb-master
```

#### 3.2.3 데이터베이스 연결 풀링
PgBouncer를 사용한 연결 풀링:

```yaml
services:
  pgbouncer:
    image: edoburu/pgbouncer:latest
    environment:
      DATABASE_URL: postgres://christmas:password@timescaledb:5432/christmas_db
      POOL_MODE: transaction
      MAX_CLIENT_CONN: 1000
      DEFAULT_POOL_SIZE: 20
    ports:
      - "6432:5432"
```

애플리케이션 코드에서는 직접 데이터베이스에 연결하는 대신 PgBouncer에 연결합니다:
```python
DATABASE_URL = "postgresql://christmas:password@pgbouncer:6432/christmas_db"
```

### 3.3 Redis 캐시 스케일링

#### 3.3.1 Redis 클러스터 설정
여러 Redis 노드로 구성된 클러스터 설정:

```yaml
services:
  redis-1:
    image: redis:alpine
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000
    ports:
      - "6379:6379"
      
  redis-2:
    image: redis:alpine
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000
    ports:
      - "6380:6379"
      
  redis-3:
    image: redis:alpine
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000
    ports:
      - "6381:6379"
```

클러스터 초기화:
```bash
redis-cli --cluster create 127.0.0.1:6379 127.0.0.1:6380 127.0.0.1:6381 --cluster-replicas 0
```

#### 3.3.2 Redis Sentinel 설정
고가용성을 위한 Redis Sentinel 설정:

```yaml
services:
  redis-master:
    image: redis:alpine
    ports:
      - "6379:6379"
      
  redis-slave:
    image: redis:alpine
    command: redis-server --slaveof redis-master 6379
    depends_on:
      - redis-master
      
  redis-sentinel:
    image: redis:alpine
    command: redis-sentinel /redis-sentinel.conf
    volumes:
      - ./redis-sentinel.conf:/redis-sentinel.conf
    depends_on:
      - redis-master
      - redis-slave
```

`redis-sentinel.conf` 설정:
```
port 26379
sentinel monitor mymaster redis-master 6379 2
sentinel down-after-milliseconds mymaster 5000
sentinel failover-timeout mymaster 60000
```

### 3.4 웹 인터페이스 스케일링

#### 3.4.1 CDN 활용
정적 자산을 CDN을 통해 제공하여 웹 서버 부하 감소:

```html
<!-- HTML에서 CDN 사용 예시 -->
<link rel="stylesheet" href="https://your-cdn.com/styles.css">
<script src="https://your-cdn.com/scripts.js"></script>
```

#### 3.4.2 웹 서버 수평 확장
웹 서버 인스턴스 증가:

```bash
docker-compose -f docker-compose.prod.yml up -d --scale web=3
```

### 3.5 메시지 큐 활용

비동기 작업 처리를 위한 RabbitMQ 설정:

```yaml
services:
  rabbitmq:
    image: rabbitmq:3-management
    ports:
      - "5672:5672"  # AMQP 포트
      - "15672:15672"  # 관리 인터페이스
    volumes:
      - rabbitmq_data:/var/lib/rabbitmq
```

Python 코드에서 메시지 큐 사용 예시:
```python
import pika

def publish_task(task_data):
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(host='rabbitmq')
    )
    channel = connection.channel()
    channel.queue_declare(queue='tasks')
    channel.basic_publish(
        exchange='',
        routing_key='tasks',
        body=json.dumps(task_data)
    )
    connection.close()

def consume_tasks():
    connection = pika.BlockingConnection(
        pika.ConnectionParameters(host='rabbitmq')
    )
    channel = connection.channel()
    channel.queue_declare(queue='tasks')
    
    def callback(ch, method, properties, body):
        # 작업 처리 로직
        process_task(json.loads(body))
        ch.basic_ack(delivery_tag=method.delivery_tag)
    
    channel.basic_consume(
        queue='tasks',
        on_message_callback=callback
    )
    channel.start_consuming()
```

## 4. 부하 테스트 및 성능 튜닝

### 4.1 부하 테스트 도구
- **Locust**: 분산 부하 테스트 도구
- **wrk**: HTTP 벤치마킹 도구
- **Siege**: HTTP 부하 테스트 및 벤치마킹 도구

### 4.2 부하 테스트 시나리오
1. **API 엔드포인트 부하 테스트**:
   ```bash
   locust -f locustfile.py --host=http://localhost:8000
   ```

2. **주문 처리 성능 테스트**:
   ```bash
   wrk -t12 -c400 -d30s http://localhost:8000/api/orders
   ```
   
3. **실시간 데이터 처리 테스트**:
   ```bash
   siege -c100 -t1M http://localhost:8000/api/market-data
   ```

### 4.3 성능 모니터링 및 튜닝

1. **API 서버 튜닝**:
   - 워커 프로세스 수 조정
   - 비동기 요청 처리
   - 응답 캐싱

2. **데이터베이스 튜닝**:
   - 인덱스 최적화
   - 쿼리 최적화
   - 연결 풀 조정

3. **네트워크 튜닝**:
   - 커넥션 풀링
   - 타임아웃 설정
   - 지연 로딩 vs 즉시 로딩

## 5. 클라우드 환경 스케일링

### 5.1 AWS 배포 시 스케일링

#### 5.1.1 ECS를 사용한 컨테이너 스케일링
```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Resources": {
    "ECSCluster": {
      "Type": "AWS::ECS::Cluster",
      "Properties": {
        "ClusterName": "christmas-cluster"
      }
    },
    "ECSService": {
      "Type": "AWS::ECS::Service",
      "Properties": {
        "Cluster": {"Ref": "ECSCluster"},
        "DesiredCount": 3,
        "TaskDefinition": {"Ref": "TaskDefinition"},
        "LaunchType": "FARGATE",
        "NetworkConfiguration": {
          "AwsvpcConfiguration": {
            "AssignPublicIp": "ENABLED",
            "SecurityGroups": [{"Ref": "SecurityGroup"}],
            "Subnets": {"Ref": "Subnets"}
          }
        }
      }
    },
    "ServiceAutoScalingTarget": {
      "Type": "AWS::ApplicationAutoScaling::ScalableTarget",
      "Properties": {
        "MaxCapacity": 10,
        "MinCapacity": 2,
        "ResourceId": {
          "Fn::Join": [
            "/",
            [
              "service",
              {"Ref": "ECSCluster"},
              {"Fn::GetAtt": ["ECSService", "Name"]}
            ]
          ]
        },
        "ScalableDimension": "ecs:service:DesiredCount",
        "ServiceNamespace": "ecs"
      }
    },
    "ServiceScalingPolicy": {
      "Type": "AWS::ApplicationAutoScaling::ScalingPolicy",
      "Properties": {
        "PolicyName": "cpu-tracking-scaling-policy",
        "PolicyType": "TargetTrackingScaling",
        "ScalingTargetId": {"Ref": "ServiceAutoScalingTarget"},
        "TargetTrackingScalingPolicyConfiguration": {
          "PredefinedMetricSpecification": {
            "PredefinedMetricType": "ECSServiceAverageCPUUtilization"
          },
          "TargetValue": 70.0
        }
      }
    }
  }
}
```

#### 5.1.2 RDS 확장 설정
```json
{
  "AWSTemplateFormatVersion": "2010-09-09",
  "Resources": {
    "DBInstance": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "DBInstanceClass": "db.m5.large",
        "AllocatedStorage": 100,
        "Engine": "postgres",
        "MasterUsername": "admin",
        "MasterUserPassword": {"Ref": "DBPassword"},
        "MultiAZ": true,
        "PubliclyAccessible": false
      }
    },
    "DBReadReplica": {
      "Type": "AWS::RDS::DBInstance",
      "Properties": {
        "SourceDBInstanceIdentifier": {"Ref": "DBInstance"},
        "DBInstanceClass": "db.m5.large",
        "PubliclyAccessible": false
      }
    }
  }
}
```

### 5.2 Kubernetes 환경 스케일링

#### 5.2.1 Deployment 설정
```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: christmas-api
spec:
  replicas: 3
  selector:
    matchLabels:
      app: christmas-api
  template:
    metadata:
      labels:
        app: christmas-api
    spec:
      containers:
      - name: api
        image: christmas-api:latest
        resources:
          requests:
            memory: "256Mi"
            cpu: "100m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        ports:
        - containerPort: 8000
```

#### 5.2.2 HPA(Horizontal Pod Autoscaler) 설정
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: christmas-api-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: christmas-api
  minReplicas: 3
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
  - type: Resource
    resource:
      name: memory
      target:
        type: Utilization
        averageUtilization: 80
```

## 6. 스케일링 모범 사례

### 6.1 무상태(Stateless) 설계 원칙
- 서비스 간 상태 공유 최소화
- 세션 데이터를 Redis와 같은 외부 저장소에 보관
- 각 요청이 독립적으로 처리될 수 있도록 설계

### 6.2 데이터베이스 최적화
- 읽기와 쓰기 작업 분리
- 인덱스 최적화 및 정기적인 유지보수
- 캐싱 전략 구현
- 쿼리 최적화 및 모니터링

### 6.3 분산 로깅 및 모니터링
- 중앙 집중식 로깅 시스템 구축
- 실시간 성능 모니터링
- 스케일링 이벤트 추적 및 분석
- 자동화된 알림 설정

### 6.4 점진적 스케일링
- 갑작스러운 대규모 스케일링 대신 점진적 접근
- 스케일링 전후 성능 측정 및 비교
- 비용 효율성 고려
- 정기적인 부하 테스트 및 병목 현상 분석

## 7. 문제 해결

### 7.1 일반적인 스케일링 문제
1. **데이터베이스 병목 현상**
   - 원인: 연결 수 초과, 느린 쿼리, 인덱스 부족
   - 해결: 연결 풀링 최적화, 쿼리 튜닝, 인덱싱 개선

2. **메모리 부족**
   - 원인: 메모리 누수, 캐시 설정 오류, 과도한 동시 요청
   - 해결: 메모리 사용량 분석, 캐시 설정 최적화, 수평적 확장

3. **네트워크 문제**
   - 원인: 높은 지연 시간, 네트워크 대역폭 제한
   - 해결: CDN 사용, 데이터 전송 최적화, 연결 풀링

### 7.2 디버깅 전략
1. **로그 분석**:
   ```bash
   docker logs christmas-api-1
   kubectl logs deployment/christmas-api
   ```

2. **성능 프로파일링**:
   ```bash
   # Python 프로파일링 예시
   python -m cProfile -o output.prof app.py
   
   # 프로파일 데이터 분석
   python -m pstats output.prof
   ```

3. **네트워크 진단**:
   ```bash
   # 네트워크 지연 확인
   ping database-host
   
   # 연결 상태 확인
   netstat -an | grep 5432
   ```

## 8. 참고 자료
- [Docker Compose 스케일링](https://docs.docker.com/compose/reference/scale/)
- [Kubernetes HPA](https://kubernetes.io/docs/tasks/run-application/horizontal-pod-autoscale/)
- [TimescaleDB 성능 최적화](https://docs.timescale.com/timescaledb/latest/how-to-guides/hypertables/best-practices/)
- [PostgreSQL 고가용성 구성](https://www.postgresql.org/docs/current/high-availability.html)
- [Redis 클러스터 구성](https://redis.io/topics/cluster-tutorial) 