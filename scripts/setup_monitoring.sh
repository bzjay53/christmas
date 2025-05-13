#!/bin/bash

# 모니터링 시스템 구축 스크립트

# 환경 변수 로드
source .env

# Prometheus 설정
echo "Prometheus를 설정합니다..."
cat << EOF > prometheus/prometheus.yml
global:
  scrape_interval: 15s
  evaluation_interval: 15s

scrape_configs:
  - job_name: 'prometheus'
    static_configs:
      - targets: ['localhost:9090']

  - job_name: 'api'
    static_configs:
      - targets: ['api:8000']

  - job_name: 'web'
    static_configs:
      - targets: ['web:3000']

  - job_name: 'postgres'
    static_configs:
      - targets: ['postgres-exporter:9187']

  - job_name: 'redis'
    static_configs:
      - targets: ['redis-exporter:9121']
EOF

# Grafana 대시보드 설정
echo "Grafana 대시보드를 설정합니다..."
mkdir -p grafana/provisioning/dashboards
mkdir -p grafana/provisioning/datasources

# Grafana 데이터소스 설정
cat << EOF > grafana/provisioning/datasources/datasources.yml
apiVersion: 1

datasources:
  - name: Prometheus
    type: prometheus
    access: proxy
    url: http://prometheus:9090
    isDefault: true
EOF

# Grafana 대시보드 설정
cat << EOF > grafana/provisioning/dashboards/dashboards.yml
apiVersion: 1

providers:
  - name: 'Default'
    orgId: 1
    folder: ''
    type: file
    disableDeletion: false
    editable: true
    options:
      path: /var/lib/grafana/dashboards
EOF

# 로깅 설정
echo "로깅 시스템을 설정합니다..."
mkdir -p logs

# Filebeat 설정
cat << EOF > filebeat/filebeat.yml
filebeat.inputs:
- type: log
  enabled: true
  paths:
    - /var/log/christmas/*.log
  fields:
    app: christmas
  fields_under_root: true

output.elasticsearch:
  hosts: ["elasticsearch:9200"]
  index: "christmas-%{+yyyy.MM.dd}"

setup.template.name: "christmas"
setup.template.pattern: "christmas-*"
setup.ilm.enabled: true
setup.ilm.rollover_alias: "christmas"
EOF

# Logstash 설정
cat << EOF > logstash/pipeline/logstash.conf
input {
  beats {
    port => 5044
  }
}

filter {
  if [fields][app] == "christmas" {
    grok {
      match => { "message" => "%{TIMESTAMP_ISO8601:timestamp} %{LOGLEVEL:level} %{GREEDYDATA:message}" }
    }
    date {
      match => [ "timestamp", "ISO8601" ]
      target => "@timestamp"
    }
  }
}

output {
  elasticsearch {
    hosts => ["elasticsearch:9200"]
    index => "christmas-%{+YYYY.MM.dd}"
  }
}
EOF

# Elasticsearch 설정
cat << EOF > elasticsearch/config/elasticsearch.yml
cluster.name: "christmas"
network.host: 0.0.0.0
discovery.type: single-node
xpack.security.enabled: true
xpack.security.transport.ssl.enabled: true
EOF

# Kibana 설정
cat << EOF > kibana/config/kibana.yml
server.name: kibana
server.host: "0.0.0.0"
elasticsearch.hosts: [ "http://elasticsearch:9200" ]
xpack.security.enabled: true
EOF

# 알림 설정
echo "알림 시스템을 설정합니다..."
cat << EOF > alertmanager/alertmanager.yml
global:
  resolve_timeout: 5m
  slack_api_url: '${SLACK_WEBHOOK_URL}'

route:
  group_by: ['alertname']
  group_wait: 10s
  group_interval: 10s
  repeat_interval: 1h
  receiver: 'slack-notifications'

receivers:
- name: 'slack-notifications'
  slack_configs:
  - channel: '#alerts'
    send_resolved: true
EOF

# Prometheus 알림 규칙
cat << EOF > prometheus/rules/alerts.yml
groups:
- name: christmas
  rules:
  - alert: HighErrorRate
    expr: rate(http_requests_total{status=~"5.."}[5m]) > 0.1
    for: 5m
    labels:
      severity: critical
    annotations:
      summary: High error rate detected
      description: "Error rate is {{ \$value }}"

  - alert: HighLatency
    expr: http_request_duration_seconds{quantile="0.9"} > 1
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: High latency detected
      description: "90th percentile latency is {{ \$value }}s"

  - alert: HighMemoryUsage
    expr: (node_memory_MemTotal_bytes - node_memory_MemAvailable_bytes) / node_memory_MemTotal_bytes * 100 > 85
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: High memory usage
      description: "Memory usage is {{ \$value }}%"

  - alert: HighCPUUsage
    expr: 100 - (avg by(instance) (irate(node_cpu_seconds_total{mode="idle"}[5m])) * 100) > 80
    for: 5m
    labels:
      severity: warning
    annotations:
      summary: High CPU usage
      description: "CPU usage is {{ \$value }}%"
EOF

# 모니터링 서비스 시작
echo "모니터링 서비스를 시작합니다..."
docker-compose up -d prometheus grafana elasticsearch kibana logstash filebeat alertmanager

# Grafana 초기 설정
echo "Grafana 초기 설정을 진행합니다..."
sleep 10  # Grafana가 시작될 때까지 대기

# Grafana 관리자 비밀번호 설정
curl -X POST -H "Content-Type: application/json" -d '{
  "oldPassword": "admin",
  "newPassword": "'${GRAFANA_ADMIN_PASSWORD}'",
  "confirmNew": "'${GRAFANA_ADMIN_PASSWORD}'"
}' http://admin:admin@localhost:3000/api/user/password

echo "모니터링 시스템 설정이 완료되었습니다." 