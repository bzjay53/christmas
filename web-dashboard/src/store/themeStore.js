import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useThemeStore = create(
  persist(
    (set) => ({
      isDarkMode: true, // 기본값을 다크모드로 설정
      toggleTheme: () => set((state) => ({ isDarkMode: !state.isDarkMode })),
      setTheme: (isDark) => set({ isDarkMode: isDark })
    }),
    {
      name: 'christmas-theme-storage'
    }
  )
)

export default useThemeStore 