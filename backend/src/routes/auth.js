const express = require('express');
const { verifyIdToken, createUser, getUser, updateUser } = require('../config/firebase');
const { authMiddleware } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const logger = require('winston');

const router = express.Router();

// Firebase 토큰 검증 및 사용자 생성/로그인
router.post('/verify', [
    body('idToken').notEmpty().withMessage('ID token is required')
], async (req, res) => {
    try {
        // 입력 검증
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { idToken } = req.body;
        
        // Firebase 토큰 검증
        const decodedToken = await verifyIdToken(idToken);
        
        logger.info(`User authentication attempt: ${decodedToken.email}`);
        
        // 사용자 정보 가져오기 또는 생성
        let userData = await getUser(decodedToken.uid);
        
        if (!userData) {
            // 신규 사용자 생성
            userData = await createUser({
                uid: decodedToken.uid,
                email: decodedToken.email,
                displayName: decodedToken.name || 'Christmas Trader'
            });
            
            logger.info(`New user created: ${decodedToken.email}`);
        } else {
            // 기존 사용자 로그인 시간 업데이트
            await updateUser(decodedToken.uid, {
                lastLogin: new Date()
            });
            
            logger.info(`User logged in: ${decodedToken.email}`);
        }

        res.json({
            success: true,
            user: {
                uid: decodedToken.uid,
                email: decodedToken.email,
                displayName: userData.displayName,
                portfolioBalance: userData.portfolioBalance,
                availableCash: userData.availableCash,
                createdAt: userData.createdAt,
                lastLogin: userData.lastLogin
            },
            message: 'Authentication successful'
        });
        
    } catch (error) {
        logger.error('Authentication failed:', error.message);
        
        res.status(401).json({
            success: false,
            error: 'Authentication failed',
            message: 'Invalid or expired token'
        });
    }
});

// 사용자 프로필 조회
router.get('/profile', authMiddleware, async (req, res) => {
    try {
        const userData = await getUser(req.user.uid);
        
        if (!userData) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        res.json({
            success: true,
            user: {
                uid: req.user.uid,
                email: userData.email,
                displayName: userData.displayName,
                portfolioBalance: userData.portfolioBalance,
                availableCash: userData.availableCash,
                createdAt: userData.createdAt,
                lastLogin: userData.lastLogin
            }
        });
        
    } catch (error) {
        logger.error('Profile fetch failed:', error.message);
        
        res.status(500).json({
            success: false,
            error: 'Failed to fetch user profile'
        });
    }
});

// 사용자 프로필 업데이트
router.put('/profile', authMiddleware, [
    body('displayName').optional().isLength({ min: 1, max: 50 }).withMessage('Display name must be 1-50 characters')
], async (req, res) => {
    try {
        // 입력 검증
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { displayName } = req.body;
        const updateData = {};
        
        if (displayName) {
            updateData.displayName = displayName;
        }

        await updateUser(req.user.uid, updateData);
        
        logger.info(`User profile updated: ${req.user.email}`);

        res.json({
            success: true,
            message: 'Profile updated successfully'
        });
        
    } catch (error) {
        logger.error('Profile update failed:', error.message);
        
        res.status(500).json({
            success: false,
            error: 'Failed to update profile'
        });
    }
});

// 사용자 로그아웃 (토큰 무효화는 클라이언트에서 처리)
router.post('/logout', authMiddleware, async (req, res) => {
    try {
        // 로그아웃 시간 기록
        await updateUser(req.user.uid, {
            lastLogout: new Date()
        });
        
        logger.info(`User logged out: ${req.user.email}`);

        res.json({
            success: true,
            message: 'Logout successful'
        });
        
    } catch (error) {
        logger.error('Logout failed:', error.message);
        
        res.json({
            success: true,
            message: 'Logout completed (with minor error in logging)'
        });
    }
});

// 계정 삭제 (주의: 실제 운영에서는 더 엄격한 검증 필요)
router.delete('/account', authMiddleware, [
    body('confirmEmail').notEmpty().withMessage('Email confirmation required')
], async (req, res) => {
    try {
        // 입력 검증
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({
                success: false,
                errors: errors.array()
            });
        }

        const { confirmEmail } = req.body;
        
        if (confirmEmail !== req.user.email) {
            return res.status(400).json({
                success: false,
                error: 'Email confirmation does not match'
            });
        }

        // TODO: 실제 계정 삭제 로직 구현
        // 현재는 비활성화만 처리
        await updateUser(req.user.uid, {
            isActive: false,
            deletedAt: new Date()
        });
        
        logger.warn(`Account deletion requested: ${req.user.email}`);

        res.json({
            success: true,
            message: 'Account has been deactivated'
        });
        
    } catch (error) {
        logger.error('Account deletion failed:', error.message);
        
        res.status(500).json({
            success: false,
            error: 'Failed to delete account'
        });
    }
});

module.exports = router;