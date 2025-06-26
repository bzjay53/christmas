// 🎄 Christmas Trading - Theme Context
// Dark/Light 모드 전환 시스템

import React, { createContext, useContext, useEffect, useState } from 'react'

export type Theme = 'light' | 'dark'

interface ThemeContextType {
  theme: Theme
  toggleTheme: () => void
  isDark: boolean
  isLight: boolean
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

interface ThemeProviderProps {
  children: React.ReactNode
  defaultTheme?: Theme
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ 
  children, 
  defaultTheme = 'light' 
}) => {
  const [theme, setTheme] = useState<Theme>(() => {
    // 로컬 스토리지에서 저장된 테마 불러오기
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('christmas-trading-theme') as Theme
      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        return savedTheme
      }
      
      // 시스템 선호도 감지
      if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
        return 'light'
      }
    }
    
    return defaultTheme
  })

  // DOM에 테마 속성 적용
  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme)
      localStorage.setItem('christmas-trading-theme', theme)
      
      console.log(`🎨 테마 변경: ${theme === 'dark' ? '🌙 다크 모드' : '☀️ 라이트 모드'}`)
    }
  }, [theme])

  // 시스템 테마 변경 감지
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: light)')
      
      const handleChange = (e: MediaQueryListEvent) => {
        // 사용자가 수동으로 테마를 변경하지 않은 경우에만 시스템 테마 따르기
        const savedTheme = localStorage.getItem('christmas-trading-theme')
        if (!savedTheme) {
          setTheme(e.matches ? 'light' : 'dark')
        }
      }

      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
    
    // 사용자 액션 로깅
    console.log(`👤 사용자 테마 전환: ${newTheme === 'dark' ? '🌙 다크' : '☀️ 라이트'} 모드`)
  }

  const value: ThemeContextType = {
    theme,
    toggleTheme,
    isDark: theme === 'dark',
    isLight: theme === 'light'
  }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

// Custom Hook for Theme
export const useTheme = () => {
  const context = useContext(ThemeContext)
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}

export default ThemeContext