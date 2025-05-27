import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useInvestmentStore = create(
  persist(
    (set, get) => ({
      // 투자 성향 설정
      investmentStyle: 'defensive', // 'aggressive', 'neutral', 'defensive'
      riskLevel: 3, // 1-10 스케일
      investmentAmount: 1000000, // 기본 투자 금액 (원)
      
      // 투자 성향 변경
      setInvestmentStyle: (style) => {
        set({ investmentStyle: style })
        
        // 투자 성향에 따른 기본 리스크 레벨 자동 설정
        const defaultRiskLevels = {
          aggressive: 8,
          neutral: 5,
          defensive: 3
        }
        
        set({ riskLevel: defaultRiskLevels[style] })
      },
      
      // 리스크 레벨 변경
      setRiskLevel: (level) => set({ riskLevel: level }),
      
      // 투자 금액 변경
      setInvestmentAmount: (amount) => set({ investmentAmount: amount }),
      
      // 투자 성향 정보 가져오기
      getInvestmentInfo: () => {
        const state = get()
        const styleInfo = {
          aggressive: {
            name: '공격형',
            emoji: '⚔️',
            description: '높은 수익률 추구 (목표: 월 15-25%)',
            details: ['큰 투자 금액 (잔고의 70-90%)', '적극적 리스크 감수'],
            color: 'error',
            targetReturn: '15-25%',
            riskRange: '높음'
          },
          neutral: {
            name: '중립형',
            emoji: '⚖️',
            description: '안정적 수익률 (목표: 월 8-15%)',
            details: ['중간 투자 금액 (잔고의 40-60%)', '균형잡힌 리스크 관리'],
            color: 'warning',
            targetReturn: '8-15%',
            riskRange: '중간'
          },
          defensive: {
            name: '방어형',
            emoji: '🛡️',
            description: '안전한 수익률 (목표: 월 3-8%)',
            details: ['작은 투자 금액 (잔고의 10-30%)', '보수적 리스크 관리'],
            color: 'success',
            targetReturn: '3-8%',
            riskRange: '낮음'
          }
        }
        
        return {
          ...styleInfo[state.investmentStyle],
          currentStyle: state.investmentStyle,
          riskLevel: state.riskLevel,
          investmentAmount: state.investmentAmount
        }
      },
      
      // 투자 성향 초기화
      resetInvestmentSettings: () => set({
        investmentStyle: 'defensive',
        riskLevel: 3,
        investmentAmount: 1000000
      })
    }),
    {
      name: 'christmas-investment-storage'
    }
  )
)

export default useInvestmentStore 