// 🎄 Christmas Trading - Market Hours Logic
// 실제 거래시간에만 데이터 업데이트

export interface MarketStatus {
  isOpen: boolean
  nextOpen?: string
  nextClose?: string
  statusMessage: string
}

// 한국 증시 운영시간 확인
export const getKoreanMarketStatus = (): MarketStatus => {
  const now = new Date()
  
  // 한국 시간으로 변환 (UTC+9)
  const koreaTime = new Date(now.getTime() + (9 * 60 * 60 * 1000))
  const hour = koreaTime.getHours()
  const minute = koreaTime.getMinutes()
  const day = koreaTime.getDay() // 0=일요일, 1=월요일, ..., 6=토요일
  
  // 주말 체크
  if (day === 0 || day === 6) {
    return {
      isOpen: false,
      statusMessage: '📅 주말 - 시장 휴장',
      nextOpen: getNextMarketOpen(koreaTime)
    }
  }
  
  // 평일 거래시간 체크 (9:00 - 15:30)
  const currentMinutes = hour * 60 + minute
  const marketOpen = 9 * 60 // 09:00
  const marketClose = 15 * 60 + 30 // 15:30
  
  if (currentMinutes >= marketOpen && currentMinutes <= marketClose) {
    return {
      isOpen: true,
      statusMessage: '🟢 장 중 - 실시간 거래',
      nextClose: '15:30'
    }
  } else if (currentMinutes < marketOpen) {
    return {
      isOpen: false,
      statusMessage: '🟡 장 시작 전 - 09:00 개장 예정',
      nextOpen: '09:00'
    }
  } else {
    return {
      isOpen: false,
      statusMessage: '🔴 장 마감 - 다음날 09:00 개장',
      nextOpen: getNextMarketOpen(koreaTime)
    }
  }
}

// 다음 장 개장 시간 계산
const getNextMarketOpen = (koreaTime: Date): string => {
  const tomorrow = new Date(koreaTime)
  tomorrow.setDate(tomorrow.getDate() + 1)
  
  // 주말이면 월요일로
  while (tomorrow.getDay() === 0 || tomorrow.getDay() === 6) {
    tomorrow.setDate(tomorrow.getDate() + 1)
  }
  
  return tomorrow.toLocaleDateString('ko-KR') + ' 09:00'
}

// 개발/데모 모드 체크 (항상 장중으로 처리)
export const isDemoMode = (): boolean => {
  return process.env.NODE_ENV === 'development' || 
         window.location.search.includes('demo=true')
}

// 실제 사용할 시장 상태 (데모 모드 고려)
export const getMarketStatus = (): MarketStatus => {
  if (isDemoMode()) {
    return {
      isOpen: true,
      statusMessage: '🎮 데모 모드 - 시뮬레이션 중',
      nextClose: 'N/A'
    }
  }
  
  return getKoreanMarketStatus()
}

export default {
  getMarketStatus,
  getKoreanMarketStatus,
  isDemoMode
}