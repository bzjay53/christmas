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

// 모든 주식 데이터 조회
export const getAllStocks = async (): Promise<{ data: Stock[] | null; error: any }> => {
  try {
    console.log('📊 주식 데이터 조회 시작...')
    
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .order('current_price', { ascending: false })
    
    if (error) {
      console.error('❌ 주식 데이터 조회 실패:', error)
      return { data: null, error }
    }
    
    console.log(`✅ 주식 데이터 조회 성공: ${data?.length}개 종목`)
    return { data, error: null }
    
  } catch (err) {
    console.error('❌ 주식 서비스 에러:', err)
    return { data: null, error: err }
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

export default {
  getAllStocks,
  getStock,
  subscribeToStocks
}