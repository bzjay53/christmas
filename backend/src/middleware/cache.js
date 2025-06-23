const Redis = require('redis');
const logger = require('winston');

// Redis 클라이언트 초기화
let redisClient = null;

const initializeRedis = async () => {
    if (redisClient) {
        return redisClient;
    }

    try {
        redisClient = Redis.createClient({
            url: process.env.REDIS_URL || 'redis://localhost:6379'
        });

        redisClient.on('error', (err) => {
            logger.error('Redis Client Error:', err);
        });

        redisClient.on('connect', () => {
            logger.info('🔴 Connected to Redis');
        });

        redisClient.on('disconnect', () => {
            logger.warn('🔴 Disconnected from Redis');
        });

        await redisClient.connect();
        
    } catch (error) {
        logger.error('Redis initialization failed:', error.message);
        redisClient = null;
    }

    return redisClient;
};

/**
 * 캐시 미들웨어
 * @param {number} duration - 캐시 지속 시간 (초)
 * @param {string} keyPrefix - 캐시 키 접두사
 */
const cacheMiddleware = (duration = 300, keyPrefix = 'api') => {
    return async (req, res, next) => {
        try {
            const client = await initializeRedis();
            
            if (!client) {
                // Redis가 없으면 캐시 없이 진행
                return next();
            }

            // 캐시 키 생성 (URL + 쿼리 파라미터 기반)
            const cacheKey = `${keyPrefix}:${req.originalUrl || req.url}`;
            
            // 캐시된 데이터 확인
            const cachedData = await client.get(cacheKey);
            
            if (cachedData) {
                logger.debug(`Cache hit: ${cacheKey}`);
                
                const parsedData = JSON.parse(cachedData);
                
                // 캐시 헤더 추가
                res.set({
                    'X-Cache': 'HIT',
                    'X-Cache-Key': cacheKey,
                    'Cache-Control': `public, max-age=${duration}`
                });
                
                return res.json(parsedData);
            }

            logger.debug(`Cache miss: ${cacheKey}`);

            // 원래 res.json 함수 저장
            const originalJson = res.json;
            
            // res.json 오버라이드하여 응답을 캐시에 저장
            res.json = function(data) {
                // 캐시에 저장 (비동기로 처리하여 응답 속도에 영향 주지 않음)
                client.setEx(cacheKey, duration, JSON.stringify(data))
                    .catch(err => logger.error('Cache save failed:', err));
                
                // 캐시 헤더 추가
                res.set({
                    'X-Cache': 'MISS',
                    'X-Cache-Key': cacheKey,
                    'Cache-Control': `public, max-age=${duration}`
                });
                
                // 원래 함수 호출
                return originalJson.call(this, data);
            };

            next();
            
        } catch (error) {
            logger.error('Cache middleware error:', error.message);
            // 캐시 에러가 있어도 요청은 계속 처리
            next();
        }
    };
};

/**
 * 캐시 무효화
 * @param {string} pattern - 삭제할 캐시 키 패턴
 */
const invalidateCache = async (pattern) => {
    try {
        const client = await initializeRedis();
        
        if (!client) {
            return false;
        }

        const keys = await client.keys(pattern);
        
        if (keys.length > 0) {
            await client.del(keys);
            logger.info(`Cache invalidated: ${keys.length} keys matching ${pattern}`);
        }
        
        return true;
        
    } catch (error) {
        logger.error('Cache invalidation failed:', error.message);
        return false;
    }
};

/**
 * 특정 캐시 키 삭제
 * @param {string} key - 삭제할 캐시 키
 */
const deleteCache = async (key) => {
    try {
        const client = await initializeRedis();
        
        if (!client) {
            return false;
        }

        const result = await client.del(key);
        
        if (result > 0) {
            logger.debug(`Cache deleted: ${key}`);
        }
        
        return result > 0;
        
    } catch (error) {
        logger.error('Cache deletion failed:', error.message);
        return false;
    }
};

/**
 * 캐시 통계 조회
 */
const getCacheStats = async () => {
    try {
        const client = await initializeRedis();
        
        if (!client) {
            return null;
        }

        const info = await client.info('memory');
        const dbSize = await client.dbSize();
        
        return {
            connected: true,
            keyCount: dbSize,
            memoryInfo: info
        };
        
    } catch (error) {
        logger.error('Cache stats failed:', error.message);
        return {
            connected: false,
            error: error.message
        };
    }
};

// Redis 연결 종료
const closeRedis = async () => {
    if (redisClient) {
        try {
            await redisClient.quit();
            logger.info('Redis connection closed');
        } catch (error) {
            logger.error('Error closing Redis connection:', error.message);
        }
    }
};

// 프로세스 종료 시 Redis 연결 정리
process.on('SIGINT', closeRedis);
process.on('SIGTERM', closeRedis);

module.exports = {
    cacheMiddleware,
    invalidateCache,
    deleteCache,
    getCacheStats,
    initializeRedis,
    closeRedis
};