# 멀티스테이지 빌드: 개발 및 프로덕션 환경 지원
FROM node:18-alpine AS base

# 작업 디렉토리 설정
WORKDIR /app

# 패키지 파일 복사 및 의존성 설치
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# 개발 환경
FROM base AS development
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]

# 빌드 스테이지
FROM base AS build
RUN npm ci
COPY . .
RUN npm run build

# 프로덕션 환경 (Nginx)
FROM nginx:alpine AS production
COPY --from=build /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"] 