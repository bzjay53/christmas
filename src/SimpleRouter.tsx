// 심플한 Christmas Trading 라우터 - 사용자 피드백 반영
import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { AuthButton } from './components/auth/AuthButton';
import { SimpleTradingPage } from './pages/SimpleTradingPage';
import { SimplePortfolioPage } from './pages/SimplePortfolioPage';
import { RealPortfolioPage } from './pages/RealPortfolioPage';
import { TradingHistoryPage } from './pages/TradingHistoryPage';
import { SettingsPage } from './pages/SettingsPage';
import './App.css';

// 심플한 네비게이션 컴포넌트
function SimpleNavigation() {
  const { user, signOut, showLoginModal } = useAuth();
  const location = useLocation();

  const navItems = [
    { path: '/', label: '거래' },
    { path: '/portfolio', label: '실제 포트폴리오' },
    { path: '/history', label: '거래내역' },
    { path: '/settings', label: '설정' },
  ];

  const handleAuthClick = () => {
    if (user) {
      signOut();
    } else {
      showLoginModal();
    }
  };

  return (
    <nav className="bg-gray-900/80 backdrop-blur-sm border-b border-gray-700">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* 로고 */}
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-white">Christmas Trading</h1>
          </div>

          {/* 메인 네비게이션 */}
          <div className="flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>

          {/* 인증 버튼 */}
          <div className="flex items-center space-x-3">
            {user && (
              <span className="text-sm text-gray-300">
                {user.email}
              </span>
            )}
            <button
              onClick={handleAuthClick}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                user
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-green-600 hover:bg-green-700 text-white'
              }`}
            >
              {user ? '로그아웃' : '로그인'}
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
}

// 심플한 페이지 래퍼
function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <SimpleNavigation />
      <main className="container mx-auto px-4 py-6">
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50 shadow-lg">
          {children}
        </div>
      </main>
    </div>
  );
}

// 메인 앱 컴포넌트
function MainApp() {
  return (
    <PageWrapper>
      <Routes>
        <Route path="/" element={<SimpleTradingPage selectedSymbol="BTCUSDT" portfolio={{
          totalValue: 10000,
          totalChange: 500,
          totalChangePercent: 5.0,
          holdings: []
        }} />} />
        <Route path="/portfolio" element={<RealPortfolioPage />} />
        <Route path="/history" element={<TradingHistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </PageWrapper>
  );
}

// 루트 컴포넌트
export default function SimpleRouter() {
  return (
    <AuthProvider>
      <Router>
        <MainApp />
      </Router>
    </AuthProvider>
  );
}