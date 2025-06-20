# Christmas 프로젝트 모니터링 가이드

## 1. 개요

이 문서는 Christmas 자동 매매 플랫폼의 모니터링 방법을 설명합니다. 효과적인 모니터링을 통해 시스템 상태를 실시간으로 파악하고, 잠재적인 문제를 사전에 감지하여 대응할 수 있습니다.

## 2. 모니터링 아키텍처

Christmas 시스템은 다음과 같은 모니터링 아키텍처를 사용합니다:

```
[애플리케이션 서비스] → [지표 수집(Prometheus)] → [시각화(Grafana)]
                      → [로그 수집(Fluent Bit)] → [로그 분석(Elasticsearch)] → [시각화(Kibana)]
                      → [알림 관리(Alertmanager)] → [알림 채널(Email, Slack)]
```

## 3. 핵심 모니터링 영역

### 3.1 시스템 모니터링
- CPU, 메모리, 디스크 사용량
- 네트워크 트래픽
- 컨테이너 상태 및 리소스 사용량

### 3.2 애플리케이션 모니터링
- API 엔드포인트 응답 시간
- 요청 처리량
- 오류율
- 백엔드 처리 시간

### 3.3 데이터베이스 모니터링
- 쿼리 성능
- 연결 수
- 트랜잭션 처리량
- 복제 지연(있는 경우)

### 3.4 거래 모니터링
- 주문 처리 시간
- 성공/실패율
- 시그널 생성 수
- 실행된 거래 수
- 수익/손실 추적

## 4. 모니터링 도구 설정

### 4.1 Prometheus 설정

Prometheus는 시계열 데이터베이스로 시스템 및 애플리케이션 메트릭을 수집합니다.

#### 4.1.1 기본 설정
Docker Compose에서 Prometheus 설정:
```yaml
services:
  prometheus:
    image: prom/prometheus
    volumes:
      - ./config/prometheus/prometheus.yml:/etc/prometheus/prometheus.yml
      - prometheus_data:/prometheus
    ports:
      - "9090:9090"
    command:
      - '--config.file=/etc/prometheus/prometheus.yml'
      - '--storage.tsdb.path=/prometheus'
      - '--web.console.libraries=/usr/share/prometheus/console_libraries'
      - '--web.console.templates=/usr/share/prometheus/consoles'
    restart: always
```

#### 4.1.2 수집 대상 설정
`prometheus.yml` 설정 예시:
```yaml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'node_exporter'
    static_configs:
      - targets: ['node-exporter:9100']

  - job_name: 'api'
    metrics_path: /metrics
    static_configs:
      - targets: ['api:8000']

  - job_name: 'cadvisor'
    static_configs:
      - targets: ['cadvisor:8080']
```

### 4.2 Grafana 설정

Grafana는 수집된 메트릭을 시각화하는 대시보드를 제공합니다.

#### 4.2.1 기본 설정
Docker Compose에서 Grafana 설정:
```yaml
services:
  grafana:
    image: grafana/grafana
    volumes:
      - grafana_data:/var/lib/grafana
      - ./config/grafana/provisioning:/etc/grafana/provisioning
    environment:
      - GF_SECURITY_ADMIN_USER=admin
      - GF_SECURITY_ADMIN_PASSWORD=secure_password
      - GF_USERS_ALLOW_SIGN_UP=false
    ports:
      - "3000:3000"
    depends_on:
      - prometheus
    restart: always
```

#### 4.2.2 대시보드 설정
주요 대시보드:
1. **시스템 개요**: CPU, 메모리, 디스크, 네트워크 사용량
2. **API 성능**: 요청 처리량, 응답 시간, 오류율
3. **데이터베이스 성능**: 쿼리 처리량, 연결 수, 캐시 히트율
4. **트레이딩 성능**: 시그널 수, 주문 처리량, 성공률

### 4.3 ELK 스택 설정

로그 수집 및 분석을 위한 ELK(Elasticsearch, Logstash, Kibana) 스택 설정:

#### 4.3.1 Fluent Bit 설정
로그 수집을 위한 Fluent Bit 설정:
```yaml
services:
  fluent-bit:
    image: fluent/fluent-bit
    volumes:
      - ./config/fluent-bit/fluent-bit.conf:/fluent-bit/etc/fluent-bit.conf
      - /var/lib/docker/containers:/var/lib/docker/containers:ro
    depends_on:
      - elasticsearch
    restart: always
```

#### 4.3.2 Elasticsearch 설정
로그 저장을 위한 Elasticsearch 설정:
```yaml
services:
  elasticsearch:
    image: docker.elastic.co/elasticsearch/elasticsearch:7.13.0
    environment:
      - discovery.type=single-node
      - "ES_JAVA_OPTS=-Xms512m -Xmx512m"
    volumes:
      - elasticsearch_data:/usr/share/elasticsearch/data
    ports:
      - "9200:9200"
    restart: always
```

#### 4.3.3 Kibana 설정
로그 시각화를 위한 Kibana 설정:
```yaml
services:
  kibana:
    image: docker.elastic.co/kibana/kibana:7.13.0
    environment:
      - ELASTICSEARCH_HOSTS=http://elasticsearch:9200
    ports:
      - "5601:5601"
    depends_on:
      - elasticsearch
    restart: always
```

### 4.4 알림 설정

#### 4.4.1 Alertmanager 설정
Docker Compose에서 Alertmanager 설정:
```yaml
services:
  alertmanager:
    image: prom/alertmanager
    volumes:
      - ./config/alertmanager/alertmanager.yml:/etc/alertmanager/alertmanager.yml
    ports:
      - "9093:9093"
    restart: always
```

#### 4.4.2 알림 규칙 설정
`alertmanager.yml` 설정 예시:
```yaml
global:
  resolve_timeout: 5m
  slack_api_url: 'https://hooks.slack.com/services/YOUR/SLACK/WEBHOOK'

route:
  group_by: ['alertname', 'job']
  group_wait: 30s
  group_interval: 5m
  repeat_interval: 4h
  receiver: 'slack-notifications'

receivers:
- name: 'slack-notifications'
  slack_configs:
  - channel: '#alerts'
    send_resolved: true
    title: "{{ .GroupLabels.alertname }}"
    text: "{{ range .Alerts }}{{ .Annotations.description }}\n{{ end }}"
```

## 5. 주요 대시보드 활용

### 5.1 시스템 대시보드
- **접근 방법**: Grafana > Dashboards > System Overview
- **주요 패널**:
  - CPU 사용률: 각 서비스별 CPU 사용률
  - 메모리 사용률: 각 서비스별 메모리 사용량
  - 디스크 I/O: 읽기/쓰기 처리량
  - 네트워크 트래픽: 인바운드/아웃바운드 트래픽

### 5.2 API 성능 대시보드
- **접근 방법**: Grafana > Dashboards > API Performance
- **주요 패널**:
  - 요청 처리량: 초당 요청 수
  - 응답 시간: 평균/최대/p95 응답 시간
  - 오류율: HTTP 상태 코드별 응답 수
  - 엔드포인트별 성능: 주요 API 엔드포인트 응답 시간

### 5.3 데이터베이스 대시보드
- **접근 방법**: Grafana > Dashboards > Database Performance
- **주요 패널**:
  - 활성 연결 수: 현재 활성 DB 연결 수
  - 쿼리 실행 시간: 평균/최대 쿼리 실행 시간
  - 트랜잭션 처리량: 초당 트랜잭션 수
  - 인덱스 사용률: 인덱스 히트/미스 비율

### 5.4 트레이딩 대시보드
- **접근 방법**: Grafana > Dashboards > Trading Performance
- **주요 패널**:
  - 시그널 발생 수: 전략별 시그널 발생 수
  - 주문 처리 상태: 성공/실패/대기 중인 주문 수
  - 거래량: 시간대별 거래량
  - 수익률: 전략별 수익률 추이

## 6. 로그 분석

### 6.1 Kibana 활용
- **접근 방법**: http://localhost:5601
- **인덱스 패턴 생성**: Management > Stack Management > Index Patterns > Create index pattern
- **로그 검색**: Discover 탭에서 로그 검색 및 필터링
- **시각화**: Visualize 탭에서 로그 데이터 시각화

### 6.2 주요 로그 쿼리
- 오류 로그 검색:
  ```
  level:ERROR OR level:FATAL
  ```
- 특정 서비스 로그 검색:
  ```
  kubernetes.container.name:api AND level:ERROR
  ```
- 특정 사용자 관련 로그 검색:
  ```
  user_id:"12345" AND (path:"/api/orders" OR path:"/api/trades")
  ```
- 성능 관련 로그 검색:
  ```
  message:*latency* AND latency_ms:>500
  ```

## 7. 알림 관리

### 7.1 알림 설정 방법
1. Prometheus에서 알림 규칙 정의 (`/config/prometheus/rules/alerts.yml`)
2. Alertmanager에서 알림 대상 및 라우팅 구성 (`/config/alertmanager/alertmanager.yml`)
3. 알림 테스트 및 확인

### 7.2 주요 알림 규칙
- **높은 CPU 사용률**:
  ```yaml
  - alert: HighCpuUsage
    expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High CPU usage detected"
      description: "CPU usage is above 80% for 5 minutes (current value: {{ $value }}%)"
  ```

- **높은 메모리 사용률**:
  ```yaml
  - alert: HighMemoryUsage
    expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: "High memory usage detected"
      description: "Memory usage is above 85% for 5 minutes (current value: {{ $value }}%)"
  ```

- **API 오류 증가**:
  ```yaml
  - alert: HighErrorRate
    expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) * 100 > 5
    for: 1m
    labels:
      severity: critical
    annotations:
      summary: "High API error rate"
      description: "API error rate is above 5% (current value: {{ $value }}%)"
  ```

- **데이터베이스 연결 부족**:
  ```yaml
  - alert: LowDbConnections
    expr: pg_stat_activity_count{datname="christmas_db"} / pg_settings_max_connections * 100 > 80
    for: 2m
    labels:
      severity: warning
    annotations:
      summary: "Database connection pool near capacity"
      description: "Database connection utilization is above 80% (current value: {{ $value }}%)"
  ```

### 7.3 알림 채널 설정
- **Slack 알림**:
  - Slack 워크스페이스에 Incoming Webhook 앱 추가
  - Webhook URL을 alertmanager.yml 구성에 추가
  - 포맷에 맞게 메시지 템플릿 설정

- **이메일 알림**:
  ```yaml
  receivers:
  - name: 'email-notifications'
    email_configs:
    - to: 'alerts@example.com'
      from: 'alertmanager@example.com'
      smarthost: 'smtp.example.com:587'
      auth_username: 'alertmanager'
      auth_password: 'password'
      require_tls: true
  ```

## 8. 성능 최적화

### 8.1 모니터링 데이터 기반 최적화
- 응답 시간이 느린 API 엔드포인트 식별 및 최적화
- 리소스 사용량이 높은 컨테이너 식별 및 스케일링
- 데이터베이스 쿼리 성능 모니터링 및 개선

### 8.2 모니터링 시스템 자체 최적화
- Prometheus 보존 기간 및 샘플 레이트 조정
- Elasticsearch 인덱스 롤오버 및 보존 정책 설정
- Grafana 대시보드 쿼리 최적화

## 9. 문제 해결

### 9.1 모니터링 시스템 문제
- **Prometheus가 시작되지 않는 경우**:
  - 설정 파일 검증: `promtool check config prometheus.yml`
  - 로그 확인: `docker logs christmas-prometheus-1`
  - 권한 문제 확인: 볼륨 마운트 권한 검증

- **Grafana 대시보드가 데이터를 표시하지 않는 경우**:
  - Prometheus 데이터 소스 연결 확인
  - 브라우저 콘솔 오류 확인
  - 쿼리 표현식 검증

- **로그가 Elasticsearch에 수집되지 않는 경우**:
  - Fluent Bit 로그 확인: `docker logs christmas-fluent-bit-1`
  - Elasticsearch 상태 확인: `curl -X GET "localhost:9200/_cat/health"`
  - 인덱스 상태 확인: `curl -X GET "localhost:9200/_cat/indices"`

### 9.2 경고 문제
- **알림이 발송되지 않는 경우**:
  - Alertmanager 로그 확인: `docker logs christmas-alertmanager-1`
  - 알림 규칙 상태 확인: Prometheus UI > Alerts
  - 네트워크 연결 확인: Slack/이메일 서버 연결 테스트

## 10. 참고 자료
- [Prometheus 공식 문서](https://prometheus.io/docs/introduction/overview/)
- [Grafana 공식 문서](https://grafana.com/docs/)
- [Elasticsearch 공식 문서](https://www.elastic.co/guide/index.html)
- [Fluent Bit 공식 문서](https://docs.fluentbit.io/manual/) 