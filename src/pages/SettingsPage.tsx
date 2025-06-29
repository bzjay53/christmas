import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Settings, Shield, Key, Bell, User, Trash2, Save, CheckCircle, AlertCircle } from 'lucide-react';
import { saveUserApiKeys, deleteUserApiKeys, validateUserApiKeys, getUserApiStatus } from '../lib/apiKeyService';

export function SettingsPage() {
  const { user, profile, showLoginModal, updateProfile } = useAuth();
  const [binanceApiKey, setBinanceApiKey] = useState('');
  const [binanceSecretKey, setBinanceSecretKey] = useState('');
  const [showApiKeys, setShowApiKeys] = useState(false);
  const [notifications, setNotifications] = useState({
    realTime: true,
    aiSignals: true,
    riskWarnings: false,
    priceAlerts: true
  });
  const [saving, setSaving] = useState(false);
  const [apiStatus, setApiStatus] = useState<{
    hasApiKeys: boolean;
    isActive: boolean;
    lastVerified?: string;
    isValid?: boolean;
  }>({
    hasApiKeys: false,
    isActive: false
  });

  // API 상태 로드
  useEffect(() => {
    if (user) {
      loadApiStatus();
    }
  }, [user]);

  const loadApiStatus = async () => {
    if (!user) return;
    
    try {
      const status = await getUserApiStatus(user.id);
      setApiStatus({
        hasApiKeys: status.hasApiKeys,
        isActive: status.isActive,
        lastVerified: status.lastVerified
      });
    } catch (error) {
      console.error('API 상태 로드 실패:', error);
    }
  };

  const handleSaveApiKeys = async () => {
    if (!user) return;
    
    console.log('🔧 API 키 저장 시작...', { 
      userId: user.id, 
      hasApiKey: !!binanceApiKey, 
      hasSecretKey: !!binanceSecretKey,
      apiKeyLength: binanceApiKey?.length,
      secretKeyLength: binanceSecretKey?.length
    });
    
    if (!binanceApiKey || !binanceSecretKey) {
      alert('❌ API 키와 시크릿 키를 모두 입력해주세요.');
      return;
    }
    
    setSaving(true);
    try {
      console.log('🔧 saveUserApiKeys 호출 중...');
      // 새로운 API 키 서비스 사용
      const result = await saveUserApiKeys(user.id, binanceApiKey, binanceSecretKey);
      console.log('🔧 saveUserApiKeys 결과:', result);
      
      if (result.success) {
        // API 키 강도 평가 결과 표시
        if (result.strength) {
          const { apiKey, secretKey } = result.strength;
          let strengthMessage = '✅ Binance API 키가 안전하게 저장되었습니다.\n\n';
          
          strengthMessage += `🔐 보안 강도 평가:\n`;
          strengthMessage += `• API 키: ${apiKey.strength.toUpperCase()} (점수: ${apiKey.score}/100)\n`;
          strengthMessage += `• 시크릿 키: ${secretKey.strength.toUpperCase()} (점수: ${secretKey.score}/100)\n`;
          
          if (apiKey.recommendations.length > 0 || secretKey.recommendations.length > 0) {
            strengthMessage += `\n💡 보안 권장사항:\n`;
            [...apiKey.recommendations, ...secretKey.recommendations]
              .forEach(rec => strengthMessage += `• ${rec}\n`);
          }
          
          alert(strengthMessage);
        } else {
          alert('✅ Binance API 키가 안전하게 저장되었습니다.');
        }
        
        setBinanceApiKey('');
        setBinanceSecretKey('');
        await loadApiStatus(); // 상태 새로고침
        
        // API 키 유효성 검증
        const validationResult = await validateUserApiKeys(user.id);
        if (validationResult.isValid) {
          alert('🎉 API 키 검증이 완료되었습니다! 이제 실제 거래를 할 수 있습니다.');
          setApiStatus(prev => ({ ...prev, isValid: true }));
        } else {
          alert(`⚠️ API 키는 저장되었지만 검증에 실패했습니다: ${validationResult.error}`);
        }
      } else {
        alert(`❌ API 키 저장에 실패했습니다: ${result.error}`);
      }
    } catch (error) {
      console.error('API 키 저장 오류:', error);
      alert('❌ API 키 저장 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteApiKeys = async () => {
    if (!user) return;
    
    const confirm = window.confirm('⚠️ 정말로 Binance API 키를 삭제하시겠습니까?\n\n삭제 후에는 실제 거래 기능을 사용할 수 없습니다.');
    if (!confirm) return;
    
    setSaving(true);
    try {
      const result = await deleteUserApiKeys(user.id);
      
      if (result.success) {
        alert('✅ Binance API 키가 삭제되었습니다.');
        await loadApiStatus(); // 상태 새로고침
        setApiStatus(prev => ({ ...prev, isValid: false }));
      } else {
        alert(`❌ API 키 삭제에 실패했습니다: ${result.error}`);
      }
    } catch (error) {
      console.error('API 키 삭제 오류:', error);
      alert('❌ API 키 삭제 중 오류가 발생했습니다.');
    } finally {
      setSaving(false);
    }
  };

  if (!user) {
    return (
      <div className="space-y-8">
        {/* 페이지 헤더 */}
        <div className="bg-gradient-to-r from-purple-600/20 to-gray-600/20 rounded-xl p-6 border border-purple-500/30">
          <h1 className="text-3xl font-bold text-white mb-2">설정</h1>
          <p className="text-gray-300">계정 정보, 거래 설정, 알림 설정을 관리합니다.</p>
        </div>

        {/* 로그인 필요 */}
        <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-12 border border-gray-700/50 text-center">
          <div className="mb-6">
            <div className="w-16 h-16 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Settings className="w-8 h-8 text-purple-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">로그인이 필요합니다</h2>
            <p className="text-gray-400 mb-6">설정을 변경하려면 먼저 로그인해주세요.</p>
          </div>
          
          <button 
            onClick={showLoginModal}
            className="bg-gradient-to-r from-purple-600 to-gray-600 text-white font-bold px-8 py-3 rounded-lg hover:from-purple-500 hover:to-gray-500 transition-all transform hover:scale-105"
          >
            로그인하기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* 페이지 헤더 */}
      <div className="bg-gradient-to-r from-purple-600/20 to-gray-600/20 rounded-xl p-6 border border-purple-500/30">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">설정</h1>
            <p className="text-gray-300">계정 정보, 거래 설정, 알림 설정을 관리합니다.</p>
          </div>
          <div className="text-right">
            <div className="text-purple-400 text-sm">구독 플랜</div>
            <div className="text-white font-bold text-xl">{profile?.subscription_tier?.toUpperCase()}</div>
          </div>
        </div>
      </div>

      {/* 계정 정보 */}
      <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center gap-3 mb-6">
          <User className="text-blue-400" size={24} />
          <h2 className="text-white font-bold text-xl">계정 정보</h2>
        </div>
        
        <div className="bg-gray-800/30 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">이메일</label>
                <div className="text-white font-medium">{user.email}</div>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">구독 플랜</label>
                <div className="text-green-400 font-semibold">{profile?.subscription_tier?.toUpperCase()}</div>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-gray-400 text-sm mb-1">가입일</label>
                <div className="text-white">{new Date(user.created_at || '').toLocaleDateString()}</div>
              </div>
              <div>
                <label className="block text-gray-400 text-sm mb-1">KYC 상태</label>
                <div className="text-yellow-400">{profile?.kyc_status || 'pending'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Binance API 설정 */}
      <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Key className="text-yellow-400" size={24} />
            <h2 className="text-white font-bold text-xl">Binance API 설정</h2>
            <div className="text-xs bg-yellow-500/20 text-yellow-400 px-2 py-1 rounded">개인 API</div>
          </div>
          
          {/* API 상태 표시 */}
          <div className="flex items-center gap-2">
            {apiStatus.hasApiKeys ? (
              <div className="flex items-center gap-2 text-green-400">
                <CheckCircle size={16} />
                <span className="text-sm">API 키 등록됨</span>
                {apiStatus.lastVerified && (
                  <span className="text-xs text-gray-400">
                    ({new Date(apiStatus.lastVerified).toLocaleDateString()})
                  </span>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2 text-gray-400">
                <AlertCircle size={16} />
                <span className="text-sm">API 키 없음</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4 mb-6">
          <div className="flex items-start gap-3">
            <Shield className="text-yellow-400 flex-shrink-0 mt-1" size={20} />
            <div>
              <h3 className="text-yellow-400 font-semibold mb-2">보안 안내</h3>
              <ul className="text-gray-300 text-sm space-y-1">
                <li>• 본인의 Binance API 키를 입력하여 개인 계정으로 거래하세요</li>
                <li>• API 키는 암호화되어 안전하게 저장됩니다</li>
                <li>• Spot Trading 권한만 활성화하는 것을 권장합니다</li>
                <li>• IP 화이트리스트 설정으로 보안을 강화하세요</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/30 rounded-lg p-6">
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">API Key</label>
              <input
                type={showApiKeys ? 'text' : 'password'}
                value={binanceApiKey}
                onChange={(e) => setBinanceApiKey(e.target.value)}
                placeholder="Binance API Key를 입력하세요"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
              />
            </div>
            
            <div>
              <label className="block text-gray-400 text-sm mb-2">Secret Key</label>
              <input
                type={showApiKeys ? 'text' : 'password'}
                value={binanceSecretKey}
                onChange={(e) => setBinanceSecretKey(e.target.value)}
                placeholder="Binance Secret Key를 입력하세요"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-yellow-500"
              />
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={showApiKeys}
                  onChange={(e) => setShowApiKeys(e.target.checked)}
                  className="rounded"
                />
                <span className="text-gray-300 text-sm">API 키 표시</span>
              </label>

              <div className="flex gap-3">
                <button
                  onClick={handleDeleteApiKeys}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition-colors"
                  disabled={saving}
                >
                  <Trash2 size={16} />
                  삭제
                </button>
                
                <button
                  onClick={handleSaveApiKeys}
                  disabled={!binanceApiKey || !binanceSecretKey || saving}
                  className="flex items-center gap-2 px-6 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                >
                  <Save size={16} />
                  {saving ? '저장 중...' : '저장'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 알림 설정 */}
      <div className="bg-gray-900/60 backdrop-blur-sm rounded-xl p-6 border border-gray-700/50">
        <div className="flex items-center gap-3 mb-6">
          <Bell className="text-green-400" size={24} />
          <h2 className="text-white font-bold text-xl">알림 설정</h2>
        </div>
        
        <div className="bg-gray-800/30 rounded-lg p-6">
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
              <div>
                <div className="text-white font-medium">실시간 알림 받기</div>
                <div className="text-gray-400 text-sm">가격 변동 및 거래 알림</div>
              </div>
              <input
                type="checkbox"
                checked={notifications.realTime}
                onChange={(e) => setNotifications(prev => ({ ...prev, realTime: e.target.checked }))}
                className="w-5 h-5 text-green-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
              <div>
                <div className="text-white font-medium">AI 매매 신호 알림</div>
                <div className="text-gray-400 text-sm">AI 추천 거래 신호</div>
              </div>
              <input
                type="checkbox"
                checked={notifications.aiSignals}
                onChange={(e) => setNotifications(prev => ({ ...prev, aiSignals: e.target.checked }))}
                className="w-5 h-5 text-green-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
              <div>
                <div className="text-white font-medium">고위험 거래 경고</div>
                <div className="text-gray-400 text-sm">리스크가 높은 거래 시 경고</div>
              </div>
              <input
                type="checkbox"
                checked={notifications.riskWarnings}
                onChange={(e) => setNotifications(prev => ({ ...prev, riskWarnings: e.target.checked }))}
                className="w-5 h-5 text-red-600 rounded"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-700/30 rounded-lg">
              <div>
                <div className="text-white font-medium">가격 알림</div>
                <div className="text-gray-400 text-sm">목표 가격 도달 시 알림</div>
              </div>
              <input
                type="checkbox"
                checked={notifications.priceAlerts}
                onChange={(e) => setNotifications(prev => ({ ...prev, priceAlerts: e.target.checked }))}
                className="w-5 h-5 text-blue-600 rounded"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}