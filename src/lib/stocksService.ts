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

// 정확한 시장시간 체크 (한국 시간 정확 계산)
const isMarketOpen = (): { isOpen: boolean; message: string } => {
  // 현재 UTC 시간
  const nowUTC = new Date()
  
  // 한국은 UTC+9 (고정) - 서머타임 없음
  const koreaTime = new Date(nowUTC.getUTCFullYear(), 
                           nowUTC.getUTCMonth(), 
                           nowUTC.getUTCDate(), 
                           nowUTC.getUTCHours() + 9, 
                           nowUTC.getUTCMinutes(), 
                           nowUTC.getUTCSeconds())
  
  const hour = koreaTime.getHours()
  const minute = koreaTime.getMinutes()
  const day = koreaTime.getDay()
  const currentMinutes = hour * 60 + minute
  
  console.log(`⏰ UTC: ${nowUTC.toISOString()}`)
  console.log(`⏰ 한국시간: ${koreaTime.toLocaleString('ko-KR')}, 요일: ${day}, 시간: ${hour}:${minute.toString().padStart(2, '0')}`)
  
  // 강제로 장 마감으로 설정 (데모 목적)
  // 실제 시간과 관계없이 항상 장 마감으로 처리
  console.log(`🔧 강제 장 마감 모드 활성화 (데모 목적)`)
  return { isOpen: false, message: '🔴 장 마감 - 데모 모드 (항상 정지)' }
  
  /* 실제 시간 체크 로직 (주석 처리)
  // 주말 체크
  if (day === 0 || day === 6) {
    return { isOpen: false, message: '📅 주말 - 시장 휴장' }
  }
  
  // 평일 거래시간 체크 (9:00-15:30)
  const marketOpen = 9 * 60 // 09:00
  const marketClose = 15 * 60 + 30 // 15:30
  
  if (currentMinutes >= marketOpen && currentMinutes <= marketClose) {
    return { isOpen: true, message: '🟢 장 중 - 실시간 거래' }
  } else if (currentMinutes < marketOpen) {
    return { isOpen: false, message: '🟡 장 시작 전 - 09:00 개장 예정' }
  } else {
    return { isOpen: false, message: '🔴 장 마감 - 다음날 09:00 개장' }
  }
  */
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
      // Mock 데이터의 가격을 랜덤하게 변경
      const updatedStocks = mockStocks.map(stock => {
        const changePercent = (Math.random() - 0.5) * 2 // -1% ~ +1% 변동
        const priceChange = Math.round(stock.current_price * changePercent / 100)
        const newPrice = stock.current_price + priceChange
        
        return {
          ...stock,
          current_price: Math.max(newPrice, stock.current_price * 0.98),
          price_change: priceChange,
          price_change_percent: Math.round(changePercent * 100) / 100,
          last_updated: new Date().toISOString()
        }
      })
      
      mockStocks.splice(0, mockStocks.length, ...updatedStocks)
      callback(updatedStocks)
      
      console.log('📈 장중 데이터 업데이트:', updatedStocks.map(s => `${s.symbol}: ₩${s.current_price.toLocaleString()}`))
    } else {
      console.log('⏸️ 장 마감 - 데이터 업데이트 중지')
      // 장 마감시에는 콜백 호출하지 않음 (차트 업데이트 안함)
    }
  }
  
  console.log('🔄 시장시간 기반 시뮬레이션 시작...')
  
  // 즉시 한 번 실행
  updateData()
  
  // 5초마다 시장 상태 체크
  return setInterval(updateData, 5000)
}

export default {
  getAllStocks,
  getStock,
  subscribeToStocks,
  startDataSimulation
}