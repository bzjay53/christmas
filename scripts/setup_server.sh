#!/bin/bash

# 서버 설정 스크립트

# 필요한 패키지 설치
echo "필요한 패키지를 설치합니다..."
sudo apt-get update
sudo apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    software-properties-common \
    git \
    ufw

# Docker 설치
echo "Docker를 설치합니다..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository \
   "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
   $(lsb_release -cs) \
   stable"
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io

# Docker Compose 설치
echo "Docker Compose를 설치합니다..."
sudo curl -L "https://github.com/docker/compose/releases/download/v2.20.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# 방화벽 설정
echo "방화벽을 설정합니다..."
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable

# 시스템 설정
echo "시스템 설정을 최적화합니다..."
# 시스템 제한 설정
cat << EOF | sudo tee -a /etc/security/limits.conf
* soft nofile 65536
* hard nofile 65536
* soft nproc 65536
* hard nproc 65536
EOF

# 시스템 파라미터 설정
cat << EOF | sudo tee -a /etc/sysctl.conf
net.core.somaxconn = 65536
net.ipv4.tcp_max_syn_backlog = 65536
net.ipv4.tcp_fin_timeout = 30
net.ipv4.tcp_keepalive_time = 300
net.ipv4.tcp_keepalive_probes = 5
net.ipv4.tcp_keepalive_intvl = 15
EOF

# 시스템 파라미터 적용
sudo sysctl -p

# Docker 데몬 설정
echo "Docker 데몬을 설정합니다..."
sudo mkdir -p /etc/docker
cat << EOF | sudo tee /etc/docker/daemon.json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "100m",
    "max-file": "3"
  },
  "storage-driver": "overlay2",
  "storage-opts": [
    "overlay2.size=10G"
  ]
}
EOF

# Docker 서비스 재시작
sudo systemctl restart docker

# 작업 디렉토리 생성
echo "작업 디렉토리를 생성합니다..."
sudo mkdir -p /opt/christmas
sudo chown -R $USER:$USER /opt/christmas

echo "서버 설정이 완료되었습니다." 