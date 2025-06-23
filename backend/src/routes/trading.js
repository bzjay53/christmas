const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { getFirestore, admin } = require('../config/firebase');
const { body, validationResult } = require('express-validator');
const logger = require('winston');

const router = express.Router();

// 모든 trading 라우트는 인증 필요
router.use(authMiddleware);

// 주문 생성
router.post('/order', [
    body('symbol').notEmpty().isLength({ min: 1, max: 10 }).withMessage('Valid symbol required'),
    body('type').isIn(['buy', 'sell']).withMessage('Type must be buy or sell'),
    body('quantity').isInt({ min: 1, max: 10000 }).withMessage('Quantity must be 1-10000'),
    body('price').optional().isNumeric().withMessage('Price must be numeric')
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

        const { symbol, type, quantity, price = 'market' } = req.body;
        const userId = req.user.uid;
        const db = getFirestore();

        // 사용자 정보 조회
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const userData = userDoc.data();
        const currentPrice = await getCurrentPrice(symbol.toUpperCase());
        const orderPrice = price === 'market' ? currentPrice : parseFloat(price);
        const totalCost = orderPrice * quantity;

        // 주문 가능성 검증
        const validationResult = await validateOrder(userId, symbol, type, quantity, orderPrice, userData);
        if (!validationResult.valid) {
            return res.status(400).json({
                success: false,
                error: validationResult.error
            });
        }

        // 주문 생성
        const orderId = `order_${Date.now()}_${userId.slice(-8)}`;
        const orderData = {
            id: orderId,
            userId,
            symbol: symbol.toUpperCase(),
            type,
            quantity,
            price: orderPrice,
            totalCost,
            status: 'pending',
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            createdAt: new Date().toISOString()
        };

        // 트랜잭션으로 주문 처리
        const result = await db.runTransaction(async (transaction) => {
            // 주문 저장
            const orderRef = db.collection('orders').doc(orderId);
            transaction.set(orderRef, orderData);

            // 즉시 체결 처리 (실제로는 시장 상황에 따라)
            if (type === 'buy') {
                // 매수: 현금 차감, 주식 추가
                transaction.update(db.collection('users').doc(userId), {
                    availableCash: admin.firestore.FieldValue.increment(-totalCost)
                });

                // 포트폴리오에 주식 추가
                const portfolioRef = db.collection('portfolios').doc(userId);
                const portfolioDoc = await transaction.get(portfolioRef);
                
                let holdings = {};
                if (portfolioDoc.exists) {
                    holdings = portfolioDoc.data().holdings || {};
                }

                if (holdings[symbol.toUpperCase()]) {
                    // 기존 보유 종목 - 평균단가 계산
                    const existing = holdings[symbol.toUpperCase()];
                    const newQuantity = existing.quantity + quantity;
                    const newAvgCost = ((existing.quantity * existing.avgCost) + totalCost) / newQuantity;
                    
                    holdings[symbol.toUpperCase()] = {
                        quantity: newQuantity,
                        avgCost: newAvgCost,
                        firstPurchase: existing.firstPurchase,
                        lastUpdated: new Date().toISOString()
                    };
                } else {
                    // 신규 종목
                    holdings[symbol.toUpperCase()] = {
                        quantity,
                        avgCost: orderPrice,
                        firstPurchase: new Date().toISOString(),
                        lastUpdated: new Date().toISOString()
                    };
                }

                transaction.set(portfolioRef, { holdings }, { merge: true });

            } else {
                // 매도: 주식 차감, 현금 추가
                const portfolioRef = db.collection('portfolios').doc(userId);
                const portfolioDoc = await transaction.get(portfolioRef);
                
                if (!portfolioDoc.exists) {
                    throw new Error('Portfolio not found');
                }

                const holdings = portfolioDoc.data().holdings || {};
                const holding = holdings[symbol.toUpperCase()];

                if (!holding || holding.quantity < quantity) {
                    throw new Error('Insufficient shares');
                }

                // 주식 수량 조정
                if (holding.quantity === quantity) {
                    delete holdings[symbol.toUpperCase()];
                } else {
                    holdings[symbol.toUpperCase()] = {
                        ...holding,
                        quantity: holding.quantity - quantity,
                        lastUpdated: new Date().toISOString()
                    };
                }

                transaction.set(portfolioRef, { holdings }, { merge: true });
                transaction.update(db.collection('users').doc(userId), {
                    availableCash: admin.firestore.FieldValue.increment(totalCost)
                });
            }

            // 주문 상태를 체결로 변경
            transaction.update(orderRef, {
                status: 'executed',
                executedAt: admin.firestore.FieldValue.serverTimestamp(),
                executedPrice: orderPrice
            });

            return orderId;
        });

        logger.info(`Order executed: ${type} ${quantity} ${symbol} for user ${userData.email}`);

        res.json({
            success: true,
            order: {
                id: result,
                symbol: symbol.toUpperCase(),
                type,
                quantity,
                price: orderPrice,
                totalCost,
                status: 'executed',
                message: `${type === 'buy' ? '매수' : '매도'} 주문이 성공적으로 체결되었습니다.`
            }
        });

    } catch (error) {
        logger.error('Order placement failed:', error.message);
        
        let errorMessage = 'Order failed';
        if (error.message.includes('Insufficient')) {
            errorMessage = error.message;
        }

        res.status(400).json({
            success: false,
            error: errorMessage
        });
    }
});

// 주문 내역 조회
router.get('/orders', async (req, res) => {
    try {
        const { limit = 20, status, symbol } = req.query;
        const userId = req.user.uid;
        const db = getFirestore();

        let query = db.collection('orders')
            .where('userId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(parseInt(limit));

        if (status) {
            query = query.where('status', '==', status);
        }

        if (symbol) {
            query = query.where('symbol', '==', symbol.toUpperCase());
        }

        const ordersSnapshot = await query.get();
        const orders = ordersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            timestamp: doc.data().timestamp?.toDate()?.toISOString() || doc.data().createdAt
        }));

        res.json({
            success: true,
            orders,
            total: orders.length
        });

    } catch (error) {
        logger.error('Orders fetch failed:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch orders'
        });
    }
});

// 특정 주문 조회
router.get('/orders/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.uid;
        const db = getFirestore();

        const orderDoc = await db.collection('orders').doc(orderId).get();
        
        if (!orderDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        const orderData = orderDoc.data();
        
        // 주문이 해당 사용자의 것인지 확인
        if (orderData.userId !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        res.json({
            success: true,
            order: {
                id: orderDoc.id,
                ...orderData,
                timestamp: orderData.timestamp?.toDate()?.toISOString() || orderData.createdAt
            }
        });

    } catch (error) {
        logger.error('Order fetch failed:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch order'
        });
    }
});

// 주문 취소
router.delete('/orders/:orderId', async (req, res) => {
    try {
        const { orderId } = req.params;
        const userId = req.user.uid;
        const db = getFirestore();

        const orderDoc = await db.collection('orders').doc(orderId).get();
        
        if (!orderDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Order not found'
            });
        }

        const orderData = orderDoc.data();
        
        // 주문이 해당 사용자의 것인지 확인
        if (orderData.userId !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Access denied'
            });
        }

        // 이미 체결된 주문은 취소 불가
        if (orderData.status === 'executed') {
            return res.status(400).json({
                success: false,
                error: 'Cannot cancel executed order'
            });
        }

        // 주문 취소
        await db.collection('orders').doc(orderId).update({
            status: 'cancelled',
            cancelledAt: admin.firestore.FieldValue.serverTimestamp()
        });

        logger.info(`Order cancelled: ${orderId} by user ${req.user.email}`);

        res.json({
            success: true,
            message: 'Order cancelled successfully'
        });

    } catch (error) {
        logger.error('Order cancellation failed:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to cancel order'
        });
    }
});

// 거래 통계
router.get('/stats', async (req, res) => {
    try {
        const { period = '1M' } = req.query;
        const userId = req.user.uid;
        const db = getFirestore();

        const periodDays = {
            '1D': 1,
            '1W': 7,
            '1M': 30,
            '3M': 90,
            '1Y': 365
        };

        const days = periodDays[period] || 30;
        const startDate = new Date();
        startDate.setDate(startDate.getDate() - days);

        const ordersSnapshot = await db.collection('orders')
            .where('userId', '==', userId)
            .where('status', '==', 'executed')
            .where('timestamp', '>=', startDate)
            .get();

        const orders = ordersSnapshot.docs.map(doc => doc.data());

        // 통계 계산
        const stats = {
            totalOrders: orders.length,
            buyOrders: orders.filter(o => o.type === 'buy').length,
            sellOrders: orders.filter(o => o.type === 'sell').length,
            totalVolume: orders.reduce((sum, o) => sum + o.totalCost, 0),
            averageOrderSize: orders.length > 0 ? orders.reduce((sum, o) => sum + o.totalCost, 0) / orders.length : 0,
            mostTradedStock: getMostTradedStock(orders),
            tradingDays: new Set(orders.map(o => o.createdAt?.split('T')[0])).size
        };

        res.json({
            success: true,
            period,
            stats
        });

    } catch (error) {
        logger.error('Trading stats fetch failed:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch trading stats'
        });
    }
});

// 헬퍼 함수들

/**
 * 현재 주가 조회 (시뮬레이션)
 */
async function getCurrentPrice(symbol) {
    const mockPrices = {
        'AAPL': 150.25,
        'MSFT': 378.85,
        'GOOGL': 138.45,
        'TSLA': 245.75,
        'AMZN': 155.20,
        'NVDA': 495.30
    };
    
    return mockPrices[symbol] || 100.00;
}

/**
 * 주문 검증
 */
async function validateOrder(userId, symbol, type, quantity, price, userData) {
    const db = getFirestore();
    
    if (type === 'buy') {
        // 매수: 충분한 현금 확인
        const totalCost = price * quantity;
        if (userData.availableCash < totalCost) {
            return {
                valid: false,
                error: `Insufficient funds. Available: $${userData.availableCash.toFixed(2)}, Required: $${totalCost.toFixed(2)}`
            };
        }
    } else {
        // 매도: 충분한 주식 보유 확인
        const portfolioDoc = await db.collection('portfolios').doc(userId).get();
        
        if (!portfolioDoc.exists) {
            return {
                valid: false,
                error: 'No portfolio found'
            };
        }

        const holdings = portfolioDoc.data().holdings || {};
        const holding = holdings[symbol];

        if (!holding || holding.quantity < quantity) {
            return {
                valid: false,
                error: `Insufficient shares. Available: ${holding?.quantity || 0}, Required: ${quantity}`
            };
        }
    }

    return { valid: true };
}

/**
 * 가장 많이 거래된 종목 찾기
 */
function getMostTradedStock(orders) {
    const stockCounts = {};
    
    orders.forEach(order => {
        stockCounts[order.symbol] = (stockCounts[order.symbol] || 0) + 1;
    });

    let mostTraded = null;
    let maxCount = 0;

    for (const [symbol, count] of Object.entries(stockCounts)) {
        if (count > maxCount) {
            maxCount = count;
            mostTraded = symbol;
        }
    }

    return mostTraded ? { symbol: mostTraded, count: maxCount } : null;
}

module.exports = router;