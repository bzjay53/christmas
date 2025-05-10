#!/bin/bash

# Christmas Vercel ë°°í¬ ?¤í¬ë¦½íŠ¸
# ???¤í¬ë¦½íŠ¸??Christmas ?„ë¡œ?íŠ¸?????¸í„°?˜ì´?¤ë? Vercel??ë°°í¬?©ë‹ˆ??

# ?˜ê²½ ë³€??ë¡œë“œ (?„ìš”??ê²½ìš°)
if [ -f .env ]; then
    echo "?˜ê²½ ë³€?˜ë? ë¡œë“œ?©ë‹ˆ??.."
    source .env
fi

# Vercel CLIê°€ ?¤ì¹˜?˜ì–´ ?ˆëŠ”ì§€ ?•ì¸
if ! command -v vercel &> /dev/null; then
    echo "Vercel CLIê°€ ?¤ì¹˜?˜ì–´ ?ˆì? ?ŠìŠµ?ˆë‹¤. npm?¼ë¡œ ?¤ì¹˜?©ë‹ˆ??.."
    npm install -g vercel
fi

# ?„ìˆ˜ ?˜ê²½ ë³€???•ì¸
if [ -z "$VERCEL_TOKEN" ]; then
    echo "?¤ë¥˜: VERCEL_TOKEN ?˜ê²½ ë³€?˜ê? ?¤ì •?˜ì? ?Šì•˜?µë‹ˆ??"
    echo "Vercel ê³„ì •?ì„œ ? í°???ì„±?˜ê³  .env ?Œì¼??ì¶”ê??˜ì„¸??"
    exit 1
fi

if [ -z "$VERCEL_ORG_ID" ] || [ -z "$VERCEL_PROJECT_ID" ]; then
    echo "ê²½ê³ : VERCEL_ORG_ID ?ëŠ” VERCEL_PROJECT_IDê°€ ?¤ì •?˜ì? ?Šì•˜?µë‹ˆ??"
    echo "ì²˜ìŒ ë°°í¬ ??Vercel ?„ë¡œ?íŠ¸ê°€ ?ë™?¼ë¡œ ?ì„±?©ë‹ˆ??"
fi

# ë°°í¬ ?˜ê²½ ?•ì¸
DEPLOY_ENV=${1:-production}
if [ "$DEPLOY_ENV" != "production" ] && [ "$DEPLOY_ENV" != "preview" ] && [ "$DEPLOY_ENV" != "development" ]; then
    echo "?¤ë¥˜: ? íš¨?˜ì? ?Šì? ë°°í¬ ?˜ê²½?…ë‹ˆ?? 'production', 'preview', 'development' ì¤??˜ë‚˜ë¥??¬ìš©?˜ì„¸??"
    exit 1
fi

echo "ë°°í¬ ?˜ê²½: $DEPLOY_ENV"

# ë¹Œë“œ ???ŒìŠ¤???¤í–‰ (? íƒ ?¬í•­)
if [ "$DEPLOY_ENV" = "production" ]; then
    echo "?„ë¡œ?•ì…˜ ë°°í¬ ???ŒìŠ¤?¸ë? ?¤í–‰?©ë‹ˆ??.."
    if ! python -m pytest tests/web -v; then
        echo "?ŒìŠ¤???¤íŒ¨! ë°°í¬ë¥?ì¤‘ë‹¨?©ë‹ˆ??"
        exit 1
    fi
fi

# vercel.json ?•ì¸
if [ ! -f "vercel.json" ]; then
    echo "?¤ë¥˜: vercel.json ?Œì¼??ì°¾ì„ ???†ìŠµ?ˆë‹¤."
    exit 1
fi

# ?˜ê²½ ë³€???„ì‹œ ?Œì¼ ?ì„±
echo "?˜ê²½ ë³€???Œì¼???ì„±?©ë‹ˆ??.."
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

# Vercel ë°°í¬ ?¤í–‰
echo "Vercel??ë°°í¬ ì¤?.."
if [ "$DEPLOY_ENV" = "production" ]; then
    # ?„ë¡œ?•ì…˜ ë°°í¬
    vercel --prod --token "$VERCEL_TOKEN" --yes
else
    # ë¯¸ë¦¬ë³´ê¸° ë°°í¬
    vercel --token "$VERCEL_TOKEN" --yes
fi

# ë°°í¬ ê²°ê³¼ ?•ì¸
if [ $? -eq 0 ]; then
    echo "ë°°í¬ ?±ê³µ!"
    echo "ë°°í¬??URL???•ì¸?˜ì„¸??"
else
    echo "ë°°í¬ ?¤íŒ¨! Vercel ì¶œë ¥ ë¡œê·¸ë¥??•ì¸?˜ì„¸??"
    exit 1
fi

# ?˜ê²½ ë³€???„ì‹œ ?Œì¼ ?? œ
if [ -f ".vercel/.env.$DEPLOY_ENV" ]; then
    rm .vercel/.env.$DEPLOY_ENV
fi

echo "ë°°í¬ ?¤í¬ë¦½íŠ¸ ?„ë£Œ - $(date)" 