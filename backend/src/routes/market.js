const express = require('express');
const marketService = require('../services/marketService');
const cacheMiddleware = require('../middleware/cache');
const logger = require('winston');

const router = express.Router();

// KOSPI 데이터 (현재 프론트엔드 차트에서 사용)
router.get('/kospi', cacheMiddleware(300), async (req, res) => {
    try {
        logger.info('KOSPI data requested');
        
        const kospiData = await marketService.getKOSPIData();
        
        res.json({
            success: true,
            symbol: 'KOSPI',
            data: kospiData,
            timestamp: new Date().toISOString(),
            source: 'live'
        });
        
    } catch (error) {
        logger.warn('KOSPI API failed, using fallback data:', error.message);
        
        // Fallback to mock data that matches frontend
        res.json({
            success: true,
            symbol: 'KOSPI',
            data: [2580, 2595, 2610, 2625, 2640, 2655, 2670],
            timestamp: new Date().toISOString(),
            source: 'fallback'
        });
    }
});

// NASDAQ 데이터
router.get('/nasdaq', cacheMiddleware(300), async (req, res) => {
    try {
        const nasdaqData = await marketService.getNASDAQData();
        
        res.json({
            success: true,
            symbol: 'NASDAQ',
            data: nasdaqData,
            timestamp: new Date().toISOString(),
            source: 'live'
        });
        
    } catch (error) {
        logger.warn('NASDAQ API failed, using fallback data:', error.message);
        
        res.json({
            success: true,
            symbol: 'NASDAQ',
            data: [17800, 17850, 17900, 17950, 18000, 18050, 18100],
            timestamp: new Date().toISOString(),
            source: 'fallback'
        });
    }
});

// S&P 500 데이터
router.get('/sp500', cacheMiddleware(300), async (req, res) => {
    try {
        const sp500Data = await marketService.getSP500Data();
        
        res.json({
            success: true,
            symbol: 'S&P500',
            data: sp500Data,
            timestamp: new Date().toISOString(),
            source: 'live'
        });
        
    } catch (error) {
        logger.warn('S&P500 API failed, using fallback data:', error.message);
        
        res.json({
            success: true,
            symbol: 'S&P500',
            data: [5950, 5960, 5970, 5980, 5990, 6000, 6010],
            timestamp: new Date().toISOString(),
            source: 'fallback'
        });
    }
});

// 개별 주식 데이터
router.get('/stock/:symbol', cacheMiddleware(60), async (req, res) => {
    try {
        const { symbol } = req.params;
        logger.info(`Stock data requested for ${symbol}`);
        
        const stockData = await marketService.getStockData(symbol);
        
        res.json({
            success: true,
            symbol: symbol.toUpperCase(),
            ...stockData,
            timestamp: new Date().toISOString()
        });
        
    } catch (error) {
        logger.warn(`Stock API failed for ${req.params.symbol}:`, error.message);
        
        // Fallback for AAPL (matches frontend)
        if (req.params.symbol.toUpperCase() === 'AAPL') {
            res.json({
                success: true,
                symbol: 'AAPL',
                price: 150.25,
                change: 2.45,
                changePercent: 1.67,
                data: [148.50, 149.20, 150.10, 149.80, 150.25, 150.60, 150.25],
                volume: [1200000, 980000, 1500000, 1100000, 1350000, 1600000, 1800000],
                timestamp: new Date().toISOString(),
                source: 'fallback'
            });
        } else {
            res.status(404).json({
                success: false,
                error: `Stock data not available for ${req.params.symbol}`
            });
        }
    }
});

// 주요 지수 한번에 가져오기 (프론트엔드 최적화용)
router.get('/indices', cacheMiddleware(300), async (req, res) => {
    try {
        logger.info('Major indices data requested');
        
        const [kospiData, nasdaqData, sp500Data] = await Promise.allSettled([
            marketService.getKOSPIData(),
            marketService.getNASDAQData(),
            marketService.getSP500Data()
        ]);
        
        const result = {
            success: true,
            data: {
                KOSPI: kospiData.status === 'fulfilled' 
                    ? kospiData.value 
                    : [2580, 2595, 2610, 2625, 2640, 2655, 2670],
                NASDAQ: nasdaqData.status === 'fulfilled' 
                    ? nasdaqData.value 
                    : [17800, 17850, 17900, 17950, 18000, 18050, 18100],
                SP500: sp500Data.status === 'fulfilled' 
                    ? sp500Data.value 
                    : [5950, 5960, 5970, 5980, 5990, 6000, 6010]
            },
            labels: ['12/18', '12/19', '12/20', '12/21', '12/22', '12/23', '12/24'],
            timestamp: new Date().toISOString()
        };
        
        res.json(result);
        
    } catch (error) {
        logger.error('Major indices API failed:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch market indices'
        });
    }
});

// 시장 상태 정보
router.get('/status', (req, res) => {
    const now = new Date();
    const hour = now.getUTCHours();
    
    // 간단한 시장 상태 로직 (UTC 기준)
    let marketStatus = 'closed';
    if (hour >= 14 && hour < 21) { // 대략적인 미국 시장 시간
        marketStatus = 'open';
    } else if (hour >= 13 && hour < 14) {
        marketStatus = 'pre-market';
    } else if (hour >= 21 && hour < 24) {
        marketStatus = 'after-hours';
    }
    
    res.json({
        success: true,
        status: marketStatus,
        timestamp: now.toISOString(),
        timezone: 'UTC',
        nextOpen: '09:30 EST',
        nextClose: '16:00 EST'
    });
});

module.exports = router;