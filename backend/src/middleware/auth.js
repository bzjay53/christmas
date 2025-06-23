const { verifyIdToken } = require('../config/firebase');
const logger = require('winston');

/**
 * Firebase 인증 미들웨어
 * Authorization 헤더에서 Bearer 토큰을 추출하고 검증
 */
const authMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader) {
            return res.status(401).json({
                success: false,
                error: 'Authorization header missing',
                message: 'Please provide authentication token'
            });
        }

        if (!authHeader.startsWith('Bearer ')) {
            return res.status(401).json({
                success: false,
                error: 'Invalid authorization format',
                message: 'Authorization header must start with "Bearer "'
            });
        }

        const idToken = authHeader.substring(7); // "Bearer " 제거
        
        if (!idToken) {
            return res.status(401).json({
                success: false,
                error: 'Token missing',
                message: 'Authentication token is required'
            });
        }

        // Firebase 토큰 검증
        const decodedToken = await verifyIdToken(idToken);
        
        // 요청 객체에 사용자 정보 추가
        req.user = {
            uid: decodedToken.uid,
            email: decodedToken.email,
            name: decodedToken.name,
            emailVerified: decodedToken.email_verified,
            authTime: decodedToken.auth_time,
            iat: decodedToken.iat,
            exp: decodedToken.exp
        };

        logger.debug(`Authenticated user: ${decodedToken.email}`);
        next();
        
    } catch (error) {
        logger.warn('Authentication failed:', {
            error: error.message,
            ip: req.ip,
            userAgent: req.get('User-Agent')
        });

        if (error.code === 'auth/id-token-expired') {
            return res.status(401).json({
                success: false,
                error: 'Token expired',
                message: 'Authentication token has expired. Please login again.'
            });
        }

        if (error.code === 'auth/id-token-revoked') {
            return res.status(401).json({
                success: false,
                error: 'Token revoked',
                message: 'Authentication token has been revoked. Please login again.'
            });
        }

        res.status(401).json({
            success: false,
            error: 'Authentication failed',
            message: 'Invalid or malformed authentication token'
        });
    }
};

/**
 * 선택적 인증 미들웨어
 * 토큰이 있으면 검증하고, 없으면 그냥 통과
 */
const optionalAuthMiddleware = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            // 토큰이 없으면 그냥 통과
            return next();
        }

        const idToken = authHeader.substring(7);
        
        if (idToken) {
            const decodedToken = await verifyIdToken(idToken);
            req.user = {
                uid: decodedToken.uid,
                email: decodedToken.email,
                name: decodedToken.name,
                emailVerified: decodedToken.email_verified
            };
        }

        next();
        
    } catch (error) {
        logger.warn('Optional authentication failed:', error.message);
        // 선택적 인증이므로 에러가 있어도 계속 진행
        next();
    }
};

module.exports = {
    authMiddleware,
    optionalAuthMiddleware
};