#!/bin/bash

# Christmas Vercel 배포 ?�크립트
# ???�크립트??Christmas ?�로?�트?????�터?�이?��? Vercel??배포?�니??

# ?�경 변??로드 (?�요??경우)
if [ -f .env ]; then
    echo "?�경 변?��? 로드?�니??.."
    source .env
fi

# Vercel CLI가 ?�치?�어 ?�는지 ?�인
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLI가 ?�치?�어 ?��? ?�습?�다. npm?�로 ?�치?�니??.."
    npm install -g vercel
fi

# ?�수 ?�경 변???�인
if [ -z "$VERCEL_TOKEN" ]; then
    echo "?�류: VERCEL_TOKEN ?�경 변?��? ?�정?��? ?�았?�니??"
    echo "Vercel 계정?�서 ?�큰???�성?�고 .env ?�일??추�??�세??"
    exit 1
fi

if [ -z "$VERCEL_ORG_ID" ] || [ -z "$VERCEL_PROJECT_ID" ]; then
    echo "경고: VERCEL_ORG_ID ?�는 VERCEL_PROJECT_ID가 ?�정?��? ?�았?�니??"
    echo "처음 배포 ??Vercel ?�로?�트가 ?�동?�로 ?�성?�니??"
fi

# 배포 ?�경 ?�인
DEPLOY_ENV=${1:-production}
if [ "$DEPLOY_ENV" != "production" ] && [ "$DEPLOY_ENV" != "preview" ] && [ "$DEPLOY_ENV" != "development" ]; then
    echo "?�류: ?�효?��? ?��? 배포 ?�경?�니?? 'production', 'preview', 'development' �??�나�??�용?�세??"
    exit 1
fi

echo "배포 ?�경: $DEPLOY_ENV"

# 빌드 ???�스???�행 (?�택 ?�항)
if [ "$DEPLOY_ENV" = "production" ]; then
    echo "?�로?�션 배포 ???�스?��? ?�행?�니??.."
    if ! python -m pytest tests/web -v; then
        echo "?�스???�패! 배포�?중단?�니??"
        exit 1
    fi
fi

# vercel.json ?�인
if [ ! -f "vercel.json" ]; then
    echo "?�류: vercel.json ?�일??찾을 ???�습?�다."
    exit 1
fi

# ?�경 변???�시 ?�일 ?�성
echo "?�경 변???�일???�성?�니??.."
cat > .vercel/.env.$DEPLOY_ENV << EOF
CHRISTMAS_ENV=$DEPLOY_ENV
CHRISTMAS_DB_HOST=$CHRISTMAS_DB_HOST
CHRISTMAS_DB_PORT=$CHRISTMAS_DB_PORT
CHRISTMAS_DB_USER=$CHRISTMAS_DB_USER
CHRISTMAS_DB_PASSWORD=$CHRISTMAS_DB_PASSWORD
CHRISTMAS_DB_NAME=$CHRISTMAS_DB_NAME
CHRISTMAS_REDIS_HOST=$CHRISTMAS_REDIS_HOST
CHRISTMAS_REDIS_PORT=$CHRISTMAS_REDIS_PORT
FLASK_SECRET_KEY=$FLASK_SECRET_KEY
EOF

# Vercel 배포 ?�행
echo "Vercel??배포 �?.."
if [ "$DEPLOY_ENV" = "production" ]; then
    # ?�로?�션 배포
    vercel --prod --token "$VERCEL_TOKEN" --yes
else
    # 미리보기 배포
    vercel --token "$VERCEL_TOKEN" --yes
fi

# 배포 결과 ?�인
if [ $? -eq 0 ]; then
    echo "배포 ?�공!"
    echo "배포??URL???�인?�세??"
else
    echo "배포 ?�패! Vercel 출력 로그�??�인?�세??"
    exit 1
fi

# ?�경 변???�시 ?�일 ??��
if [ -f ".vercel/.env.$DEPLOY_ENV" ]; then
    rm .vercel/.env.$DEPLOY_ENV
fi

echo "배포 ?�크립트 ?�료 - $(date)" 