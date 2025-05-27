import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useCouponStore = create(
  persist(
    (set, get) => ({
      // 사용 가능한 쿠폰 목록
      availableCoupons: [
        {
          id: 'WELCOME30',
          code: 'WELCOME30',
          name: '신규 가입 환영 쿠폰',
          description: '첫 결제 30% 할인',
          discount: 30,
          discountType: 'percentage', // 'percentage' or 'fixed'
          minAmount: 10000,
          maxDiscount: 50000,
          expiryDate: '2025-01-31',
          isUsed: false,
          category: 'welcome'
        },
        {
          id: 'CHRISTMAS2024',
          code: 'CHRISTMAS2024',
          name: '크리스마스 특별 쿠폰',
          description: '크리스마스 런칭 기념 20% 할인',
          discount: 20,
          discountType: 'percentage',
          minAmount: 20000,
          maxDiscount: 30000,
          expiryDate: '2024-12-31',
          isUsed: false,
          category: 'event'
        },
        {
          id: 'FRIEND7',
          code: 'FRIEND7',
          name: '친구 초대 보상',
          description: '7일 무료 이용권',
          discount: 7,
          discountType: 'days',
          minAmount: 0,
          maxDiscount: 0,
          expiryDate: '2025-03-31',
          isUsed: false,
          category: 'referral'
        }
      ],
      
      // 사용된 쿠폰 기록
      usedCoupons: [],
      
      // 현재 적용된 쿠폰
      appliedCoupon: null,
      
      // 쿠폰 코드 검증
      validateCoupon: (code) => {
        const state = get()
        const coupon = state.availableCoupons.find(c => 
          c.code.toLowerCase() === code.toLowerCase() && !c.isUsed
        )
        
        if (!coupon) {
          return { valid: false, message: '유효하지 않은 쿠폰 코드입니다.' }
        }
        
        const now = new Date()
        const expiryDate = new Date(coupon.expiryDate)
        
        if (now > expiryDate) {
          return { valid: false, message: '만료된 쿠폰입니다.' }
        }
        
        return { valid: true, coupon, message: '사용 가능한 쿠폰입니다!' }
      },
      
      // 쿠폰 적용
      applyCoupon: (code, orderAmount = 0) => {
        const state = get()
        const validation = state.validateCoupon(code)
        
        if (!validation.valid) {
          return validation
        }
        
        const coupon = validation.coupon
        
        if (orderAmount < coupon.minAmount) {
          return { 
            valid: false, 
            message: `최소 주문 금액 ${coupon.minAmount.toLocaleString()}원 이상이어야 합니다.` 
          }
        }
        
        let discountAmount = 0
        if (coupon.discountType === 'percentage') {
          discountAmount = Math.min(
            (orderAmount * coupon.discount) / 100,
            coupon.maxDiscount
          )
        } else if (coupon.discountType === 'fixed') {
          discountAmount = coupon.discount
        } else if (coupon.discountType === 'days') {
          discountAmount = 0 // 무료 이용일은 금액 할인 없음
        }
        
        set({ appliedCoupon: { ...coupon, discountAmount } })
        
        return { 
          valid: true, 
          coupon: { ...coupon, discountAmount },
          message: `쿠폰이 적용되었습니다! ${discountAmount > 0 ? `${discountAmount.toLocaleString()}원 할인` : `${coupon.discount}일 무료 이용`}` 
        }
      },
      
      // 쿠폰 사용 처리
      useCoupon: (code) => {
        const state = get()
        const couponIndex = state.availableCoupons.findIndex(c => c.code === code)
        
        if (couponIndex !== -1) {
          const updatedCoupons = [...state.availableCoupons]
          const usedCoupon = { ...updatedCoupons[couponIndex], isUsed: true, usedAt: new Date().toISOString() }
          updatedCoupons[couponIndex] = usedCoupon
          
          set({
            availableCoupons: updatedCoupons,
            usedCoupons: [...state.usedCoupons, usedCoupon],
            appliedCoupon: null
          })
          
          return { success: true, message: '쿠폰이 사용되었습니다.' }
        }
        
        return { success: false, message: '쿠폰 사용 처리 중 오류가 발생했습니다.' }
      },
      
      // 적용된 쿠폰 제거
      removeCoupon: () => {
        set({ appliedCoupon: null })
      },
      
      // 사용 가능한 쿠폰 목록 가져오기
      getAvailableCoupons: () => {
        const state = get()
        const now = new Date()
        
        return state.availableCoupons.filter(coupon => 
          !coupon.isUsed && new Date(coupon.expiryDate) > now
        )
      },
      
      // 쿠폰 통계
      getCouponStats: () => {
        const state = get()
        const available = state.getAvailableCoupons().length
        const used = state.usedCoupons.length
        const totalSaved = state.usedCoupons.reduce((sum, coupon) => 
          sum + (coupon.discountAmount || 0), 0
        )
        
        return {
          available,
          used,
          totalSaved
        }
      }
    }),
    {
      name: 'christmas-coupon-storage'
    }
  )
)

export default useCouponStore 