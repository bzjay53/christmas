#!/bin/bash

# Christmas Vercel ๋ฐฐํฌ ?คํฌ๋ฆฝํธ
# ???คํฌ๋ฆฝํธ??Christmas ?๋ก?ํธ?????ธํฐ?์ด?ค๋? Vercel??๋ฐฐํฌ?ฉ๋??

# ?๊ฒฝ ๋ณ??๋ก๋ (?์??๊ฒฝ์ฐ)
if [ -f .env ]; then
    echo "?๊ฒฝ ๋ณ?๋? ๋ก๋?ฉ๋??.."
    source .env
fi

# Vercel CLI๊ฐ ?ค์น?์ด ?๋์ง ?์ธ
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLI๊ฐ ?ค์น?์ด ?์? ?์ต?๋ค. npm?ผ๋ก ?ค์น?ฉ๋??.."
    npm install -g vercel
fi

# ?์ ?๊ฒฝ ๋ณ???์ธ
if [ -z "$VERCEL_TOKEN" ]; then
    echo "?ค๋ฅ: VERCEL_TOKEN ?๊ฒฝ ๋ณ?๊? ?ค์ ?์? ?์?ต๋??"
    echo "Vercel ๊ณ์ ?์ ? ํฐ???์ฑ?๊ณ  .env ?์ผ??์ถ๊??์ธ??"
    exit 1
fi

if [ -z "$VERCEL_ORG_ID" ] || [ -z "$VERCEL_PROJECT_ID" ]; then
    echo "๊ฒฝ๊ณ : VERCEL_ORG_ID ?๋ VERCEL_PROJECT_ID๊ฐ ?ค์ ?์? ?์?ต๋??"
    echo "์ฒ์ ๋ฐฐํฌ ??Vercel ?๋ก?ํธ๊ฐ ?๋?ผ๋ก ?์ฑ?ฉ๋??"
fi

# ๋ฐฐํฌ ?๊ฒฝ ?์ธ
DEPLOY_ENV=${1:-production}
if [ "$DEPLOY_ENV" != "production" ] && [ "$DEPLOY_ENV" != "preview" ] && [ "$DEPLOY_ENV" != "development" ]; then
    echo "?ค๋ฅ: ? ํจ?์? ?์? ๋ฐฐํฌ ?๊ฒฝ?๋?? 'production', 'preview', 'development' ์ค??๋๋ฅ??ฌ์ฉ?์ธ??"
    exit 1
fi

echo "๋ฐฐํฌ ?๊ฒฝ: $DEPLOY_ENV"

# ๋น๋ ???์ค???คํ (? ํ ?ฌํญ)
if [ "$DEPLOY_ENV" = "production" ]; then
    echo "?๋ก?์ ๋ฐฐํฌ ???์ค?ธ๋? ?คํ?ฉ๋??.."
    if ! python -m pytest tests/web -v; then
        echo "?์ค???คํจ! ๋ฐฐํฌ๋ฅ?์ค๋จ?ฉ๋??"
        exit 1
    fi
fi

# vercel.json ?์ธ
if [ ! -f "vercel.json" ]; then
    echo "?ค๋ฅ: vercel.json ?์ผ??์ฐพ์ ???์ต?๋ค."
    exit 1
fi

# ?๊ฒฝ ๋ณ???์ ?์ผ ?์ฑ
echo "?๊ฒฝ ๋ณ???์ผ???์ฑ?ฉ๋??.."
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

# Vercel ๋ฐฐํฌ ?คํ
echo "Vercel??๋ฐฐํฌ ์ค?.."
if [ "$DEPLOY_ENV" = "production" ]; then
    # ?๋ก?์ ๋ฐฐํฌ
    vercel --prod --token "$VERCEL_TOKEN" --yes
else
    # ๋ฏธ๋ฆฌ๋ณด๊ธฐ ๋ฐฐํฌ
    vercel --token "$VERCEL_TOKEN" --yes
fi

# ๋ฐฐํฌ ๊ฒฐ๊ณผ ?์ธ
if [ $? -eq 0 ]; then
    echo "๋ฐฐํฌ ?ฑ๊ณต!"
    echo "๋ฐฐํฌ??URL???์ธ?์ธ??"
else
    echo "๋ฐฐํฌ ?คํจ! Vercel ์ถ๋ ฅ ๋ก๊ทธ๋ฅ??์ธ?์ธ??"
    exit 1
fi

# ?๊ฒฝ ๋ณ???์ ?์ผ ?? 
if [ -f ".vercel/.env.$DEPLOY_ENV" ]; then
    rm .vercel/.env.$DEPLOY_ENV
fi

echo "๋ฐฐํฌ ?คํฌ๋ฆฝํธ ?๋ฃ - $(date)" 