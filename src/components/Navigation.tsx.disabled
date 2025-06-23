import { Link, useLocation } from 'react-router-dom'
import { Home, BarChart3, TrendingUp, Brain, Gift } from 'lucide-react'

export function Navigation() {
  const location = useLocation()

  const navItems = [
    { path: '/', icon: Home, label: '홈' },
    { path: '/dashboard', icon: BarChart3, label: '대시보드' },
    { path: '/portfolio', icon: TrendingUp, label: '포트폴리오' },
    { path: '/ai-recommendations', icon: Brain, label: 'AI 추천' },
  ]

  return (
    <nav className="bg-white shadow-lg border-b-4 border-christmas-gradient relative z-20">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <Gift className="w-8 h-8 text-christmas-red sparkle" />
            <span className="title-section">Christmas Trading</span>
          </Link>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map(({ path, icon: Icon, label }) => (
              <Link
                key={path}
                to={path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all duration-300 ${
                  location.pathname === path
                    ? 'bg-christmas-light-green text-christmas-dark-green'
                    : 'text-gray-600 hover:text-christmas-green hover:bg-christmas-light-green'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </Link>
            ))}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button className="text-gray-600 hover:text-christmas-green">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </nav>
  )
}