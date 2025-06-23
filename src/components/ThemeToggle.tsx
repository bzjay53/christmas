// 🎄 Christmas Trading - Theme Toggle Component
// Dark/Light 모드 전환 버튼

import React from 'react'
import { useTheme } from '../contexts/ThemeContext'

const ThemeToggle: React.FC = () => {
  const { theme, toggleTheme, isDark } = useTheme()

  return (
    <button
      onClick={toggleTheme}
      className={`
        theme-toggle-btn relative inline-flex items-center justify-center
        w-12 h-6 rounded-full transition-all duration-300 ease-in-out
        focus:outline-none focus:ring-2 focus:ring-offset-2 
        ${isDark 
          ? 'bg-gray-700 focus:ring-yellow-500' 
          : 'bg-yellow-400 focus:ring-gray-500'
        }
        hover:scale-105 active:scale-95
      `}
      title={`${isDark ? '라이트 모드로 전환' : '다크 모드로 전환'}`}
      aria-label={`현재 ${isDark ? '다크' : '라이트'} 모드, 클릭하여 ${isDark ? '라이트' : '다크'} 모드로 전환`}
    >
      {/* Toggle Circle */}
      <span
        className={`
          absolute inline-block w-5 h-5 rounded-full transition-transform duration-300
          transform ${isDark ? 'translate-x-1' : 'translate-x-6'}
          ${isDark ? 'bg-gray-200' : 'bg-white'}
          shadow-lg
        `}
      />
      
      {/* Moon Icon (Dark Mode) */}
      <span
        className={`
          absolute left-1 transition-opacity duration-300
          ${isDark ? 'opacity-100' : 'opacity-0'}
        `}
      >
        🌙
      </span>
      
      {/* Sun Icon (Light Mode) */}
      <span
        className={`
          absolute right-1 transition-opacity duration-300
          ${isDark ? 'opacity-0' : 'opacity-100'}
        `}
      >
        ☀️
      </span>
    </button>
  )
}

export default ThemeToggle