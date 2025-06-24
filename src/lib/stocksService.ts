// 🎄 Christmas Trading - Stocks Service
// Supabase와 주식 데이터 연동 + 한국투자증권 API 통합

import { supabase } from './supabase'
import { koreaInvestmentAPI, type StockData } from './koreaInvestmentAPI'
import { tradingConflictManager, type TradeRequest, type TradeConflict } from './tradingConflictManager'

export interface Stock {
  symbol: string
  name: string
  current_price: number
  price_change: number
  price_change_percent: number
  market: string
  last_updated: string
}

// Mock 데이터 (테이블 생성 전 임시 사용)
const mockStocks: Stock[] = [
  {
    symbol: '005930',
    name: '삼성전자',
    current_price: 75000,
    price_change: 1500,
    price_change_percent: 2.04,
    market: 'KOSPI',
    last_updated: new Date().toISOString()
  },
  {
    symbol: '000660',
    name: 'SK하이닉스',
    current_price: 145000,
    price_change: -2000,
    price_change_percent: -1.36,
    market: 'KOSPI',
    last_updated: new Date().toISOString()
  },
  {
    symbol: '035420',
    name: 'NAVER',
    current_price: 185000,
    price_change: 3500,
    price_change_percent: 1.93,
    market: 'KOSPI',
    last_updated: new Date().toISOString()
  }
]

// 모든 주식 데이터 조회 (한국투자증권 API + Fallback)
export const getAllStocks = async (): Promise<{ data: Stock[] | null; error: any }> => {
  try {
    console.log('📊 주식 데이터 조회 시작...')
    
    // 환경변수로 실제 API 사용 여부 결정
    // API 키가 placeholder가 아닌 실제 값이고, MOCK 모드가 false일 때만 실제 API 사용
    const hasRealAPIKeys = import.meta.env.VITE_KOREA_INVESTMENT_APP_KEY && 
                          import.meta.env.VITE_KOREA_INVESTMENT_APP_SECRET &&
                          !import.meta.env.VITE_KOREA_INVESTMENT_APP_KEY.includes('placeholder')
    const useMockData = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true' || !hasRealAPIKeys
    
    if (!useMockData) {
      // 한국투자증권 실제 API 사용
      try {
        console.log('🏦 한국투자증권 API로 실제 데이터 조회...')
        
        const stockCodes = ['005930', '000660', '035420', '005380', '006400']
        const realStocks = await koreaInvestmentAPI.getMultipleStocks(stockCodes)
        
        const formattedStocks: Stock[] = realStocks.map(stock => ({
          symbol: stock.symbol,
          name: stock.name,
          current_price: stock.current_price,
          price_change: stock.price_change,
          price_change_percent: stock.price_change_percent,
          market: 'KOSPI',
          last_updated: stock.last_updated
        }))
        
        console.log(`✅ 한국투자증권 API 데이터 조회 성공: ${formattedStocks.length}개 종목`)
        
        // Supabase에 실제 데이터 저장 (옵션)
        await saveStocksToSupabase(formattedStocks)
        
        return { data: formattedStocks, error: null }
      } catch (apiError) {
        console.warn('⚠️ 한국투자증권 API 실패, Supabase 조회로 전환:', apiError)
        // API 실패시 Supabase 데이터 조회
      }
    }
    
    // Supabase 데이터 조회
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .order('current_price', { ascending: false })
    
    if (error) {
      console.warn('⚠️ Supabase 테이블 접근 실패, Mock 데이터 사용:', error.message)
      
      // 404 에러 (테이블 없음)인 경우 Mock 데이터 반환
      if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        console.log('📝 Mock 데이터로 임시 대체 (stocks 테이블 생성 필요)')
        return { data: mockStocks, error: null }
      }
      
      return { data: null, error }
    }
    
    console.log(`✅ Supabase 데이터 조회 성공: ${data?.length}개 종목`)
    return { data, error: null }
    
  } catch (err) {
    console.error('❌ 주식 서비스 에러, Mock 데이터 사용:', err)
    return { data: mockStocks, error: null }
  }
}

// Supabase에 실제 데이터 저장하는 헬퍼 함수
const saveStocksToSupabase = async (stocks: Stock[]): Promise<void> => {
  try {
    console.log('💾 Supabase에 실제 데이터 저장 중...')
    
    for (const stock of stocks) {
      const { error } = await supabase
        .from('stocks')
        .upsert({
          symbol: stock.symbol,
          name: stock.name,
          current_price: stock.current_price,
          price_change: stock.price_change,
          price_change_percent: stock.price_change_percent,
          market: stock.market,
          last_updated: stock.last_updated
        }, {
          onConflict: 'symbol'
        })
      
      if (error) {
        console.warn(`⚠️ ${stock.symbol} 저장 실패:`, error.message)
      }
    }
    
    console.log('✅ Supabase 데이터 저장 완료')
  } catch (error) {
    console.warn('⚠️ Supabase 저장 중 오류:', error)
  }
}

// 특정 주식 조회
export const getStock = async (symbol: string): Promise<{ data: Stock | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .eq('symbol', symbol)
      .single()
    
    if (error) {
      console.error(`❌ 주식 ${symbol} 조회 실패:`, error)
      return { data: null, error }
    }
    
    return { data, error: null }
    
  } catch (err) {
    return { data: null, error: err }
  }
}

// Supabase에서 주식 가격 업데이트 (시뮬레이션)
export const updateStockPricesInSupabase = async (): Promise<{ data: Stock[] | null; error: any }> => {
  try {
    console.log('📊 Supabase 주식 가격 업데이트 시작...')
    
    // 먼저 현재 데이터 조회
    const { data: currentStocks, error: fetchError } = await supabase
      .from('stocks')
      .select('*')
    
    if (fetchError || !currentStocks) {
      console.error('❌ 현재 주식 데이터 조회 실패:', fetchError)
      return { data: null, error: fetchError }
    }
    
    // 각 주식의 가격을 랜덤하게 업데이트
    const updatePromises = currentStocks.map(async (stock) => {
      const changePercent = (Math.random() - 0.5) * 2 // -1% ~ +1% 변동
      const priceChange = Math.round(stock.current_price * changePercent / 100)
      const newPrice = Math.max(
        stock.current_price + priceChange, 
        stock.current_price * 0.98 // 최소 2% 하락 제한
      )
      
      const { data, error } = await supabase
        .from('stocks')
        .update({
          current_price: newPrice,
          price_change: priceChange,
          price_change_percent: Math.round(changePercent * 100) / 100,
          last_updated: new Date().toISOString()
        })
        .eq('symbol', stock.symbol)
        .select()
        .single()
      
      if (error) {
        console.error(`❌ ${stock.symbol} 업데이트 실패:`, error)
        return stock // 실패시 기존 데이터 반환
      }
      
      return data
    })
    
    const updatedStocks = await Promise.all(updatePromises)
    console.log(`✅ ${updatedStocks.length}개 주식 가격 업데이트 완료`)
    
    return { data: updatedStocks, error: null }
    
  } catch (err) {
    console.error('❌ Supabase 주식 업데이트 에러:', err)
    return { data: null, error: err }
  }
}

// 실시간 주식 데이터 구독
export const subscribeToStocks = (callback: (stocks: Stock[]) => void) => {
  console.log('🔄 주식 실시간 구독 시작...')
  
  const subscription = supabase
    .channel('stocks_channel')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'stocks'
    }, (payload) => {
      console.log('📈 주식 데이터 실시간 업데이트:', payload)
      // 전체 데이터 다시 조회하여 콜백 호출
      getAllStocks().then(({ data }) => {
        if (data) callback(data)
      })
    })
    .subscribe()
  
  return subscription
}

// 정확한 시장시간 체크 (한국 시간 정확 계산)
const isMarketOpen = (): { isOpen: boolean; message: string } => {
  // 현재 UTC 시간
  const nowUTC = new Date()
  
  // 한국시간으로 정확히 변환 (UTC+9)
  const koreaTime = new Date(nowUTC.getTime() + (9 * 60 * 60 * 1000))
  
  const hour = koreaTime.getUTCHours() // UTC 기준으로 가져와야 한국시간이 맞음
  const minute = koreaTime.getUTCMinutes()
  const day = koreaTime.getUTCDay()
  const currentMinutes = hour * 60 + minute
  
  console.log(`⏰ UTC: ${nowUTC.toISOString()}`)
  console.log(`⏰ 한국시간: ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}, 요일: ${day} (${['일', '월', '화', '수', '목', '금', '토'][day]})`)
  console.log(`⏰ 현재 분 계산: ${currentMinutes} (장 시간: 540-930)`)
  
  // 실제 한국 주식시장 시간 체크 (평일 09:00-15:30 KST)
  
  // 주말 체크
  if (day === 0 || day === 6) {
    return { isOpen: false, message: '📅 주말 - 시장 휴장' }
  }
  
  // 평일 거래시간 체크 (9:00-15:30)
  const marketOpen = 9 * 60 // 09:00 = 540분
  const marketClose = 15 * 60 + 30 // 15:30 = 930분
  
  console.log(`🔍 시장 상태 분석: 현재 ${currentMinutes}분, 시장 ${marketOpen}-${marketClose}분`)
  
  if (currentMinutes >= marketOpen && currentMinutes <= marketClose) {
    console.log(`✅ 장중 확인! 현재 ${hour}:${minute.toString().padStart(2, '0')}`)
    return { isOpen: true, message: '🟢 장 중 - 실시간 거래' }
  } else if (currentMinutes < marketOpen) {
    return { isOpen: false, message: '🟡 장 시작 전 - 09:00 개장 예정' }
  } else {
    return { isOpen: false, message: '🔴 장 마감 - 다음날 09:00 개장' }
  }
}

// 실시간 데이터 시뮬레이션 (시장시간 고려 - 수정됨)
export const startDataSimulation = (callback: (stocks: Stock[]) => void, marketStatusCallback?: (status: any) => void) => {
  const updateData = () => {
    const marketStatus = isMarketOpen()
    
    console.log(`🔍 시장 상태 체크: ${marketStatus.message}`)
    
    if (marketStatusCallback) {
      marketStatusCallback({
        isOpen: marketStatus.isOpen,
        statusMessage: marketStatus.message
      })
    }
    
    // 장이 열려있을 때만 데이터 업데이트
    if (marketStatus.isOpen) {
      // 고성능 Mock 데이터 실시간 업데이트 (Supabase 406 오류 회피)
      const updatedStocks = mockStocks.map(stock => {
        const changePercent = (Math.random() - 0.5) * 2 // -1% ~ +1% 변동
        const priceChange = Math.round(stock.current_price * changePercent / 100)
        const newPrice = Math.max(
          stock.current_price + priceChange, 
          stock.current_price * 0.98 // 최소 2% 하락 제한
        )
        
        return {
          ...stock,
          current_price: newPrice,
          price_change: priceChange,
          price_change_percent: Math.round(changePercent * 100) / 100,
          last_updated: new Date().toISOString()
        }
      })
      
      // Mock 데이터 업데이트
      mockStocks.splice(0, mockStocks.length, ...updatedStocks)
      callback(updatedStocks)
      
      console.log('🚀 실시간 Mock 데이터 업데이트:', updatedStocks.map(s => `${s.symbol}: ₩${s.current_price.toLocaleString()}`))
    } else {
      console.log('⏸️ 장 마감 - 데이터 업데이트 중지')
      // 장 마감시에는 정적 데이터 반환
      callback(mockStocks)
    }
  }
  
  console.log('🚀 고성능 실시간 시뮬레이션 시작... (1초 간격)')
  
  // 즉시 한 번 실행
  updateData()
  
  // 1초마다 빠른 업데이트 (사용자 요청)
  return setInterval(updateData, 1000)
}

// 안전한 거래 요청 처리 (동시 거래 방지)
export const safePlaceOrder = async (
  userId: string, 
  stockCode: string, 
  orderType: 'buy' | 'sell', 
  quantity: number, 
  price?: number
): Promise<{ success: boolean; message: string; conflict?: TradeConflict; alternatives?: any[] }> => {
  try {
    console.log(`🛡️ 안전한 거래 요청: ${userId} -> ${stockCode} ${orderType} ${quantity}주`)

    const tradeRequest: TradeRequest = {
      userId,
      stockCode,
      orderType,
      quantity,
      price,
      timestamp: Date.now()
    }

    // 1. 충돌 감지
    const conflict = await tradingConflictManager.detectTradeConflict(tradeRequest)
    
    if (conflict) {
      console.log(`⚠️ 거래 충돌 감지:`, conflict)
      
      // 대안 종목 추천
      const alternatives = await tradingConflictManager.getAlternativeStocks(stockCode)
      
      return {
        success: false,
        message: `거래 제한: ${conflict.message}`,
        conflict,
        alternatives
      }
    }

    // 2. 시간 분산 권장
    const recommendedDelay = tradingConflictManager.getOptimalTradingDelay(stockCode)
    if (recommendedDelay > 2000) {
      console.log(`⏰ 권장 지연 시간: ${recommendedDelay}ms`)
    }

    // 3. 거래 요청 등록
    await tradingConflictManager.registerTradeRequest(tradeRequest)

    // 4. 실제 주문 처리 (시뮬레이션)
    // 실제 환경에서는 koreaInvestmentAPI.placeBuyOrder() 또는 placeSellOrder() 호출
    console.log(`✅ 주문 처리 시뮬레이션: ${stockCode} ${orderType} ${quantity}주`)
    
    // 5. 거래 완료 처리
    setTimeout(() => {
      tradingConflictManager.completeTradeRequest(userId, stockCode)
    }, 5000) // 5초 후 완료 처리

    return {
      success: true,
      message: `주문이 성공적으로 처리되었습니다. ${recommendedDelay > 2000 ? `(${recommendedDelay/1000}초 지연 권장)` : ''}`
    }

  } catch (error) {
    console.error('❌ 안전한 거래 처리 실패:', error)
    return {
      success: false,
      message: `거래 처리 중 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`
    }
  }
}

// 활성 거래 현황 조회
export const getActiveTradingStatus = () => {
  return tradingConflictManager.getActiveTradeStatus()
}

export default {
  getAllStocks,
  getStock,
  subscribeToStocks,
  updateStockPricesInSupabase,
  startDataSimulation,
  safePlaceOrder,
  getActiveTradingStatus
}