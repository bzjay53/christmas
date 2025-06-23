// 🎄 Christmas Trading - Stocks Service
// Supabase와 주식 데이터 연동

import { supabase } from './supabase'

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

// 모든 주식 데이터 조회 (Fallback 포함)
export const getAllStocks = async (): Promise<{ data: Stock[] | null; error: any }> => {
  try {
    console.log('📊 주식 데이터 조회 시작...')
    
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
    
    console.log(`✅ 주식 데이터 조회 성공: ${data?.length}개 종목`)
    return { data, error: null }
    
  } catch (err) {
    console.error('❌ 주식 서비스 에러, Mock 데이터 사용:', err)
    return { data: mockStocks, error: null }
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

// 실시간 데이터 시뮬레이션 (Mock 모드용)
export const startDataSimulation = (callback: (stocks: Stock[]) => void) => {
  console.log('🔄 실시간 데이터 시뮬레이션 시작...')
  
  return setInterval(() => {
    // Mock 데이터의 가격을 랜덤하게 변경
    const updatedStocks = mockStocks.map(stock => {
      const changePercent = (Math.random() - 0.5) * 4 // -2% ~ +2% 변동
      const priceChange = Math.round(stock.current_price * changePercent / 100)
      const newPrice = stock.current_price + priceChange
      
      return {
        ...stock,
        current_price: Math.max(newPrice, stock.current_price * 0.95), // 최대 5% 하락 제한
        price_change: priceChange,
        price_change_percent: Math.round(changePercent * 100) / 100,
        last_updated: new Date().toISOString()
      }
    })
    
    // mockStocks 업데이트
    mockStocks.splice(0, mockStocks.length, ...updatedStocks)
    callback(updatedStocks)
    
    console.log('📈 Mock 데이터 업데이트:', updatedStocks.map(s => `${s.symbol}: ₩${s.current_price.toLocaleString()}`))
  }, 5000) // 5초마다 업데이트
}

export default {
  getAllStocks,
  getStock,
  subscribeToStocks,
  startDataSimulation
}