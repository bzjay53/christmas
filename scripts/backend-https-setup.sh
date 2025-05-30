#!/bin/bash
# 백엔드 서버 HTTPS 설정 스크립트
# 2025-05-30 22:15 KST - Mixed Content 문제 근본 해결

echo "🔧 백엔드 HTTPS 설정 시작..."

# 1. Let's Encrypt SSL 인증서 설치
sudo apt update
sudo apt install -y certbot nginx

# 2. 도메인 설정 (예시)
# christmas-api.your-domain.com -> 31.220.83.213

# 3. Nginx 설정
sudo tee /etc/nginx/sites-available/christmas-api << 'EOF'
server {
    listen 80;
    server_name 31.220.83.213;
    
    location / {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        
        # CORS 헤더 추가
        add_header Access-Control-Allow-Origin "https://christmas-protocol.netlify.app" always;
        add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS" always;
        add_header Access-Control-Allow-Headers "Content-Type, Authorization" always;
        
        if ($request_method = 'OPTIONS') {
            add_header Access-Control-Allow-Origin "https://christmas-protocol.netlify.app";
            add_header Access-Control-Allow-Methods "GET, POST, PUT, DELETE, OPTIONS";
            add_header Access-Control-Allow-Headers "Content-Type, Authorization";
            return 204;
        }
    }
}
EOF

# 4. Nginx 활성화
sudo ln -sf /etc/nginx/sites-available/christmas-api /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

echo "✅ 백엔드 HTTPS 설정 완료"
echo "🔗 이제 https://31.220.83.213 으로 접속 가능" 