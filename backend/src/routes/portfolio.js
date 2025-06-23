const express = require('express');
const { authMiddleware } = require('../middleware/auth');
const { getFirestore } = require('../config/firebase');
const { body, validationResult } = require('express-validator');
const logger = require('winston');

const router = express.Router();

// 모든 portfolio 라우트는 인증 필요
router.use(authMiddleware);

// 포트폴리오 조회
router.get('/', async (req, res) => {
    try {
        const db = getFirestore();
        const userId = req.user.uid;

        // 사용자 기본 정보
        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const userData = userDoc.data();

        // 포트폴리오 보유 종목
        const portfolioDoc = await db.collection('portfolios').doc(userId).get();
        let holdings = {};
        let totalValue = userData.availableCash || 0;

        if (portfolioDoc.exists) {
            holdings = portfolioDoc.data().holdings || {};
        }

        // 각 보유 종목의 현재 가치 계산
        const holdingsWithValue = {};
        for (const [symbol, holding] of Object.entries(holdings)) {
            // 실제로는 시장 데이터 API를 통해 현재가를 가져와야 함
            // 여기서는 시뮬레이션 데이터 사용
            const currentPrice = await getCurrentPrice(symbol);
            const marketValue = holding.quantity * currentPrice;
            const unrealizedPnL = marketValue - (holding.quantity * holding.avgCost);
            
            holdingsWithValue[symbol] = {
                ...holding,
                currentPrice,
                marketValue,
                unrealizedPnL,
                unrealizedPnLPercent: ((currentPrice - holding.avgCost) / holding.avgCost) * 100
            };
            
            totalValue += marketValue;
        }

        // 최근 거래 내역
        const ordersSnapshot = await db.collection('orders')
            .where('userId', '==', userId)
            .orderBy('timestamp', 'desc')
            .limit(10)
            .get();

        const recentOrders = ordersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json({
            success: true,
            portfolio: {
                totalValue,
                availableCash: userData.availableCash,
                totalInvested: totalValue - userData.availableCash,
                totalPnL: totalValue - userData.portfolioBalance,
                totalPnLPercent: ((totalValue - userData.portfolioBalance) / userData.portfolioBalance) * 100,
                holdings: holdingsWithValue,
                recentOrders
            },
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Portfolio fetch failed:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch portfolio'
        });
    }
});

// 포트폴리오 요약 (간단한 버전)
router.get('/summary', async (req, res) => {
    try {
        const db = getFirestore();
        const userId = req.user.uid;

        const userDoc = await db.collection('users').doc(userId).get();
        if (!userDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'User not found'
            });
        }

        const userData = userDoc.data();
        const portfolioDoc = await db.collection('portfolios').doc(userId).get();
        
        let totalInvested = 0;
        let currentValue = userData.availableCash || 0;

        if (portfolioDoc.exists) {
            const holdings = portfolioDoc.data().holdings || {};
            
            for (const [symbol, holding] of Object.entries(holdings)) {
                const currentPrice = await getCurrentPrice(symbol);
                totalInvested += holding.quantity * holding.avgCost;
                currentValue += holding.quantity * currentPrice;
            }
        }

        const totalPnL = currentValue - userData.portfolioBalance;

        res.json({
            success: true,
            summary: {
                totalValue: currentValue,
                availableCash: userData.availableCash,
                totalInvested,
                totalPnL,
                totalPnLPercent: userData.portfolioBalance > 0 
                    ? (totalPnL / userData.portfolioBalance) * 100 
                    : 0
            }
        });

    } catch (error) {
        logger.error('Portfolio summary failed:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch portfolio summary'
        });
    }
});

// 포트폴리오 성과 히스토리
router.get('/performance', async (req, res) => {
    try {
        const { period = '1M' } = req.query;
        
        // 실제로는 데이터베이스에서 히스토리 데이터를 가져와야 함
        // 여기서는 시뮬레이션 데이터 생성
        const performanceData = generatePerformanceData(period);

        res.json({
            success: true,
            period,
            performance: performanceData,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        logger.error('Portfolio performance fetch failed:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch portfolio performance'
        });
    }
});

// 보유 종목 상세 정보
router.get('/holdings/:symbol', async (req, res) => {
    try {
        const { symbol } = req.params;
        const db = getFirestore();
        const userId = req.user.uid;

        const portfolioDoc = await db.collection('portfolios').doc(userId).get();
        
        if (!portfolioDoc.exists) {
            return res.status(404).json({
                success: false,
                error: 'Portfolio not found'
            });
        }

        const holdings = portfolioDoc.data().holdings || {};
        const holding = holdings[symbol.toUpperCase()];

        if (!holding) {
            return res.status(404).json({
                success: false,
                error: 'Stock not found in portfolio'
            });
        }

        const currentPrice = await getCurrentPrice(symbol);
        const marketValue = holding.quantity * currentPrice;
        const unrealizedPnL = marketValue - (holding.quantity * holding.avgCost);

        // 해당 종목의 거래 내역
        const ordersSnapshot = await db.collection('orders')
            .where('userId', '==', userId)
            .where('symbol', '==', symbol.toUpperCase())
            .orderBy('timestamp', 'desc')
            .get();

        const orders = ordersSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        }));

        res.json({
            success: true,
            holding: {
                symbol: symbol.toUpperCase(),
                quantity: holding.quantity,
                avgCost: holding.avgCost,
                currentPrice,
                marketValue,
                unrealizedPnL,
                unrealizedPnLPercent: ((currentPrice - holding.avgCost) / holding.avgCost) * 100,
                firstPurchase: holding.firstPurchase,
                lastUpdated: holding.lastUpdated,
                orders
            }
        });

    } catch (error) {
        logger.error('Holding detail fetch failed:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch holding details'
        });
    }
});

// 포트폴리오 다양성 분석
router.get('/diversification', async (req, res) => {
    try {
        const db = getFirestore();
        const userId = req.user.uid;

        const portfolioDoc = await db.collection('portfolios').doc(userId).get();
        
        if (!portfolioDoc.exists) {
            return res.json({
                success: true,
                diversification: {
                    sectors: {},
                    topHoldings: [],
                    concentration: 0,
                    riskLevel: 'Low'
                }
            });
        }

        const holdings = portfolioDoc.data().holdings || {};
        const holdingsArray = [];
        let totalValue = 0;

        // 각 보유 종목의 현재 가치 계산
        for (const [symbol, holding] of Object.entries(holdings)) {
            const currentPrice = await getCurrentPrice(symbol);
            const marketValue = holding.quantity * currentPrice;
            
            holdingsArray.push({
                symbol,
                marketValue,
                percentage: 0 // 아래에서 계산
            });
            
            totalValue += marketValue;
        }

        // 비중 계산
        holdingsArray.forEach(holding => {
            holding.percentage = (holding.marketValue / totalValue) * 100;
        });

        // 상위 보유 종목 (비중 순)
        const topHoldings = holdingsArray
            .sort((a, b) => b.percentage - a.percentage)
            .slice(0, 5);

        // 집중도 계산 (상위 3개 종목의 비중 합)
        const concentration = topHoldings.slice(0, 3)
            .reduce((sum, holding) => sum + holding.percentage, 0);

        // 리스크 레벨 결정
        let riskLevel = 'Low';
        if (concentration > 60) riskLevel = 'High';
        else if (concentration > 40) riskLevel = 'Medium';

        res.json({
            success: true,
            diversification: {
                topHoldings,
                concentration: Math.round(concentration * 100) / 100,
                riskLevel,
                totalPositions: holdingsArray.length,
                analysis: {
                    isWellDiversified: concentration < 40 && holdingsArray.length >= 5,
                    suggestions: generateDiversificationSuggestions(concentration, holdingsArray.length)
                }
            }
        });

    } catch (error) {
        logger.error('Diversification analysis failed:', error.message);
        res.status(500).json({
            success: false,
            error: 'Failed to analyze diversification'
        });
    }
});

// 헬퍼 함수들

/**
 * 현재 주가 조회 (시뮬레이션)
 */
async function getCurrentPrice(symbol) {
    // 실제로는 marketService를 통해 현재가를 가져와야 함
    const mockPrices = {
        'AAPL': 150.25,
        'MSFT': 378.85,
        'GOOGL': 138.45,
        'TSLA': 245.75,
        'AMZN': 155.20,
        'NVDA': 495.30
    };
    
    return mockPrices[symbol.toUpperCase()] || 100.00;
}

/**
 * 포트폴리오 성과 데이터 생성 (시뮬레이션)
 */
function generatePerformanceData(period) {
    const periods = {
        '1D': { days: 1, points: 24 },
        '1W': { days: 7, points: 7 },
        '1M': { days: 30, points: 30 },
        '3M': { days: 90, points: 30 },
        '1Y': { days: 365, points: 52 }
    };
    
    const config = periods[period] || periods['1M'];
    const data = [];
    const baseValue = 100000;
    
    for (let i = 0; i < config.points; i++) {
        const progress = i / (config.points - 1);
        const trend = baseValue * (1 + progress * 0.05); // 5% 증가 추세
        const volatility = baseValue * 0.02 * (Math.random() - 0.5); // 2% 변동성
        
        data.push({
            date: new Date(Date.now() - (config.days - progress * config.days) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            value: Math.round(trend + volatility),
            change: i > 0 ? Math.round((trend + volatility) - data[i-1].value) : 0
        });
    }
    
    return data;
}

/**
 * 다양성 개선 제안 생성
 */
function generateDiversificationSuggestions(concentration, positionCount) {
    const suggestions = [];
    
    if (concentration > 60) {
        suggestions.push('포트폴리오가 소수 종목에 과도하게 집중되어 있습니다. 위험 분산을 위해 추가 종목 투자를 고려해보세요.');
    }
    
    if (positionCount < 5) {
        suggestions.push('포트폴리오 다양성을 높이기 위해 5개 이상의 종목에 투자하는 것을 권장합니다.');
    }
    
    if (positionCount > 20) {
        suggestions.push('너무 많은 종목을 보유하고 있습니다. 관리 효율성을 위해 핵심 종목에 집중하는 것을 고려해보세요.');
    }
    
    if (suggestions.length === 0) {
        suggestions.push('포트폴리오가 적절히 다양화되어 있습니다. 현재 수준을 유지하세요.');
    }
    
    return suggestions;
}

module.exports = router;