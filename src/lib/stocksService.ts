// 🎄 Christmas Trading - Crypto Service
// Supabase와 암호화폐 데이터 연동 + 바이낸스 API 통합

import { supabase } from './supabase'
import { getBinanceAPI, type Ticker24hr } from './binanceAPI'
import { tradingConflictManager, type TradeRequest, type TradeConflict } from './tradingConflictManager'

export interface Crypto {
  symbol: string
  name: string
  current_price: number
  price_change: number
  price_change_percent: number
  market: string
  last_updated: string
}

// 암호화폐 심볼을 풀네임으로 변환하는 헬퍼 함수
const getFullCryptoName = (symbol: string): string => {
  const nameMap: { [key: string]: string } = {
    'BTCUSDT': 'Bitcoin',
    'ETHUSDT': 'Ethereum',
    'BNBUSDT': 'Binance Coin',
    'ADAUSDT': 'Cardano',
    'SOLUSDT': 'Solana',
    'XRPUSDT': 'Ripple',
    'DOTUSDT': 'Polkadot',
    'AVAXUSDT': 'Avalanche',
    'MATICUSDT': 'Polygon',
    'LINKUSDT': 'Chainlink',
    'LTCUSDT': 'Litecoin'
  }
  return nameMap[symbol] || symbol.replace('USDT', '')
}

// Mock 데이터 (테이블 생성 전 임시 사용)
const mockCryptos: Crypto[] = [
  {
    symbol: 'BTCUSDT',
    name: 'Bitcoin',
    current_price: 43250.00,
    price_change: 1275.50,
    price_change_percent: 3.04,
    market: 'SPOT',
    last_updated: new Date().toISOString()
  },
  {
    symbol: 'ETHUSDT',
    name: 'Ethereum',
    current_price: 2485.75,
    price_change: -125.25,
    price_change_percent: -4.78,
    market: 'SPOT',
    last_updated: new Date().toISOString()
  },
  {
    symbol: 'BNBUSDT',
    name: 'Binance Coin',
    current_price: 315.60,
    price_change: 18.45,
    price_change_percent: 6.05,
    market: 'SPOT',
    last_updated: new Date().toISOString()
  },
  {
    symbol: 'ADAUSDT',
    name: 'Cardano',
    current_price: 0.385,
    price_change: -0.012,
    price_change_percent: -3.02,
    market: 'SPOT',
    last_updated: new Date().toISOString()
  },
  {
    symbol: 'SOLUSDT',
    name: 'Solana',
    current_price: 98.50,
    price_change: 4.25,
    price_change_percent: 4.51,
    market: 'SPOT',
    last_updated: new Date().toISOString()
  }
]

// 모든 암호화폐 데이터 조회 (바이낸스 API + Fallback)
export const getAllCryptos = async (): Promise<{ data: Crypto[] | null; error: any }> => {
  try {
    console.log('📊 암호화폐 데이터 조회 시작...')
    
    // 환경변수로 실제 API 사용 여부 결정
    // API 키가 placeholder가 아닌 실제 값이고, MOCK 모드가 false일 때만 실제 API 사용
    const hasRealAPIKeys = import.meta.env.VITE_BINANCE_API_KEY && 
                          import.meta.env.VITE_BINANCE_SECRET_KEY &&
                          !import.meta.env.VITE_BINANCE_API_KEY.includes('placeholder')
    const useMockData = import.meta.env.VITE_ENABLE_MOCK_DATA === 'true' || !hasRealAPIKeys
    
    if (!useMockData) {
      // 바이낸스 실제 API 사용
      try {
        console.log('🏦 바이낸스 API로 실제 데이터 조회...')
        
        const binanceAPI = getBinanceAPI()
        const cryptoSymbols = ['BTCUSDT', 'ETHUSDT', 'BNBUSDT', 'ADAUSDT', 'SOLUSDT']
        
        // 바이낸스 24시간 시세 데이터 조회
        const realCryptos = await Promise.all(
          cryptoSymbols.map(symbol => binanceAPI.getTicker24hr(symbol))
        )
        
        const formattedCryptos: Crypto[] = realCryptos.map(ticker => ({
          symbol: ticker.symbol,
          name: getFullCryptoName(ticker.symbol),
          current_price: ticker.lastPrice,
          price_change: ticker.priceChange,
          price_change_percent: ticker.priceChangePercent,
          market: 'SPOT',
          last_updated: new Date().toISOString()
        }))
        
        console.log(`✅ 바이낸스 API 데이터 조회 성공: ${formattedCryptos.length}개 코인`)
        
        // Supabase에 실제 데이터 저장 (옵션)
        await saveCryptosToSupabase(formattedCryptos)
        
        return { data: formattedCryptos, error: null }
      } catch (apiError) {
        console.warn('⚠️ 바이낸스 API 실패, Supabase 조회로 전환:', apiError)
        // API 실패시 Supabase 데이터 조회
      }
    }
    
    // Supabase 데이터 조회
    const { data, error } = await supabase
      .from('cryptos')
      .select('*')
      .order('current_price', { ascending: false })
    
    if (error) {
      console.warn('⚠️ Supabase 테이블 접근 실패, Mock 데이터 사용:', error.message)
      
      // 404 에러 (테이블 없음)인 경우 Mock 데이터 반환
      if (error.code === 'PGRST116' || error.message?.includes('relation') || error.message?.includes('does not exist')) {
        console.log('📝 Mock 데이터로 임시 대체 (cryptos 테이블 생성 필요)')
        return { data: mockCryptos, error: null }
      }
      
      return { data: null, error }
    }
    
    console.log(`✅ Supabase 데이터 조회 성공: ${data?.length}개 코인`)
    return { data, error: null }
    
  } catch (err) {
    console.error('❌ 암호화폐 서비스 에러, Mock 데이터 사용:', err)
    return { data: mockCryptos, error: null }
  }
}

// Supabase에 실제 데이터 저장하는 헬퍼 함수
const saveCryptosToSupabase = async (cryptos: Crypto[]): Promise<void> => {
  try {
    console.log('💾 Supabase에 실제 데이터 저장 중...')
    
    for (const crypto of cryptos) {
      const { error } = await supabase
        .from('cryptos')
        .upsert({
          symbol: crypto.symbol,
          name: crypto.name,
          current_price: crypto.current_price,
          price_change: crypto.price_change,
          price_change_percent: crypto.price_change_percent,
          market: crypto.market,
          last_updated: crypto.last_updated
        }, {
          onConflict: 'symbol'
        })
      
      if (error) {
        console.warn(`⚠️ ${crypto.symbol} 저장 실패:`, error.message)
      }
    }
    
    console.log('✅ Supabase 데이터 저장 완료')
  } catch (error) {
    console.warn('⚠️ Supabase 저장 중 오류:', error)
  }
}

// 특정 암호화폐 조회
export const getCrypto = async (symbol: string): Promise<{ data: Crypto | null; error: any }> => {
  try {
    const { data, error } = await supabase
      .from('cryptos')
      .select('*')
      .eq('symbol', symbol)
      .single()
    
    if (error) {
      console.error(`❌ 암호화폐 ${symbol} 조회 실패:`, error)
      return { data: null, error }
    }
    
    return { data, error: null }
    
  } catch (err) {
    return { data: null, error: err }
  }
}

// Supabase에서 암호화폐 가격 업데이트 (시뮬레이션)
export const updateCryptoPricesInSupabase = async (): Promise<{ data: Crypto[] | null; error: any }> => {
  try {
    console.log('📊 Supabase 암호화폐 가격 업데이트 시작...')
    
    // 먼저 현재 데이터 조회
    const { data: currentCryptos, error: fetchError } = await supabase
      .from('cryptos')
      .select('*')
    
    if (fetchError || !currentCryptos) {
      console.error('❌ 현재 암호화폐 데이터 조회 실패:', fetchError)
      return { data: null, error: fetchError }
    }
    
    // 각 암호화폐의 가격을 랜덤하게 업데이트
    const updatePromises = currentCryptos.map(async (crypto) => {
      const changePercent = (Math.random() - 0.5) * 6 // -3% ~ +3% 변동 (암호화폐는 변동성이 큼)
      const priceChange = crypto.current_price * changePercent / 100
      const newPrice = Math.max(
        crypto.current_price + priceChange, 
        crypto.current_price * 0.90 // 최소 10% 하락 제한
      )
      
      const { data, error } = await supabase
        .from('cryptos')
        .update({
          current_price: newPrice,
          price_change: priceChange,
          price_change_percent: Math.round(changePercent * 100) / 100,
          last_updated: new Date().toISOString()
        })
        .eq('symbol', crypto.symbol)
        .select()
        .single()
      
      if (error) {
        console.error(`❌ ${crypto.symbol} 업데이트 실패:`, error)
        return crypto // 실패시 기존 데이터 반환
      }
      
      return data
    })
    
    const updatedCryptos = await Promise.all(updatePromises)
    console.log(`✅ ${updatedCryptos.length}개 암호화폐 가격 업데이트 완료`)
    
    return { data: updatedCryptos, error: null }
    
  } catch (err) {
    console.error('❌ Supabase 암호화폐 업데이트 에러:', err)
    return { data: null, error: err }
  }
}

// 실시간 암호화폐 데이터 구독
export const subscribeToCryptos = (callback: (cryptos: Crypto[]) => void) => {
  console.log('🔄 암호화폐 실시간 구독 시작...')
  
  const subscription = supabase
    .channel('cryptos_channel')
    .on('postgres_changes', {
      event: '*',
      schema: 'public',
      table: 'cryptos'
    }, (payload) => {
      console.log('📈 암호화폐 데이터 실시간 업데이트:', payload)
      // 전체 데이터 다시 조회하여 콜백 호출
      getAllCryptos().then(({ data }) => {
        if (data) callback(data)
      })
    })
    .subscribe()
  
  return subscription
}

// 암호화폐 시장 상태 체크 (24시간 운영)
const isCryptoMarketOpen = (): { isOpen: boolean; message: string } => {
  // 암호화폐 시장은 24시간 연중무휴 운영
  const nowUTC = new Date()
  const hour = nowUTC.getUTCHours()
  const minute = nowUTC.getUTCMinutes()
  
  console.log(`⏰ UTC: ${nowUTC.toISOString()}`)
  console.log(`⏰ UTC 시간: ${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`)
  
  // 바이낸스는 항상 열려있음 (점검 시간 제외)
  // 일반적으로 매주 수요일 UTC 00:00-02:00에 시스템 점검
  const isMaintenanceTime = nowUTC.getUTCDay() === 3 && hour >= 0 && hour < 2
  
  if (isMaintenanceTime) {
    console.log(`🔧 시스템 점검 시간`)
    return { isOpen: false, message: '🔧 시스템 점검 중 - 곧 재개 예정' }
  }
  
  console.log(`✅ 암호화폐 시장 24시간 운영 중`)
  return { isOpen: true, message: '🟢 24시간 거래 중 - 바이낸스 연결' }
}

// 실시간 데이터 시뮬레이션 (암호화폐 24시간 시장)
export const startDataSimulation = (callback: (cryptos: Crypto[]) => void, marketStatusCallback?: (status: any) => void) => {
  const updateData = () => {
    const marketStatus = isCryptoMarketOpen()
    
    console.log(`🔍 시장 상태 체크: ${marketStatus.message}`)
    
    if (marketStatusCallback) {
      marketStatusCallback({
        isOpen: marketStatus.isOpen,
        statusMessage: marketStatus.message
      })
    }
    
    // 암호화폐 시장이 열려있을 때 데이터 업데이트 (거의 항상)
    if (marketStatus.isOpen) {
      // 고성능 Mock 데이터 실시간 업데이트 (Supabase 406 오류 회피)
      const updatedCryptos = mockCryptos.map(crypto => {
        const changePercent = (Math.random() - 0.5) * 6 // -3% ~ +3% 변동 (암호화폐는 변동성이 큼)
        const priceChange = crypto.current_price * changePercent / 100
        const newPrice = Math.max(
          crypto.current_price + priceChange, 
          crypto.current_price * 0.90 // 최소 10% 하락 제한
        )
        
        return {
          ...crypto,
          current_price: parseFloat(newPrice.toFixed(crypto.symbol === 'BTCUSDT' ? 2 : crypto.symbol === 'ETHUSDT' ? 2 : crypto.symbol === 'ADAUSDT' ? 4 : 2)),
          price_change: parseFloat(priceChange.toFixed(crypto.symbol === 'BTCUSDT' ? 2 : crypto.symbol === 'ETHUSDT' ? 2 : crypto.symbol === 'ADAUSDT' ? 4 : 2)),
          price_change_percent: Math.round(changePercent * 100) / 100,
          last_updated: new Date().toISOString()
        }
      })
      
      // Mock 데이터 업데이트
      mockCryptos.splice(0, mockCryptos.length, ...updatedCryptos)
      callback(updatedCryptos)
      
      console.log('🚀 실시간 암호화폐 Mock 데이터 업데이트:', updatedCryptos.map(c => `${c.symbol}: $${c.current_price.toLocaleString()}`))
    } else {
      console.log('⏸️ 시스템 점검 중 - 데이터 업데이트 일시 중지')
      // 점검시에는 정적 데이터 반환
      callback(mockCryptos)
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
  cryptoSymbol: string, 
  orderType: 'buy' | 'sell', 
  quantity: number, 
  price?: number
): Promise<{ success: boolean; message: string; conflict?: TradeConflict; alternatives?: any[] }> => {
  try {
    console.log(`🛡️ 안전한 거래 요청: ${userId} -> ${cryptoSymbol} ${orderType} ${quantity} 코인`)

    const tradeRequest: TradeRequest = {
      userId,
      stockCode: cryptoSymbol,
      orderType,
      quantity,
      price,
      timestamp: Date.now()
    }

    // 1. 충돌 감지
    const conflict = await tradingConflictManager.detectTradeConflict(tradeRequest)
    
    if (conflict) {
      console.log(`⚠️ 거래 충돌 감지:`, conflict)
      
      // 대안 암호화폐 추천
      const alternatives = await tradingConflictManager.getAlternativeStocks(cryptoSymbol)
      
      return {
        success: false,
        message: `거래 제한: ${conflict.message}`,
        conflict,
        alternatives
      }
    }

    // 2. 시간 분산 권장
    const recommendedDelay = tradingConflictManager.getOptimalTradingDelay(cryptoSymbol)
    if (recommendedDelay > 2000) {
      console.log(`⏰ 권장 지연 시간: ${recommendedDelay}ms`)
    }

    // 3. 거래 요청 등록
    await tradingConflictManager.registerTradeRequest(tradeRequest)

    // 4. 실제 주문 처리 (시뮬레이션)
    // 실제 환경에서는 binanceAPI.createSpotOrder() 호출
    console.log(`✅ 주문 처리 시뮬레이션: ${cryptoSymbol} ${orderType} ${quantity} 코인`)
    
    // 5. 거래 완료 처리
    setTimeout(() => {
      tradingConflictManager.completeTradeRequest(userId, cryptoSymbol)
    }, 3000) // 3초 후 완료 처리 (암호화폐는 더 빠름)

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
  getAllCryptos,
  getCrypto,
  subscribeToCryptos,
  updateCryptoPricesInSupabase,
  startDataSimulation,
  safePlaceOrder,
  getActiveTradingStatus
}