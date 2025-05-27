import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useReferralStore = create(
  persist(
    (set, get) => ({
      // 사용자 초대 정보
      referralCode: null,
      referralLink: null,
      invitedFriends: [],
      totalInvites: 0,
      earnedRewards: 0,
      
      // 초기화 및 초대 코드 생성
      initializeReferral: (userId) => {
        const state = get()
        if (!state.referralCode) {
          const code = generateReferralCode(userId)
          const link = `https://christmas-protocol.netlify.app/?ref=${code}`
          set({ 
            referralCode: code, 
            referralLink: link 
          })
        }
      },
      
      // 친구 초대 추가
      addInvitedFriend: (friendInfo) => {
        const state = get()
        const newFriend = {
          id: Date.now(),
          name: friendInfo.name || '익명',
          email: friendInfo.email || '',
          joinDate: new Date().toISOString(),
          status: 'pending',
          reward: 7
        }
        
        set({
          invitedFriends: [...state.invitedFriends, newFriend],
          totalInvites: state.totalInvites + 1
        })
        
        return newFriend
      },
      
      // 초대 링크 공유
      shareReferralLink: async (method) => {
        const state = get()
        const link = state.referralLink
        const message = `🎄 Christmas Trading에 초대합니다!\n\n자동매매로 쉽고 안전하게 투자하세요.\n초대 링크: ${link}\n\n✨ 가입하면 7일 무료 체험!`
        
        try {
          if (method === 'clipboard') {
            await navigator.clipboard.writeText(link)
            return { success: true, message: '링크가 클립보드에 복사되었습니다!' }
          } else if (method === 'kakao') {
            await navigator.clipboard.writeText(message)
            return { success: true, message: '카카오톡용 메시지가 복사되었습니다!' }
          }
        } catch (error) {
          return { success: false, message: '공유 중 오류가 발생했습니다.' }
        }
      },
      
      // 통계 정보 가져오기
      getStats: () => {
        const state = get()
        return {
          totalInvites: state.totalInvites,
          earnedRewards: state.earnedRewards
        }
      }
    }),
    {
      name: 'christmas-referral-storage'
    }
  )
)

// 초대 코드 생성 함수
const generateReferralCode = (userId) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
  const timestamp = Date.now().toString(36).toUpperCase()
  const random = Array.from({ length: 4 }, () => 
    chars.charAt(Math.floor(Math.random() * chars.length))
  ).join('')
  
  return `CHR${timestamp}${random}`.slice(0, 12)
}

export default useReferralStore 