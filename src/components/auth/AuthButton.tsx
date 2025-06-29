import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { User, LogOut, Crown, Settings, Wallet } from 'lucide-react';
import LoginModal from './LoginModal';

export function AuthButton() {
  const { user, profile, signOut, loading } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    setShowUserMenu(false);
  };

  // 구독 티어별 스타일
  const getTierStyle = (tier: string) => {
    switch (tier) {
      case 'vip':
        return 'from-yellow-500 to-orange-500 text-black';
      case 'premium':
        return 'from-purple-500 to-blue-500 text-white';
      case 'basic':
        return 'from-green-500 to-blue-500 text-white';
      default:
        return 'from-gray-600 to-gray-700 text-white';
    }
  };

  const getTierIcon = (tier: string) => {
    switch (tier) {
      case 'vip':
        return <Crown size={16} className="text-yellow-400" />;
      case 'premium':
        return <Crown size={16} className="text-purple-400" />;
      case 'basic':
        return <User size={16} className="text-green-400" />;
      default:
        return <User size={16} className="text-gray-400" />;
    }
  };

  const getTierName = (tier: string) => {
    switch (tier) {
      case 'vip': return 'VIP';
      case 'premium': return 'Premium';
      case 'basic': return 'Basic';
      default: return 'Free';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-green-500"></div>
      </div>
    );
  }

  if (!user || !profile) {
    return (
      <>
        <button
          onClick={() => setShowLoginModal(true)}
          className="bg-gradient-to-r from-green-600 to-green-700 hover:from-green-500 hover:to-green-600 text-white font-semibold py-2 px-4 rounded-lg transition-all transform hover:scale-105 flex items-center space-x-2"
        >
          <User size={18} />
          <span>로그인</span>
        </button>
        
        <LoginModal 
          isOpen={showLoginModal} 
          onClose={() => setShowLoginModal(false)} 
        />
      </>
    );
  }

  return (
    <div className="relative">
      {/* 사용자 정보 버튼 */}
      <button
        onClick={() => setShowUserMenu(!showUserMenu)}
        className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all hover:scale-105 bg-gradient-to-r ${getTierStyle(profile.subscription_tier)}`}
      >
        {getTierIcon(profile.subscription_tier)}
        <div className="text-left">
          <div className="font-semibold text-sm">
            {profile.display_name || user.email?.split('@')[0]}
          </div>
          <div className="text-xs opacity-80">
            {getTierName(profile.subscription_tier)}
          </div>
        </div>
      </button>

      {/* 드롭다운 메뉴 */}
      {showUserMenu && (
        <div className="absolute right-0 mt-2 w-80 bg-gray-900 border border-gray-700 rounded-lg shadow-2xl z-50">
          {/* 사용자 정보 헤더 */}
          <div className="p-4 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-full bg-gradient-to-r ${getTierStyle(profile.subscription_tier)} flex items-center justify-center`}>
                {getTierIcon(profile.subscription_tier)}
              </div>
              <div>
                <div className="text-white font-semibold">
                  {profile.display_name || '사용자'}
                </div>
                <div className="text-gray-400 text-sm">{user.email}</div>
                <div className="flex items-center space-x-1 mt-1">
                  {getTierIcon(profile.subscription_tier)}
                  <span className="text-xs text-gray-300">
                    {getTierName(profile.subscription_tier)} 멤버
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 잔액 정보 */}
          <div className="p-4 border-b border-gray-700 bg-gray-800/50">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm flex items-center">
                <Wallet size={16} className="mr-2" />
                포트폴리오 가치
              </span>
              <span className="text-green-400 font-bold">
                ${(profile.portfolio_balance_usdt || 0).toLocaleString()} USDT
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-gray-400 text-sm">사용 가능한 현금</span>
              <span className="text-white font-semibold">
                ${(profile.available_cash_usdt || 1000).toLocaleString()} USDT
              </span>
            </div>
          </div>

          {/* 구독 정보 */}
          <div className="p-4 border-b border-gray-700">
            <div className="text-sm text-gray-400 mb-2">구독 상태</div>
            <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-gradient-to-r ${getTierStyle(profile.subscription_tier)}`}>
              {getTierIcon(profile.subscription_tier)}
              <span className="ml-1">{getTierName(profile.subscription_tier)} 플랜</span>
            </div>
            {profile.subscription_tier === 'free' && (
              <div className="mt-2">
                <button className="text-yellow-400 text-xs hover:text-yellow-300 transition-colors">
                  업그레이드하기 →
                </button>
              </div>
            )}
          </div>

          {/* 메뉴 항목들 */}
          <div className="p-2">
            <button
              className="w-full text-left px-3 py-2 text-gray-300 hover:text-white hover:bg-gray-800 rounded-lg transition-colors flex items-center space-x-2"
              onClick={() => setShowUserMenu(false)}
            >
              <Settings size={16} />
              <span>계정 설정</span>
            </button>
            
            <button
              onClick={handleSignOut}
              className="w-full text-left px-3 py-2 text-gray-300 hover:text-red-400 hover:bg-gray-800 rounded-lg transition-colors flex items-center space-x-2"
            >
              <LogOut size={16} />
              <span>로그아웃</span>
            </button>
          </div>
        </div>
      )}

      {/* 외부 클릭 시 메뉴 닫기 */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </div>
  );
}

export default AuthButton;