import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useBacktestStore = create(
  persist(
    (set, get) => ({
      // 백테스트 상태
      isRunning: false,
      results: null,
      selectedPeriod: '3months',
      selectedStrategy: 'christmas_ai',
      
      // 백테스트 설정
      settings: {
        initialCapital: 10000000, // 1천만원
        commission: 0.0015, // 0.15% 수수료
        slippage: 0.001, // 0.1% 슬리피지
      },
      
      // 백테스트 실행
      runBacktest: async (period, strategy) => {
        set({ isRunning: true, selectedPeriod: period, selectedStrategy: strategy })
        
        try {
          // Mock 백테스트 실행 (실제로는 API 호출)
          const mockResults = await simulateBacktest(period, strategy)
          set({ results: mockResults, isRunning: false })
          return mockResults
        } catch (error) {
          set({ isRunning: false })
          throw error
        }
      },
      
      // 백테스트 결과 초기화
      clearResults: () => set({ results: null }),
      
      // 설정 업데이트
      updateSettings: (newSettings) => set(state => ({
        settings: { ...state.settings, ...newSettings }
      }))
    }),
    {
      name: 'christmas-backtest-storage'
    }
  )
)

// Mock 백테스트 시뮬레이션 함수
const simulateBacktest = async (period, strategy) => {
  // 실제 백테스트 로직 시뮬레이션
  await new Promise(resolve => setTimeout(resolve, 2000)) // 2초 대기
  
  const periodData = {
    '1month': { days: 30, label: '최근 1개월' },
    '3months': { days: 90, label: '최근 3개월' },
    '1year': { days: 365, label: '최근 1년' },
    'custom': { days: 180, label: '사용자 정의' }
  }
  
  const strategyMultipliers = {
    christmas_ai: 1.2,
    traditional: 1.0,
    aggressive: 1.5,
    defensive: 0.8
  }
  
  const baseReturn = Math.random() * 20 - 5 // -5% ~ 15% 기본 수익률
  const strategyMultiplier = strategyMultipliers[strategy] || 1.0
  const finalReturn = baseReturn * strategyMultiplier
  
  const totalTrades = Math.floor(Math.random() * 50) + 20
  const winningTrades = Math.floor(totalTrades * (0.6 + Math.random() * 0.3))
  const losingTrades = totalTrades - winningTrades
  
  return {
    period: periodData[period],
    strategy: strategy,
    performance: {
      totalReturn: finalReturn,
      annualizedReturn: finalReturn * (365 / periodData[period].days),
      maxDrawdown: -(Math.random() * 8 + 2), // -2% ~ -10%
      sharpeRatio: Math.random() * 2 + 0.5, // 0.5 ~ 2.5
      winRate: (winningTrades / totalTrades) * 100,
      profitFactor: 1 + Math.random() * 1.5 // 1.0 ~ 2.5
    },
    trades: {
      total: totalTrades,
      winning: winningTrades,
      losing: losingTrades,
      avgWin: Math.random() * 5 + 1, // 1% ~ 6%
      avgLoss: -(Math.random() * 3 + 0.5) // -0.5% ~ -3.5%
    },
    equity: generateEquityCurve(finalReturn, periodData[period].days),
    monthlyReturns: generateMonthlyReturns(periodData[period].days)
  }
}

// 자산 곡선 생성
const generateEquityCurve = (totalReturn, days) => {
  const points = Math.min(days, 100) // 최대 100개 포인트
  const dailyReturn = totalReturn / points
  const volatility = 0.02 // 2% 일일 변동성
  
  let equity = 10000000 // 초기 자본
  const curve = [{ date: new Date(Date.now() - days * 24 * 60 * 60 * 1000), value: equity }]
  
  for (let i = 1; i <= points; i++) {
    const randomReturn = (Math.random() - 0.5) * volatility * 2
    const trendReturn = dailyReturn / points
    equity *= (1 + trendReturn + randomReturn)
    
    const date = new Date(Date.now() - (days - i) * 24 * 60 * 60 * 1000)
    curve.push({ date, value: equity })
  }
  
  return curve
}

// 월별 수익률 생성
const generateMonthlyReturns = (days) => {
  const months = Math.ceil(days / 30)
  const returns = []
  
  for (let i = 0; i < months; i++) {
    const monthReturn = (Math.random() - 0.3) * 10 // -3% ~ 7% 월 수익률
    const date = new Date()
    date.setMonth(date.getMonth() - (months - i - 1))
    
    returns.push({
      month: date.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' }),
      return: monthReturn
    })
  }
  
  return returns
}

export default useBacktestStore 